package com.mpi.aivango_backend.services.sponsorship;

import com.mpi.aivango_backend.dto.sponsorship.SponsorshipRequest;
import com.mpi.aivango_backend.models.sponsorship.Sponsorship;
import com.mpi.aivango_backend.models.sponsorship.SponsorshipPackage;
import com.mpi.aivango_backend.models.sponsorship.SponsorshipStatus;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import com.mpi.aivango_backend.repository.SponsorshipRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import com.mpi.aivango_backend.repository.UserRepository;
import com.mpi.aivango_backend.repository.UserTournamentRoleRepository;
import com.mpi.aivango_backend.services.email.EmailSendService;
import com.mpi.aivango_backend.services.tournament.TournamentRoleService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SponsorshipService {

    private final SponsorshipRepository sponsorshipRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentRoleService tournamentRoleService;
    private final UserRepository userRepository;
    private final UserTournamentRoleRepository userTournamentRoleRepository;
    private final EmailSendService emailSendService;

    @Transactional
    public void createSponsorship(Long tournamentId, SponsorshipRequest request, Long sponsorId) {

        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Турнир не найден"));

        if (tournament.getTournamentStatus() != TournamentStatus.WAITING_DONATION) {
            throw new IllegalArgumentException("Спонсорство доступно только для турниров в статусе сбора средств");
        }

        UserAccount sponsor = userRepository.findById(sponsorId)
                .orElseThrow(() -> new IllegalArgumentException("Спонсор не найден"));

        // Получаем текущие роли пользователя в этом турнире
        Set<TournamentRolesEnum> currentRoles = tournamentRoleService.getUserRolesInTournament(sponsorId, tournamentId);
        if (!currentRoles.isEmpty()) {
            throw new IllegalArgumentException("Вы уже участвуете в этом турнире");
        }

        SponsorshipPackage packageType = request.getPackageType();
        double amount = packageType.getAmount();

        // Проверяем, не достигнута ли уже цель
        Double currentCollected = sponsorshipRepository.getTotalCollectedAmount(tournamentId);
        if (currentCollected >= tournament.getRequiredAmount()) {
            throw new IllegalArgumentException("Турнир уже собрал необходимую сумму");
        }

        // Создаём спонсорство со статусом
        Sponsorship sponsorship = Sponsorship.builder()
                .sponsor(sponsor)
                .tournament(tournament)
                .packageType(packageType)
                .amount(amount)
                .companyName(request.getCompanyName())
                .logoPath(null) // пока без фото
                .createdAt(LocalDateTime.now())
                .status(SponsorshipStatus.CONFIRMED)
                .build();

        sponsorshipRepository.save(sponsorship);
        UserTournamentRole role = UserTournamentRole.builder()
                .user(sponsor)
                .tournament(tournament)
                .role(TournamentRolesEnum.SPONSOR)
                .build();
        userTournamentRoleRepository.save(role);
        updateTournamentCollectedAmountAndStatus(tournament);

        // Отправляем письмо спонсору
        sendConfirmationEmail(sponsor, tournament, packageType, amount, request.getCompanyName());
    }

    private void updateTournamentCollectedAmountAndStatus(Tournament tournament) {
        Double total = sponsorshipRepository.getTotalCollectedAmount(tournament.getId());

        if (total >= tournament.getRequiredAmount()) {
            tournament.setTournamentStatus(TournamentStatus.KNIGHT_REGISTRATION);
            tournamentRepository.save(tournament);
        }
    }

    private void sendConfirmationEmail(UserAccount sponsor, Tournament tournament,
                                       SponsorshipPackage packageType, double amount, String companyName) {

        String packageNameRu = switch (packageType) {
            case BRONZE -> "Бронзовый";
            case SILVER -> "Серебряный";
            case GOLD -> "Золотой";
            case PLATINUM -> "Платиновый";
        };

        String body = """
                <!DOCTYPE html>
                <html lang="ru">
                <head><meta charset="UTF-8"><title>Спасибо за спонсорство!</title></head>
                <body style="font-family: 'Palatino Linotype', serif; background: #f5f0e6; color: #3a3226;">
                    <div style="max-width: 600px; margin: 20px auto; background: #fff9e6; padding: 30px; border: 2px solid #d4af37;">
                        <h1 style="color: #8b0000; text-align: center;">Благодарность сенешаля</h1>
                        <p>Благородный спонсор <strong>%s</strong>!</p>
                        <p>Мы с глубокой признательностью подтверждаем получение вашего взноса в размере <strong>%.2f золотых</strong> 
                        по пакету <strong>%s</strong> в пользу турнира <strong>%s</strong>.</p>
                        <p>Ваше имя и компания будут увековечены на странице турнира после утверждения организатором.</p>
                        <p>Да преумножится ваша слава и богатство!</p>
                        <div style="margin-top: 30px; text-align: center; font-style: italic; color: #8b0000;">
                            С почтением,<br>Сенешаль турнира Айвенго
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(companyName, amount, packageNameRu, tournament.getName());

        emailSendService.sendHtmlEmail(sponsor.getEmail(), "Спасибо за спонсорство турнира!", body);
    }
}
