package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.ticket.Ticket;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface TicketRepository extends JpaRepository<Ticket, Long> {
    Optional<Ticket> findByUserIdAndTournamentId(Long userId, Long tournamentId);

    /** Проверяем, есть ли активное бронирование у пользователя на турнир */
    Optional<Ticket> findByUserIdAndTournamentIdAndConfirmedTrue(Long userId, Long tournamentId);

    @Query("SELECT COALESCE(SUM(t.seatsCount), 0) FROM Ticket t WHERE t.tournament.id = :tournamentId AND t.confirmed = true")
    Integer sumSeatsCountByTournamentIdAndConfirmedTrue(Long tournamentId);
}
