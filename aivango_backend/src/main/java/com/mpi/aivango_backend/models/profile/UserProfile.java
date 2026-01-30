package com.mpi.aivango_backend.models.profile;

import com.mpi.aivango_backend.models.user.UserAccount;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Entity
@Table(name = "user_profiles")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private UserAccount user;

    @Column(nullable = false)
    private String firstName;  // Имя

    @Column(nullable = false)
    private String lastName;   // Фамилия

    @Column
    private Integer height;    // Рост в см

    @Column
    private Integer weight;    // Вес в кг

    @Column
    private String motivation; // Мотивация участия

    @Column
    private LocalDate birthDate; // Дата рождения

    // Цифровой герб (логотип/аватар)
    @Column
    private String coatOfArmsPath;  // путь к файлу: /uploads/coa/user_123.png
}
