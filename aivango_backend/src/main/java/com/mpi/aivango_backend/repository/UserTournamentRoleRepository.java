package com.mpi.aivango_backend.repository;

import com.mpi.aivango_backend.models.user.TournamentRolesEnum;
import com.mpi.aivango_backend.models.user.UserTournamentRole;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserTournamentRoleRepository extends JpaRepository<UserTournamentRole, Long> {

    List<UserTournamentRole> findByUserIdAndTournamentId(Long userId, Long tournamentId);

    boolean existsByUserIdAndTournamentIdAndRole(Long userId, Long tournamentId, TournamentRolesEnum role);

    List<UserTournamentRole> findByUserId(Long userId);

    List<UserTournamentRole> findByTournamentIdAndRole(Long tournamentId, TournamentRolesEnum role);
}
