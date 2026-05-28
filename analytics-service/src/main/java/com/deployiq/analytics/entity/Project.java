package com.deployiq.analytics.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "\"Project\"")
public class Project {

    @Id
    @Column(name = "id")
    private String id;

    @Column(name = "name")
    private String name;

    @Column(name = "description")
    private String description;

    @Column(name = "\"githubRepo\"")
    private String githubRepo;

    @Column(name = "\"ownerId\"")
    private String ownerId;

    @Column(name = "\"deploymentStatus\"")
    private String deploymentStatus;

    @Column(name = "\"createdAt\"")
    private LocalDateTime createdAt;

    // Default constructor
    public Project() {}

    // All-args constructor
    public Project(String id, String name, String description, String githubRepo, String ownerId, String deploymentStatus, LocalDateTime createdAt) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.githubRepo = githubRepo;
        this.ownerId = ownerId;
        this.deploymentStatus = deploymentStatus;
        this.createdAt = createdAt;
    }

    // Getters and Setters
    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getGithubRepo() {
        return githubRepo;
    }

    public void setGithubRepo(String githubRepo) {
        this.githubRepo = githubRepo;
    }

    public String getOwnerId() {
        return ownerId;
    }

    public void setOwnerId(String ownerId) {
        this.ownerId = ownerId;
    }

    public String getDeploymentStatus() {
        return deploymentStatus;
    }

    public void setDeploymentStatus(String deploymentStatus) {
        this.deploymentStatus = deploymentStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
