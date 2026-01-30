package com.mpi.aivango_backend.dto.user;

import com.mpi.aivango_backend.models.application.ApplicationStatus;
import com.mpi.aivango_backend.models.sponsorship.SponsorshipPackage;
import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ParticipantDTO {

    // Общая информация
    private Long id;
    private String name;
    private String secondName;
    private String email;
    private TournamentRolesEnum role;

    // Специфическая для KNIGHT
    private ApplicationStatus applicationStatus;
    private String applicationComment;  // комментарий организатора

    // Специфическая для SPECTATOR
    private Integer ticketSeatsCount;
    private String bookingCode;

    // Специфическая для SPONSOR
    private SponsorshipPackage packageType;
    private Double sponsorshipAmount;
    private String companyName;
}
