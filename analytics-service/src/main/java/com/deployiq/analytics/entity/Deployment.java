package com.deployiq.analytics.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Deployment\"")
public class Deployment {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "status")
    private String status;

    @Column(name = "\"imageTag\"")
    private String imageTag;

    @Column(name = "logs", columnDefinition = "TEXT")
    private String logs;

    @Column(name = "\"deployedBy\"")
    private String deployedBy;

    @Column(name = "\"projectId\"")
    private String projectId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "\"projectId\"", referencedColumnName = "id", insertable = false, updatable = false)
    private Project project;

    @Column(name = "\"deployedAt\"")
    private LocalDateTime deployedAt;

    @Column(name = "\"updatedAt\"")
    private LocalDateTime updatedAt;

    @Column(name = "\"durationMs\"")
    private Integer durationMs;

    // Default constructor
    public Deployment() {}

    // All-args constructor
    public Deployment(String id, String status, String imageTag, String logs, String deployedBy, String projectId, Project project, LocalDateTime deployedAt, LocalDateTime updatedAt, Integer durationMs) {
        this.id = id;
        this.status = status;
        this.imageTag = imageTag;
        this.logs = logs;
        this.deployedBy = deployedBy;
        this.projectId = projectId;
        this.project = project;
        this.deployedAt = deployedAt;
        this.updatedAt = updatedAt;
        this.durationMs = durationMs;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getImageTag() {
        return imageTag;
    }

    public void setImageTag(String imageTag) {
        this.imageTag = imageTag;
    }

    public String getLogs() {
        return logs;
    }

    public void setLogs(String logs) {
        this.logs = logs;
    }

    public String getDeployedBy() {
        return deployedBy;
    }

    public void setDeployedBy(String deployedBy) {
        this.deployedBy = deployedBy;
    }

    public String getProjectId() {
        return projectId;
    }

    public void setProjectId(String projectId) {
        this.projectId = projectId;
    }

    public Project getProject() {
        return project;
    }

    public void setProject(Project project) {
        this.project = project;
    }

    public LocalDateTime getDeployedAt() {
        return deployedAt;
    }

    public void setDeployedAt(LocalDateTime deployedAt) {
        this.deployedAt = deployedAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }

    public Integer getDurationMs() {
        return durationMs;
    }

    public void setDurationMs(Integer durationMs) {
        this.durationMs = durationMs;
    }
}
