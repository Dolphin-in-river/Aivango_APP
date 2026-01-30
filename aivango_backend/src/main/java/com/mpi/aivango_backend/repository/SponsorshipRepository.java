package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.sponsorship.Sponsorship;
import com.mpi.aivango_backend.models.sponsorship.SponsorshipStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface SponsorshipRepository extends JpaRepository<Sponsorship, Long> {

    @Query("SELECT COALESCE(SUM(s.amount), 0.0) FROM Sponsorship s " +
            "WHERE s.tournament.id = :tournamentId AND s.status = 'CONFIRMED'")
    Double getTotalCollectedAmount(Long tournamentId);

    List<Sponsorship> findByTournamentIdAndStatus(Long tournamentId, SponsorshipStatus status);

    Optional<Sponsorship> findBySponsorIdAndTournamentId(Long sponsorId, Long tournamentId);

    @Query("SELECT COALESCE(SUM(s.amount), 0.0) FROM Sponsorship s " +
            "WHERE s.tournament.id = :tournamentId AND s.status = :status")
    Double sumAmountByTournamentIdAndStatus(Long tournamentId, SponsorshipStatus status);
}
