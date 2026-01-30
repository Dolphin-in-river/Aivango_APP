package com.mpi.aivango_backend.dto.tournament;

import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TournamentHistoryFilter {
    private LocalDate eventDateFrom;
    private LocalDate eventDateTo;
    private Long locationId;
    private TournamentStatus status;

    // Пагинация
    private int page = 0;
    private int size = 20;
}
