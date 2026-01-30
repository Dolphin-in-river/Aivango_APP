package com.mpi.aivango_backend.dto.fight;

import com.mpi.aivango_backend.models.fight.FightRound;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FightMatchDTO {
    private Long matchId;
    private FightRound round;                    // ROUND_OF_8, QUARTERFINAL и т.д.
    private String roundDisplayName;             // "1/8 финала", "Финал" и т.д.

    // Участник 1
    private Long fighter1Id;
    private String fighter1Name;

    // Участник 2
    private Long fighter2Id;
    private String fighter2Name;

    // Победитель (если бой завершён)
    private Long winnerId;
    private String winnerName;

    // Время боя
    private LocalDateTime fightDate;

    // Комментарий (например, "нокаут")
    private String comment;

    // Связь: ID следующего матча (для построения дерева)
    private Long nextMatchId;
}
