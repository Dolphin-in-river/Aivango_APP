package com.mpi.aivango_backend.services.report;

import com.mpi.aivango_backend.dto.report.TournamentReportDTO;
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
import com.mpi.aivango_backend.repository.TicketRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class TournamentReportService {

    private final TournamentRepository tournamentRepository;
    private final SponsorshipRepository sponsorshipRepository;
    private final TicketRepository ticketRepository;
    private final FightHistoryRepository fightHistoryRepository;
    private final PrizeDistributionRepository prizeDistributionRepository;

    public TournamentReportDTO generateReport(Long tournamentId, Long organizerId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Турнир не найден"));

        if (tournament.getTournamentStatus() != TournamentStatus.COMPLETED) {
            throw new IllegalArgumentException("Отчёт доступен только для завершённых турниров");
        }

        // Проверка прав — только организатор
        if (!tournament.getUserAccount().getId().equals(organizerId)) {
            throw new IllegalArgumentException("Доступ запрещён");
        }

        TournamentReportDTO report = new TournamentReportDTO();
        report.setTournamentName(tournament.getName());
        report.setCompletedAt(LocalDateTime.now());
        report.setStatus(tournament.getTournamentStatus().name());

        // === Финансовый отчёт ===
        List<Sponsorship> confirmedSponsors = sponsorshipRepository
                .findByTournamentIdAndStatus(tournamentId, SponsorshipStatus.CONFIRMED);

        BigDecimal totalCollected = BigDecimal.valueOf(
                sponsorshipRepository.sumAmountByTournamentIdAndStatus(tournamentId, SponsorshipStatus.CONFIRMED)
        );

        List<TournamentReportDTO.SponsorSummary> sponsorSummaries = confirmedSponsors.stream()
                .map(s -> TournamentReportDTO.SponsorSummary.builder()
                        .companyName(s.getCompanyName())
                        .packageType(s.getPackageType().name())
                        .amount(s.getAmount())
                        .build())
                .toList();

        BigDecimal totalPrizeFund = prizeDistributionRepository.findByTournamentId(tournamentId)
                .stream()
                .map(PrizeDistribution::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        report.setTotalCollected(totalCollected);
        report.setTotalPrizeFund(totalPrizeFund);
        report.setSponsorsCount(confirmedSponsors.size());
        report.setSponsors(sponsorSummaries);

        // === Посещаемость ===
        int totalSeats = tournament.getTotalSeats();
        int bookedSeats = ticketRepository.sumSeatsCountByTournamentIdAndConfirmedTrue(tournamentId);

        report.setTotalSeats(totalSeats);
        report.setBookedSeats(bookedSeats);
        report.setAvailableSeats(totalSeats - bookedSeats);
        report.setOccupancyPercent(totalSeats > 0
                ? BigDecimal.valueOf(bookedSeats).divide(BigDecimal.valueOf(totalSeats), 4, RoundingMode.HALF_UP)
                .multiply(BigDecimal.valueOf(100)).doubleValue()
                : 0.0);

        // === Результаты боёв ===
        List<FightHistory> fights = fightHistoryRepository.findByTournamentId(tournamentId);
        int completedFights = (int) fights.stream().filter(f -> f.getWinner() != null).count();

        report.setTotalFights(fights.size());
        report.setCompletedFights(completedFights);

        // Победители по местам
        FightHistory finalFight = fights.stream()
                .filter(f -> f.getRound() == FightRound.FINAL)
                .findFirst()
                .orElse(null);

        if (finalFight != null && finalFight.getWinner() != null) {
            report.setChampion(getFullName(finalFight.getWinner()));
            UserAccount loser = finalFight.getFighter1().getId().equals(finalFight.getWinner().getId())
                    ? finalFight.getFighter2()
                    : finalFight.getFighter1();
            if (loser != null) {
                report.setSecondPlace(getFullName(loser));
            }
        }

        // 3-е место
        FightHistory bronze = fights.stream()
                .filter(f -> f.getRound() == FightRound.BRONZE)
                .findFirst()
                .orElse(null);

        if (bronze != null && bronze.getWinner() != null) {
            report.setThirdPlace(getFullName(bronze.getWinner()));
        }

        // Приз зрительских симпатий
        PrizeDistribution sympathy = prizeDistributionRepository.findByTournamentId(tournamentId).stream()
                .filter(p -> "sympathy".equals(p.getPlace()) || p.getPlace().contains("sympathy") || p.getPlace().contains("зрительских"))
                .findFirst()
                .orElse(null);

        if (sympathy != null) {
            report.setSympathyPrizeWinner(getFullName(sympathy.getKnight()));
        }

        return report;
    }

    public String generateReportEmailBody(Long tournamentId, Long organizerId) {
        var report = generateReport(tournamentId, organizerId);
        return """
        <!DOCTYPE html>
        <html lang="ru">
        <head>
            <meta charset="UTF-8">
            <title>Отчёт о турнире «%s»</title>
            <style>
                body { font-family: 'Palatino Linotype', 'Georgia', serif; background: #f5f0e6; color: #3a3226; margin: 0; padding: 0; }
                .container { max-width: 800px; margin: 30px auto; background: #fff9e6; padding: 40px; border: 4px double #d4af37; border-radius: 15px; box-shadow: 0 10px 30px rgba(212,175,55,0.4); }
                h1 { color: #8b0000; text-align: center; font-variant: small-caps; letter-spacing: 3px; margin-bottom: 10px; }
                h2 { color: #a0522d; border-bottom: 2px solid #d4af37; padding-bottom: 8px; margin-top: 40px; }
                .trophy { font-size: 80px; text-align: center; margin: 20px 0; }
                table { width: 100%%; border-collapse: collapse; margin: 20px 0; background: #f8f4e8; }
                th, td { padding: 12px; text-align: left; border: 1px solid #d4af37; }
                th { background: #e6d5b8; font-weight: bold; }
                .highlight { background: #fff3cd; text-align: center; font-size: 1.2em; font-weight: bold; }
                .footer { margin-top: 50px; text-align: center; font-style: italic; color: #8b0000; font-size: 16px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="trophy">🏆</div>
                <h1>Отчёт о завершённом турнире</h1>
                <p style="text-align: center; font-size: 1.3em;"><strong>«%s»</strong></p>
                <p style="text-align: center;">Дата завершения: %s</p>

                <h2>🏅 Победители турнира</h2>
                <table>
                    <tr><th>Место</th><th>Рыцарь</th></tr>
                    <tr><td class="highlight">1 место — Чемпион</td><td class="highlight">%s</td></tr>
                    <tr><td>2 место</td><td>%s</td></tr>
                    <tr><td>3 место</td><td>%s</td></tr>
                    <tr><td>Приз зрительских симпатий</td><td>%s</td></tr>
                </table>

                <h2>💰 Финансовый отчёт</h2>
                <table>
                    <tr><th>Показатель</th><th>Сумма</th></tr>
                    <tr><td>Собрано от спонсоров</td><td><strong>%.2f золотых</strong></td></tr>
                    <tr><td>Выплачено призового фонда</td><td><strong>%.2f золотых</strong></td></tr>
                    <tr><td>Количество спонсоров</td><td>%d</td></tr>
                </table>

                %s

                <h2>👥 Посещаемость</h2>
                <table>
                    <tr><th>Показатель</th><th>Значение</th></tr>
                    <tr><td>Общее количество мест</td><td>%d</td></tr>
                    <tr><td>Забронировано мест</td><td>%d</td></tr>
                    <tr><td>Свободно мест</td><td>%d</td></tr>
                    <tr><td class="highlight">Заполняемость зала</td><td class="highlight">%.2f%%%%</td></tr>
                </table>

                <h2>⚔️ Статистика боёв</h2>
                <table>
                    <tr><th>Показатель</th><th>Значение</th></tr>
                    <tr><td>Всего боёв</td><td>%d</td></tr>
                    <tr><td>Завершено боёв</td><td>%d</td></tr>
                </table>

                <div class="footer">
                    Благодарим всех участников, спонсоров и зрителей!<br>
                    Да здравствует дух рыцарства и честного поединка!<br><br>
                    Сенешаль турнира Айвенго
                </div>
            </div>
        </body>
        </html>
        """.formatted(
                report.getTournamentName(),
                report.getTournamentName(),
                report.getCompletedAt().toLocalDate(),
                report.getChampion() != null ? report.getChampion() : "Не определён",
                report.getSecondPlace() != null ? report.getSecondPlace() : "Не определён",
                report.getThirdPlace() != null ? report.getThirdPlace() : "Не определён",
                report.getSympathyPrizeWinner() != null ? report.getSympathyPrizeWinner() : "Не определён",
                report.getTotalCollected(),
                report.getTotalPrizeFund(),
                report.getSponsorsCount(),
                generateSponsorsTable(report.getSponsors()),
                report.getTotalSeats(),
                report.getBookedSeats(),
                report.getAvailableSeats(),
                report.getOccupancyPercent(),
                report.getTotalFights(),
                report.getCompletedFights()
        );
    }

    // Вспомогательный метод для таблицы спонсоров
    private String generateSponsorsTable(List<TournamentReportDTO.SponsorSummary> sponsors) {
        if (sponsors.isEmpty()) {
            return "<p><em>Спонсоров не было</em></p>";
        }

        StringBuilder sb = new StringBuilder();
        sb.append("<h2>🤝 Спонсоры турнира</h2>");
        sb.append("<table>");
        sb.append("<tr><th>Компания</th><th>Пакет</th><th>Взнос</th></tr>");

        for (TournamentReportDTO.SponsorSummary s : sponsors) {
            sb.append("<tr>")
                    .append("<td>").append(s.getCompanyName()).append("</td>")
                    .append("<td>").append(s.getPackageType()).append("</td>")
                    .append("<td>").append(String.format("%.2f золотых", s.getAmount())).append("</td>")
                    .append("</tr>");
        }

        sb.append("</table>");
        return sb.toString();
    }

    private String getFullName(UserAccount user) {
        if (user == null) return "Не определён";
        return user.getName() + " " + user.getSecondName();
    }
}
