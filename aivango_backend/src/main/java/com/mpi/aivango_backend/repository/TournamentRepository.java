package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDate;
import java.util.Optional;

public interface TournamentRepository extends JpaRepository<Tournament, Long> {
    Optional<Tournament> findAllById(Long id);

    @Query("SELECT t FROM Tournament t " +
            "LEFT JOIN FETCH t.finalLocation l " +
            "WHERE (:eventDateFrom IS NULL OR t.eventDate >= :eventDateFrom) " +
            "AND (:eventDateTo IS NULL OR t.eventDate <= :eventDateTo) " +
            "AND (:locationId IS NULL OR l.id = :locationId) " +
            "AND (:status IS NULL OR t.tournamentStatus = :status) " +
            "ORDER BY t.eventDate DESC")
    Page<Tournament> findHistoryWithFilters(
            @Param("eventDateFrom") LocalDate eventDateFrom,
            @Param("eventDateTo") LocalDate eventDateTo,
            @Param("locationId") Long locationId,
            @Param("status") TournamentStatus status,
            Pageable pageable);
}
