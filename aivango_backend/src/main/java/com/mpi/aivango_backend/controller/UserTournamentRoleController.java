package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.user.UserTournamentRoleDTO;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import com.mpi.aivango_backend.repository.UserTournamentRoleRepository;
import com.mpi.aivango_backend.services.tournament.TournamentService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/user-roles")
@Slf4j
public class UserTournamentRoleController {

    private final UserTokenHelper userTokenHelper;
    private final UserTournamentRoleRepository roleRepository;
    private final TournamentService tournamentService;

    /**
     * Возвращает все турниры, в которых участвует текущий пользователь, и его роль в каждом
     * GET /api/user-roles/my-tournaments
     */
    @GetMapping("/my-tournaments")
    public ResponseEntity<List<UserTournamentRoleDTO>> getMyTournamentsWithRoles() {
        Long userId = userTokenHelper.getCurrentUserId();

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<UserTournamentRole> userRoles = roleRepository.findByUserId(userId);

        List<UserTournamentRoleDTO> response = userRoles.stream()
                .map(role -> UserTournamentRoleDTO.builder()
                        .tournament(tournamentService.mapToTournamentDTO(role.getTournament()))
                        .role(role.getRole())
                        .eventDate(role.getTournament().getEventDate())
                        .status(role.getTournament().getTournamentStatus())
                        .build())
                .collect(Collectors.toList());

        return ResponseEntity.ok(response);
    }

    /**
     * Возвращает роль текущего пользователя в конкретном турнире
     * GET /api/user-roles/tournaments/{tournamentId}
     */
    @GetMapping("/tournaments/{tournamentId}")
    public ResponseEntity<UserTournamentRoleDTO> getMyRoleInTournament(@PathVariable Long tournamentId) {
        Long userId = userTokenHelper.getCurrentUserId();

        if (userId == null) {
            return ResponseEntity.status(401).build();
        }

        List<UserTournamentRole> roleOpt = roleRepository
                .findByUserIdAndTournamentId(userId, tournamentId);

        if (roleOpt.size() != 1) {
            return ResponseEntity.ok(UserTournamentRoleDTO.builder()
                    .tournament(tournamentService.mapToTournamentDTO(tournamentService.getById(tournamentId)))
                    .role(null)
                    .build());
        }

        UserTournamentRole role = roleOpt.get(0);

        UserTournamentRoleDTO response = UserTournamentRoleDTO.builder()
                .tournament(tournamentService.mapToTournamentDTO(tournamentService.getById(tournamentId)))
                .role(role.getRole())
                .eventDate(role.getTournament().getEventDate())
                .status(role.getTournament().getTournamentStatus())
                .build();

        return ResponseEntity.ok(response);
    }
}
