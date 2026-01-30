package com.mpi.aivango_backend.dto.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@RequiredArgsConstructor
@Getter
@Setter
public class UserAuthenticationRequest {
    private String email;
    private Integer code;
}
