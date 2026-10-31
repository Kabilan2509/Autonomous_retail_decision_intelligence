"""Agent 6 — Weather Intelligence Agent.

Detects rainfall anomalies, temperature spikes (heatwaves), and weather risks
affecting demand for perishable, cold beverages, and delivery fulfillment.
"""
from typing import Dict, Any, List
import pandas as pd
from app.agents.base_agent import BaseAgent
from app.data.repository import get_weather, get_stores


class WeatherIntelligenceAgent(BaseAgent):
    agent_name: str = "WeatherIntelligenceAgent"
    agent_version: str = "1.0.0"

    def run(self, context: Dict[str, Any]) -> Dict[str, Any]:
        location = context.get("location")
        target_date = context.get("date")

        weather_df = get_weather()
        if location and location != "All":
            weather_df = weather_df[weather_df["location"].str.lower() == location.lower()]

        # Latest observations / forecasts
        latest = weather_df.sort_values("date").groupby("location").last().reset_index()

        weather_signals = []
        for _, row in latest.iterrows():
            loc = row["location"]
            temp = float(row.get("temperature_c", 25.0))
            rain = float(row.get("rainfall_mm", 0.0))
            condition = str(row.get("weather_condition", "Clear"))
            fc_temp = float(row.get("forecast_temperature_c", temp))
            fc_rain = float(row.get("forecast_rainfall_mm", rain))

            # Risk classification
            risk_level = "NORMAL"
            impacted_cats = []
            delivery_delay_risk = 0.0
            demand_multiplier = 1.0

            if rain > 30.0 or fc_rain > 30.0:
                risk_level = "HIGH"
                impacted_cats = ["Grocery", "Seasonal", "Vegetables"]
                delivery_delay_risk = 0.40
                demand_multiplier = 0.85  # Footfall drop during heavy rain
            elif temp > 35.0 or fc_temp > 35.0:
                risk_level = "ELEVATED"
                impacted_cats = ["Beverages", "Dairy", "Frozen", "Fruits"]
                demand_multiplier = 1.25  # Surge in cold drinks & ice creams
            elif rain > 10.0:
                risk_level = "MODERATE"
                impacted_cats = ["Snacks", "Beverages"]
                demand_multiplier = 1.10

            weather_signals.append({
                "location": loc,
                "temperature_c": temp,
                "rainfall_mm": rain,
                "condition": condition,
                "forecast_temperature_c": fc_temp,
                "forecast_rainfall_mm": fc_rain,
                "risk_level": risk_level,
                "affected_categories": impacted_cats,
                "delivery_delay_risk": delivery_delay_risk,
                "demand_multiplier": round(demand_multiplier, 2),
                "confidence": 0.88
            })

        return {
            "agent": self.agent_name,
            "version": self.agent_version,
            "signals": weather_signals
        }

    def validate_output(self, output: Dict[str, Any]) -> bool:
        return "signals" in output and len(output["signals"]) > 0
