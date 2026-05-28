package com.deployiq.analytics.service;

import com.deployiq.analytics.dto.DashboardStatsDto;
import com.deployiq.analytics.dto.StatusBreakdownDto;
import com.deployiq.analytics.dto.TrendDataDto;
import com.deployiq.analytics.entity.Deployment;
import com.deployiq.analytics.repository.DeploymentRepository;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final DeploymentRepository deploymentRepository;
    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    // Standard constructor injection instead of @RequiredArgsConstructor
    public AnalyticsService(DeploymentRepository deploymentRepository) {
        this.deploymentRepository = deploymentRepository;
    }

    public DashboardStatsDto getDashboardStats() {
        List<Deployment> deployments = deploymentRepository.findAll();
        
        long total = deployments.size();
        long success = deployments.stream().filter(d -> "SUCCESS".equalsIgnoreCase(d.getStatus())).count();
        long failed = deployments.stream().filter(d -> "FAILED".equalsIgnoreCase(d.getStatus())).count();
        long running = deployments.stream().filter(d -> "RUNNING".equalsIgnoreCase(d.getStatus())).count();
        
        double avgDuration = deployments.stream()
                .filter(d -> d.getDurationMs() != null && d.getDurationMs() > 0)
                .mapToLong(Deployment::getDurationMs)
                .average()
                .orElse(0.0);
        
        // Round to 2 decimal places
        avgDuration = Math.round(avgDuration * 100.0) / 100.0;

        return new DashboardStatsDto(total, success, failed, running, avgDuration);
    }

    public List<TrendDataDto> getTrends() {
        List<Deployment> deployments = deploymentRepository.findAllByOrderByDeployedAtAsc();
        
        // Filter out deployments without a timestamp
        List<Deployment> validDeployments = deployments.stream()
                .filter(d -> d.getDeployedAt() != null)
                .collect(Collectors.toList());

        // Group by day string (YYYY-MM-DD)
        Map<String, List<Deployment>> groupedByDay = validDeployments.stream()
                .collect(Collectors.groupingBy(
                        d -> d.getDeployedAt().format(DATE_FORMATTER),
                        LinkedHashMap::new, // Keep insertion order (which is sorted asc by query)
                        Collectors.toList()
                ));

        return groupedByDay.entrySet().stream()
                .map(entry -> {
                    String date = entry.getKey();
                    List<Deployment> dayList = entry.getValue();
                    long total = dayList.size();
                    long success = dayList.stream().filter(d -> "SUCCESS".equalsIgnoreCase(d.getStatus())).count();
                    long failed = dayList.stream().filter(d -> "FAILED".equalsIgnoreCase(d.getStatus())).count();

                    return new TrendDataDto(date, total, success, failed);
                })
                .collect(Collectors.toList());
    }

    public StatusBreakdownDto getStatusBreakdown() {
        List<Deployment> deployments = deploymentRepository.findAll();
        long total = deployments.size();

        if (total == 0) {
            return new StatusBreakdownDto(0.0, 0.0, 0.0, 0.0);
        }

        long success = deployments.stream().filter(d -> "SUCCESS".equalsIgnoreCase(d.getStatus())).count();
        long failed = deployments.stream().filter(d -> "FAILED".equalsIgnoreCase(d.getStatus())).count();
        long running = deployments.stream().filter(d -> "RUNNING".equalsIgnoreCase(d.getStatus())).count();
        
        // Group anything else (PENDING, BUILDING) as pending/other
        long pending = total - success - failed - running;

        double successPercentage = (success * 100.0) / total;
        double failedPercentage = (failed * 100.0) / total;
        double runningPercentage = (running * 100.0) / total;
        double pendingPercentage = (pending * 100.0) / total;

        // Round to 1 decimal place
        successPercentage = Math.round(successPercentage * 10.0) / 10.0;
        failedPercentage = Math.round(failedPercentage * 10.0) / 10.0;
        runningPercentage = Math.round(runningPercentage * 10.0) / 10.0;
        pendingPercentage = Math.round(pendingPercentage * 10.0) / 10.0;

        return new StatusBreakdownDto(successPercentage, failedPercentage, runningPercentage, pendingPercentage);
    }
}
