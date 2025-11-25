package com.infosys.stationary.forecast.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/predict")
public class ForecastController {

    @PostMapping
    public ResponseEntity<?> predict(@RequestBody Map<String, Object> body) {
        try {
            Object h = body.get("horizon");
            int horizon = 7;
            if (h != null) {
                horizon = Integer.parseInt(h.toString());
            }

            Object histObj = body.get("history");
            if (!(histObj instanceof List)) {
                return ResponseEntity.badRequest().body(Map.of("error", "history must be an array of numbers"));
            }

            List<?> raw = (List<?>) histObj;
            if (raw.size() < 2) {
                return ResponseEntity.badRequest().body(Map.of("error", "history must contain at least 2 values"));
            }

            List<Double> history = new ArrayList<>();
            for (Object o : raw) {
                try {
                    history.add(Double.parseDouble(o.toString()));
                } catch (NumberFormatException ex) {
                    history.add(0.0);
                }
            }

            List<Double> forecast = linearForecast(history, horizon);
            return ResponseEntity.ok(Map.of("forecast", forecast));
        } catch (Exception e) {
            return ResponseEntity.status(500).body(Map.of("error", e.getMessage()));
        }
    }

    private List<Double> linearForecast(List<Double> y, int horizon) {
        int n = y.size();
        // X values are 0..n-1
        double sumX = 0, sumY = 0;
        for (int i = 0; i < n; i++) {
            sumX += i;
            sumY += y.get(i);
        }
        double meanX = sumX / n;
        double meanY = sumY / n;

        double num = 0, den = 0;
        for (int i = 0; i < n; i++) {
            double xi = i - meanX;
            double yi = y.get(i) - meanY;
            num += xi * yi;
            den += xi * xi;
        }
        double slope = (den == 0) ? 0 : num / den;
        double intercept = meanY - slope * meanX;

        List<Double> preds = new ArrayList<>();
        for (int t = n; t < n + horizon; t++) {
            double p = intercept + slope * t;
            if (Double.isNaN(p) || Double.isInfinite(p)) {
                p = meanY;
            }
            p = Math.max(0.0, Math.round(p * 100.0) / 100.0);
            preds.add(p);
        }
        return preds;
    }
}
