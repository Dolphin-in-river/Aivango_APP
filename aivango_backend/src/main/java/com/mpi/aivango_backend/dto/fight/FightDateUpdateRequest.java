package com.mpi.aivango_backend.dto.fight;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FightDateUpdateRequest {
    private LocalDateTime newFightDate;
}
