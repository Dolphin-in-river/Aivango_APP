package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.application.Application;
import com.mpi.aivango_backend.models.application.ApplicationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    List<Application> findByTournamentIdAndStatus(Long tournamentId, ApplicationStatus status);

    boolean existsByKnightIdAndTournamentIdAndStatus(Long knightId, Long tournamentId, ApplicationStatus status);

    boolean existsByKnightIdAndTournamentId(Long knightId, Long tournamentId);

    Optional<Application> findByKnightIdAndTournamentId(Long knightId, Long tournamentId);

    List<Application> findByTournamentId(Long tournamentId);

    long countByTournamentIdAndStatus(Long tournamentId, ApplicationStatus status);
}
