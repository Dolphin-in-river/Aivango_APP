package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.fight.FightHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface FightHistoryRepository extends JpaRepository<FightHistory, Long> {

    List<FightHistory> findByTournamentId(Long tournamentId);

    void deleteByTournamentId(Long tournamentId);
}
