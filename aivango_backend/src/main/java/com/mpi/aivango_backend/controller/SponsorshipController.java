package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.sponsorship.SponsorshipRequest;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.services.sponsorship.SponsorshipService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/sponsorship")
@Slf4j
public class SponsorshipController {

    private final SponsorshipService sponsorshipService;
    private final UserTokenHelper userTokenHelper;

    @PostMapping("/tournaments/{tournamentId}")
    public ResponseEntity<Void> createSponsorship(@PathVariable Long tournamentId,
                                                  @RequestBody SponsorshipRequest request) {

        Long sponsorId = userTokenHelper.getCurrentUserId();
        if (sponsorId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        try {
            sponsorshipService.createSponsorship(tournamentId, request, sponsorId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.warn("Ошибка спонсорства: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Неожиданная ошибка при создании спонсорства", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
