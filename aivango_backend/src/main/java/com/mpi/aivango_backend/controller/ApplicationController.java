package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.application.ApplicationDTO;
import com.mpi.aivango_backend.dto.application.ApplicationStatusUpdateDTO;
import com.mpi.aivango_backend.dto.application.ApplicationsListDTO;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.models.application.Application;
import com.mpi.aivango_backend.models.application.ApplicationStatus;
import com.mpi.aivango_backend.models.profile.UserProfile;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.repository.UserProfileRepository;
import com.mpi.aivango_backend.services.application.ApplicationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/application")
@Slf4j
public class ApplicationController {
    private final ApplicationService applicationService;
    private final UserTokenHelper userTokenHelper;
    private final UserProfileRepository userProfileRepository;

    @PostMapping
    public ResponseEntity<Void> submitApplication(@RequestBody ApplicationDTO request) {
        Long knightId = userTokenHelper.getCurrentUserId();

        if (knightId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            applicationService.createApplication(request, knightId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            log.warn("Ошибка подачи заявки: {}", e.getMessage());
            return ResponseEntity.badRequest().body(null);
        } catch (Exception e) {
            log.error("Неожиданная ошибка при подаче заявки", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/tournament/{tournamentId}")
    public ResponseEntity<List<ApplicationsListDTO>> getApplicationsByTournament(@PathVariable Long tournamentId) {
        try {
            List<Application> applications = applicationService.getApplicationsByTournament(tournamentId);
            var response = applications.stream().map(this::mapToApplicationsListDTO).collect(Collectors.toList());
            return new ResponseEntity<>(response, HttpStatus.OK);
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @GetMapping("/{applicationId}")
    public ResponseEntity<ApplicationDTO> getApplicationById(@PathVariable Long applicationId) {
        try {
            Optional<Application> optionalApplication = applicationService.getApplicationById(applicationId);
            return optionalApplication
                    .map(application -> ResponseEntity.ok(mapToApplicationDTO(application)))
                    .orElseGet(() -> ResponseEntity.notFound().build());
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{applicationId}/status")
    public ResponseEntity<Void> updateApplicationStatus(
            @PathVariable Long applicationId,
            @RequestBody ApplicationStatusUpdateDTO statusUpdateDTO
    ) {
        try {
            ApplicationStatus status = statusUpdateDTO.getStatus();
            String comment = statusUpdateDTO.getComment();

            if ((status == ApplicationStatus.REJECTED || status == ApplicationStatus.EDITS) &&
                    (comment == null || comment.trim().isEmpty())) {
                return ResponseEntity.badRequest().build();
            }

            applicationService.updateStatus(applicationId, status, comment, userTokenHelper.getCurrentUserId());
            return ResponseEntity.ok().build();
        } catch (EntityNotFoundException e) {
            return ResponseEntity.notFound().build();
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private ApplicationDTO mapToApplicationDTO(Application application) {
        UserAccount knightAccount = application.getKnight();

        // Получаем профиль рыцаря
        UserProfile profile = userProfileRepository.findByUserId(knightAccount.getId())
                .orElseThrow(() -> new IllegalStateException("Профиль рыцаря не найден"));

        return ApplicationDTO.builder()
                .knightName(profile.getFirstName())           // из профиля
                .knightSurname(profile.getLastName())         // из профиля
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .motivation(profile.getMotivation())
                .birthDate(profile.getBirthDate())
                .coatOfArmsUrl(profile.getCoatOfArmsPath())
                .build();
    }

    private ApplicationsListDTO mapToApplicationsListDTO(Application application) {
        String fullName = application.getKnight().getName() + " " + application.getKnight().getSecondName();
        return ApplicationsListDTO.builder()
                .id(application.getId())
                .fullName(fullName)
                .createdAt(application.getCreatedAt())
                .build();
    }
}
