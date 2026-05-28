package com.deployiq.analytics.dto;

public class StatusBreakdownDto {
    private double successPercentage;
    private double failedPercentage;
    private double runningPercentage;
    private double pendingPercentage;

    // Default constructor
    public StatusBreakdownDto() {}

    // All-args constructor
    public StatusBreakdownDto(double successPercentage, double failedPercentage, double runningPercentage, double pendingPercentage) {
        this.successPercentage = successPercentage;
        this.failedPercentage = failedPercentage;
        this.runningPercentage = runningPercentage;
        this.pendingPercentage = pendingPercentage;
    }

    // Getters and Setters
    public double getSuccessPercentage() {
        return successPercentage;
    }

    public void setSuccessPercentage(double successPercentage) {
        this.successPercentage = successPercentage;
    }

    public double getFailedPercentage() {
        return failedPercentage;
    }

    public void setFailedPercentage(double failedPercentage) {
        this.failedPercentage = failedPercentage;
    }

    public double getRunningPercentage() {
        return runningPercentage;
    }

    public void setRunningPercentage(double runningPercentage) {
        this.runningPercentage = runningPercentage;
    }

    public double getPendingPercentage() {
        return pendingPercentage;
    }

    public void setPendingPercentage(double pendingPercentage) {
        this.pendingPercentage = pendingPercentage;
    }
}
