package com.mpi.aivango_backend.dto.tournament;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@RequiredArgsConstructor
@Getter
@Setter
public class TournamentCreateRequest {
    private String name;
    private Float requiredAmount;
    private String description;
    private Float prizePercentNum;
    private LocalDate eventDate;
    private Integer totalSeats;
    private Integer requiredKnights;
    private List<Long> selectedLocationsIds;
}
