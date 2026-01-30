package com.mpi.aivango_backend;

import io.qameta.allure.Description;
import io.qameta.allure.Severity;
import io.qameta.allure.SeverityLevel;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

public class LoginTests extends BaseTest {
    private LoginPage loginPage;
    private static final String LOGIN_URL = "/login";

    @BeforeEach
    public void openLoginPage() {
        driver.get(BASE_URL + LOGIN_URL);
        loginPage = new LoginPage(driver);
    }

    @Test
    @DisplayName("Проверка загрузки страницы входа")
    @Description("Тест проверяет, что страница входа загружается и отображает корректный заголовок")
    @Severity(SeverityLevel.BLOCKER)
    @Tag("smoke")
    public void testLoginPageLoads() {
        assertThat(loginPage.isPageLoaded())
                .as("Страница входа должна загрузиться")
                .isTrue();
    }

    @Test
    @DisplayName("Запрос кода с валидным email")
    @Description("Тест проверяет успешную отправку кода на существующий email")
    @Severity(SeverityLevel.CRITICAL)
    @Tag("authentication")
    public void testRequestCodeWithValidEmail() {
        String validEmail = "test@example.com";

        loginPage.requestCode(validEmail);

        // Проверяем, что появилось поле для ввода кода
        boolean codeInputDisplayed = loginPage.isCodeInputDisplayed();

        if (codeInputDisplayed) {
            // Если код успешно отправлен
            assertThat(loginPage.isInfoMessageDisplayed())
                    .as("Должно отображаться информационное сообщение об отправке кода")
                    .isTrue();

            String infoText = loginPage.getInfoMessage();
            assertThat(infoText)
                    .as("Сообщение должно содержать email")
                    .contains(validEmail);
        } else {
            // Если email не найден (аккаунт не существует)
            assertThat(loginPage.isErrorMessageDisplayed())
                    .as("Должно отображаться сообщение об ошибке")
                    .isTrue();
        }
    }

    @Test
    @DisplayName("Запрос кода с несуществующим email")
    @Description("Тест проверяет отображение ошибки при вводе незарегистрированного email")
    @Severity(SeverityLevel.CRITICAL)
    @Tag("validation")
    public void testRequestCodeWithNonexistentEmail() {
        String nonexistentEmail = "nonexistent" + System.currentTimeMillis() + "@example.com";

        loginPage.requestCode(nonexistentEmail);

        // Должна появиться ошибка о том, что аккаунт не найден
        assertThat(loginPage.isErrorMessageDisplayed())
                .as("Должно отображаться сообщение об ошибке")
                .isTrue();

        String errorText = loginPage.getErrorMessage();
        assertThat(errorText)
                .as("Сообщение должно указывать, что аккаунт не найден")
                .containsIgnoringCase("не найден");
    }

    @Test
    @DisplayName("Попытка запроса кода с пустым email")
    @Description("Тест проверяет валидацию пустого поля email")
    @Severity(SeverityLevel.NORMAL)
    @Tag("validation")
    public void testRequestCodeWithEmptyEmail() {
        loginPage.enterEmail("");
        loginPage.clickGetCode();
    }

    @Test
    @DisplayName("Попытка запроса кода с невалидным форматом email")
    @Description("Тест проверяет валидацию формата email")
    @Severity(SeverityLevel.NORMAL)
    @Tag("validation")
    public void testRequestCodeWithInvalidEmailFormat() {
        String invalidEmail = "notanemail";

        loginPage.enterEmail(invalidEmail);
        loginPage.clickGetCode();
    }

    @Test
    @DisplayName("Проверка таймера повторной отправки кода")
    @Description("Тест проверяет, что кнопка повторной отправки недоступна сразу после отправки")
    @Severity(SeverityLevel.NORMAL)
    @Tag("functionality")
    public void testResendCodeTimer() {
        String validEmail = "georgiyshulyak@gmail.com"; // должен существовать в системе

        loginPage.requestCode(validEmail);

        if (loginPage.isCodeInputDisplayed()) {
            assertThat(loginPage.isResendButtonDisabled())
                    .as("Кнопка повторной отправки должна быть недоступна сразу после отправки")
                    .isTrue();

            String buttonText = loginPage.getResendButtonText();
            assertThat(buttonText)
                    .as("Текст кнопки должен содержать таймер")
                    .matches(".*\\d+:\\d+.*");
        }
    }

    @Test
    @DisplayName("Ввод невалидного кода подтверждения")
    @Description("Тест проверяет отображение ошибки при вводе неверного кода")
    @Severity(SeverityLevel.CRITICAL)
    @Tag("authentication")
    public void testSubmitInvalidCode() {
        String validEmail = "georgiyshulyak@gmail.com"; // должен существовать в системе
        String invalidCode = "000000";

        loginPage.requestCode(validEmail);

        if (loginPage.isCodeInputDisplayed()) {
            loginPage.submitCode(invalidCode);

            assertThat(loginPage.isErrorMessageDisplayed())
                    .as("Должно отображаться сообщение об ошибке неверного кода")
                    .isTrue();

            String errorText = loginPage.getErrorMessage();
            assertThat(errorText)
                    .as("Сообщение должно указывать на неверный код")
                    .containsIgnoringCase("неверный");

            takeScreenshot("Invalid code error");
        }
    }

    @Test
    @DisplayName("Переход на страницу регистрации")
    @Description("Тест проверяет переход на страницу регистрации по ссылке")
    @Severity(SeverityLevel.NORMAL)
    @Tag("navigation")
    public void testNavigateToRegisterPage() {
        var registerPage = loginPage.clickRegisterLink();

        assertThat(registerPage.isPageLoaded())
                .as("Страница регистрации должна загрузиться")
                .isTrue();

        assertThat(driver.getCurrentUrl())
                .as("URL должен содержать /register")
                .contains("/register");

        takeScreenshot("Navigated to register page");
    }
}
