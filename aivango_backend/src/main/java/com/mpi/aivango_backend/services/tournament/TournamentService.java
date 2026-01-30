package com.mpi.aivango_backend.services.tournament;

import com.mpi.aivango_backend.dto.tournament.TournamentCreateRequest;
import com.mpi.aivango_backend.dto.tournament.TournamentDTO;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.models.sponsorship.SponsorshipStatus;
import com.mpi.aivango_backend.models.tournament.Location;
import com.mpi.aivango_backend.models.tournament.LocationTournament;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import com.mpi.aivango_backend.repository.LocationRepository;
import com.mpi.aivango_backend.repository.SponsorshipRepository;
import com.mpi.aivango_backend.repository.TicketRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import com.mpi.aivango_backend.repository.UserTournamentRoleRepository;
import com.mpi.aivango_backend.services.email.EmailSendService;
import com.mpi.aivango_backend.services.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class TournamentService {
    private final TournamentRepository tournamentRepository;
    private final LocationRepository locationRepository;
    private final EmailSendService emailSendService;
    private final SponsorshipRepository sponsorshipRepository;
    private final UserTokenHelper userTokenHelper;
    private final UserService userService;
    private final UserTournamentRoleRepository userTournamentRoleRepository;
    private final TicketRepository ticketRepository;

    public Tournament save(TournamentCreateRequest request) {
        var email = userTokenHelper.getCurrentEmailUser();
        if (email == null) {
            throw new RuntimeException("Email is incorrect");
        }
        var user = userService.findByEmail(email);
        if (!user.isOrganizer()) {
            throw new RuntimeException("You can't create a new tournament");
        }
        Tournament saved = tournamentRepository.save(tournamentRequestToEntity(request, user));
        UserTournamentRole organizerRole = UserTournamentRole.builder()
                .user(user)
                .tournament(saved)
                .role(TournamentRolesEnum.ORGANIZER)
                .build();
        userTournamentRoleRepository.save(organizerRole);
        return saved;
    }

    public Tournament save(Tournament request) {
        Tournament saved = tournamentRepository.save(request);
        return saved;
    }

    public Tournament getById(Long id) {
        return tournamentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Турнир не найден"));
    }

    public Tournament tournamentRequestToEntity(TournamentCreateRequest request, UserAccount user) {
        Tournament tournament = Tournament.builder()
                .name(request.getName())
                .requiredAmount(request.getRequiredAmount())
                .description(request.getDescription())
                .prizePercentNum(request.getPrizePercentNum())
                .tournamentStatus(TournamentStatus.WAITING_DONATION)
                .eventDate(request.getEventDate())
                .totalSeats(request.getTotalSeats())
                .requiredKnights(request.getRequiredKnights())
                .userAccount(user)  // организатор турнира
                .selectedLocations(new ArrayList<>())  // будет заполнено ниже
                .applications(new ArrayList<>())
                .roles(new ArrayList<>())
                .build();


        List<LocationTournament> selectedLocations = request.getSelectedLocationsIds().stream().map(locationId -> {
            LocationTournament locationTournament = new LocationTournament();
            var location = locationRepository.findById(locationId);
            if (location.isEmpty()) {
                throw new RuntimeException("Location id is not correct");
            }
            locationTournament.setLocation(location.get());
            locationTournament.setTournament(tournament);
            return locationTournament;
        }).collect(Collectors.toList());

        if (!selectedLocations.isEmpty()) {
            Collections.shuffle(selectedLocations);
            Location randomFinalLocation = selectedLocations.get(0).getLocation();
            tournament.setFinalLocation(randomFinalLocation);
        } else {
            throw new IllegalArgumentException("Должна быть выбрана хотя бы одна локация");
        }

        tournament.setSelectedLocations(selectedLocations);
        return tournament;
    }

    public List<Tournament> findAll() {
        return tournamentRepository.findAll();
    }

    public TournamentDTO mapToTournamentDTO(Tournament tournament) {
        var currentUserId = userTokenHelper.getCurrentUserId();
        Double collectedAmount = sponsorshipRepository
                .sumAmountByTournamentIdAndStatus(tournament.getId(), SponsorshipStatus.CONFIRMED);

        // Свободные места для зрителей
        int bookedSeats = ticketRepository.sumSeatsCountByTournamentIdAndConfirmedTrue(tournament.getId());
        int availableSeats = tournament.getTotalSeats() - bookedSeats;

        // Свободные места для рыцарей
        long approvedKnights =
                userTournamentRoleRepository.findByTournamentIdAndRole(tournament.getId(), TournamentRolesEnum.KNIGHT).size();
        int availableKnightSlots = tournament.getRequiredKnights() - (int) approvedKnights;

        // Организатор
        String organizerName = tournament.getUserAccount() != null
                ? tournament.getUserAccount().getName() + " " + tournament.getUserAccount().getSecondName()
                : "Неизвестно";

        // Локация
        String finalLocationName = tournament.getFinalLocation() != null
                ? tournament.getFinalLocation().getName()
                : null;

        // Роль текущего пользователя в турнире
        TournamentRolesEnum userRole = null;
        if (currentUserId != null) {
            userRole = userTournamentRoleRepository
                    .findByUserIdAndTournamentId(currentUserId, tournament.getId())
                    .stream().findFirst()
                    .map(UserTournamentRole::getRole)
                    .orElse(null);
        }

        return TournamentDTO.builder()
                .id(tournament.getId())
                .name(tournament.getName())
                .collectedAmount(collectedAmount != null ? collectedAmount : BigDecimal.ZERO.doubleValue())
                .requiredAmount(tournament.getRequiredAmount().doubleValue())
                .description(tournament.getDescription())
                .prizePercentNum(tournament.getPrizePercentNum())
                .tournamentStatus(tournament.getTournamentStatus())
                .totalSeats(tournament.getTotalSeats())
                .availableSeats(availableSeats)
                .eventDate(tournament.getEventDate())
                .finalLocationName(finalLocationName)
                .organizerName(organizerName)
                .totalKnights(tournament.getRequiredKnights())
                .availableKnightSlots(availableKnightSlots)
                .userRole(userRole)
                .build();
    }

    private String getStatusText(TournamentStatus tournamentStatus) {
        switch (tournamentStatus) {
            case WAITING_DONATION -> {
                return "Ждем Спонсорские деньги!";
            }
        }
        return null;
    }
}
