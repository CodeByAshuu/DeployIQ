package com.deployiq.analytics.dto;

public class DashboardStatsDto {
    private long totalDeployments;
    private long successfulDeployments;
    private long failedDeployments;
    private long runningDeployments;
    private double averageDeploymentDuration;

    // Default constructor
    public DashboardStatsDto() {}

    // All-args constructor
    public DashboardStatsDto(long totalDeployments, long successfulDeployments, long failedDeployments, long runningDeployments, double averageDeploymentDuration) {
        this.totalDeployments = totalDeployments;
        this.successfulDeployments = successfulDeployments;
        this.failedDeployments = failedDeployments;
        this.runningDeployments = runningDeployments;
        this.averageDeploymentDuration = averageDeploymentDuration;
    }

    // Getters and Setters
    public long getTotalDeployments() {
        return totalDeployments;
    }

    public void setTotalDeployments(long totalDeployments) {
        this.totalDeployments = totalDeployments;
    }

    public long getSuccessfulDeployments() {
        return successfulDeployments;
    }

    public void setSuccessfulDeployments(long successfulDeployments) {
        this.successfulDeployments = successfulDeployments;
    }

    public long getFailedDeployments() {
        return failedDeployments;
    }

    public void setFailedDeployments(long failedDeployments) {
        this.failedDeployments = failedDeployments;
    }

    public long getRunningDeployments() {
        return runningDeployments;
    }

    public void setRunningDeployments(long runningDeployments) {
        this.runningDeployments = runningDeployments;
    }

    public double getAverageDeploymentDuration() {
        return averageDeploymentDuration;
    }

    public void setAverageDeploymentDuration(double averageDeploymentDuration) {
        this.averageDeploymentDuration = averageDeploymentDuration;
    }
}
