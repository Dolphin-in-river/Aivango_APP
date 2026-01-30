package com.mpi.aivango_backend.dto.fight;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FightResultRequest {

    private Long winnerId;

    private String comment;
}
