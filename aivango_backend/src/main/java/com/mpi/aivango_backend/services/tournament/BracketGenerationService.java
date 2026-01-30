package com.mpi.aivango_backend.services.tournament;

import com.mpi.aivango_backend.dto.fight.FightMatchDTO;
import com.mpi.aivango_backend.dto.fight.TournamentBracketDTO;
import com.mpi.aivango_backend.models.application.Application;
import com.mpi.aivango_backend.models.application.ApplicationStatus;
import com.mpi.aivango_backend.models.fight.FightHistory;
import com.mpi.aivango_backend.models.fight.FightRound;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.repository.ApplicationRepository;
import com.mpi.aivango_backend.repository.FightHistoryRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import com.mpi.aivango_backend.services.email.EmailSendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class BracketGenerationService {

    private final TournamentRepository tournamentRepository;
    private final ApplicationRepository applicationRepository;
    private final FightHistoryRepository fightHistoryRepository;
    private final EmailSendService emailSendService;

    @Transactional
    public void generateBracket(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Турнир не найден"));

        if (tournament.getTournamentStatus() != TournamentStatus.KNIGHT_REGISTRATION) {
            throw new IllegalArgumentException("Сетка формируется только в статусе REGISTRATION");
        }

        List<UserAccount> knights = applicationRepository
                .findByTournamentIdAndStatus(tournamentId, ApplicationStatus.APPROVED)
                .stream()
                .map(Application::getKnight)
                .toList();

        int count = knights.size();

        if (count < 1) {
            throw new IllegalArgumentException("Нет утверждённых участников");
        }

        if (count > 16 || (count > 2 && !isPowerOfTwo(count))) {
            throw new IllegalArgumentException("Количество участников должно быть 1, 2, 4, 8 или 16");
        }

        fightHistoryRepository.deleteByTournamentId(tournamentId);

        List<UserAccount> shuffled = new ArrayList<>(knights);
        Collections.shuffle(shuffled);

        List<FightHistory> allMatches = new ArrayList<>();
        LocalDateTime currentTime = LocalDateTime.now();
        if (count == 1) {
            // Единственный участник — автоматически чемпион
            FightHistory finalMatch = FightHistory.builder()
                    .tournament(tournament)
                    .fighter1(shuffled.get(0))
                    .fighter2(null)
                    .winner(shuffled.get(0))
                    .round(FightRound.FINAL)
                    .fightDate(currentTime)
                    .comment("Автоматическая победа — единственный участник")
                    .build();
            allMatches.add(finalMatch);

        } else if (count == 2) {
            FightHistory finalMatch = createSingleMatch(shuffled.get(0), shuffled.get(1), FightRound.FINAL, tournament);
            allMatches.add(finalMatch);

        } else {
            FightRound firstRound = switch (count) {
                case 4 -> FightRound.SEMIFINAL;
                case 8 -> FightRound.QUARTERFINAL;
                case 16 -> FightRound.ROUND_OF_8;
                default -> throw new IllegalStateException("Неподдерживаемое количество");
            };

            List<FightHistory> currentRound = createRoundMatches(shuffled, firstRound, tournament);
            allMatches.addAll(currentRound);
            LocalDateTime roundStartTime = currentTime;
            // Сохраняем первый раунд, чтобы получить ID
            currentRound = fightHistoryRepository.saveAll(currentRound);

            while (currentRound.size() > 1) {
                // Получили вид текущего раунда
                FightRound nextRound = getNextRound(currentRound.get(0).getRound());
                roundStartTime = roundStartTime.plusDays(1);
                // Создаём матчи следующего раунда (без ID пока)
                List<FightHistory> nextRoundMatches = new ArrayList<>();
                for (int i = 0; i < currentRound.size(); i += 2) {
                    FightHistory nextMatch = FightHistory.builder()
                            .tournament(tournament)
                            .fighter1(null)
                            .fighter2(null)
                            .round(nextRound)
                            .fightDate(roundStartTime)
                            .build();
                    nextRoundMatches.add(nextMatch);
                }

                // Сохраняем следующий раунд — теперь у них есть ID
                nextRoundMatches = fightHistoryRepository.saveAll(nextRoundMatches);
                allMatches.addAll(nextRoundMatches);

                // Устанавливаем связи: победители из currentRound идут в nextRoundMatches
                for (int i = 0; i < currentRound.size(); i += 2) {
                    FightHistory match1 = currentRound.get(i);
                    FightHistory match2 = (i + 1 < currentRound.size()) ? currentRound.get(i + 1) : null;

                    FightHistory targetMatch = nextRoundMatches.get(i / 2);

                    match1.setNextMatchId(targetMatch.getId());
                    if (match2 != null) {
                        match2.setNextMatchId(targetMatch.getId());
                    }
                }

                // Обновляем связи в БД
                fightHistoryRepository.saveAll(currentRound);

                currentRound = nextRoundMatches;
            }

            // Бой за 3-е место (если ≥ 4 участников)
            if (count >= 4) {
                LocalDateTime bronzeTime = roundStartTime.plusDays(1);
                FightHistory bronzeMatch = FightHistory.builder()
                        .tournament(tournament)
                        .fighter1(null)
                        .fighter2(null)
                        .round(FightRound.BRONZE)
                        .fightDate(bronzeTime)
                        .comment("Бой за 3-е место")
                        .build();

                bronzeMatch = fightHistoryRepository.save(bronzeMatch);
                allMatches.add(bronzeMatch);
            }
        }

        // Финальный save всех (на всякий случай)
        fightHistoryRepository.saveAll(allMatches);

        tournament.setTournamentStatus(TournamentStatus.TICKET_SALES);
        tournamentRepository.save(tournament);

        log.info("Турнирная сетка сформирована для турнира {} (участников: {})", tournament.getName(), count);
        sendBracketGeneratedNotifications(tournament, knights);
    }

    private List<FightHistory> createRoundMatches(List<UserAccount> participants, FightRound round, Tournament tournament) {
        List<FightHistory> matches = new ArrayList<>();
        for (int i = 0; i < participants.size(); i += 2) {
            if (i + 1 < participants.size()) {
                matches.add(createSingleMatch(participants.get(i), participants.get(i + 1), round, tournament));
            }
        }
        return matches;
    }

    private FightHistory createSingleMatch(UserAccount f1, UserAccount f2, FightRound round, Tournament tournament) {
        return FightHistory.builder()
                .tournament(tournament)
                .fighter1(f1)
                .fighter2(f2)
                .round(round)
                .fightDate(LocalDateTime.now())
                .build();
    }

    private FightRound getNextRound(FightRound current) {
        return switch (current) {
            case ROUND_OF_8 -> FightRound.QUARTERFINAL;
            case QUARTERFINAL -> FightRound.SEMIFINAL;
            case SEMIFINAL -> FightRound.FINAL;
            default -> throw new IllegalArgumentException("Нет следующего раунда после " + current);
        };
    }

    private boolean isPowerOfTwo(int n) {
        return n > 0 && (n & (n - 1)) == 0;
    }

    private void sendBracketGeneratedNotifications(Tournament tournament, List<UserAccount> knights) {
        String organizerBody = """
                Турнирная сетка для турнира "%s" успешно сформирована!
                Участников: %d. Продажа билетов открыта.
                """.formatted(tournament.getName(), knights.size());

        emailSendService.sendHtmlEmail(tournament.getUserAccount().getEmail(), "Сетка сформирована", organizerBody);

        String knightBody = """
                Благородный рыцарь!
                Турнирная сетка для "%s" сформирована. Вы допущены к участию.
                Следите за расписанием в личном кабинете.
                """.formatted(tournament.getName());

        knights.forEach(knight ->
                emailSendService.sendHtmlEmail(knight.getEmail(), "Вы в турнирной сетке!", knightBody)
        );
    }

    @Transactional(readOnly = true)
    public TournamentBracketDTO getTournamentBracket(Long tournamentId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Турнир не найден"));

        List<FightHistory> fights = fightHistoryRepository.findByTournamentId(tournamentId);

        List<FightMatchDTO> matchDTOs = fights.stream()
                .map(this::mapToFightMatchDTO)
                .sorted((a, b) -> {
                    // Сортировка по раундам: от ранних к поздним
                    int roundOrderA = getRoundOrder(a.getRound());
                    int roundOrderB = getRoundOrder(b.getRound());
                    return Integer.compare(roundOrderA, roundOrderB);
                })
                .toList();

        return TournamentBracketDTO.builder()
                .tournamentId(tournament.getId())
                .tournamentName(tournament.getName())
                .generatedAt(LocalDateTime.now())
                .matches(matchDTOs)
                .build();
    }

    private FightMatchDTO mapToFightMatchDTO(FightHistory fight) {
        String fighter1Name = fight.getFighter1() != null
                ? fight.getFighter1().getName() + " " + fight.getFighter1().getSecondName()
                : null;

        String fighter2Name = fight.getFighter2() != null
                ? fight.getFighter2().getName() + " " + fight.getFighter2().getSecondName()
                : null;

        String winnerName = fight.getWinner() != null
                ? fight.getWinner().getName() + " " + fight.getWinner().getSecondName()
                : null;

        return FightMatchDTO.builder()
                .matchId(fight.getId())
                .round(fight.getRound())
                .roundDisplayName(fight.getRound().getDisplayName())
                .fighter1Id(fight.getFighter1() != null ? fight.getFighter1().getId() : null)
                .fighter1Name(fighter1Name)
                .fighter2Id(fight.getFighter2() != null ? fight.getFighter2().getId() : null)
                .fighter2Name(fighter2Name)
                .winnerId(fight.getWinner() != null ? fight.getWinner().getId() : null)
                .winnerName(winnerName)
                .fightDate(fight.getFightDate())
                .comment(fight.getComment())
                .nextMatchId(fight.getNextMatchId())
                .build();
    }

    private int getRoundOrder(FightRound round) {
        return switch (round) {
            case ROUND_OF_8 -> 1;
            case QUARTERFINAL -> 2;
            case SEMIFINAL -> 3;
            case BRONZE -> 4;
            case FINAL -> 5;
        };
    }
}
