package com.mpi.aivango_backend.dto.profile;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileDTO {

    private String firstName;

    private String lastName;

    private Integer height;

    private Integer weight;

    private String motivation;

    private LocalDate birthDate;

    private String coatOfArmsUrl;
}
