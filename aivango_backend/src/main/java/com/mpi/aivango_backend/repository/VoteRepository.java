package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.vote.Vote;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface VoteRepository extends JpaRepository<Vote, Long> {
    boolean existsByVoterIdAndTournamentId(Long voterId, Long tournamentId);
    Optional<Vote> findByVoterIdAndTournamentId(Long voterId, Long tournamentId);
    List<Vote> findByTournamentId(Long tournamentId);
}
