package com.mpi.aivango_backend.services.fight;

import com.mpi.aivango_backend.dto.fight.FightDateUpdateRequest;
import com.mpi.aivango_backend.dto.fight.FightResultRequest;
import com.mpi.aivango_backend.models.fight.FightHistory;
import com.mpi.aivango_backend.models.fight.FightRound;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.repository.FightHistoryRepository;
import com.mpi.aivango_backend.repository.UserRepository;
import com.mpi.aivango_backend.services.email.EmailSendService;
import com.mpi.aivango_backend.services.tournament.TournamentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class FightResultService {

    private final FightHistoryRepository fightHistoryRepository;
    private final UserRepository userRepository;
    private final EmailSendService emailSendService;
    private final TournamentService tournamentService;

    @Transactional
    public void recordFightResult(Long fightId, FightResultRequest request) {
        FightHistory fight = fightHistoryRepository.findById(fightId)
                .orElseThrow(() -> new IllegalArgumentException("Бой не найден"));

//        if (fight.getWinner() != null) {
//            throw new IllegalArgumentException("Результат этого боя уже введён");
//        }

        UserAccount winner = userRepository.findById(request.getWinnerId())
                .orElseThrow(() -> new IllegalArgumentException("Победитель не найден"));

        // Проверяем, что победитель — один из участников
        if (!winner.getId().equals(fight.getFighter1().getId()) &&
                (fight.getFighter2() == null || !winner.getId().equals(fight.getFighter2().getId()))) {
            throw new IllegalArgumentException("Победитель должен быть одним из участников боя");
        }

        // Записываем победителя и комментарий
        fight.setWinner(winner);
        fight.setComment(request.getComment());
        fightHistoryRepository.save(fight);

        log.info("Результат боя {} записан: победитель {}", fightId, winner.getName() + " " + winner.getSecondName());

        // Автоматическое продвижение в следующий матч
        if (fight.getNextMatchId() != null) {
            promoteWinnerToNextMatch(fight);
        }

//        if (fight.getRound() == FightRound.FINAL) {
//            var tournament = fight.getTournament();
//            tournament.setTournamentStatus(TournamentStatus.COMPLETED);
//            tournamentService.save(tournament);
//        }

        // Уведомления участникам
        sendResultNotifications(fight, request.getComment());

        if (fight.getRound() == FightRound.SEMIFINAL) {
            FightHistory bronzeFight =
                    fightHistoryRepository.findByTournamentId(fight.getTournament().getId())
                            .stream().filter(s -> s.getRound() == FightRound.BRONZE).findFirst().orElseThrow();

            UserAccount loser;
            if (Objects.equals(fight.getFighter1().getId(), winner.getId())) {
                loser = fight.getFighter2();
            } else {
                loser = fight.getFighter1();
            }
            if (bronzeFight.getFighter1() == null) {
                bronzeFight.setFighter1(loser);
            } else if (bronzeFight.getFighter2() == null) {
                bronzeFight.setFighter2(loser);
            }
            fightHistoryRepository.save(bronzeFight);

            String bronzeInvitationBody = """
                    <!DOCTYPE html>
                    <html lang="ru">
                    <head>
                        <meta charset="UTF-8">
                        <title>🏅 Бой за бронзу!</title>
                        <style>
                            body { font-family: 'Palatino Linotype', 'Georgia', serif; background: #f5f0e6; color: #3a3226; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 30px auto; background: #fff9e6; padding: 35px; border: 3px solid #d4af37; border-radius: 12px; box-shadow: 0 8px 25px rgba(212,175,55,0.3); }
                            h1 { color: #8b0000; text-align: center; font-variant: small-caps; letter-spacing: 2px; margin-bottom: 10px; }
                            .medal { font-size: 60px; text-align: center; margin: 10px 0; }
                            .highlight { background: #f8f4e8; border-left: 5px solid #d4af37; padding: 15px; margin: 25px 0; font-style: italic; text-align: center; font-size: 18px; }
                            .footer { margin-top: 40px; text-align: center; font-style: italic; color: #8b0000; font-size: 15px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="medal">🏅</div>
                            <h1>Приглашение на бой за бронзу</h1>
                            
                            <p>Благородный рыцарь <strong>%s %s</strong>!</p>
                            
                            <p>Вы показали выдающееся мастерство в полуфинале турнира <strong>«%s»</strong>.</p>
                            
                            <div class="highlight">
                                Вас ждёт почётный бой за третье место!<br>
                                Это шанс увенчать своё участие заслуженной бронзовой медалью.
                            </div>
                            
                            <p>Сражайтесь с достоинством — ваша доблесть уже вписана в летопись турнира.</p>

                            <p>Ждём вас на арене!</p>
                            
                            <div class="footer">
                                Честь и слава ждут достойных.<br>
                                Сенешаль турнира Айвенго
                            </div>
                        </div>
                    </body>
                    </html>
                    """.formatted(
                    winner.getName(),
                    winner.getSecondName(),
                    fight.getTournament().getName()
            );
            emailSendService.sendHtmlEmail(loser.getEmail(), "🏅 Бой за бронзу — Турнир «"
                    + fight.getTournament().getName() + "»", bronzeInvitationBody);
        }
    }

    private void promoteWinnerToNextMatch(FightHistory currentFight) {
        FightHistory nextFight = fightHistoryRepository.findById(currentFight.getNextMatchId())
                .orElse(null);

        if (nextFight == null) {
            return; // например, бой за бронзу или финал
        }

        UserAccount winner = currentFight.getWinner();

        // Определяем, в какое место следующего матча ставим победителя
        if (nextFight.getFighter1() == null) {
            nextFight.setFighter1(winner);
        } else if (nextFight.getFighter2() == null) {
            nextFight.setFighter2(winner);
        } else {
            // Оба места заняты — это ошибка (не должно быть)
            log.error("Следующий матч {} уже заполнен", nextFight.getId());
            return;
        }

        fightHistoryRepository.save(nextFight);

        log.info("Рыцарь {} продвинут в матч {}", winner.getName() + " " + winner.getSecondName(), nextFight.getId());

        // Если следующий матч теперь полный (оба fighter не null) — можно уведомить организатора
        if (nextFight.getFighter1() != null && nextFight.getFighter2() != null) {
            sendMatchReadyNotification(nextFight);
        }
    }

    private void sendResultNotifications(FightHistory fight, String comment) {
        UserAccount winner = fight.getWinner();
        UserAccount loser = fight.getFighter1().getId().equals(winner.getId()) ? fight.getFighter2() : fight.getFighter1();
        String winnerBody;
        if (fight.getRound() == FightRound.FINAL) {
            winnerBody = """
                    <!DOCTYPE html>
                    <html lang="ru">
                    <head>
                        <meta charset="UTF-8">
                        <title>СЛАВА ЧЕМПИОНУ!</title>
                        <style>
                            body { font-family: 'Palatino Linotype', serif; background: #f5f0e6; color: #3a3226; }
                            .container { max-width: 600px; margin: 20px auto; background: #fff9e6; padding: 30px; border: 3px solid #d4af37; box-shadow: 0 0 20px rgba(212,175,55,0.5); }
                            h1 { color: #8b0000; text-align: center; font-variant: small-caps; letter-spacing: 2px; }
                            .crown { font-size: 60px; text-align: center; }
                            .highlight { background: #f8f8f8; border: 1px solid #d4af37; padding: 15px; margin: 20px 0; text-align: center; font-weight: bold; }
                            .footer { margin-top: 40px; text-align: center; font-style: italic; color: #8b0000; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="crown">👑</div>
                            <h1>СЛАВА ЧЕМПИОНУ!</h1>
                            
                            <p>Благородный рыцарь <strong>%s %s</strong>!</p>
                            
                            <p>С великой честью и гордостью объявляем:</p>
                            
                            <div class="highlight">
                                Вы стали <strong>ПОБЕДИТЕЛЕМ</strong> Великого турнира<br>
                                <strong>«%s»</strong>!
                            </div>
                            
                            <p>В финальном поединке вы одолели достойного соперника и заслужили вечную славу среди рыцарей Айвенго.</p>
                            
                            %s
                            
                            <p>Пусть ваша победа вдохновляет новые подвиги!</p>
                            
                            <div class="footer">
                                Да пребудет с вами слава и честь!<br>
                                Сенешаль турнира Айвенго
                            </div>
                        </div>
                    </body>
                    </html>
                    """.formatted(
                    winner.getName(),
                    winner.getSecondName(),
                    fight.getTournament().getName(),
                    comment != null && !comment.isBlank()
                            ? "<p><strong>Комментарий судьи:</strong><br>" + comment + "</p>"
                            : ""
            );
        } else {

            // Письмо победителю
            winnerBody = """
                    <!DOCTYPE html>
                    <html lang="ru">
                    <head>
                        <meta charset="UTF-8">
                        <title>⚔️ Победа в бою!</title>
                        <style>
                            body { font-family: 'Palatino Linotype', 'Georgia', serif; background: #f5f0e6; color: #3a3226; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 30px auto; background: #fff9e6; padding: 35px; border: 3px solid #d4af37; border-radius: 12px; box-shadow: 0 8px 25px rgba(212,175,55,0.3); }
                            h1 { color: #8b0000; text-align: center; font-variant: small-caps; letter-spacing: 2px; margin-bottom: 10px; }
                            .sword { font-size: 60px; text-align: center; margin: 10px 0; }
                            .highlight { background: #f8f4e8; border-left: 5px solid #d4af37; padding: 15px; margin: 25px 0; font-style: italic; }
                            .footer { margin-top: 40px; text-align: center; font-style: italic; color: #8b0000; font-size: 15px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="sword">⚔️</div>
                            <h1>Победа в бою!</h1>
                            
                            <p>Благородный рыцарь <strong>%s %s</strong>!</p>
                            
                            <p>С радостью объявляем: вы одержали победу в <strong>%s</strong> турнира <strong>«%s»</strong>!</p>
                            
                            <div class="highlight">
                                Ваше мастерство и доблесть принесли вам заслуженную славу!
                            </div>
                           
                            
                            <p>Следите за турнирной сеткой — новые подвиги ждут вас!</p>
                            
                            <div class="footer">
                                Да преумножится ваша слава!<br>
                                Сенешаль турнира Айвенго
                            </div>
                        </div>
                    </body>
                    </html>
                    """.formatted(
                    winner.getName(),
                    winner.getSecondName(),
                    fight.getRound().getDisplayName(),
                    fight.getTournament().getName()
            );
        }
        emailSendService.sendHtmlEmail(winner.getEmail(), "Победа в бою!", winnerBody);

        // Письмо проигравшему (если есть)
        if (loser != null) {
            String loserBody = """
                    <!DOCTYPE html>
                    <html lang="ru">
                    <head>
                        <meta charset="UTF-8">
                        <title>Достойный бой</title>
                        <style>
                            body { font-family: 'Palatino Linotype', 'Georgia', serif; background: #f5f0e6; color: #3a3226; margin: 0; padding: 0; }
                            .container { max-width: 600px; margin: 30px auto; background: #fff9e6; padding: 35px; border: 3px solid #d4af37; border-radius: 12px; box-shadow: 0 8px 25px rgba(212,175,55,0.3); }
                            h1 { color: #8b0000; text-align: center; font-variant: small-caps; letter-spacing: 2px; margin-bottom: 10px; }
                            .shield { font-size: 60px; text-align: center; margin: 10px 0; }
                            .highlight { background: #f8f4e8; border-left: 5px solid #d4af37; padding: 15px; margin: 25px 0; font-style: italic; }
                            .footer { margin-top: 40px; text-align: center; font-style: italic; color: #8b0000; font-size: 15px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <div class="shield">🛡️</div>
                            <h1>Достойный бой</h1>
                            
                            <p>Благородный рыцарь <strong>%s %s</strong>!</p>
                            
                            <p>Вы показали истинную доблесть в <strong>%s</strong> турнира <strong>«%s»</strong>.</p>
                            
                            <div class="highlight">
                                Хотя победа досталась вашему сопернику, ваша честь и мастерство останутся в памяти всех, кто видел этот поединок.
                            </div>
                            
                            <p>Благодарим за участие и желаем новых побед!</p>
                            
                            <div class="footer">
                                Честь выше победы.<br>
                                Сенешаль турнира Айвенго
                            </div>
                        </div>
                    </body>
                    </html>
                    """.formatted(
                    winner.getName(),
                    winner.getSecondName(),
                    fight.getRound().getDisplayName(),
                    fight.getTournament().getName()
            );
            emailSendService.sendHtmlEmail(loser.getEmail(), "Результат боя", loserBody);
        }
    }

    @Transactional
    public void updateFightDate(Long fightId, FightDateUpdateRequest request, Long organizerId) {
        FightHistory fight = fightHistoryRepository.findById(fightId)
                .orElseThrow(() -> new IllegalArgumentException("Бой не найден"));

        Tournament tournament = fight.getTournament();

        // Проверка: организатор ли это турнира
        // Предполагаем, что у Tournament есть поле organizer (UserAccount)
        if (!tournament.getUserAccount().getId().equals(organizerId)) {
            throw new IllegalArgumentException("Только организатор турнира может менять время матчей");
        }

        LocalDateTime oldDate = fight.getFightDate();
        LocalDateTime newDate = request.getNewFightDate();

        if (oldDate.equals(newDate)) {
            throw new IllegalArgumentException("Новое время совпадает со старым");
        }

        fight.setFightDate(newDate);
        fightHistoryRepository.save(fight);

        log.info("Время боя {} изменено с {} на {}", fightId, oldDate, newDate);

        // Уведомляем участников
        sendDateChangeNotification(fight, oldDate, newDate);
    }

    private void sendDateChangeNotification(FightHistory fight, LocalDateTime oldDate, LocalDateTime newDate) {
        UserAccount fighter1 = fight.getFighter1();
        UserAccount fighter2 = fight.getFighter2();

        String body = """
                <!DOCTYPE html>
                <html lang="ru">
                <head><meta charset="UTF-8"><title>Изменение времени боя</title></head>
                <body style="font-family: 'Palatino Linotype', serif; background: #f5f0e6; color: #3a3226;">
                    <div style="max-width: 600px; margin: 20px auto; background: #fff9e6; padding: 30px; border: 2px solid #d4af37;">
                        <h1 style="color: #8b0000; text-align: center;">Перенос боя</h1>
                        <p>Благородный рыцарь!</p>
                        <p>Время вашего боя в турнире <strong>%s</strong> (%s) изменено.</p>
                        <p><strong>Было:</strong> %s</p>
                        <p><strong>Стало:</strong> %s</p>
                        <p>Пожалуйста, скорректируйте свои планы.</p>
                        <div style="margin-top: 30px; text-align: center; font-style: italic; color: #8b0000;">
                            Сенешаль турнира Айвенго
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                fight.getTournament().getName(),
                fight.getRound().getDisplayName(),
                oldDate,
                newDate
        );

        if (fighter1 != null) {
            emailSendService.sendHtmlEmail(fighter1.getEmail(), "Перенос боя в турнире", body);
        }
        if (fighter2 != null) {
            emailSendService.sendHtmlEmail(fighter2.getEmail(), "Перенос боя в турнире", body);
        }
    }

    private void sendMatchReadyNotification(FightHistory nextFight) {
        // Пока логируем
        log.info("Матч {} готов: {} vs {}", nextFight.getId(),
                nextFight.getFighter1().getName() + " " + nextFight.getFighter1().getSecondName(),
                nextFight.getFighter2() != null ? nextFight.getFighter2().getName() + " " + nextFight.getFighter2().getSecondName() : "ожидается");
    }
}
