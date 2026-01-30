package com.mpi.aivango_backend.dto.ticket;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TicketBookingRequest {
    private Integer seatsCount;

    private boolean agreeToRules;
}
