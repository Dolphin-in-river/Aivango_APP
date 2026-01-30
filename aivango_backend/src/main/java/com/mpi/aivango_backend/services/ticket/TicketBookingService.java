package com.mpi.aivango_backend.services.ticket;

import com.google.zxing.BarcodeFormat;
import com.google.zxing.WriterException;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.qrcode.QRCodeWriter;
import com.mpi.aivango_backend.dto.ticket.TicketBookingRequest;
import com.mpi.aivango_backend.models.ticket.Ticket;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import com.mpi.aivango_backend.repository.TicketRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import com.mpi.aivango_backend.repository.UserTournamentRoleRepository;
import com.mpi.aivango_backend.services.email.EmailSendService;
import com.mpi.aivango_backend.services.tournament.TournamentRoleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

@Service
@Slf4j
@RequiredArgsConstructor
public class TicketBookingService {

    private final TicketRepository ticketRepository;
    private final TournamentRepository tournamentRepository;
    private final TournamentRoleService tournamentRoleService;
    private final UserTournamentRoleRepository userTournamentRoleRepository;
    private final EmailSendService emailSendService;

    private static final int QR_SIZE = 300;

    @Transactional
    public void bookTicket(Long tournamentId, TicketBookingRequest request, UserAccount user) {
        if (request.getSeatsCount() < 1 || request.getSeatsCount() > 4) {
            throw new IllegalArgumentException("Можно забронировать от 1 до 4 мест");
        }

        if (!request.isAgreeToRules()) {
            throw new IllegalArgumentException("Необходимо согласие с правилами");
        }

        Tournament tournament = tournamentRepository.findById(tournamentId)
                .orElseThrow(() -> new IllegalArgumentException("Турнир не найден"));

        if (tournament.getTournamentStatus() != TournamentStatus.TICKET_SALES) {
            throw new IllegalArgumentException("Бронирование билетов недоступно для этого турнира");
        }

        // Проверка: у пользователя уже есть бронирование
        boolean hasExistingBooking = ticketRepository
                .findByUserIdAndTournamentIdAndConfirmedTrue(user.getId(), tournamentId)
                .isPresent();

        if (hasExistingBooking) {
            throw new IllegalArgumentException("У вас уже есть бронирование на этот турнир");
        }

        Set<TournamentRolesEnum> currentRoles = tournamentRoleService.getUserRolesInTournament(user.getId(), tournamentId);
        if (!currentRoles.isEmpty()) {
            throw new IllegalArgumentException("Вы уже участвуете в этом турнире");
        }

        // Подсчёт уже забронированных мест
        Integer bookedSeats = ticketRepository.sumSeatsCountByTournamentIdAndConfirmedTrue(tournamentId);
        if (bookedSeats == null) bookedSeats = 0;

        int availableSeats = tournament.getTotalSeats() - bookedSeats;
        if (availableSeats < request.getSeatsCount()) {
            throw new IllegalArgumentException("Недостаточно свободных мест");
        }

        if (bookedSeats + request.getSeatsCount() == tournament.getTotalSeats()) {
            tournament.setTournamentStatus(TournamentStatus.ACTIVE);
            tournamentRepository.save(tournament);
        }

        // Генерация уникального кода
        String bookingCode = UUID.randomUUID().toString();

        // Создание билета
        Ticket ticket = Ticket.builder()
                .user(user)
                .tournament(tournament)
                .seatsCount(request.getSeatsCount())
                .bookingCode(bookingCode)
                .createdAt(LocalDateTime.now())
                .confirmed(true)
                .build();

        ticketRepository.save(ticket);

        UserTournamentRole role = UserTournamentRole.builder()
                .user(user)
                .tournament(tournament)
                .role(TournamentRolesEnum.SPECTATOR)
                .build();
        userTournamentRoleRepository.save(role);

        // Генерация и отправка QR-кода
        sendTicketWithQR(ticket, tournament);
    }

    private void sendTicketWithQR(Ticket ticket, Tournament tournament) {
        String qrContent = String.format(
                "Tournament: %s%n" +
                        "Booking Code: %s%n" +
                        "Seats: %d%n" +
                        "Spectator: %s %s%n" +
                        "Booking Date: %s",
                tournament.getName(),
                ticket.getBookingCode(),
                ticket.getSeatsCount(),
                ticket.getUser().getName(),
                ticket.getUser().getSecondName(),
                ticket.getCreatedAt().toString()
        );

        try {
            byte[] qrImageBytes = generateQRCodeImage(qrContent);

            // Красивое тело письма без встроенного QR (только текст + информация)
            String emailBody = """
                <!DOCTYPE html>
                <html lang="ru">
                <head>
                    <meta charset="UTF-8">
                    <title>Билет на турнир Айвенго</title>
                    <style>
                        body { font-family: 'Palatino Linotype', serif; background: #f5f0e6; color: #3a3226; }
                        .container { max-width: 600px; margin: 20px auto; background: #fff9e6; padding: 30px; 
                                     border: 2px solid #d4af37; box-shadow: 0 0 15px rgba(0,0,0,0.1); }
                        h1 { color: #8b0000; text-align: center; font-variant: small-caps; }
                        .highlight { background: #f8f8f8; border: 1px solid #d4af37; padding: 10px; 
                                     font-weight: bold; text-align: center; margin: 15px 0; }
                        .footer { margin-top: 30px; font-size: 14px; color: #666; text-align: center; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <h1>Билет на турнир</h1>
                        <p>Благородный зритель!</p>
                        <p>Ваше бронирование на турнир успешно подтверждено.</p>
                        
                        <div class="highlight">
                            Турнир: %s<br>
                            Количество мест: %d<br>
                            Код бронирования: %s<br>
                            Зритель: %s %s
                        </div>
                        
                        <p>QR-код с вашим билетом прикреплён к этому письму в виде файла <strong>ticket_qr.png</strong>.</p>
                        <p>Сохраните его на телефон и предъявите на входе.</p>
                        
                        <div class="footer">
                            Да пребудет с вами удача на турнире!<br>
                            Сенешаль Айвенго
                        </div>
                    </div>
                </body>
                </html>
                """.formatted(
                    tournament.getName(),
                    ticket.getSeatsCount(),
                    ticket.getBookingCode(),
                    ticket.getUser().getName(),
                    ticket.getUser().getSecondName()
            );

            // Отправляем письмо с вложением
            boolean sent = emailSendService.sendHtmlEmailWithAttachment(
                    ticket.getUser().getEmail(),
                    "Ваш билет на турнир «" + tournament.getName() + "»",
                    emailBody,
                    qrImageBytes,                   // байты изображения
                    "ticket_qr.png"                 // имя файла вложения
            );

            if (!sent) {
                log.warn("Не удалось отправить письмо с билетом на {}", ticket.getUser().getEmail());
            }

        } catch (Exception e) {
            log.error("Ошибка при генерации или отправке билета с QR-кодом", e);
        }
    }

//    private void sendTicketWithQR(Ticket ticket, Tournament tournament) {
//        String qrContent = "Турнир: " + tournament.getName() +
//                "\nКод бронирования: " + ticket.getBookingCode() +
//                "\nМест: " + ticket.getSeatsCount() +
//                "\nДата: " + ticket.getCreatedAt();
//
//        try {
//            byte[] qrImageBytes = generateQRCodeImage(qrContent);
//            String qrBase64 = Base64.getEncoder().encodeToString(qrImageBytes);
//
//            String emailBody = """
//                    <h2>Ваше бронирование успешно создано!</h2>
//                    <p><strong>Турнир:</strong> %s</p>
//                    <p><strong>Количество мест:</strong> %d</p>
//                    <p><strong>Код бронирования:</strong> %s</p>
//                    <p>Сохраните этот QR-код — он будет нужен для входа на мероприятие.</p>
//                    <img src="data:image/png;base64,%s" alt="QR-код бронирования" />
//                    """.formatted(tournament.getName(), ticket.getSeatsCount(), ticket.getBookingCode(), qrBase64);
//
//            emailSendService.sendHtmlEmail(
//                    ticket.getUser().getEmail(),
//                    "Билет на турнир: " + tournament.getName(),
//                    emailBody
//            );
//
//        } catch (Exception e) {
//            throw new RuntimeException("Ошибка при генерации или отправке QR-кода", e);
//        }
//    }

    private byte[] generateQRCodeImage(String text) throws WriterException, IOException {
        QRCodeWriter qrCodeWriter = new QRCodeWriter();
        BitMatrix bitMatrix = qrCodeWriter.encode(text, BarcodeFormat.QR_CODE, QR_SIZE, QR_SIZE);

        ByteArrayOutputStream pngOutputStream = new ByteArrayOutputStream();
        MatrixToImageWriter.writeToStream(bitMatrix, "PNG", pngOutputStream);
        return pngOutputStream.toByteArray();
    }
}
