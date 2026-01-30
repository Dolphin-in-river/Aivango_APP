package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.vote.KnightForVotingDTO;
import com.mpi.aivango_backend.dto.vote.VoteRequest;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.services.vote.VoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api")
@Slf4j
public class VoteController {

    private final VoteService voteService;
    private final UserTokenHelper userTokenHelper;

    @GetMapping("/tournaments/{tournamentId}/knights")
    public ResponseEntity<List<KnightForVotingDTO>> getKnightsForVoting(@PathVariable Long tournamentId) {

        Long userId = userTokenHelper.getCurrentUserId();

        try {
            List<KnightForVotingDTO> knights = voteService.getKnightsForVoting(tournamentId, userId);
            return ResponseEntity.ok(knights);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            log.error("Error loading knights for voting", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/votes")
    public ResponseEntity<Void> submitVote(@RequestBody VoteRequest request) {

        Long userId = userTokenHelper.getCurrentUserId();

        try {
            voteService.submitVote(request, userId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Error submitting vote", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
