package com.mpi.aivango_backend.dto.vote;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KnightForVotingDTO {
    private Long id;
    private String name;
    private String secondName;
}
