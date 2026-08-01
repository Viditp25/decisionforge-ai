import numpy as np
from typing import Dict, Any, List


class SimulationEngine:
    @staticmethod
    def run_monte_carlo(
        base_value: float,
        uncertainty_config: Dict[str, Any],
        num_trials: int = 1000,
        fixed_cost: float = 0.0,
    ) -> Dict[str, Any]:
        """
        Runs Monte Carlo risk simulations around a base margin or demand value using NumPy.
        """
        dist_type = uncertainty_config.get("distribution", "normal")
        std_dev = uncertainty_config.get("std_dev", 10.0)
        
        # Seed generator for deterministic execution
        rng = np.random.default_rng(seed=42)

        if dist_type == "normal":
            samples = rng.normal(loc=base_value, scale=std_dev, size=num_trials)
        elif dist_type == "lognormal":
            # For lognormal, locate parameter fitting
            # std_dev is expected as fraction or absolute scale
            sigma = std_dev / base_value if base_value > 0 else 0.1
            mu = np.log(base_value) - (sigma**2) / 2 if base_value > 0 else 1.0
            samples = rng.lognormal(mean=mu, sigma=sigma, size=num_trials)
        elif dist_type == "triangular":
            left = uncertainty_config.get("min", base_value - std_dev)
            mode = base_value
            right = uncertainty_config.get("max", base_value + std_dev)
            samples = rng.triangular(left=left, mode=mode, right=right, size=num_trials)
        else:
            samples = rng.normal(loc=base_value, scale=std_dev, size=num_trials)

        # Net profit/revenue sample values (applying simple fixed cost logic)
        margins = samples - fixed_cost

        # Compute key statistical metrics
        mean_margin = float(np.mean(margins))
        std_margin = float(np.std(margins))
        min_margin = float(np.min(margins))
        max_margin = float(np.max(margins))

        percentiles = {
            "p5": float(np.percentile(margins, 5)),
            "p10": float(np.percentile(margins, 10)),
            "p50": float(np.percentile(margins, 50)),
            "p90": float(np.percentile(margins, 90)),
            "p95": float(np.percentile(margins, 95)),
        }

        # Value at Risk (VaR) is the amount of potential loss at a given confidence level.
        # e.g., VaR 95% indicates that there's a 5% chance the profit falls below a certain threshold.
        # The loss threshold relative to the mean:
        var_95 = mean_margin - percentiles["p5"]
        var_99 = mean_margin - float(np.percentile(margins, 1))

        # Generate histogram data for visual charting (say, 20 bins)
        hist, bin_edges = np.histogram(margins, bins=20)
        histogram_data = [
            {"bin_start": float(bin_edges[i]), "bin_end": float(bin_edges[i+1]), "count": int(hist[i])}
            for i in range(len(hist))
        ]

        return {
            "status": "SUCCESS",
            "results": {
                "mean": mean_margin,
                "std_dev": std_margin,
                "min": min_margin,
                "max": max_margin,
                "percentiles": percentiles,
                "value_at_risk_95": var_95,
                "value_at_risk_99": var_99,
                "histogram": histogram_data,
                "raw_samples_subset": [float(x) for x in margins[:50]]  # Provide subset for audit/plot
            },
            "metrics": {
                "trials_run": num_trials,
            }
        }
