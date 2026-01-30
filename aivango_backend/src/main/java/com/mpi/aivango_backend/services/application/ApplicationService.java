package com.mpi.aivango_backend.services.application;

import com.mpi.aivango_backend.dto.application.ApplicationDTO;
import com.mpi.aivango_backend.models.application.Application;
import com.mpi.aivango_backend.models.application.ApplicationStatus;
import com.mpi.aivango_backend.models.profile.UserProfile;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import com.mpi.aivango_backend.repository.ApplicationRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import com.mpi.aivango_backend.repository.UserProfileRepository;
import com.mpi.aivango_backend.repository.UserRepository;
import com.mpi.aivango_backend.repository.UserTournamentRoleRepository;
import com.mpi.aivango_backend.services.email.EmailSendService;
import com.mpi.aivango_backend.services.tournament.TournamentRoleService;
import com.mpi.aivango_backend.services.tournament.BracketGenerationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@Slf4j
@RequiredArgsConstructor
public class ApplicationService {
    private final ApplicationRepository applicationRepository;
    private final TournamentRepository tournamentRepository;
    private final UserRepository userRepository;
    private final UserTournamentRoleRepository userTournamentRoleRepository;
    private final TournamentRoleService tournamentRoleService;
    private final EmailSendService emailSendService;
    private final BracketGenerationService bracketGenerationService;
    private final UserProfileRepository userProfileRepository;

    public List<Application> getApplicationsByTournament(Long tournamentId) {
        return applicationRepository.findByTournamentId(tournamentId);
    }

    public Optional<Application> getApplicationById(Long applicationId) {
        return applicationRepository.findById(applicationId);
    }

    @Transactional
    public void updateStatus(Long applicationId, ApplicationStatus newStatus, String comment, Long organizerId) {
        Application application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new EntityNotFoundException("Заявка не найдена"));

        Tournament tournament = application.getTournament();
        UserAccount knight = application.getKnight();
        Long userId = knight.getId();
        Long tournamentId = tournament.getId();

        // Проверка: только организатор турнира может менять статус
        boolean isOrganizer = userTournamentRoleRepository
                .existsByUserIdAndTournamentIdAndRole(organizerId, tournamentId, TournamentRolesEnum.ORGANIZER);

        if (!isOrganizer && !knight.isOrganizer()) { // если глобальный админ — тоже можно
            throw new IllegalArgumentException("Только организатор турнира может менять статус заявки");
        }

        ApplicationStatus oldStatus = application.getStatus();

        // Обновляем статус и комментарий
        application.setStatus(newStatus);
        application.setComment(comment);
        applicationRepository.save(application);

        if (newStatus == ApplicationStatus.APPROVED) {
            long currentKnightsCount = applicationRepository
                    .countByTournamentIdAndStatus(tournamentId, ApplicationStatus.APPROVED);

            Integer requiredKnights = tournament.getRequiredKnights();
            if (requiredKnights != null && currentKnightsCount >= requiredKnights) {
                log.info("Достигнуто требуемое количество рыцарей ({}/{}) для турнира {}. Запуск генерации сетки.",
                        currentKnightsCount, requiredKnights, tournament.getName());

                try {
                    bracketGenerationService.generateBracket(tournamentId);
                } catch (Exception e) {
                    log.error("Ошибка при автоматической генерации сетки для турнира {}", tournamentId, e);
                }
            }
        }
        if (newStatus == ApplicationStatus.REJECTED) {
            // Удаляем роль KNIGHT, если была
            userTournamentRoleRepository
                    .findByUserIdAndTournamentId(userId, tournamentId)
                    .stream()
                    .filter(role -> role.getRole() == TournamentRolesEnum.KNIGHT)
                    .findFirst()
                    .ifPresent(roleToRemove -> userTournamentRoleRepository.delete(roleToRemove));

            log.info("Роль KNIGHT удалена у пользователя {} в турнире {} из-за отклонения заявки", userId, tournamentId);
        }

        // Уведомления рыцарю
        sendStatusUpdateNotification(knight, tournament, oldStatus, newStatus, comment);
    }

    @Transactional
    public void createApplication(ApplicationDTO request, Long knightId) {
        Tournament tournament = tournamentRepository.findById(request.getTournamentId())
                .orElseThrow(() -> new IllegalArgumentException("Турнир не найден"));

        if (tournament.getTournamentStatus() != TournamentStatus.KNIGHT_REGISTRATION) {
            throw new IllegalArgumentException("Регистрация на этот турнир закрыта");
        }

        UserAccount knight = userRepository.findById(knightId)
                .orElseThrow(() -> new IllegalArgumentException("Рыцарь не найден"));

        Set<TournamentRolesEnum> currentRoles = tournamentRoleService.getUserRolesInTournament(knightId, tournament.getId());
        if (!currentRoles.isEmpty()) {
            throw new IllegalArgumentException("Вы уже участвуете в этом турнире");
        }

        Application application = Application.builder()
                .knight(knight)
                .tournament(tournament)
                .createdAt(LocalDateTime.now())
//                .status(ApplicationStatus.PENDING)
                .status(ApplicationStatus.APPROVED)
                .build();

        applicationRepository.save(application);
        UserTournamentRole role = UserTournamentRole.builder()
                .user(knight)
                .tournament(tournament)
                .role(TournamentRolesEnum.KNIGHT)
                .build();
        userTournamentRoleRepository.save(role);

        UserProfile profile = userProfileRepository.findByUserId(knightId)
                .orElseGet(() -> UserProfile.builder().user(knight).build());

        profile.setFirstName(request.getKnightName());
        profile.setLastName(request.getKnightSurname());
        profile.setHeight(request.getHeight());
        profile.setWeight(request.getWeight());
        profile.setMotivation(request.getMotivation());
        profile.setBirthDate(request.getBirthDate());
        profile.setCoatOfArmsPath(request.getCoatOfArmsUrl());

        userProfileRepository.save(profile);

        // Уведомления
        sendApplicationSubmittedEmail(knight, tournament);
        sendNewApplicationNotificationToOrganizer(knight, tournament);

        long currentKnightsCount = applicationRepository
                .countByTournamentIdAndStatus(tournament.getId(), ApplicationStatus.APPROVED);

        Integer requiredKnights = tournament.getRequiredKnights();
        if (requiredKnights != null && currentKnightsCount >= requiredKnights) {
            log.info("Достигнуто требуемое количество рыцарей ({}/{}) для турнира {}. Запуск генерации сетки.",
                    currentKnightsCount + 1, requiredKnights, tournament.getName());

            try {
                bracketGenerationService.generateBracket(tournament.getId());
            } catch (Exception e) {
                log.error("Ошибка при автоматической генерации сетки для турнира {}", tournament.getId(), e);
            }
        }
    }

    private void sendApplicationSubmittedEmail(UserAccount knight, Tournament tournament) {
        String body = """
                <!DOCTYPE html>
                <html lang="ru">
                <head><meta charset="UTF-8"><title>Заявка подана</title></head>
                <body style="font-family: 'Palatino Linotype', serif; background: #f5f0e6; color: #3a3226;">
                    <div style="max-width: 600px; margin: 20px auto; background: #fff9e6; padding: 30px; border: 2px solid #d4af37;">
                        <h1 style="color: #8b0000; text-align: center;">Заявка принята</h1>
                        <p>Благородный рыцарь <strong>%s %s</strong>!</p>
                        <p>Ваша заявка на участие в турнире <strong>%s</strong> успешно подана и ожидает рассмотрения организатором.</p>
                        <p>Вы будете уведомлены по email о любом изменении статуса.</p>
                        <p>Да пребудет с вами сила и честь!</p>
                        <div style="margin-top: 30px; text-align: center; font-style: italic; color: #8b0000;">
                            Сенешаль турнира Айвенго
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(knight.getName(), knight.getSecondName(), tournament.getName());

        emailSendService.sendHtmlEmail(knight.getEmail(), "Заявка на турнир подана", body);
    }

    private void sendNewApplicationNotificationToOrganizer(UserAccount knight, Tournament tournament) {
        var organizer = tournament.getUserAccount();
        if (organizer == null || organizer.getEmail() == null) {
            log.warn("Не удалось отправить уведомление организатору: email не найден для турнира {}", tournament.getId());
            return;
        }
        String body = """
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <title>Новая заявка на турнир</title>
                    <style>
                        body { font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif; background: #f5f0e6; color: #3a3226; margin: 0; padding: 0; }
                        .container { max-width: 600px; margin: 20px auto; background: #fff9e6; padding: 30px; border: 2px solid #d4af37; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
                        h1 { color: #8b0000; text-align: center; font-variant: small-caps; letter-spacing: 1px; }
                        .highlight { background: #f8f8f8; border: 1px solid #d4af37; padding: 15px; margin: 20px 0; text-align: center; font-weight: bold; }
                        .knight-name { font-size: 18px; color: #8b0000; }
                        .tournament-name { font-size: 20px; font-style: italic; }
                        .footer { margin-top: 30px; text-align: center; font-style: italic; color: #8b0000; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Новая заявка на участие</h1>
                        <p>Достопочтенный организатор!</p>
                        <p>Благородный рыцарь объявил о своём желании сразиться на вашем турнире.</p>
                        
                        <div class="highlight">
                            <p class="tournament-name"><strong>Турнир:</strong> %s</p>
                            <p class="knight-name"><strong>Рыцарь:</strong> %s %s</p>
                            <p><strong>Email:</strong> %s</p>
                        </div>
                        
                        <p>Просим вас незамедлительно рассмотреть заявку в личном кабинете организатора.</p>
                        <p>После одобрения рыцарь будет допущен к участию в турнире.</p>
                        
                        <div class="footer">
                            Да свершится справедливое решение!<br>
                            Сенешаль турнира Айвенго
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                tournament.getName(),
                knight.getName(),
                knight.getSecondName(),
                knight.getEmail()
        );

        emailSendService.sendHtmlEmail(organizer.getEmail(), "Новая заявка на турнир «" + tournament.getName() + "»",
                body
        );
    }

    private void sendStatusUpdateNotification(UserAccount knight, Tournament tournament,
                                              ApplicationStatus oldStatus, ApplicationStatus newStatus, String comment) {

        // Текст статуса для письма
        String statusTitle = switch (newStatus) {
            case APPROVED -> "Одобрена!";
            case REJECTED -> "Отклонена";
            case EDITS    -> "Отправлена на доработку";
            case PENDING  -> "В обработке";
        };

        String statusDescription = switch (newStatus) {
            case APPROVED -> "Ваша заявка успешно одобрена. Вы допущены к участию в турнире как рыцарь!";
            case REJECTED -> "К сожалению, ваша заявка была отклонена.";
            case EDITS    -> "Организатор просит внести изменения в вашу заявку.";
            case PENDING  -> "Ваша заявка принята и находится на рассмотрении.";
        };

        // Комментарий организатора (если есть)
        String commentBlock = (comment != null && !comment.trim().isEmpty())
                ? "<p><strong>Комментарий организатора:</strong><br>" + comment.trim() + "</p>"
                : "";

        String htmlBody = """
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <title>Статус заявки — %s</title>
                <style>
                    body { font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif; background: #f5f0e6; color: #3a3226; margin: 0; padding: 0; }
                    .container { max-width: 600px; margin: 20px auto; background: #fff9e6; padding: 30px; border: 2px solid #d4af37; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
                    h1 { color: #8b0000; text-align: center; font-variant: small-caps; letter-spacing: 1px; }
                    .status { background: #f8f8f8; border: 1px solid #d4af37; padding: 15px; margin: 20px 0; text-align: center; font-size: 18px; font-weight: bold; color: #8b0000; }
                    .footer { margin-top: 30px; text-align: center; font-style: italic; color: #8b0000; }
                </style>
            </head>
            <body>
                <div class="container">
                    <h1>Изменение статуса заявки</h1>
                    <p>Благородный рыцарь <strong>%s %s</strong>!</p>
                    <p>По поводу вашей заявки на участие в турнире <strong>%s</strong>:</p>
                    
                    <div class="status">%s</div>
                    
                    <p>%s</p>
                    
                    %s
                    
                    <p>Следите за обновлениями в личном кабинете.</p>
                    
                    <div class="footer">
                        Да пребудет с вами честь и слава!<br>
                        Сенешаль турнира Айвенго
                    </div>
                </div>
            </body>
            </html>
            """.formatted(
                statusTitle,
                knight.getName(),
                knight.getSecondName(),
                tournament.getName(),
                statusTitle,
                statusDescription,
                commentBlock
        );

        String subject = "Заявка на турнир «" + tournament.getName() + "» — " + statusTitle;

        emailSendService.sendHtmlEmail(knight.getEmail(), subject, htmlBody);
    }
}
