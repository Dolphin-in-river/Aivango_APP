package com.mpi.aivango_backend.services.location;

import com.mpi.aivango_backend.models.tournament.Location;
import com.mpi.aivango_backend.repository.LocationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@Slf4j
@RequiredArgsConstructor
public class LocationService {
    private final LocationRepository locationRepository;

    public List<Location> getAllLocation() {
        return locationRepository.findAll();
    }
}
