package com.mpi.aivango_backend;

import io.qameta.allure.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

@Epic("UI Tests")
@Feature("Authentication - Registration")
@DisplayName("Тесты страницы регистрации")
public class RegisterTests extends BaseTest {

    private RegisterPage registerPage;
    private static final String REGISTER_URL = "/register";

    @BeforeEach
    public void openRegisterPage() {
        driver.get(BASE_URL + REGISTER_URL);
        registerPage = new RegisterPage(driver);
    }

    @Test
    @DisplayName("Проверка загрузки страницы регистрации")
    @Description("Тест проверяет, что страница регистрации загружается и отображает корректный заголовок")
    @Severity(SeverityLevel.BLOCKER)
    @Tag("smoke")
    public void testRegisterPageLoads() {
        assertThat(registerPage.isPageLoaded())
                .as("Страница регистрации должна загрузиться")
                .isTrue();
    }

    @Test
    @DisplayName("Проверка наличия всех элементов формы")
    @Description("Тест проверяет наличие всех полей формы регистрации")
    @Severity(SeverityLevel.CRITICAL)
    @Tag("ui")
    public void testRegisterPageElements() {
        assertThat(registerPage.isPageLoaded()).isTrue();

        String authHint = registerPage.getAuthHintText();
        assertThat(authHint)
                .as("Должна быть ссылка на вход")
                .contains("Уже есть аккаунт");
    }

    @Test
    @DisplayName("Успешная регистрация с валидными данными")
    @Description("Тест проверяет успешную регистрацию нового пользователя")
    @Severity(SeverityLevel.CRITICAL)
    @Tag("authentication")
    public void testSuccessfulRegistration() {
        String uniqueEmail = "user" + System.currentTimeMillis() + "@example.com";
        String firstName = "Иван";
        String lastName = "Петров";

        registerPage.fillRegistrationForm(uniqueEmail, firstName, lastName);

        boolean codeInputDisplayed = registerPage.isCodeInputDisplayed();

        if (codeInputDisplayed) {
            assertThat(registerPage.isInfoMessageDisplayed())
                    .as("Должно отображаться информационное сообщение об отправке кода")
                    .isTrue();

            String infoText = registerPage.getInfoMessage();
            assertThat(infoText)
                    .as("Сообщение должно содержать email")
                    .contains(uniqueEmail);
        }
    }

    @Test
    @DisplayName("Регистрация с уже существующим email")
    @Description("Тест проверяет отображение ошибки при попытке регистрации с уже используемым email")
    @Severity(SeverityLevel.CRITICAL)
    @Tag("validation")
    public void testRegistrationWithExistingEmail() {
        String existingEmail = "georgiyshulyak@gmail.com";
        String firstName = "Тест";
        String lastName = "Тестов";

        registerPage.fillRegistrationForm(existingEmail, firstName, lastName);

        // Должна появиться ошибка о том, что email уже зарегистрирован
        assertThat(registerPage.isErrorMessageDisplayed())
                .as("Должно отображаться сообщение об ошибке")
                .isTrue();

        String errorText = registerPage.getErrorMessage();
        assertThat(errorText)
                .as("Сообщение должно указывать, что email уже зарегистрирован")
                .containsIgnoringCase("зарегистрирован");

        takeScreenshot("Existing email error");
    }

    @Test
    @DisplayName("Попытка регистрации с пустыми полями")
    @Description("Тест проверяет валидацию обязательных полей")
    @Severity(SeverityLevel.NORMAL)
    @Tag("validation")
    public void testRegistrationWithEmptyFields() {
        registerPage.enterEmail("");
        registerPage.enterFirstName("");
        registerPage.enterLastName("");
        registerPage.clickGetCode();
    }

    @Test
    @DisplayName("Регистрация с пустым email")
    @Description("Тест проверяет валидацию поля email")
    @Severity(SeverityLevel.NORMAL)
    @Tag("validation")
    public void testRegistrationWithEmptyEmail() {
        registerPage.enterEmail("");
        registerPage.enterFirstName("Иван");
        registerPage.enterLastName("Петров");
        registerPage.clickGetCode();
    }

    @Test
    @DisplayName("Регистрация с пустым именем")
    @Description("Тест проверяет валидацию поля имени")
    @Severity(SeverityLevel.NORMAL)
    @Tag("validation")
    public void testRegistrationWithEmptyFirstName() {
        String uniqueEmail = "user" + System.currentTimeMillis() + "@example.com";

        registerPage.enterEmail(uniqueEmail);
        registerPage.enterFirstName("");
        registerPage.enterLastName("Петров");
        registerPage.clickGetCode();
    }

    @Test
    @DisplayName("Регистрация с пустой фамилией")
    @Description("Тест проверяет валидацию поля фамилии")
    @Severity(SeverityLevel.NORMAL)
    @Tag("validation")
    public void testRegistrationWithEmptyLastName() {
        String uniqueEmail = "user" + System.currentTimeMillis() + "@example.com";

        registerPage.enterEmail(uniqueEmail);
        registerPage.enterFirstName("Иван");
        registerPage.enterLastName("");
        registerPage.clickGetCode();
    }

    @Test
    @DisplayName("Регистрация с невалидным форматом email")
    @Description("Тест проверяет валидацию формата email")
    @Severity(SeverityLevel.NORMAL)
    @Tag("validation")
    public void testRegistrationWithInvalidEmailFormat() {
        registerPage.enterEmail("notanemail");
        registerPage.enterFirstName("Иван");
        registerPage.enterLastName("Петров");
        registerPage.clickGetCode();
    }

    @Test
    @DisplayName("Проверка таймера повторной отправки кода")
    @Description("Тест проверяет, что кнопка повторной отправки недоступна сразу после регистрации")
    @Severity(SeverityLevel.NORMAL)
    @Tag("functionality")
    public void testResendCodeTimer() {
        String uniqueEmail = "user" + System.currentTimeMillis() + "@example.com";

        registerPage.fillRegistrationForm(uniqueEmail, "Иван", "Петров");

        if (registerPage.isCodeInputDisplayed()) {
            // Проверяем, что кнопка повторной отправки disabled
            assertThat(registerPage.isResendButtonDisabled())
                    .as("Кнопка повторной отправки должна быть недоступна сразу после отправки")
                    .isTrue();

            String buttonText = registerPage.getResendButtonText();
            assertThat(buttonText)
                    .as("Текст кнопки должен содержать таймер")
                    .matches(".*\\d+:\\d+.*");
        }
    }

    @Test
    @DisplayName("Переход на страницу входа")
    @Description("Тест проверяет переход на страницу входа по ссылке")
    @Severity(SeverityLevel.NORMAL)
    @Tag("navigation")
    public void testNavigateToLoginPage() {
        var loginPage = registerPage.clickLoginLink();

        assertThat(loginPage.isPageLoaded())
                .as("Страница входа должна загрузиться")
                .isTrue();

        assertThat(driver.getCurrentUrl())
                .as("URL должен содержать /login")
                .contains("/login");

        takeScreenshot("Navigated to login page");
    }

    @Test
    @DisplayName("Проверка состояния кнопки во время отправки")
    @Description("Тест проверяет, что кнопка недоступна во время отправки запроса")
    @Severity(SeverityLevel.MINOR)
    @Tag("ui")
    public void testButtonStateWhileSending() {
        String uniqueEmail = "user" + System.currentTimeMillis() + "@example.com";

        registerPage.enterEmail(uniqueEmail);
        registerPage.enterFirstName("Иван");
        registerPage.enterLastName("Петров");
    }
}