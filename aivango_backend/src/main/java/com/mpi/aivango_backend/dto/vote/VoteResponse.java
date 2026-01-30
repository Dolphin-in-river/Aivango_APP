package com.mpi.aivango_backend.dto.vote;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VoteResponse {
    private Long id;
    private Long voterId;
    private Long votedForId;
    private Long tournamentId;
    private String voteDate;
}
