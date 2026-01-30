package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.email.Email;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;


public interface EmailRepository extends JpaRepository<Email, Long> {
    Optional<Email> findByHashedEmail(String email);
}
