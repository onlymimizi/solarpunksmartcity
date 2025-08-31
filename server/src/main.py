from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, validator
from typing import List, Optional, Dict
import math

app = FastAPI(title="Solarpunk Smart City API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


class TrafficRequest(BaseModel):
    intersections: int = Field(1, gt=0, le=50)
    approaches: int = Field(4, gt=2, le=8)
    demand: List[int] = Field(..., description="Vehicles per minute per approach")

    @validator("demand")
    def validate_demand(cls, v, values):
        approaches = values.get("approaches", 4)
        if len(v) != approaches:
            raise ValueError(f"demand length must equal approaches ({approaches})")
        if any(x < 0 for x in v):
            raise ValueError("demand must be non-negative")
        return v


class TrafficPlan(BaseModel):
    cycle_seconds: int
    green_times: List[float]
    efficiency_score: float
    notes: str


class HealthInput(BaseModel):
    hr_rest: int = Field(..., gt=30, lt=220)
    sleep_hours: float = Field(..., gt=0, lt=24)
    steps: int = Field(..., ge=0, lt=200000)
    age: int = Field(..., gt=0, lt=120)
    conditions: Optional[List[str]] = None


class HealthAdvice(BaseModel):
    risk_score: int
    insights: List[str]
    recommendations: List[str]


@app.get("/healthz")
def healthz():
    return {"ok": True}


@app.post("/api/traffic/optimize", response_model=TrafficPlan)
def optimize_traffic(req: TrafficRequest):
    # Simple proportional split with minimum green, fixed cycle
    cycle = 90
    min_green = 5.0
    lost_time = req.approaches * 2.0
    available = max(10.0, cycle - lost_time - req.approaches * min_green)

    total_demand = sum(req.demand)
    if total_demand == 0:
        greens = [cycle / req.approaches] * req.approaches
        score = 0.5
        return TrafficPlan(
            cycle_seconds=cycle,
            green_times=greens,
            efficiency_score=score,
            notes="No demand; equal split."
        )

    proportional = [d / total_demand for d in req.demand]
    greens = [min_green + p * available for p in proportional]

    # Normalize to cycle (min rounding drift)
    factor = cycle / sum(greens)
    greens = [round(g * factor, 2) for g in greens]

    # Efficiency score heuristic: higher balance and higher cycle utilization => better
    balance_penalty = float(sum(abs(p - (1 / req.approaches)) for p in proportional)) / req.approaches
    utilization = available / cycle
    score = max(0.0, min(1.0, (0.6 * utilization + 0.4 * (1 - balance_penalty))))

    return TrafficPlan(
        cycle_seconds=cycle,
        green_times=greens,
        efficiency_score=round(score, 3),
        notes="Proportional green split with fixed cycle and minimum greens."
    )


@app.post("/api/health/analyze", response_model=HealthAdvice)
def analyze_health(data: HealthInput):
    insights: List[str] = []
    recs: List[str] = []

    # Basic rule-based analysis
    risk = 0
    if data.hr_rest > 90:
        risk += 20
        insights.append("静息心率偏高")
        recs.append("考虑进行低强度有氧训练并监测血压")
    elif data.hr_rest < 50 and data.age > 30:
        insights.append("静息心率较低")
        recs.append("如伴随头晕乏力，请咨询医生")

    if data.sleep_hours < 6:
        risk += 20
        insights.append("睡眠不足")
        recs.append("尝试保持7-8小时稳定睡眠")
    elif data.sleep_hours > 9:
        insights.append("睡眠时间较长")
        recs.append("保持规律作息并增加白天活动量")

    if data.steps < 5000:
        risk += 15
        insights.append("日常活动量偏低")
        recs.append("逐步提升到每日8000-10000步")
    elif data.steps > 15000:
        insights.append("活动量较高")
        recs.append("注意补水与拉伸，避免过度训练")

    if data.conditions:
        conds = [c.lower() for c in data.conditions]
        if "hypertension" in conds or "高血压" in conds:
            risk += 15
            insights.append("已有高血压风险因素")
            recs.append("控制盐摄入，监测血压，遵医嘱服药")
        if "diabetes" in conds or "糖尿病" in conds:
            risk += 15
            insights.append("已有糖代谢风险因素")
            recs.append("控制碳水摄入，保持规律运动")

    # Age factor
    if data.age >= 55:
        risk += 10

    risk = max(0, min(100, risk))
    if not insights:
        insights.append("总体指标处于可接受范围")
        recs.append("保持均衡饮食、规律作息与适度运动")

    return HealthAdvice(
        risk_score=int(risk),
        insights=insights,
        recommendations=recs
    )


@app.get("/")
def root():
    return {
        "name": "Solarpunk Smart City API",
        "endpoints": ["/api/traffic/optimize", "/api/health/analyze", "/healthz"],
        "docs": "/docs"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)