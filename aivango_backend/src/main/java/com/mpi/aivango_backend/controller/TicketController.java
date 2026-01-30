package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.ticket.TicketBookingRequest;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.services.ticket.TicketBookingService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tickets")
@Slf4j
public class TicketController {

    private final TicketBookingService ticketBookingService;
    private final UserTokenHelper userTokenHelper;

    @PostMapping("/tournaments/{tournamentId}")
    public ResponseEntity<Void> bookTicket(
            @PathVariable Long tournamentId,
            @RequestBody TicketBookingRequest request) {

        UserAccount user = userTokenHelper.getCurrentUser();
        if (user == null) {
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
        try {
            ticketBookingService.bookTicket(tournamentId, request, user);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.error("Ошибка при бронировании билета", e);
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            log.error("Ошибка при бронировании билета", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
