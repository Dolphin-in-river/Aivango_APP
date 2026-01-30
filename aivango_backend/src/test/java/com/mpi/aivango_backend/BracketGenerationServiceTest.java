package com.mpi.aivango_backend;

import com.mpi.aivango_backend.dto.fight.TournamentBracketDTO;
import com.mpi.aivango_backend.models.application.Application;
import com.mpi.aivango_backend.models.application.ApplicationStatus;
import com.mpi.aivango_backend.models.fight.FightHistory;
import com.mpi.aivango_backend.models.fight.FightRound;
import com.mpi.aivango_backend.models.tournament.Tournament;
import com.mpi.aivango_backend.models.tournament.TournamentStatus;
import com.mpi.aivango_backend.models.user.UserAccount;
import com.mpi.aivango_backend.repository.ApplicationRepository;
import com.mpi.aivango_backend.repository.FightHistoryRepository;
import com.mpi.aivango_backend.repository.TournamentRepository;
import com.mpi.aivango_backend.services.email.EmailSendService;
import com.mpi.aivango_backend.services.tournament.BracketGenerationService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
public class BracketGenerationServiceTest {
    @Mock
    private TournamentRepository tournamentRepository;

    @Mock
    private ApplicationRepository applicationRepository;

    @Mock
    private FightHistoryRepository fightHistoryRepository;

    @Mock
    private EmailSendService emailSendService;

    @InjectMocks
    private BracketGenerationService bracketGenerationService;

    private Tournament tournament;
    private List<UserAccount> knights;
    private List<Application> applications;

    @BeforeEach
    void setUp() {
        tournament = Tournament.builder()
                .id(1L)
                .name("Test Tournament")
                .tournamentStatus(TournamentStatus.KNIGHT_REGISTRATION)
                .userAccount(new UserAccount(1L, "organizer@example.com", "Organizer", "Org", true))
                .build();

        knights = new ArrayList<>();
        applications = new ArrayList<>();
    }

    @Test
    void generateBracket_SingleParticipant_Success() {
        addKnights(1);
        mockCommonRepositories();
        mockDeleteAndSaveAll();

        bracketGenerationService.generateBracket(1L);

        verifyBracketGenerated(1, FightRound.FINAL, 1); // 1 match
        verifyStatusUpdated(TournamentStatus.TICKET_SALES);
        verifyNotificationsSent(1);
    }

    @Test
    void generateBracket_TwoParticipants_Success() {
        addKnights(2);
        mockCommonRepositories();
        mockDeleteAndSaveAll();

        bracketGenerationService.generateBracket(1L);

        verifyBracketGenerated(2, FightRound.FINAL, 1); // 1 match
        verifyStatusUpdated(TournamentStatus.TICKET_SALES);
        verifyNotificationsSent(2);
    }

    @Test
    void generateBracket_FourParticipants_Success() {
        addKnights(4);
        mockCommonRepositories();
        mockDeleteAndSaveAll();
        mockSaveForBronze();

        bracketGenerationService.generateBracket(1L);

        verifyBracketGenerated(4, FightRound.SEMIFINAL, 4); // 2 semis + 1 final + 1 bronze = 4
        verifyStatusUpdated(TournamentStatus.TICKET_SALES);
        verifyNotificationsSent(4);
    }

    @Test
    void generateBracket_EightParticipants_Success() {
        addKnights(8);
        mockCommonRepositories();
        mockDeleteAndSaveAll();
        mockSaveForBronze();

        bracketGenerationService.generateBracket(1L);

        verifyBracketGenerated(8, FightRound.QUARTERFINAL, 8); // 4 quarters + 2 semis + 1 final + 1 bronze
        verifyNotificationsSent(8);
    }

    @Test
    void generateBracket_SixteenParticipants_Success() {
        addKnights(16);
        mockCommonRepositories();
        mockDeleteAndSaveAll();
        mockSaveForBronze();

        bracketGenerationService.generateBracket(1L);

        verifyBracketGenerated(16, FightRound.ROUND_OF_8, 16); // 8 + 4 + 2 + 1 + 1 bronze = 16
        verifyStatusUpdated(TournamentStatus.TICKET_SALES);
        verifyNotificationsSent(16);
    }

    @Test
    void generateBracket_InvalidStatus_ThrowsException() {
        tournament.setTournamentStatus(TournamentStatus.TICKET_SALES);
        when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));

        assertThrows(IllegalArgumentException.class, () -> bracketGenerationService.generateBracket(1L));
    }

    @Test
    void generateBracket_NoParticipants_ThrowsException() {
        mockCommonRepositories();

        assertThrows(IllegalArgumentException.class, () -> bracketGenerationService.generateBracket(1L));
    }

    @Test
    void generateBracket_InvalidCount_ThrowsException() {
        addKnights(3);
        mockCommonRepositories();

        assertThrows(IllegalArgumentException.class, () -> bracketGenerationService.generateBracket(1L));
    }

    @Test
    void getTournamentBracket_Success() {
        List<FightHistory> fights = createSampleFights();
        when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
        when(fightHistoryRepository.findByTournamentId(1L)).thenReturn(fights);

        TournamentBracketDTO bracket = bracketGenerationService.getTournamentBracket(1L);

        assertNotNull(bracket);
        assertEquals(1L, bracket.getTournamentId());
        assertEquals("Test Tournament", bracket.getTournamentName());
        assertEquals(2, bracket.getMatches().size()); // Based on sample
        assertTrue(bracket.getMatches().get(0).getRound().name().contains("SEMI")); // Example check
    }

    @Test
    void getTournamentBracket_TournamentNotFound_ThrowsException() {
        when(tournamentRepository.findById(1L)).thenReturn(Optional.empty());

        assertThrows(IllegalArgumentException.class, () -> bracketGenerationService.getTournamentBracket(1L));
    }

    // Helper methods
    private void addKnights(int count) {
        for (int i = 1; i <= count; i++) {
            UserAccount knight = new UserAccount((long) i + 1, "knight" + i + "@example.com", "Knight" + i, "Last" + i, false);
            knights.add(knight);
            applications.add(Application.builder().knight(knight).status(ApplicationStatus.APPROVED).build());
        }
    }

    private void mockCommonRepositories() {
        when(tournamentRepository.findById(1L)).thenReturn(Optional.of(tournament));
        when(applicationRepository.findByTournamentIdAndStatus(1L, ApplicationStatus.APPROVED)).thenReturn(applications);
    }

    private void mockDeleteAndSaveAll() {
        doNothing().when(fightHistoryRepository).deleteByTournamentId(1L);
        when(fightHistoryRepository.saveAll(any())).thenAnswer(invocation -> {
            List<FightHistory> args = invocation.getArgument(0);
            for (int i = 0; i < args.size(); i++) {
                if (args.get(i).getId() == null) {
                    args.get(i).setId((long) (i + 1)); // Simulate ID assignment
                }
            }
            return args;
        });
    }

    private void mockSaveForBronze() {
        when(fightHistoryRepository.save(any())).thenAnswer(invocation -> {
            FightHistory arg = invocation.getArgument(0);
            if (arg.getId() == null) {
                arg.setId(999L); // For bronze
            }
            return arg;
        });
    }

    private void verifyBracketGenerated(int participantCount, FightRound firstRound, int expectedMatchCount) {
        ArgumentCaptor<List<FightHistory>> saveAllCaptor = ArgumentCaptor.forClass(List.class);
        verify(fightHistoryRepository, atLeastOnce()).saveAll(saveAllCaptor.capture());

        List<List<FightHistory>> allSaveCalls = saveAllCaptor.getAllValues();
        assertFalse(allSaveCalls.isEmpty(), "No saveAll calls captured");

        // The last saveAll is the final one with all unique matches
        List<FightHistory> finalMatches = allSaveCalls.get(allSaveCalls.size() - 1);
        assertEquals(expectedMatchCount, finalMatches.size(), "Unexpected number of unique matches");

        // Optional: Assert first round (if applicable)
        if (participantCount > 2 && !finalMatches.isEmpty()) {
            assertEquals(firstRound, finalMatches.get(0).getRound(), "Incorrect first round");
        }
    }

    private void verifyStatusUpdated(TournamentStatus expected) {
        ArgumentCaptor<Tournament> captor = ArgumentCaptor.forClass(Tournament.class);
        verify(tournamentRepository).save(captor.capture());
        assertEquals(expected, captor.getValue().getTournamentStatus());
    }

    private void verifyNotificationsSent(int knightCount) {
        verify(emailSendService, times(1 + knightCount)).sendHtmlEmail(anyString(), anyString(), anyString());
    }

    private List<FightHistory> createSampleFights() {
        List<FightHistory> fights = new ArrayList<>();
        UserAccount u1 = new UserAccount(2L, "u1@example.com", "U1", "Last", false);
        UserAccount u2 = new UserAccount(3L, "u2@example.com", "U2", "Last", false);
        fights.add(FightHistory.builder().id(1L).round(FightRound.SEMIFINAL).fighter1(u1).fighter2(u2).build());
        fights.add(FightHistory.builder().id(2L).round(FightRound.FINAL).build());
        return fights;
    }
}
