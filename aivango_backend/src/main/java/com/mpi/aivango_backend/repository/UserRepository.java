package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.user.UserAccount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;


public interface UserRepository extends JpaRepository<UserAccount, Long> {
    @Query(value = "SELECT * FROM user_account WHERE email = :email", nativeQuery = true)
    Optional<UserAccount> getByEmail(@Param("email") String email1);
}
