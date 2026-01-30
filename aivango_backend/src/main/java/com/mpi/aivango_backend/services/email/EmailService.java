package com.mpi.aivango_backend.services.email;

import com.mpi.aivango_backend.dto.user.UserAuthenticationRequest;
import com.mpi.aivango_backend.models.email.Email;
import com.mpi.aivango_backend.repository.EmailRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Optional;

@RequiredArgsConstructor
@Slf4j
@Service
public class EmailService {
    private static final int TIME_VALID_TOKEN_MINUTES = 10;

    private final EmailRepository emailRepository;
    public Optional<Email> findByEmail(String email) {
        return emailRepository.findByHashedEmail(email);
    }

    public Email save(Email email) {
        return emailRepository.save(email);
    }

    public boolean verifyCode(UserAuthenticationRequest request) {
        var email = emailRepository.findByHashedEmail(request.getEmail());
        if (email.isEmpty()) {
            throw new RuntimeException("Ti! Mosheinik!");
        }
        var emailEntity = email.get();
        if (emailEntity.getLocalDateTime().plusMinutes(TIME_VALID_TOKEN_MINUTES).isBefore(LocalDateTime.now())) {
            throw new RuntimeException("Kto ne uspel, tot opozdal! Code uzhe ne deistvitelen!");
        }
        if (!BCrypt.checkpw(request.getCode().toString(), emailEntity.getHashedToken())) {
            throw new RuntimeException("Code is incorrect!!");
        }

        return true;
    }
}
