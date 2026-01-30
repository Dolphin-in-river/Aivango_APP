package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.models.tournament.Location;
import com.mpi.aivango_backend.services.location.LocationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/location")
@Slf4j
public class LocationController {
    private final LocationService locationService;

    @GetMapping

    public ResponseEntity<List<Location>> findAll() {
        try {
            return new ResponseEntity<>(locationService.getAllLocation(), HttpStatus.OK);
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }
}
