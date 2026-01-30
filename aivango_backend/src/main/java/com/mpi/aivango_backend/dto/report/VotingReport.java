package com.mpi.aivango_backend.dto.report;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VotingReport {
    private Long tournamentId;
    private Map<Long, Long> votesPerKnight;
    private Long winnerId;
    private Long winnerVotes;
}
