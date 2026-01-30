package com.mpi.aivango_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TournamentReportDTO {

    private String tournamentName;
    private LocalDateTime completedAt;
    private String status;

    // Финансовый блок
    private BigDecimal totalCollected;           // от спонсоров
    private BigDecimal totalPrizeFund;           // распределено победителям
    private int sponsorsCount;
    private List<SponsorSummary> sponsors;

    // Посещаемость
    private int totalSeats;
    private int bookedSeats;
    private int availableSeats;
    private double occupancyPercent;

    // Результаты боёв
    private String champion;                     // 1 место
    private String secondPlace;
    private String thirdPlace;
    private String sympathyPrizeWinner;
    private int totalFights;
    private int completedFights;

    @Data
    @Builder
    public static class SponsorSummary {
        private String companyName;
        private String packageType;
        private Double amount;
    }
}
