package com.deployiq.analytics.dto;

public class TrendDataDto {
    private String date; // YYYY-MM-DD
    private long total;
    private long success;
    private long failed;

    // Default constructor
    public TrendDataDto() {}

    // All-args constructor
    public TrendDataDto(String date, long total, long success, long failed) {
        this.date = date;
        this.total = total;
        this.success = success;
        this.failed = failed;
    }

    // Getters and Setters
    public String getDate() {
        return date;
    }

    public void setDate(String date) {
        this.date = date;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public long getSuccess() {
        return success;
    }

    public void setSuccess(long success) {
        this.success = success;
    }

    public long getFailed() {
        return failed;
    }

    public void setFailed(long failed) {
        this.failed = failed;
    }
}
