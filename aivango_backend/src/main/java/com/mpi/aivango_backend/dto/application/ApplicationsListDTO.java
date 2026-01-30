package com.mpi.aivango_backend.dto.application;

import lombok.*;

import java.time.LocalDateTime;

@NoArgsConstructor
@Getter
@Setter
@Builder
@AllArgsConstructor
public class ApplicationsListDTO {
    private Long id;
    private String fullName;
    private LocalDateTime createdAt;
}
