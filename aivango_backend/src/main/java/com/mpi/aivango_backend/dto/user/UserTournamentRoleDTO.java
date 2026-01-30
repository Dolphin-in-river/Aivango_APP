package com.mpi.aivango_backend.dto.user;

import com.mpi.aivango_backend.dto.tournament.TournamentDTO;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserTournamentRoleDTO {

    private TournamentDTO tournament;
    private LocalDate eventDate;
    private TournamentStatus status;
    private TournamentRolesEnum role;  // KNIGHT, SPECTATOR, SPONSOR, ORGANIZER или null
}
