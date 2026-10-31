"""FastAPI route: External news & weather signals."""
from fastapi import APIRouter, Query
from typing import Dict, Any, Optional
from app.agents.news_agent import NewsIntelligenceAgent
from app.agents.weather_agent import WeatherIntelligenceAgent

router = APIRouter(prefix="/external", tags=["External Signals"])
news_agent = NewsIntelligenceAgent()
weather_agent = WeatherIntelligenceAgent()


@router.get("/news")
def get_news_signals(location: Optional[str] = None) -> Dict[str, Any]:
    return news_agent.run({"location": location})


@router.get("/weather")
def get_weather_signals(location: Optional[str] = None) -> Dict[str, Any]:
    return weather_agent.run({"location": location})
