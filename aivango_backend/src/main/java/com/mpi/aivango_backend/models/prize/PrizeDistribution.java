package com.mpi.aivango_backend.models.prize;

import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.user.UserAccount;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "prize_distributions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PrizeDistribution {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "knight_id", nullable = false)
    private UserAccount knight;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    /** Место: 1, 2, 3 или "sympathy" */
    private String place;

    /** Призовая сумма */
    private BigDecimal amount;

    private LocalDateTime calculatedAt;
}
