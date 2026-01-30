package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.prize.PrizeDistribution;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PrizeDistributionRepository extends JpaRepository<PrizeDistribution, Long> {

    boolean existsByTournamentId(Long tournamentId);
    List<PrizeDistribution> findByTournamentId(Long tournamentId);
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM PrizeDistribution p WHERE p.tournament.id = :tournamentId")
    BigDecimal sumAmountByTournamentId(@Param("tournamentId") Long tournamentId);

}
