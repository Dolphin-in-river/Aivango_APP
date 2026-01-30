package com.mpi.aivango_backend.models.fight;

import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.user.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
@Table(name = "fight_histories")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FightHistory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fighter1_id")
    private UserAccount fighter1;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fighter2_id")
    private UserAccount fighter2;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "winner_id")
    private UserAccount winner; // null если ничья или не завершено

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private FightRound round;

    private String comment;

    @Column(nullable = false)
    private LocalDateTime fightDate;

    @Column(name = "next_match_id")
    private Long nextMatchId; // ID матча следующего раунда, куда выходит победитель
}
