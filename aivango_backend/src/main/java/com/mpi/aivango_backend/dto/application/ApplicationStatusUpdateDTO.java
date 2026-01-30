package com.mpi.aivango_backend.dto.application;

import com.mpi.aivango_backend.models.application.ApplicationStatus;
import lombok.*;

@NoArgsConstructor
@Getter
@Setter
@Builder
@AllArgsConstructor
public class ApplicationStatusUpdateDTO {
    private ApplicationStatus status;
    private String comment;
}
