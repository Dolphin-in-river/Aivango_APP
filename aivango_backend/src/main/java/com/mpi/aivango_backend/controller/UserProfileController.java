package com.mpi.aivango_backend.controller;

import com.mpi.aivango_backend.dto.profile.UserProfileDTO;
import com.mpi.aivango_backend.helper.UserTokenHelper;
import com.mpi.aivango_backend.models.profile.UserProfile;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.repository.UserProfileRepository;
import com.mpi.aivango_backend.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@RestController
@RequiredArgsConstructor
@RequestMapping("/api/profile")
@Slf4j
public class UserProfileController {

    private final UserTokenHelper userTokenHelper;
    private final UserRepository userRepository;
    private final UserProfileRepository profileRepository;

    private static final String UPLOAD_DIR = "uploads/coa/";
    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final String[] ALLOWED_TYPES = {"image/jpeg", "image/png", "image/svg+xml"};

    static {
        try {
            Files.createDirectories(Paths.get(UPLOAD_DIR));
        } catch (IOException e) {
            log.error("Не удалось создать директорию для загрузки гербов", e);
        }
    }

    /**
     * Получить свой профиль
     */
    @GetMapping("/me")
    public ResponseEntity<UserProfileDTO> getMyProfile() {
        Long userId = userTokenHelper.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserAccount user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        // В БД firstName/lastName не могут быть null, поэтому если профиля нет - создаем его сразу
        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> profileRepository.save(UserProfile.builder()
                        .user(user)
                        .firstName(safeString(user.getName()))
                        .lastName(safeString(user.getSecondName()))
                        .build()));

        UserProfileDTO dto = UserProfileDTO.builder()
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .motivation(profile.getMotivation())
                .birthDate(profile.getBirthDate())
                .coatOfArmsUrl(profile.getCoatOfArmsPath())
                .build();

        return ResponseEntity.ok(dto);
    }

    /**
     * Обновить свой профиль (без загрузки файла)
     *
     * Загрузка герба выполняется отдельной ручкой: POST /api/profile/me/coat-of-arms
     */
    @PatchMapping("/me")
    public ResponseEntity<UserProfileDTO> updateMyProfile(@RequestBody UserProfileDTO request) {
        Long userId = userTokenHelper.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserAccount user = userRepository.findById(userId).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        UserProfile profile = profileRepository.findByUserId(userId)
                .orElseGet(() -> UserProfile.builder()
                        .user(user)
                        .firstName(safeString(user.getName()))
                        .lastName(safeString(user.getSecondName()))
                        .build());

        // firstName/lastName обязательны в БД, поэтому не затираем на null/пусто
        if (request.getFirstName() != null && !request.getFirstName().trim().isEmpty()) {
            profile.setFirstName(request.getFirstName().trim());
        }
        if (request.getLastName() != null && !request.getLastName().trim().isEmpty()) {
            profile.setLastName(request.getLastName().trim());
        }

        profile.setHeight(request.getHeight());
        profile.setWeight(request.getWeight());
        profile.setMotivation(request.getMotivation());
        profile.setBirthDate(request.getBirthDate());

        profileRepository.save(profile);

        UserProfileDTO dto = UserProfileDTO.builder()
                .firstName(profile.getFirstName())
                .lastName(profile.getLastName())
                .height(profile.getHeight())
                .weight(profile.getWeight())
                .motivation(profile.getMotivation())
                .birthDate(profile.getBirthDate())
                .coatOfArmsUrl(profile.getCoatOfArmsPath())
                .build();

        return ResponseEntity.ok(dto);
    }

    /**
     * Загрузить цифровой герб (логотип)
     */
    @PostMapping("/me/coat-of-arms")
    public ResponseEntity<String> uploadCoatOfArms(@RequestParam("file") MultipartFile file) {
        Long userId = userTokenHelper.getCurrentUserId();
        if (userId == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }

        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body("Файл пустой");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            return ResponseEntity.badRequest().body("Файл слишком большой (макс. 5 МБ)");
        }

        String contentType = file.getContentType();
        if (contentType == null || !isAllowedType(contentType)) {
            return ResponseEntity.badRequest().body("Неподдерживаемый формат. Разрешены: JPG, PNG, SVG");
        }

        try {
            String fileName = userId + "_" + UUID.randomUUID() + getExtension(file.getOriginalFilename());
            Path path = Paths.get(UPLOAD_DIR + fileName);
            Files.write(path, file.getBytes());

            UserAccount user = userRepository.findById(userId).orElse(null);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
            }

            UserProfile profile = profileRepository.findByUserId(userId)
                    .orElseGet(() -> UserProfile.builder()
                            .user(user)
                            .firstName(safeString(user.getName()))
                            .lastName(safeString(user.getSecondName()))
                            .build());

            profile.setCoatOfArmsPath("/" + UPLOAD_DIR + fileName);
            profileRepository.save(profile);

            return ResponseEntity.ok("/" + UPLOAD_DIR + fileName);

        } catch (IOException e) {
            log.error("Ошибка при сохранении герба", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body("Ошибка сохранения файла");
        }
    }

    @GetMapping("/uploads/coa/{fileName:.+}")
    public ResponseEntity<Resource> getCoatOfArms(@PathVariable String fileName) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR + fileName);
            Resource resource = new UrlResource(filePath.toUri());

            if (resource.exists() && resource.isReadable()) {
                String contentType = Files.probeContentType(filePath);
                return ResponseEntity.ok()
                        .header(HttpHeaders.CONTENT_TYPE, contentType != null ? contentType : "application/octet-stream")
                        .body(resource);
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }

    private boolean isAllowedType(String contentType) {
        for (String type : ALLOWED_TYPES) {
            if (type.equals(contentType)) return true;
        }
        return false;
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null) return ".png";
        int dotIndex = originalFilename.lastIndexOf('.');
        return dotIndex == -1 ? ".png" : originalFilename.substring(dotIndex);
    }

    private static String safeString(String s) {
        return (s == null || s.trim().isEmpty()) ? "-" : s.trim();
    }
}
