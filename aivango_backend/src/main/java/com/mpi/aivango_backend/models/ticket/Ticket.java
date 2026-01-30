package com.mpi.aivango_backend.models.ticket;

import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.user.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private UserAccount user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    /** Количество забронированных мест (1–4) */
    @Column(nullable = false)
    private Integer seatsCount;

    /** Уникальный код бронирования для QR-кода */
    @Column(unique = true, nullable = false)
    private String bookingCode;

    /** Статус подтверждения (true — билет активен) */
    @Column(nullable = false)
    private boolean confirmed = true;

    @Column(nullable = false)
    private LocalDateTime createdAt;
}
