package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.fight.FightDateUpdateRequest;
import com.mpi.aivango_backend.dto.fight.FightResultRequest;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.services.fight.FightResultService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/fights")
@Slf4j
public class FightController {

    private final FightResultService fightResultService;
    private final UserTokenHelper userTokenHelper;

    @PatchMapping("/{fightId}/result")
    public ResponseEntity<Void> recordResult(
            @PathVariable Long fightId, @RequestBody FightResultRequest request) {

        try {
            fightResultService.recordFightResult(fightId, request);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Ошибка при записи результата боя", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    @PatchMapping("/{fightId}/date")
    public ResponseEntity<Void> updateFightDate(
            @PathVariable Long fightId,  @RequestBody FightDateUpdateRequest request) {

        Long organizerId = userTokenHelper.getCurrentUserId();
        if (organizerId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        try {
            fightResultService.updateFightDate(fightId, request, organizerId);
            return ResponseEntity.ok().build();
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        } catch (Exception e) {
            log.error("Ошибка при изменении времени боя", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
