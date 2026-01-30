package com.mpi.aivango_backend.models.sponsorship;

public enum SponsorshipPackage {
    BRONZE(5000.0),
    SILVER(15000.0),
    GOLD(30000.0),
    PLATINUM(50000.0);

    private final double amount;

    SponsorshipPackage(double amount) {
        this.amount = amount;
    }

    public double getAmount() {
        return amount;
    }
}
