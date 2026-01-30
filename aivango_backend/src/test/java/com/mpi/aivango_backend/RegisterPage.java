package com.mpi.aivango_backend;

import io.qameta.allure.Step;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.PageFactory;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.time.Duration;

public class RegisterPage {

    private WebDriver driver;
    private WebDriverWait wait;

    // Элементы первого шага (регистрация)
    @FindBy(css = "input#email")
    private WebElement emailInput;

    @FindBy(css = "input#firstName")
    private WebElement firstNameInput;

    @FindBy(css = "input#lastName")
    private WebElement lastNameInput;

    @FindBy(css = "form.registration-form button[type='submit']")
    private WebElement getCodeButton;

    // Элементы второго шага (подтверждение кода)
    @FindBy(css = "input#code")
    private WebElement codeInput;

    @FindBy(css = "form.verification-form button[type='submit']")
    private WebElement confirmButton;

    @FindBy(css = "form.verification-form button[type='button']")
    private WebElement resendButton;

    // Сообщения
    @FindBy(css = "p.error")
    private WebElement errorMessage;

    @FindBy(css = "p.info")
    private WebElement infoMessage;

    // Заголовок и ссылки
    @FindBy(css = "h2")
    private WebElement pageHeading;

    @FindBy(css = "a.authLink")
    private WebElement loginLink;

    @FindBy(css = "p.authHint")
    private WebElement authHint;

    public RegisterPage(WebDriver driver) {
        this.driver = driver;
        this.wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        PageFactory.initElements(driver, this);
    }

    @Step("Проверка, что страница регистрации загружена")
    public boolean isPageLoaded() {
        try {
            wait.until(ExpectedConditions.visibilityOf(pageHeading));
            return pageHeading.getText().equals("Регистрация");
        } catch (Exception e) {
            return false;
        }
    }

    @Step("Ввод email: {email}")
    public RegisterPage enterEmail(String email) {
        wait.until(ExpectedConditions.visibilityOf(emailInput));
        emailInput.clear();
        emailInput.sendKeys(email);
        return this;
    }

    @Step("Ввод имени: {firstName}")
    public RegisterPage enterFirstName(String firstName) {
        wait.until(ExpectedConditions.visibilityOf(firstNameInput));
        firstNameInput.clear();
        firstNameInput.sendKeys(firstName);
        return this;
    }

    @Step("Ввод фамилии: {lastName}")
    public RegisterPage enterLastName(String lastName) {
        wait.until(ExpectedConditions.visibilityOf(lastNameInput));
        lastNameInput.clear();
        lastNameInput.sendKeys(lastName);
        return this;
    }

    @Step("Клик по кнопке получения кода")
    public void clickGetCode() {
        wait.until(ExpectedConditions.elementToBeClickable(getCodeButton));
        getCodeButton.click();
    }

    @Step("Заполнение формы регистрации: email={email}, имя={firstName}, фамилия={lastName}")
    public void fillRegistrationForm(String email, String firstName, String lastName) {
        enterEmail(email);
        enterFirstName(firstName);
        enterLastName(lastName);
        clickGetCode();
    }

    @Step("Проверка, что отображается форма подтверждения кода")
    public boolean isCodeInputDisplayed() {
        try {
            wait.until(ExpectedConditions.visibilityOf(codeInput));
            return codeInput.isDisplayed();
        } catch (Exception e) {
            return false;
        }
    }

    @Step("Ввод кода подтверждения: {code}")
    public RegisterPage enterCode(String code) {
        wait.until(ExpectedConditions.visibilityOf(codeInput));
        codeInput.clear();
        codeInput.sendKeys(code);
        return this;
    }

    @Step("Клик по кнопке подтверждения")
    public void clickConfirm() {
        wait.until(ExpectedConditions.elementToBeClickable(confirmButton));
        confirmButton.click();
    }

    @Step("Отправка кода подтверждения: {code}")
    public void submitCode(String code) {
        enterCode(code);
        clickConfirm();
    }

    @Step("Полный процесс регистрации: email={email}, имя={firstName}, фамилия={lastName}, код={code}")
    public void registerWithEmailAndCode(String email, String firstName, String lastName, String code) {
        fillRegistrationForm(email, firstName, lastName);
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

    @Step("Проверка, что кнопка получения кода disabled")
    public boolean isGetCodeButtonDisabled() {
        try {
            return !getCodeButton.isEnabled();
        } catch (Exception e) {
            return false;
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

    @Step("Клик по ссылке входа")
    public LoginPage clickLoginLink() {
        wait.until(ExpectedConditions.elementToBeClickable(loginLink));
        loginLink.click();
        return new LoginPage(driver);
    }

    @Step("Проверка текста подсказки о входе")
    public String getAuthHintText() {
        try {
            return authHint.getText();
        } catch (Exception e) {
            return "";
        }
    }
}