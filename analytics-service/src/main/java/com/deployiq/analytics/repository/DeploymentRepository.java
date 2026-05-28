package com.deployiq.analytics.repository;

import com.deployiq.analytics.entity.Deployment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeploymentRepository extends JpaRepository<Deployment, String> {
    List<Deployment> findAllByOrderByDeployedAtAsc();
}
