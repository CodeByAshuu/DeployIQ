package com.deployiq.analytics.controller;

import com.deployiq.analytics.dto.DashboardStatsDto;
import com.deployiq.analytics.dto.StatusBreakdownDto;
import com.deployiq.analytics.dto.TrendDataDto;
import com.deployiq.analytics.service.AnalyticsService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/analytics")
@CrossOrigin(origins = "*") // Allows easy integration across microservices and ports
public class AnalyticsController {

    private final AnalyticsService analyticsService;

    // Standard constructor injection instead of @RequiredArgsConstructor
    public AnalyticsController(AnalyticsService analyticsService) {
        this.analyticsService = analyticsService;
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardStatsDto> getDashboardStats() {
        return ResponseEntity.ok(analyticsService.getDashboardStats());
    }

    @GetMapping("/trends")
    public ResponseEntity<List<TrendDataDto>> getTrends() {
        return ResponseEntity.ok(analyticsService.getTrends());
    }

    @GetMapping("/status-breakdown")
    public ResponseEntity<StatusBreakdownDto> getStatusBreakdown() {
        return ResponseEntity.ok(analyticsService.getStatusBreakdown());
    }

    @GetMapping("/health")
    public ResponseEntity<Map<String, String>> getHealth() {
        Map<String, String> status = new HashMap<>();
        status.put("status", "UP");
        return ResponseEntity.ok(status);
    }
}
