package com.mpi.aivango_backend.services.prize;

import com.mpi.aivango_backend.models.fight.FightHistory;
import com.mpi.aivango_backend.models.fight.FightRound;
import com.mpi.aivango_backend.models.prize.PrizeDistribution;
import com.mpi.aivango_backend.models.sponsorship.Sponsorship;
import com.mpi.aivango_backend.models.sponsorship.SponsorshipStatus;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.repository.FightHistoryRepository;
import com.mpi.aivango_backend.repository.PrizeDistributionRepository;
import com.mpi.aivango_backend.repository.SponsorshipRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import com.mpi.aivango_backend.repository.UserRepository;
import com.mpi.aivango_backend.services.email.EmailSendService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class PrizeCalculationService {

    private final TournamentRepository tournamentRepository;
    private final SponsorshipRepository sponsorshipRepository;
    private final UserRepository userRepository;
    private final FightHistoryRepository fightHistoryRepository;
    private final PrizeDistributionRepository prizeDistributionRepository;
    private final EmailSendService emailSendService;

    private static final BigDecimal PERCENT_WINNER = new BigDecimal("0.50");
    private static final BigDecimal PERCENT_SECOND = new BigDecimal("0.25");
    private static final BigDecimal PERCENT_THIRD = new BigDecimal("0.10");
    private static final BigDecimal PERCENT_SYMPATHY = new BigDecimal("0.05");
    private static final String FIRST_PLACE = "1st";
    private static final String SECOND_PLACE = "2st";
    private static final String THIRD_PLACE = "3st";
    private static final String SYMPATHY_PLACE = "sympth";

    @Transactional
    public void calculatePrizes(Long tournamentId, Long sympathyWinnerId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Турнир не найден"));

        if (tournament.getTournamentStatus() != TournamentStatus.COMPLETED) {
            throw new IllegalArgumentException("Расчёт призов возможен только для завершённого турнира");
        }

        if (prizeDistributionRepository.existsByTournamentId(tournamentId)) {
            throw new IllegalArgumentException("Призы уже распределены");
        }

        if (tournament.getPrizePercentNum() == null ||  tournament.getPrizePercentNum() > 100 ||  tournament.getPrizePercentNum() < 0) {
            throw new RuntimeException("Ошибка с распределением процента призов");
        }

        // Общая сумма от спонсоров с учетом процента на призы
        BigDecimal totalFund = BigDecimal.valueOf(
                sponsorshipRepository.sumAmountByTournamentIdAndStatus(tournamentId, SponsorshipStatus.CONFIRMED) * tournament.getPrizePercentNum() / 100
        );

        if (totalFund.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("Призовой фонд пуст");
        }

        Map<String, Long> places = determinePlaces(tournamentId);

        if (places.isEmpty()) {
            throw new IllegalArgumentException("Не определены победители по истории боёв");
        }

        Map<Long, PrizeDistribution> distributionsByKnight = new HashMap<>();

        // 1 место
        addOrUpdateDistribution(distributionsByKnight, tournament, places.get(FIRST_PLACE), FIRST_PLACE, PERCENT_WINNER, totalFund);

        // 2 место
        addOrUpdateDistribution(distributionsByKnight, tournament, places.get(SECOND_PLACE), SECOND_PLACE, PERCENT_SECOND, totalFund);

        // 3 место
        addOrUpdateDistribution(distributionsByKnight, tournament, places.get(THIRD_PLACE), THIRD_PLACE, PERCENT_THIRD, totalFund);

        // Приз симпатий (может совпадать с призовым местом — сумма добавится)
        addOrUpdateDistribution(distributionsByKnight, tournament, sympathyWinnerId, SYMPATHY_PLACE, PERCENT_SYMPATHY, totalFund);

        // Сохраняем
        prizeDistributionRepository.saveAll(distributionsByKnight.values());
        tournamentRepository.save(tournament);

        // Уведомления
        distributionsByKnight.values().forEach(dist -> sendWinnerNotification(dist, tournament, totalFund));
        sendOrganizerNotification(tournament, totalFund);
    }

    private Map<String, Long> determinePlaces(Long tournamentId) {
        Map<String, Long> places = new HashMap<>();
        List<FightHistory> fights = fightHistoryRepository.findByTournamentId(tournamentId);

        // Финал
        FightHistory finalFight = fights.stream()
                .filter(f -> f.getRound() == FightRound.FINAL)
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Финальный бой не найден"));

        Long winnerId = finalFight.getWinner().getId();
        Long loserId = winnerId.equals(finalFight.getFighter1().getId())
                ? finalFight.getFighter2().getId()
                : finalFight.getFighter1().getId();

        places.put(FIRST_PLACE, winnerId);
        places.put(SECOND_PLACE, loserId);

        // 3 место — бой за бронзу
        FightHistory bronzeFight = fights.stream()
                .filter(f -> f.getRound() == FightRound.BRONZE)
                .findFirst()
                .orElse(null);

        if (bronzeFight != null && bronzeFight.getWinner() != null) {
            places.put(THIRD_PLACE, bronzeFight.getWinner().getId());
        }

        return places;
    }

    private void addOrUpdateDistribution(Map<Long, PrizeDistribution> map, Tournament tournament,
                                         Long knightId, String place, BigDecimal percent, BigDecimal total) {
        if (knightId == null) {
            return;
        }

        UserAccount knight = userRepository.findById(knightId)
                .orElseThrow(() -> new IllegalArgumentException("Рыцарь не найден: " + knightId));

        BigDecimal amount = total.multiply(percent).setScale(2, RoundingMode.HALF_UP);

        PrizeDistribution dist = map.getOrDefault(knightId, PrizeDistribution.builder()
                .knight(knight)
                .tournament(tournament)
                .amount(BigDecimal.ZERO)
                .calculatedAt(LocalDateTime.now())
                .build());

        dist.setAmount(dist.getAmount().add(amount));
        String placeRu = switch (place) {
            case FIRST_PLACE -> "1 место";
            case SECOND_PLACE -> "2 место";
            case THIRD_PLACE -> "3 место";
            case SYMPATHY_PLACE -> "Приз зрительских симпатий";
            default -> dist.getPlace();
        };

        dist.setPlace(placeRu + (dist.getPlace() == null || dist.getPlace().isEmpty() ? "" : ", " + dist.getPlace())); // комбинируем, если несколько

        map.put(knightId, dist);
    }

    private void sendWinnerNotification(PrizeDistribution dist, Tournament tournament, BigDecimal totalFund) {
        UserAccount knight = dist.getKnight();
        String placeRu = switch (dist.getPlace()) {
            case FIRST_PLACE -> "1 место";
            case SECOND_PLACE -> "2 место";
            case THIRD_PLACE -> "3 место";
            case SYMPATHY_PLACE -> "Приз зрительских симпатий";
            default -> dist.getPlace();
        };

        String body = """
                <!DOCTYPE html>
                <html lang="ru">
                <head><meta charset="UTF-8"><title>Поздравляем с победой!</title></head>
                <body style="font-family: 'Palatino Linotype', serif; background: #f5f0e6; color: #3a3226;">
                    <div style="max-width: 600px; margin: 20px auto; background: #fff9e6; padding: 30px; border: 2px solid #d4af37;">
                        <h1 style="color: #8b0000; text-align: center;">Слава победителю!</h1>
                        <p>Благородный рыцарь <strong>%s %s</strong>!</p>
                        <p>С великой радостью объявляем, что вы заняли <strong>%s</strong> на турнире <strong>%s</strong>.</p>
                        <p>Ваша призовая сумма составляет: <strong>%.2f золотых монет</strong></p>
                        <p>Общий призовой фонд турнира: %.2f золотых</p>
                        <p>Средства будут переведены в ближайшее время.</p>
                        <div style="margin-top: 30px; text-align: center; font-style: italic; color: #8b0000;">
                            Да здравствует чемпион!<br>
                            Сенешаль турнира Айвенго
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                knight.getName(), knight.getSecondName(),
                placeRu,
                tournament.getName(),
                dist.getAmount(),
                totalFund
        );

        emailSendService.sendHtmlEmail(knight.getEmail(), "Поздравляем с победой на турнире!", body);
    }

    private void sendOrganizerNotification(Tournament tournament, BigDecimal totalFund) {
        UserAccount organizer = tournament.getUserAccount();
        if (organizer != null && organizer.getEmail() != null) {
            String body = """
                    <p>Уважаемый организатор!</p>
                    <p>Призовой фонд турнира <strong>%s</strong> успешно рассчитан.</p>
                    <p>Общая сумма: %.2f золотых</p>
                    <p>Распределение завершено и уведомления отправлены победителям.</p>
                    """.formatted(tournament.getName(), totalFund);

            emailSendService.sendHtmlEmail(organizer.getEmail(), "Призовой фонд рассчитан", body);
        }
    }
}
