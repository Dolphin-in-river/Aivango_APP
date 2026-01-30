package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.tournament.Location;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface LocationRepository extends JpaRepository<Location, Long> {
    Optional<Location> findById(Long id);
}
