package com.mpi.aivango_backend.models.sponsorship;

import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.user.UserAccount;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "sponsorships")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Sponsorship {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "sponsor_id", nullable = false)
    private UserAccount sponsor;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tournament_id", nullable = false)
    private Tournament tournament;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SponsorshipPackage packageType;

    @Column(nullable = false)
    private Double amount;

    @Column(length = 200)
    private String companyName;

    private String logoPath;

    @Column(nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SponsorshipStatus status;
}
