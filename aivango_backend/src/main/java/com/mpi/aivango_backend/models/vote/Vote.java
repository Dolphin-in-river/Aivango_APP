package com.mpi.aivango_backend.models.vote;

import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.user.UserAccount;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "votes")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Vote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voter_id", nullable = false)
    private UserAccount voter;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "voted_for_id", nullable = false)
    private UserAccount votedFor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Column(name = "vote_date", nullable = false)
    private LocalDateTime voteDate;
}
