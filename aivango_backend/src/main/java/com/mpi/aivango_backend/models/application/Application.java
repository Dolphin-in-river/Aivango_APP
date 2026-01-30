package com.mpi.aivango_backend.models.application;

import com.mpi.aivango_backend.models.category.CategoryApplication;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.user.UserAccount;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.time.LocalDateTime;
import java.util.List;

@Entity
@Data
@Table(name = "application")
@AllArgsConstructor
@NoArgsConstructor
@Builder
public class Application {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    private UserAccount knight;
    private ApplicationStatus status = ApplicationStatus.PENDING;

    @ManyToOne
    private Tournament tournament;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @OneToMany(mappedBy = "application", cascade = {CascadeType.PERSIST, CascadeType.REMOVE})
    private List<CategoryApplication> categoryApplications;

    private String comment;
}
