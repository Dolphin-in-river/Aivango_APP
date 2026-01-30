package com.mpi.aivango_backend.services.tournament;

import com.mpi.aivango_backend.dto.tournament.TournamentHistoryFilter;
import com.mpi.aivango_backend.dto.tournament.TournamentHistoryItem;
import com.mpi.aivango_backend.models.application.ApplicationStatus;
import com.mpi.aivango_backend.repository.ApplicationRepository;
import com.mpi.aivango_backend.repository.PrizeDistributionRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import com.mpi.aivango_backend.models.tournament.Tournament;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;

@Service
@RequiredArgsConstructor
public class TournamentHistoryService {

    private final TournamentRepository tournamentRepository;
    private final ApplicationRepository applicationRepository;
    private final PrizeDistributionRepository prizeDistributionRepository;

    public Page<TournamentHistoryItem> getTournamentHistory(TournamentHistoryFilter filter) {

        Pageable pageable = PageRequest.of(filter.getPage(), filter.getSize());

        Page<Tournament> tournaments = tournamentRepository.findHistoryWithFilters(
                filter.getEventDateFrom(),
                filter.getEventDateTo(),
                filter.getLocationId(),
                filter.getStatus(),
                pageable
        );

        return tournaments.map(this::mapToHistoryItem);
    }

    private TournamentHistoryItem mapToHistoryItem(Tournament t) {
        int participants = (int) applicationRepository
                .countByTournamentIdAndStatus(t.getId(), ApplicationStatus.APPROVED);

        BigDecimal prizeFund = prizeDistributionRepository.sumAmountByTournamentId(t.getId());

        String locationName = t.getFinalLocation() != null ? t.getFinalLocation().getName() : null;

        return TournamentHistoryItem.builder()
                .id(t.getId())
                .name(t.getName())
                .eventDate(t.getEventDate())
                .status(t.getTournamentStatus())
                .locationName(locationName)
                .participantCount(participants)
                .prizeFund(prizeFund != null ? prizeFund : BigDecimal.ZERO)
                .build();
    }
}
