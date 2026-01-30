package com.mpi.aivango_backend.dto.fight;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TournamentBracketDTO {

    private Long tournamentId;
    private String tournamentName;
    private LocalDateTime generatedAt;

    // Список всех матчей в сетке
    private List<FightMatchDTO> matches;
}
