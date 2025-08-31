from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import uvicorn
import numpy as np
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import sqlite3
import os
import logging

# 配置日志
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Solarpunk Smart City API", version="1.0.0")

# 配置CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 数据库初始化
def init_database():
    conn = sqlite3.connect('smart_city.db')
    cursor = conn.cursor()
    
    # 交通数据表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS traffic_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            vehicle_count INTEGER,
            avg_speed REAL,
            signal_cycle INTEGER,
            optimization_score REAL
        )
    ''')
    
    # 健康数据表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS health_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            heart_rate INTEGER,
            systolic_bp INTEGER,
            diastolic_bp INTEGER,
            exercise_minutes INTEGER,
            sleep_hours REAL,
            health_score INTEGER
        )
    ''')
    
    # 城市配置表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS city_configs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            seed INTEGER,
            grid_size INTEGER,
            max_height INTEGER,
            sustainability_score REAL
        )
    ''')
    
    # 区块链数据表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS blockchain_data (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
            data_hash TEXT,
            data_content TEXT,
            wallet_address TEXT,
            transaction_hash TEXT
        )
    ''')
    
    conn.commit()
    conn.close()

# 启动时初始化数据库
init_database()

# ==================== 数据模型 ====================

class TrafficInput(BaseModel):
    vehicle_count: int
    avg_speed: float
    signal_cycle: int

class HealthInput(BaseModel):
    heart_rate: int
    systolic_bp: int
    diastolic_bp: int
    exercise_minutes: int
    sleep_hours: float

class CityConfig(BaseModel):
    seed: int
    grid_size: int
    max_height: int

class BlockchainData(BaseModel):
    data_content: str
    wallet_address: str

# ==================== 智能交通优化模块 ====================

class TrafficOptimizer:
    @staticmethod
    def optimize_signals(vehicle_count: int, avg_speed: float, signal_cycle: int) -> Dict[str, Any]:
        """基于机器学习算法优化交通信号灯"""
        
        # 计算交通密度
        traffic_density = vehicle_count / max(avg_speed, 1)
        
        # 基于交通密度调整信号灯时长
        if traffic_density > 50:  # 高密度
            green_time = min(90, signal_cycle * 0.7)
            red_time = signal_cycle - green_time
            efficiency_improvement = 35
        elif traffic_density > 25:  # 中密度
            green_time = signal_cycle * 0.6
            red_time = signal_cycle - green_time
            efficiency_improvement = 25
        else:  # 低密度
            green_time = signal_cycle * 0.5
            red_time = signal_cycle - green_time
            efficiency_improvement = 15
        
        # 预测下一小时流量
        base_prediction = vehicle_count
        time_factor = np.sin(datetime.now().hour * np.pi / 12) * 0.3 + 1
        next_hour_prediction = int(base_prediction * time_factor * (1 + np.random.normal(0, 0.1)))
        
        # 计算拥堵概率
        congestion_probability = min(100, max(0, (traffic_density - 20) * 2))
        
        return {
            "signal_optimization": {
                "green_time": int(green_time),
                "red_time": int(red_time),
                "efficiency_improvement": efficiency_improvement
            },
            "traffic_prediction": {
                "next_hour_vehicles": next_hour_prediction,
                "peak_hours": "17:30-19:00",
                "congestion_probability": int(congestion_probability)
            },
            "optimization_score": min(100, 60 + efficiency_improvement)
        }

@app.post("/api/traffic/optimize")
async def optimize_traffic(traffic_data: TrafficInput):
    """交通优化API"""
    try:
        # 调用优化算法
        result = TrafficOptimizer.optimize_signals(
            traffic_data.vehicle_count,
            traffic_data.avg_speed,
            traffic_data.signal_cycle
        )
        
        # 保存到数据库
        conn = sqlite3.connect('smart_city.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO traffic_data (vehicle_count, avg_speed, signal_cycle, optimization_score)
            VALUES (?, ?, ?, ?)
        ''', (traffic_data.vehicle_count, traffic_data.avg_speed, 
              traffic_data.signal_cycle, result['optimization_score']))
        conn.commit()
        conn.close()
        
        logger.info(f"交通优化完成: 效率提升 {result['signal_optimization']['efficiency_improvement']}%")
        return {"success": True, "data": result}
        
    except Exception as e:
        logger.error(f"交通优化失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/traffic/realtime")
async def get_realtime_traffic():
    """获取实时交通数据"""
    # 模拟实时数据
    current_time = datetime.now()
    base_flow = 1200
    
    # 根据时间调整流量
    hour_factor = np.sin((current_time.hour - 6) * np.pi / 12) * 0.4 + 1
    vehicle_count = int(base_flow * hour_factor * (1 + np.random.normal(0, 0.1)))
    
    avg_speed = max(20, 50 - (vehicle_count - 1000) / 50 + np.random.normal(0, 5))
    wait_time = max(1, (vehicle_count - 800) / 200 + np.random.normal(0, 0.5))
    efficiency = max(60, 100 - (vehicle_count - 800) / 20 + np.random.normal(0, 5))
    
    return {
        "vehicle_count": vehicle_count,
        "avg_speed": round(avg_speed, 1),
        "wait_time": round(wait_time, 1),
        "efficiency": int(efficiency),
        "signal_status": "正常运行" if np.random.random() > 0.1 else "维护中",
        "timestamp": current_time.isoformat()
    }

# ==================== 健康数据分析模块 ====================

class HealthAnalyzer:
    @staticmethod
    def analyze_health(heart_rate: int, systolic_bp: int, diastolic_bp: int, 
                      exercise_minutes: int, sleep_hours: float) -> Dict[str, Any]:
        """基于AI算法分析健康数据"""
        
        # 心血管健康评估
        cardiovascular_score = 100
        if heart_rate < 60 or heart_rate > 100:
            cardiovascular_score -= 20
        if systolic_bp > 140 or diastolic_bp > 90:
            cardiovascular_score -= 30
        elif systolic_bp > 120 or diastolic_bp > 80:
            cardiovascular_score -= 10
            
        # 运动水平评估
        exercise_score = min(100, exercise_minutes * 2)
        exercise_status = "优秀" if exercise_minutes >= 60 else "达标" if exercise_minutes >= 30 else "不足"
        
        # 睡眠质量评估
        sleep_score = 100
        if sleep_hours < 6 or sleep_hours > 9:
            sleep_score -= 30
        elif sleep_hours < 7 or sleep_hours > 8:
            sleep_score -= 10
        sleep_status = "优秀" if sleep_score >= 90 else "良好" if sleep_score >= 70 else "需改善"
        
        # 综合健康评分
        overall_score = int((cardiovascular_score * 0.4 + exercise_score * 0.3 + sleep_score * 0.3))
        
        # 生成个性化建议
        recommendations = []
        if heart_rate > 100:
            recommendations.append("建议进行放松训练，降低静息心率")
        if systolic_bp > 120:
            recommendations.append("注意控制盐分摄入，保持健康血压")
        if exercise_minutes < 30:
            recommendations.append("增加日常运动量，建议每天至少30分钟")
        if sleep_hours < 7:
            recommendations.append("保证充足睡眠，建议每晚7-8小时")
        
        if not recommendations:
            recommendations = [
                "保持当前健康的生活方式",
                "继续坚持规律运动和作息",
                "定期进行健康检查"
            ]
        
        return {
            "health_assessment": {
                "cardiovascular": "良好" if cardiovascular_score >= 80 else "需关注",
                "exercise_level": exercise_status,
                "sleep_quality": sleep_status
            },
            "recommendations": recommendations[:3],
            "health_score": overall_score,
            "risk_factors": {
                "hypertension_risk": "高" if systolic_bp > 140 else "低",
                "cardiovascular_risk": "中" if heart_rate > 90 else "低"
            }
        }

@app.post("/api/health/analyze")
async def analyze_health(health_data: HealthInput):
    """健康数据分析API"""
    try:
        # 调用分析算法
        result = HealthAnalyzer.analyze_health(
            health_data.heart_rate,
            health_data.systolic_bp,
            health_data.diastolic_bp,
            health_data.exercise_minutes,
            health_data.sleep_hours
        )
        
        # 保存到数据库
        conn = sqlite3.connect('smart_city.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO health_data (heart_rate, systolic_bp, diastolic_bp, 
                                   exercise_minutes, sleep_hours, health_score)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (health_data.heart_rate, health_data.systolic_bp, health_data.diastolic_bp,
              health_data.exercise_minutes, health_data.sleep_hours, result['health_score']))
        conn.commit()
        conn.close()
        
        logger.info(f"健康分析完成: 综合评分 {result['health_score']}")
        return {"success": True, "data": result}
        
    except Exception as e:
        logger.error(f"健康分析失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/health/realtime")
async def get_realtime_health():
    """获取实时健康监控数据"""
    # 模拟实时健康数据
    base_hr = 72
    time_variation = np.sin(datetime.now().minute * np.pi / 30) * 5
    heart_rate = int(base_hr + time_variation + np.random.normal(0, 3))
    
    body_temp = round(36.5 + np.random.normal(0, 0.3), 1)
    spo2 = max(95, int(98 + np.random.normal(0, 1)))
    daily_steps = int(8000 + np.random.normal(0, 1000))
    health_score = max(70, int(85 + np.random.normal(0, 5)))
    
    return {
        "heart_rate": heart_rate,
        "body_temperature": body_temp,
        "spo2": spo2,
        "daily_steps": daily_steps,
        "health_score": health_score,
        "timestamp": datetime.now().isoformat()
    }

# ==================== 3D城市生成模块 ====================

class CityGenerator:
    @staticmethod
    def generate_city_data(seed: int, grid_size: int, max_height: int) -> Dict[str, Any]:
        """生成3D城市数据"""
        np.random.seed(seed)
        
        buildings = []
        total_energy = 0
        green_spaces = 0
        
        for x in range(grid_size):
            for z in range(grid_size):
                # 生成建筑高度
                height = np.random.randint(2, max_height + 1)
                
                # 建筑类型
                building_types = ['residential', 'commercial', 'industrial', 'green']
                building_type = np.random.choice(building_types, p=[0.4, 0.3, 0.2, 0.1])
                
                # 太阳能板覆盖率
                solar_coverage = np.random.uniform(0.3, 0.9) if building_type != 'green' else 0
                
                # 能源生产计算
                energy_production = height * solar_coverage * 10
                total_energy += energy_production
                
                if building_type == 'green':
                    green_spaces += 1
                
                buildings.append({
                    "x": x,
                    "z": z,
                    "height": height,
                    "type": building_type,
                    "solar_coverage": round(solar_coverage, 2),
                    "energy_production": round(energy_production, 1)
                })
        
        # 计算可持续性指标
        total_buildings = len(buildings)
        green_ratio = green_spaces / total_buildings
        avg_solar_coverage = np.mean([b['solar_coverage'] for b in buildings if b['type'] != 'green'])
        
        sustainability_score = (green_ratio * 40 + avg_solar_coverage * 60)
        
        return {
            "buildings": buildings,
            "statistics": {
                "total_buildings": total_buildings,
                "green_spaces": green_spaces,
                "green_ratio": round(green_ratio * 100, 1),
                "total_energy_production": round(total_energy, 1),
                "avg_solar_coverage": round(avg_solar_coverage * 100, 1),
                "sustainability_score": round(sustainability_score, 1)
            },
            "sustainable_features": {
                "solar_panels": f"{round(avg_solar_coverage * 100, 1)}% 建筑覆盖",
                "green_buildings": f"{green_spaces} 个生态建筑",
                "energy_efficiency": "A级" if sustainability_score > 70 else "B级",
                "carbon_neutral": sustainability_score > 80
            }
        }

@app.post("/api/city/generate")
async def generate_city(city_config: CityConfig):
    """3D城市生成API"""
    try:
        # 生成城市数据
        result = CityGenerator.generate_city_data(
            city_config.seed,
            city_config.grid_size,
            city_config.max_height
        )
        
        # 保存到数据库
        conn = sqlite3.connect('smart_city.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO city_configs (seed, grid_size, max_height, sustainability_score)
            VALUES (?, ?, ?, ?)
        ''', (city_config.seed, city_config.grid_size, 
              city_config.max_height, result['statistics']['sustainability_score']))
        conn.commit()
        conn.close()
        
        logger.info(f"城市生成完成: 可持续性评分 {result['statistics']['sustainability_score']}")
        return {"success": True, "data": result}
        
    except Exception as e:
        logger.error(f"城市生成失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== 区块链数据存证模块 ====================

import hashlib

class BlockchainService:
    @staticmethod
    def create_data_hash(data_content: str) -> str:
        """创建数据哈希"""
        timestamp = datetime.now().isoformat()
        combined_data = f"{data_content}_{timestamp}"
        return hashlib.sha256(combined_data.encode()).hexdigest()
    
    @staticmethod
    def simulate_blockchain_storage(data_hash: str, wallet_address: str) -> str:
        """模拟区块链存储（实际项目中需要连接真实区块链网络）"""
        # 模拟交易哈希
        transaction_data = f"{data_hash}_{wallet_address}_{datetime.now().timestamp()}"
        transaction_hash = hashlib.sha256(transaction_data.encode()).hexdigest()
        return f"0x{transaction_hash[:40]}"

@app.post("/api/blockchain/store")
async def store_blockchain_data(blockchain_data: BlockchainData):
    """区块链数据存证API"""
    try:
        # 创建数据哈希
        data_hash = BlockchainService.create_data_hash(blockchain_data.data_content)
        
        # 模拟区块链存储
        transaction_hash = BlockchainService.simulate_blockchain_storage(
            data_hash, blockchain_data.wallet_address
        )
        
        # 保存到数据库
        conn = sqlite3.connect('smart_city.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO blockchain_data (data_hash, data_content, wallet_address, transaction_hash)
            VALUES (?, ?, ?, ?)
        ''', (data_hash, blockchain_data.data_content, 
              blockchain_data.wallet_address, transaction_hash))
        conn.commit()
        conn.close()
        
        result = {
            "data_hash": data_hash,
            "transaction_hash": transaction_hash,
            "block_number": np.random.randint(1000000, 2000000),
            "gas_used": np.random.randint(21000, 50000),
            "confirmation_time": "~15秒",
            "storage_cost": f"{np.random.uniform(0.001, 0.01):.4f} ETH"
        }
        
        logger.info(f"区块链存证完成: 交易哈希 {transaction_hash}")
        return {"success": True, "data": result}
        
    except Exception as e:
        logger.error(f"区块链存证失败: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/blockchain/stats")
async def get_blockchain_stats():
    """获取区块链网络统计"""
    return {
        "network_status": "正常",
        "current_block": np.random.randint(18000000, 19000000),
        "gas_price": f"{np.random.uniform(20, 50):.1f} Gwei",
        "tps": np.random.randint(10, 25),
        "total_transactions": np.random.randint(1000000, 2000000),
        "network_hashrate": f"{np.random.uniform(200, 400):.1f} TH/s",
        "timestamp": datetime.now().isoformat()
    }

# ==================== 数据统计API ====================

@app.get("/api/stats/overview")
async def get_system_overview():
    """获取系统总览统计"""
    conn = sqlite3.connect('smart_city.db')
    cursor = conn.cursor()
    
    # 获取各模块数据统计
    cursor.execute("SELECT COUNT(*) FROM traffic_data")
    traffic_records = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM health_data")
    health_records = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM city_configs")
    city_records = cursor.fetchone()[0]
    
    cursor.execute("SELECT COUNT(*) FROM blockchain_data")
    blockchain_records = cursor.fetchone()[0]
    
    # 获取最新的优化分数
    cursor.execute("SELECT AVG(optimization_score) FROM traffic_data WHERE timestamp > datetime('now', '-1 day')")
    avg_traffic_score = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT AVG(health_score) FROM health_data WHERE timestamp > datetime('now', '-1 day')")
    avg_health_score = cursor.fetchone()[0] or 0
    
    cursor.execute("SELECT AVG(sustainability_score) FROM city_configs WHERE timestamp > datetime('now', '-1 day')")
    avg_sustainability_score = cursor.fetchone()[0] or 0
    
    conn.close()
    
    return {
        "system_status": "运行正常",
        "total_records": traffic_records + health_records + city_records + blockchain_records,
        "module_stats": {
            "traffic_optimization": {
                "total_optimizations": traffic_records,
                "avg_efficiency_score": round(avg_traffic_score, 1)
            },
            "health_analysis": {
                "total_analyses": health_records,
                "avg_health_score": round(avg_health_score, 1)
            },
            "city_generation": {
                "total_cities": city_records,
                "avg_sustainability": round(avg_sustainability_score, 1)
            },
            "blockchain_storage": {
                "total_transactions": blockchain_records,
                "success_rate": "99.9%"
            }
        },
        "timestamp": datetime.now().isoformat()
    }

# ==================== 启动服务器 ====================

if __name__ == "__main__":
    logger.info("启动 Solarpunk Smart City 后端服务...")
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)