package com.mpi.aivango_backend.dto.application;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@NoArgsConstructor
@Getter
@Setter
@Builder
@AllArgsConstructor
public class ApplicationDTO {
    private Long id;
    private String knightName;
    private String knightSurname;
    private Long tournamentId;

    private Integer height;

    private Integer weight;

    private String motivation;

    private LocalDate birthDate;
    private String coatOfArmsUrl;
}
