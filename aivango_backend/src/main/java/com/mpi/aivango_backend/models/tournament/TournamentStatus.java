package com.mpi.aivango_backend.models.tournament;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

@RequiredArgsConstructor
@Getter
public enum TournamentStatus {
    WAITING_DONATION,
    KNIGHT_REGISTRATION,
    TICKET_SALES,
    ACTIVE,
    COMPLETED
}
