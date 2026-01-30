package com.mpi.aivango_backend.services.tournament;

import com.mpi.aivango_backend.dto.user.ParticipantDTO;
import com.mpi.aivango_backend.models.application.Application;
import com.mpi.aivango_backend.models.sponsorship.Sponsorship;
import com.mpi.aivango_backend.models.ticket.Ticket;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import com.mpi.aivango_backend.repository.ApplicationRepository;
import com.mpi.aivango_backend.repository.SponsorshipRepository;
import com.mpi.aivango_backend.repository.TicketRepository;
import com.mpi.aivango_backend.repository.UserTournamentRoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TournamentRoleService {

    private final UserTournamentRoleRepository roleRepository;
    private final ApplicationRepository applicationRepository;
    private final TicketRepository ticketRepository;
    private final SponsorshipRepository sponsorshipRepository;

    /**
     * Получает все роли пользователя в конкретном турнире
     */
    public Set<TournamentRolesEnum> getUserRolesInTournament(Long userId, Long tournamentId) {
        return roleRepository.findByUserIdAndTournamentId(userId, tournamentId)
                .stream()
                .map(UserTournamentRole::getRole)
                .collect(Collectors.toSet());
    }

    public List<ParticipantDTO> getParticipantsByRole(Long tournamentId, TournamentRolesEnum role) {
        List<UserTournamentRole> roles = roleRepository.findByTournamentIdAndRole(tournamentId, role);

        return roles.stream()
                .map(this::mapToParticipantDTO)
                .toList();
    }

    private ParticipantDTO mapToParticipantDTO(UserTournamentRole userRole) {
        UserAccount user = userRole.getUser();
        Tournament tournament = userRole.getTournament();

        ParticipantDTO dto = ParticipantDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .secondName(user.getSecondName())
                .email(user.getEmail())
                .role(userRole.getRole())
                .build();

        switch (userRole.getRole()) {
            case KNIGHT -> {
                Application app = applicationRepository
                        .findByKnightIdAndTournamentId(user.getId(), tournament.getId())
                        .orElse(null);
                if (app != null) {
                    dto.setApplicationStatus(app.getStatus());
                    dto.setApplicationComment(app.getComment());
                }
            }
            case SPECTATOR -> {
                Ticket ticket = ticketRepository
                        .findByUserIdAndTournamentId(user.getId(), tournament.getId())
                        .orElse(null);
                if (ticket != null) {
                    dto.setTicketSeatsCount(ticket.getSeatsCount());
                    dto.setBookingCode(ticket.getBookingCode());
                }
            }
            case SPONSOR -> {
                Sponsorship sponsorship = sponsorshipRepository
                        .findBySponsorIdAndTournamentId(user.getId(), tournament.getId())
                        .orElse(null);
                if (sponsorship != null) {
                    dto.setPackageType(sponsorship.getPackageType());
                    dto.setSponsorshipAmount(sponsorship.getAmount());
                    dto.setCompanyName(sponsorship.getCompanyName());
                }
            }
            case ORGANIZER -> {
            }
        }
        return dto;
    }
}
