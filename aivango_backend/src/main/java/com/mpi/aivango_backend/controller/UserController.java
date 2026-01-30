package com.mpi.aivango_backend.controller;


import com.mpi.aivango_backend.dto.user.UserAuthenticationRequest;
import com.mpi.aivango_backend.dto.user.UserCreateRequest;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.services.email.EmailService;
import com.mpi.aivango_backend.services.security.JwtService;
import com.mpi.aivango_backend.services.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequiredArgsConstructor
@RequestMapping("/auth/users")
@Slf4j
public class UserController {
    private final UserService userService;
    private final EmailService emailService;
    private final JwtService jwtService;

    @PostMapping
    public ResponseEntity<?> create(@RequestBody UserCreateRequest request) {
        try {
            userService.validationUser(request);
            UserAccount userAccount = userService.save(request);
            var token = jwtService.generateToken(userAccount);
            return ResponseEntity.ok(getStringObjectMap(userAccount, token));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody UserAuthenticationRequest requestDto) {
        try {
            emailService.verifyCode(requestDto);
            UserAccount userAccount = userService.findByEmail(requestDto.getEmail());
            var token = jwtService.generateToken(userAccount);
            return ResponseEntity.ok(getStringObjectMap(userAccount, token));
        } catch (Exception e) {
            log.error(e.getMessage(), e);
            return new ResponseEntity<>(HttpStatus.BAD_REQUEST);
        }
    }

    private static Map<String, Object> getStringObjectMap(UserAccount userAccount, String token) {
        Map<String, Object> response = Map.of(
                "accessToken", token,
                "name", userAccount.getName(),
                "secondName", userAccount.getSecondName(),
                "isOrganizer", userAccount.isOrganizer()
        );
        return response;
    }
}
