package com.mpi.aivango_backend.services.email;

import com.mpi.aivango_backend.models.email.Email;
import com.mpi.aivango_backend.models.tournament.Tournament;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.mindrot.jbcrypt.BCrypt;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.activation.DataHandler;
import javax.mail.Authenticator;
import javax.mail.Message;
import javax.mail.Multipart;
import javax.mail.PasswordAuthentication;
import javax.mail.Session;
import javax.mail.Transport;
import javax.mail.internet.InternetAddress;
import javax.mail.internet.MimeBodyPart;
import javax.mail.internet.MimeMessage;
import javax.mail.internet.MimeMultipart;
import javax.mail.util.ByteArrayDataSource;
import java.time.LocalDateTime;
import java.util.Properties;
import java.util.Random;

@RequiredArgsConstructor
@Slf4j
@Service
public class EmailSendService {
    private final EmailService emailService;
    @Value("${email.username}")
    private String username;
    @Value("${email.password}")
    private String password;
    @Value("${email.port}")
    private String port;
    @Value("${email.host}")
    private String host;
    private static final String EMAIL_FORMAT = "text/html; charset=UTF-8";
    private static final int CODE_FOR_EMAIL_MIN_VALUE = 100000;
    private static final int CODE_FOR_EMAIL_RANGE = 900000;

    private int createCodeForEmailMessage() {
        return CODE_FOR_EMAIL_MIN_VALUE + new Random().nextInt(CODE_FOR_EMAIL_RANGE);
    }

    public boolean sendCode(String email) {
        try {
            Session session = getSession();
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(username));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(email));
            message.setSubject("Login in account");
            int randomNumber = createCodeForEmailMessage();
            var emailMessageEntity = getOrUpdateEmailMessage(Integer.toString(randomNumber), email);
            emailService.save(emailMessageEntity);
            message.setContent(createKnightSecretCodeEmail(randomNumber), EMAIL_FORMAT);
            Transport.send(message);
            return true;
        } catch (Exception e) {
            log.error(String.format("Cant send message to user with email = %s:  %s", email, e.getMessage()));
            return false;
        }
    }

    public boolean sendCreationTournamentEmail(String email, Tournament tournament) {
        try {
            Session session = getSession();
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(username));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(email));
            message.setSubject("Creation Tournament!");
            message.setContent(createTournamentAnnouncementEmail(tournament.getName(),
                    tournament.getDescription(), tournament.getRequiredAmount(),
                    tournament.getPrizePercentNum()), EMAIL_FORMAT);
            Transport.send(message);
            return true;
        } catch (Exception e) {
            log.error(String.format("Cant send message to user with email = %s:  %s", email, e.getMessage()));
            return false;
        }
    }

    private Email getOrUpdateEmailMessage(String token, String email) throws Exception {
        var emailMessage = emailService.findByEmail(email);
        Email emailMessageEntity;
        if (emailMessage.isPresent()) {
            emailMessageEntity = emailMessage.get();
            emailMessageEntity.setLocalDateTime(LocalDateTime.now());
            emailMessageEntity.setHashedToken(getHashedValue(token));
        } else {
            emailMessageEntity = Email.builder()
                    .hashedEmail(email)
                    .localDateTime(LocalDateTime.now())
                    .hashedToken(getHashedValue(token))
                    .build();
        }
        return emailMessageEntity;
    }

    private String getHashedValue(String str) {
        return BCrypt.hashpw(str, BCrypt.gensalt());
    }

    private Session getSession() {
        Properties props = new Properties();
        props.put("mail.smtp.auth", "true");
        props.put("mail.smtp.starttls.enable", "true");
        props.put("mail.smtp.host", host);
        props.put("mail.smtp.port", port);
        return Session.getInstance(props, new Authenticator() {
            protected PasswordAuthentication getPasswordAuthentication() {
                return new PasswordAuthentication(username, password);
            }
        });
    }

    private String createKnightSecretCodeEmail(int secretCode) {
        return "<!DOCTYPE html>"
                + "<html lang=\"en\">"
                + "<head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<title>Рыцарский Код Турнира Айвенго</title>"
                + "<style>"
                + "  body {"
                + "    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;"
                + "    background-color: #f5f0e6;"
                + "    margin: 0;"
                + "    padding: 0;"
                + "    color: #3a3226;"
                + "  }"
                + "  .container {"
                + "    max-width: 600px;"
                + "    margin: 20px auto;"
                + "    background: #fff9e6;"
                + "    padding: 30px;"
                + "    border: 2px solid #d4af37;"
                + "    border-radius: 0;"
                + "    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);"
                + "  }"
                + "  .header {"
                + "    text-align: center;"
                + "    border-bottom: 3px double #8b0000;"
                + "    padding-bottom: 15px;"
                + "    margin-bottom: 25px;"
                + "  }"
                + "  h1 {"
                + "    color: #8b0000;"
                + "    font-size: 28px;"
                + "    font-weight: normal;"
                + "    font-variant: small-caps;"
                + "    letter-spacing: 1px;"
                + "    margin: 0;"
                + "  }"
                + "  .knight-title {"
                + "    font-style: italic;"
                + "    color: #5d2906;"
                + "    margin: 10px 0;"
                + "  }"
                + "  .content {"
                + "    line-height: 1.6;"
                + "    font-size: 16px;"
                + "  }"
                + "  .code-container {"
                + "    background: #f8f8f8;"
                + "    border: 1px solid #d4af37;"
                + "    padding: 15px;"
                + "    margin: 25px auto;"
                + "    text-align: center;"
                + "    font-family: monospace;"
                + "    font-size: 24px;"
                + "    letter-spacing: 3px;"
                + "    color: #8b0000;"
                + "    width: fit-content;"
                + "  }"
                + "  .footer {"
                + "    margin-top: 30px;"
                + "    border-top: 1px solid #d4af37;"
                + "    padding-top: 15px;"
                + "    font-size: 14px;"
                + "    color: #666;"
                + "  }"
                + "  .seal {"
                + "    text-align: center;"
                + "    margin-top: 20px;"
                + "    font-style: italic;"
                + "    color: #8b0000;"
                + "  }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class=\"container\">"
                + "  <div class=\"header\">"
                + "    <h1>Турнир!</h1>"
                + "    <div class=\"knight-title\">Послание благородному рыцарю</div>"
                + "  </div>"
                + "  <div class=\"content\">"
                + "    <p>Да будет известно, что по велению короля Ричарда Львиное Сердце,</p>"
                + "    <p>Вам дарован сей тайный код для вступления в наше братство:</p>"
                + "    <div class=\"code-container\">" + secretCode + "</div>"
                + "    <p>Да поможет вам Святой Георгий в предстоящих испытаниях!</p>"
                + "  </div>"
                + "  <div class=\"footer\">"
                + "    <p>Если вы не рыцарь и не ожидали это послание,"
                + "    немедленно сообщите об этом сенешалю турнира.</p>"
                + "    <div class=\"seal\">"
                + "      Печать сенешаля турнира<br>"
                + "      <span style=\"font-size:12px;\">Подлинность подтверждена</span>"
                + "    </div>"
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }

    private String createTournamentAnnouncementEmail(String name, String description, Float requiredAmount, Float winnerPercentage) {
        return "<!DOCTYPE html>"
                + "<html lang=\"ru\">"
                + "<head>"
                + "<meta charset=\"UTF-8\">"
                + "<meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">"
                + "<title>Новый Турнир Айвенго</title>"
                + "<style>"
                + "  body {"
                + "    font-family: 'Palatino Linotype', 'Book Antiqua', Palatino, serif;"
                + "    background-color: #f5f0e6;"
                + "    margin: 0;"
                + "    padding: 0;"
                + "    color: #3a3226;"
                + "  }"
                + "  .container {"
                + "    max-width: 600px;"
                + "    margin: 20px auto;"
                + "    background: #fff9e6;"
                + "    padding: 30px;"
                + "    border: 2px solid #d4af37;"
                + "    border-radius: 0;"
                + "    box-shadow: 0 0 15px rgba(0, 0, 0, 0.1);"
                + "  }"
                + "  .header {"
                + "    text-align: center;"
                + "    border-bottom: 3px double #8b0000;"
                + "    padding-bottom: 15px;"
                + "    margin-bottom: 25px;"
                + "  }"
                + "  h1 {"
                + "    color: #8b0000;"
                + "    font-size: 28px;"
                + "    font-weight: normal;"
                + "    font-variant: small-caps;"
                + "    letter-spacing: 1px;"
                + "    margin: 0;"
                + "  }"
                + "  .knight-title {"
                + "    font-style: italic;"
                + "    color: #5d2906;"
                + "    margin: 10px 0;"
                + "  }"
                + "  .content {"
                + "    line-height: 1.6;"
                + "    font-size: 16px;"
                + "  }"
                + "  .highlight {"
                + "    background: #f8f8f8;"
                + "    border: 1px solid #d4af37;"
                + "    padding: 12px;"
                + "    margin: 15px 0;"
                + "    font-weight: bold;"
                + "    color: #8b0000;"
                + "  }"
                + "  .footer {"
                + "    margin-top: 30px;"
                + "    border-top: 1px solid #d4af37;"
                + "    padding-top: 15px;"
                + "    font-size: 14px;"
                + "    color: #666;"
                + "  }"
                + "  .seal {"
                + "    text-align: center;"
                + "    margin-top: 20px;"
                + "    font-style: italic;"
                + "    color: #8b0000;"
                + "  }"
                + "</style>"
                + "</head>"
                + "<body>"
                + "<div class=\"container\">"
                + "  <div class=\"header\">"
                + "    <h1>Новый Турнир!</h1>"
                + "    <div class=\"knight-title\">Глашатай возвещает</div>"
                + "  </div>"
                + "  <div class=\"content\">"
                + "    <p>Да услышат все рыцари и дамы королевства!</p>"
                + "    <p>Объявляется новый турнир под названием:</p>"
                + "    <div class=\"highlight\">" + name + "</div>"
                + "    <p><strong>Описание:</strong> " + description + "</p>"
                + "    <p>Для проведения турнира требуется сумма в размере:</p>"
                + "    <div class=\"highlight\">" + requiredAmount + " золотых монет</div>"
                + "    <p>Из собранной суммы победитель получит:</p>"
                + "    <div class=\"highlight\">" + winnerPercentage + "%</div>"
                + "    <p>Да свершится великая битва, и пусть сильнейший возьмёт славу и золото!</p>"
                + "  </div>"
                + "  <div class=\"footer\">"
                + "    <p>Если вы не собирались участвовать в турнире, просим не обращать внимания на это послание.</p>"
                + "    <div class=\"seal\">"
                + "      Печать сенешаля турнира<br>"
                + "      <span style=\"font-size:12px;\">Пусть доблесть будет с вами</span>"
                + "    </div>"
                + "  </div>"
                + "</div>"
                + "</body>"
                + "</html>";
    }


    /** Универсальный метод отправки HTML письма */
    public boolean sendHtmlEmail(String toEmail, String subject, String htmlBody) {
        try {
            Session session = getSession();
            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(username));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject(subject);
            message.setContent(htmlBody, EMAIL_FORMAT);
            Transport.send(message);
            log.info("HTML письмо успешно отправлено на {}", toEmail);
            return true;
        } catch (Exception e) {
            log.error("Ошибка отправки письма на {}: {}", toEmail, e.getMessage(), e);
            return false;
        }
    }
    public boolean sendHtmlEmailWithAttachment(String toEmail,
                                               String subject,
                                               String htmlBody,
                                               byte[] attachmentBytes,
                                               String attachmentFileName) {
        try {
            Session session = getSession();

            Message message = new MimeMessage(session);
            message.setFrom(new InternetAddress(username));
            message.setRecipients(Message.RecipientType.TO, InternetAddress.parse(toEmail));
            message.setSubject(subject);

            // Тело письма (HTML)
            MimeBodyPart messageBodyPart = new MimeBodyPart();
            messageBodyPart.setContent(htmlBody, EMAIL_FORMAT);

            // Вложение (QR-код)
            MimeBodyPart attachmentPart = new MimeBodyPart();
            ByteArrayDataSource dataSource = new ByteArrayDataSource(attachmentBytes, "image/png");
            attachmentPart.setDataHandler(new DataHandler(dataSource));
            attachmentPart.setFileName(attachmentFileName);

            // Собираем всё вместе
            Multipart multipart = new MimeMultipart();
            multipart.addBodyPart(messageBodyPart);
            multipart.addBodyPart(attachmentPart);

            message.setContent(multipart);

            Transport.send(message);
            log.info("Письмо с вложением QR-кода отправлено на {}", toEmail);
            return true;

        } catch (Exception e) {
            log.error("Ошибка отправки письма с вложением на {}: {}", toEmail, e.getMessage(), e);
            return false;
        }
    }

}
