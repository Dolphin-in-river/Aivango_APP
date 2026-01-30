package com.mpi.aivango_backend.dto.tournament;


import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TournamentDTO {

    private Long id;
    private String name;

    // Финансы
    private Double collectedAmount;     // собранная сумма от спонсоров
    private Double requiredAmount;      // необходимая сумма

    private String description;
    private Float prizePercentNum;          // процент приза для победителя

    private TournamentStatus tournamentStatus;

    // Места для зрителей
    private Integer totalSeats;             // общее количество мест
    private Integer availableSeats;         // свободные места для зрителей

    // Дата проведения
    private LocalDate eventDate;

    // Локация
    private String finalLocationName;       // название выбранной локации

    // Организатор
    private String organizerName;           // имя + фамилия организатора

    // Места для рыцарей
    private Integer totalKnights;           // общее количество мест для рыцарей (лимит)
    private Integer availableKnightSlots;   // свободные места для рыцарей (totalKnights - approved knights)

    // Роль текущего пользователя в этом турнире
    private TournamentRolesEnum userRole;        // KNIGHT, SPECTATOR, SPONSOR, ORGANIZER или null
}
