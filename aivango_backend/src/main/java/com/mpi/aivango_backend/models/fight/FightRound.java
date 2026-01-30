package com.mpi.aivango_backend.models.fight;

public enum FightRound {
    ROUND_OF_8("1/8"),
    QUARTERFINAL("1/4"),
    SEMIFINAL("1/2"),
    BRONZE("bronze"),
    FINAL("final");

    private final String label;

    FightRound(String label) {
        this.label = label;
    }

    public String getLabel() {
        return label;
    }

    public String getDisplayName() {
        return switch (this) {
            case ROUND_OF_8 -> "1/8 финала";
            case QUARTERFINAL -> "Четвертьфинал";
            case SEMIFINAL -> "Полуфинал";
            case BRONZE -> "Бой за 3-е место";
            case FINAL -> "Финал";
        };
    }
}
