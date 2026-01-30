package com.mpi.aivango_backend.services.reporting;

import com.mpi.aivango_backend.dto.report.VotingReport;
import com.mpi.aivango_backend.services.vote.VoteService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ReportingService {
    private final VoteService voteService;

//    public String generateReport(Long tournamentId) {
//        VotingReport report = voteService.generateVotingReport(tournamentId);
//        // Simple string report; can be extended to PDF/email etc.
//        return "Voting Report for Tournament " + tournamentId + ": Winner ID " + report.getWinnerId() + " with " + report.getWinnerVotes() + " votes.";
//    }
}
