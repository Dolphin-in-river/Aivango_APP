package com.mpi.aivango_backend.helper;

import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.repository.UserTournamentRoleRepository;
import com.mpi.aivango_backend.services.user.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@RequiredArgsConstructor
@Slf4j
public class UserTokenHelper {
    private final UserService userService;
    private final UserTournamentRoleRepository userTournamentRoleRepository;

    public String getCurrentEmailUser() {
        try {
            Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
            if (authentication != null && authentication.isAuthenticated()) {
                return authentication.getName();
            }
        } catch (Exception e) {
            log.error(e.getMessage(), e);
        }
        return null;
    }

    /** Возвращает ID текущего пользователя */
    public Long getCurrentUserId() {
        String email = getCurrentEmailUser();
        if (email == null) {
            return null;
        }
        return Optional.ofNullable(userService.findByEmail(email))
                .map(UserAccount::getId)
                .orElse(null);
    }

    /** Возвращает полный объект UserAccount текущего пользователя (если нужен) */
    public UserAccount getCurrentUser() {
        String email = getCurrentEmailUser();
        if (email == null) {
            return null;
        }
        return userService.findByEmail(email);
    }
}
