package com.mpi.aivango_backend.services.vote;

import com.mpi.aivango_backend.dto.vote.KnightForVotingDTO;
import com.mpi.aivango_backend.dto.vote.VoteRequest;
import com.mpi.aivango_backend.models.ticket.Ticket;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import com.mpi.aivango_backend.models.vote.Vote;
import com.mpi.aivango_backend.repository.ApplicationRepository;
import com.mpi.aivango_backend.repository.TicketRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import com.mpi.aivango_backend.repository.UserRepository;
import com.mpi.aivango_backend.repository.UserTournamentRoleRepository;
import com.mpi.aivango_backend.repository.VoteRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class VoteService {

    private final VoteRepository voteRepository;
    private final TournamentRepository tournamentRepository;
    private final UserTournamentRoleRepository userTournamentRoleRepository;
    private final ApplicationRepository applicationRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    /**
     * Получить список рыцарей для голосования в конкретном турнире
     */
    @Transactional(readOnly = true)
    public List<KnightForVotingDTO> getKnightsForVoting(Long tournamentId, Long viewerId) {
        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Турнир не найден"));

        if (tournament.getTournamentStatus() != TournamentStatus.ACTIVE) {
            throw new RuntimeException("Голосование доступно только для активного турнира");
        }

        // Проверяем наличие подтверждённого билета у зрителя
        ticketRepository.findByUserIdAndTournamentId(viewerId, tournamentId)
                .filter(Ticket::isConfirmed)
                .orElseThrow(() -> new RuntimeException("Требуется подтверждённый билет для голосования"));

        // Проверяем, не голосовал ли уже зритель
        if (voteRepository.existsByVoterIdAndTournamentId(viewerId, tournamentId)) {
            throw new RuntimeException("Вы уже проголосовали в этом турнире");
        }

        List<UserTournamentRole> knightRoles = userTournamentRoleRepository
                .findByTournamentIdAndRole(tournamentId, TournamentRolesEnum.KNIGHT);

        return knightRoles.stream()
                .map(UserTournamentRole::getUser)
                .map(this::toKnightDTO)
                .toList();
    }

    /**
     * Принять и сохранить голос зрителя
     */
    @Transactional
    public void submitVote(VoteRequest request, Long viewerId) {
        Long tournamentId = request.getTournamentId();
        Long votedForId = request.getVotedForId();

        // Повторное голосование запрещено
        if (voteRepository.existsByVoterIdAndTournamentId(viewerId, tournamentId)) {
            throw new RuntimeException("Вы уже проголосовали в этом турнире");
        }

        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new RuntimeException("Турнир не найден"));

        if (tournament.getTournamentStatus() != TournamentStatus.ACTIVE) {
            throw new RuntimeException("Голосование доступно только для активного турнира");
        }

        // Проверяем, что зритель имеет роль SPECTATOR в этом турнире
        boolean isSpectator = userTournamentRoleRepository
                .existsByUserIdAndTournamentIdAndRole(viewerId, tournamentId, TournamentRolesEnum.SPECTATOR);

        if (!isSpectator) {
            throw new RuntimeException("Только зрители с билетом могут голосовать в этом турнире");
        }

        boolean isKnight = userTournamentRoleRepository
                .existsByUserIdAndTournamentIdAndRole(votedForId, tournamentId, TournamentRolesEnum.KNIGHT);

        if (!isKnight) {
            throw new RuntimeException("Можно голосовать только за рыцаря, участвующего в этом турнире");
        }

        UserAccount votedFor = userRepository.findById(votedForId)
                .orElseThrow(() -> new RuntimeException("Выбранный рыцарь не найден"));

        Vote vote = Vote.builder()
                .voter(UserAccount.builder().id(viewerId).build())
                .votedFor(votedFor)
                .tournament(tournament)
                .voteDate(LocalDateTime.now())
                .build();

        voteRepository.save(vote);
    }

    /**
     * Получить ID рыцаря-победителя по количеству голосов (по завершению турнира)
     */
    @Transactional(readOnly = true)
    public Long getWinnerKnightId(Long tournamentId) {
        List<Vote> votes = voteRepository.findByTournamentId(tournamentId);
        if (votes.isEmpty()) {
            return null;
        }

        return votes.stream()
                .map(vote -> vote.getVotedFor().getId())
                .reduce((a, b) -> {
                    long countA = votes.stream().filter(v -> v.getVotedFor().getId().equals(a)).count();
                    long countB = votes.stream().filter(v -> v.getVotedFor().getId().equals(b)).count();
                    return countA >= countB ? a : b;
                })
                .orElse(null);
    }

    private KnightForVotingDTO toKnightDTO(UserAccount user) {
        return KnightForVotingDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .secondName(user.getSecondName())
                .build();
    }
}
