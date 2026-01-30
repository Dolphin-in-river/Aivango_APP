package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.report.TournamentReportDTO;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.services.report.TournamentReportService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/reports")
@Slf4j
public class ReportController {

    private final TournamentReportService reportService;
    private final UserTokenHelper userTokenHelper;

    @GetMapping("/tournaments/{tournamentId}")
    public ResponseEntity<TournamentReportDTO> getTournamentReport(@PathVariable Long tournamentId) {
        Long organizerId = userTokenHelper.getCurrentUserId();

        if (organizerId == null) {
            return ResponseEntity.status(401).build();
        }

        try {
            TournamentReportDTO report = reportService.generateReport(tournamentId, organizerId);
            return ResponseEntity.ok(report);
        } catch (IllegalArgumentException e) {
            log.warn("Ошибка доступа к отчёту: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            log.error("Ошибка при формировании отчёта", e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
