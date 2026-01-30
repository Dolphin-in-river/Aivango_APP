package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.tournament.TournamentHistoryFilter;
import com.mpi.aivango_backend.dto.tournament.TournamentHistoryItem;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.services.tournament.TournamentHistoryService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/tournaments/history")
@RequiredArgsConstructor
public class TournamentHistoryController {

    private final TournamentHistoryService historyService;
    private final UserTokenHelper userTokenHelper;

    @GetMapping
    public ResponseEntity<Page<TournamentHistoryItem>> getHistory(@ModelAttribute TournamentHistoryFilter filter) {
        UserAccount userAccount = userTokenHelper.getCurrentUser();
        if (userAccount == null || userAccount.getId() == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!userAccount.isOrganizer()) return ResponseEntity.status(403).build();

        Page<TournamentHistoryItem> page = historyService.getTournamentHistory(filter);
        return ResponseEntity.ok(page);
    }
}
