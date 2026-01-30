package com.mpi.aivango_backend.models.tournament;


import com.fasterxml.jackson.annotation.JsonIgnore;
import com.mpi.aivango_backend.models.application.Application;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import jakarta.persistence.CascadeType;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Data
@Table(name = "tournament")
@AllArgsConstructor
@NoArgsConstructor
@Entity
@Builder
public class Tournament {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    private String name;
    private Float requiredAmount;
    private String description;
    private Float prizePercentNum;
    private TournamentStatus tournamentStatus;
    private Integer totalSeats;
    private LocalDate eventDate;
    @JsonIgnore
    @OneToMany(mappedBy = "tournament", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    private List<LocationTournament> selectedLocations;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "final_location_id")
    private Location finalLocation;
    @ManyToOne
    private UserAccount userAccount;

    @OneToMany(mappedBy = "tournament", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    private List<Application> applications;

    @OneToMany(mappedBy = "tournament", cascade = CascadeType.ALL)
    private List<UserTournamentRole> roles = new ArrayList<>();
    private Integer requiredKnights;
}
