package com.mpi.aivango_backend.dto.tournament;

import com.mpi.aivango_backend.models.tournament.TournamentStatus;
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
public class TournamentHistoryItem {

    private Long id;
    private String name;
    private LocalDate eventDate;
    private TournamentStatus status;
    private String locationName;
    private int participantCount;
    private BigDecimal prizeFund;
}
