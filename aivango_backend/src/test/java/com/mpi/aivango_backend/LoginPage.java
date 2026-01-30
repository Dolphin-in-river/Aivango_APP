package com.mpi.aivango_backend;

import io.qameta.allure.Step;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class LoginPage {
    private WebDriver driver;
    private WebDriverWait wait;

    // Элементы первого шага (ввод email)
    @FindBy(css = "input#email")
    private WebElement emailInput;

    @FindBy(css = "button[type='submit']")
    private WebElement submitButton;

    // Элементы второго шага (ввод кода)
    @FindBy(css = "input#code")
    private WebElement codeInput;

    @FindBy(css = "button[type='button']")
    private WebElement resendButton;

    // Сообщения
    @FindBy(css = "p.error")
    private WebElement errorMessage;

    @FindBy(css = "p.info")
    private WebElement infoMessage;

    // Заголовок и ссылка
    @FindBy(css = "h2")
    private WebElement pageHeading;

    @FindBy(css = "a.authLink")
    private WebElement registerLink;

    @FindBy(css = "p.authHint")
    private WebElement authHint;

    public LoginPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    @Step("Проверка, что страница логина загружена")
    public boolean isPageLoaded() {
        try {
            wait.until(ExpectedConditions.visibilityOf(pageHeading));
            return pageHeading.getText().equals("Вход");
        } catch (Exception e) {
            return false;
        }
    }

    @Step("Ввод email: {email}")
    public LoginPage enterEmail(String email) {
        wait.until(ExpectedConditions.visibilityOf(emailInput));
        emailInput.clear();
        emailInput.sendKeys(email);
        return this;
    }

    @Step("Клик по кнопке получения кода")
    public void clickGetCode() {
        wait.until(ExpectedConditions.elementToBeClickable(submitButton));
        submitButton.click();
    }

    @Step("Запрос кода для email: {email}")
    public void requestCode(String email) {
        enterEmail(email);
        clickGetCode();
    }

    @Step("Проверка, что код был отправлен (отображается поле ввода кода)")
    public boolean isCodeInputDisplayed() {
        try {
            wait.until(ExpectedConditions.visibilityOf(codeInput));
            return codeInput.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    @Step("Ввод кода подтверждения: {code}")
    public LoginPage enterCode(String code) {
        wait.until(ExpectedConditions.visibilityOf(codeInput));
        codeInput.clear();
        codeInput.sendKeys(code);
        return this;
    }

    @Step("Клик по кнопке Войти")
    public void clickLogin() {
        wait.until(ExpectedConditions.elementToBeClickable(submitButton));
        submitButton.click();
    }

    @Step("Выполнение входа с кодом: {code}")
    public void submitCode(String code) {
        enterCode(code);
        clickLogin();
    }

    @Step("Полный процесс входа: email={email}, code={code}")
    public void loginWithEmailAndCode(String email, String code) {
        requestCode(email);
        // Ждем появления поля для кода
        wait.until(ExpectedConditions.visibilityOf(codeInput));
        submitCode(code);
    }

    @Step("Клик по кнопке повторной отправки кода")
    public void clickResendCode() {
        wait.until(ExpectedConditions.elementToBeClickable(resendButton));
        resendButton.click();
    }

    @Step("Проверка, что кнопка повторной отправки disabled")
    public boolean isResendButtonDisabled() {
        try {
            return !resendButton.isEnabled();
        } catch (Exception e) {
            return false;
        }
    }

    @Step("Получение текста кнопки повторной отправки")
    public String getResendButtonText() {
        try {
            wait.until(ExpectedConditions.visibilityOf(resendButton));
            return resendButton.getText();
        } catch (Exception e) {
            return "";
        }
    }

    @Step("Получение текста сообщения об ошибке")
    public String getErrorMessage() {
        try {
            wait.until(ExpectedConditions.visibilityOf(errorMessage));
            return errorMessage.getText();
        } catch (Exception e) {
            return "";
        }
    }

    @Step("Получение текста информационного сообщения")
    public String getInfoMessage() {
        try {
            wait.until(ExpectedConditions.visibilityOf(infoMessage));
            return infoMessage.getText();
        } catch (Exception e) {
            return "";
        }
    }

    @Step("Проверка видимости сообщения об ошибке")
    public boolean isErrorMessageDisplayed() {
        try {
            wait.until(ExpectedConditions.visibilityOf(errorMessage));
            return errorMessage.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    @Step("Проверка видимости информационного сообщения")
    public boolean isInfoMessageDisplayed() {
        try {
            wait.until(ExpectedConditions.visibilityOf(infoMessage));
            return infoMessage.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    @Step("Клик по ссылке регистрации")
    public RegisterPage clickRegisterLink() {
        wait.until(ExpectedConditions.elementToBeClickable(registerLink));
        registerLink.click();
        return new RegisterPage(driver);
    }

    @Step("Проверка текста подсказки о регистрации")
    public String getAuthHintText() {
        try {
            return authHint.getText();
        } catch (Exception e) {
            return "";
        }
    }
}
