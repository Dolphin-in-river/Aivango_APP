package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.fight.TournamentBracketDTO;
import com.mpi.aivango_backend.dto.tournament.TournamentCreateRequest;
import com.mpi.aivango_backend.dto.tournament.TournamentDTO;
import com.mpi.aivango_backend.dto.user.ParticipantDTO;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import com.mpi.aivango_backend.services.email.EmailSendService;
import com.mpi.aivango_backend.services.prize.PrizeCalculationService;
import com.mpi.aivango_backend.services.report.TournamentReportService;
import com.mpi.aivango_backend.services.reporting.ReportingService;
import com.mpi.aivango_backend.services.tournament.BracketGenerationService;
import com.mpi.aivango_backend.services.tournament.TournamentRoleService;
import com.mpi.aivango_backend.services.tournament.TournamentService;
import com.mpi.aivango_backend.services.user.UserService;
import com.mpi.aivango_backend.services.vote.VoteService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/tournament")
@Slf4j
public class TournamentController {
    private final TournamentService tournamentService;
    private final TournamentRoleService tournamentRoleService;
    private final VoteService voteService;
    private final UserService userService;
    private final PrizeCalculationService prizeCalculationService;
    private final BracketGenerationService bracketGenerationService;
    private final EmailSendService emailSendService;
    private final UserTokenHelper userTokenHelper;
    private final TournamentReportService tournamentReportService;

    @PostMapping
    public ResponseEntity<TournamentDTO> create(@RequestBody TournamentCreateRequest request) {
        try {
            Tournament saved = tournamentService.save(request);
            emailSendService.sendCreationTournamentEmail(userTokenHelper.getCurrentEmailUser(), saved);
            var response = tournamentService.mapToTournamentDTO(saved);
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/tournaments")
    public ResponseEntity<List<TournamentDTO>> findAll() {
        try {
            List<Tournament> tournaments = tournamentService.findAll();
            var response = tournaments.stream().map(tournamentService::mapToTournamentDTO)
                    .collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PatchMapping("/{id}/complete")
    @Transactional
    public ResponseEntity<String> completeTournament(@PathVariable Long id) {
        try {
            Tournament tournament = tournamentService.getById(id);

            if (tournament.getTournamentStatus() != TournamentStatus.ACTIVE) {
                return ResponseEntity.badRequest().body("Турнир не в статусе ACTIVE");
            }

            Long sympWinnerId = voteService.getWinnerKnightId(id);
            String winnerInfo = sympWinnerId != null
                    ? userService.getById(sympWinnerId).getName() + " " + userService.getById(sympWinnerId).getSecondName()
                    : "Голосов не было";

            tournament.setTournamentStatus(TournamentStatus.COMPLETED);
            tournamentService.save(tournament);

            try {
                prizeCalculationService.calculatePrizes(id, sympWinnerId);
                emailSendService.sendHtmlEmail(
                        userTokenHelper.getCurrentUser().getEmail(),
                        "🏆 Полный отчёт о турнире «" + tournament.getName() + "»",
                        tournamentReportService.generateReportEmailBody(tournament.getId(), userTokenHelper.getCurrentUserId())
                );
                String message = "Турнир завершён. Призовой фонд рассчитан и распределён. Приз Зрительских Симпатий получает: " + winnerInfo;
                return ResponseEntity.ok(message);
            } catch (Exception e) {
                log.error("Ошибка при расчёте призов после завершения турнира", e);
                return ResponseEntity.ok("Турнир завершён. Ошибка при расчёте призов: " + e.getMessage());
            }

        } catch (Exception e) {
            log.error("Ошибка при завершении турнира", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PostMapping("/{id}/generate-bracket")
    public ResponseEntity<TournamentBracketDTO> generateBracket(@PathVariable Long id) {
        try {
            bracketGenerationService.generateBracket(id);
            TournamentBracketDTO bracket = bracketGenerationService.getTournamentBracket(id);
            return ResponseEntity.ok(bracket);
        } catch (IllegalArgumentException e) {
            log.warn("Ошибка при генерации сетки турнира {}: {}", id, e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            log.error("Неожиданная ошибка при формировании сетки турнира {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{id}/bracket")
    public ResponseEntity<TournamentBracketDTO> getBracket(@PathVariable Long id) {
        try {
            TournamentBracketDTO bracket = bracketGenerationService.getTournamentBracket(id);
            return ResponseEntity.ok(bracket);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            log.error("Ошибка при получении сетки турнира {}", id, e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{tournamentId}/participants")
    public ResponseEntity<List<ParticipantDTO>> getParticipantsByRole(
            @PathVariable Long tournamentId,
            @RequestParam TournamentRolesEnum role) {
        List<ParticipantDTO> participants = tournamentRoleService.getParticipantsByRole(tournamentId, role);
        return ResponseEntity.ok(participants);
    }
}
