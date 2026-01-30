package com.mpi.aivango_backend.services.user;

import com.mpi.aivango_backend.dto.user.UserCreateRequest;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.repository.UserRepository;
import com.mpi.aivango_backend.services.email.EmailSendService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {
    private final UserRepository userRepository;
    private final EmailSendService emailSendService;

    public void validationUser(UserCreateRequest request) {
        if (userRepository.getByEmail(request.getEmail()).isPresent()) {
            throw new RuntimeException("User with this email has been existed! Go out from here!");
        }
        // todo add more validation
    }

    public UserAccount getById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Пользователь не найден"));
    }

    @Transactional
    public UserAccount save(UserCreateRequest request) {
        UserAccount userAccount = UserAccount.builder()
                .name(request.getName())
                .email(request.getEmail())
                .secondName(request.getSecondName())
                .isOrganizer(false)
                .build();
        userRepository.save(userAccount);
        var result = emailSendService.sendCode(request.getEmail());
        if (!result) {
            throw new RuntimeException("We have problem with deliver email message. Try later!");
        }
        return userAccount;
    }

    public UserAccount findByEmail(String email) {
        return userRepository.getByEmail(email).orElseThrow();
    }
}
