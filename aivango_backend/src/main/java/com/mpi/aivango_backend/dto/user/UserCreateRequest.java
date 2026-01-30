package com.mpi.aivango_backend.dto.user;

import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@RequiredArgsConstructor
@Getter
@Setter
public class UserCreateRequest {
    private String email;
    private String name;
    private String secondName;
}
