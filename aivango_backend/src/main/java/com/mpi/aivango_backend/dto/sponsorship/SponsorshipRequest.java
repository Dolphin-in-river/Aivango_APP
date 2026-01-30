package com.mpi.aivango_backend.dto.sponsorship;

import com.mpi.aivango_backend.models.sponsorship.SponsorshipPackage;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SponsorshipRequest {

    private SponsorshipPackage packageType;

    private String companyName;

    // В будущем: MultipartFile logo
}
