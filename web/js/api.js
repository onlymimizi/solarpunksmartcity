// API配置
const API_BASE_URL = 'http://localhost:8000/api';

// API调用工具函数
async function apiCall(endpoint, method = 'GET', data = null) {
    const config = {
        method: method,
        headers: {
            'Content-Type': 'application/json',
        }
    };
    
    if (data) {
        config.body = JSON.stringify(data);
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
        const result = await response.json();
        
        if (!response.ok) {
            throw new Error(result.detail || 'API调用失败');
        }
        
        return result;
    } catch (error) {
        console.error('API调用错误:', error);
        throw error;
    }
}

// ==================== 交通优化API ====================

// 交通优化分析
async function optimizeTraffic(vehicleCount, avgSpeed, signalCycle) {
    const data = {
        vehicle_count: parseInt(vehicleCount),
        avg_speed: parseFloat(avgSpeed),
        signal_cycle: parseInt(signalCycle)
    };
    
    return await apiCall('/traffic/optimize', 'POST', data);
}

// 获取实时交通数据
async function getRealtimeTraffic() {
    return await apiCall('/traffic/realtime');
}

// ==================== 健康分析API ====================

// 健康数据分析
async function analyzeHealth(heartRate, systolicBp, diastolicBp, exerciseMinutes, sleepHours) {
    const data = {
        heart_rate: parseInt(heartRate),
        systolic_bp: parseInt(systolicBp),
        diastolic_bp: parseInt(diastolicBp),
        exercise_minutes: parseInt(exerciseMinutes),
        sleep_hours: parseFloat(sleepHours)
    };
    
    return await apiCall('/health/analyze', 'POST', data);
}

// 获取实时健康数据
async function getRealtimeHealth() {
    return await apiCall('/health/realtime');
}

// ==================== 城市生成API ====================

// 生成3D城市
async function generateCity(seed, gridSize, maxHeight) {
    const data = {
        seed: parseInt(seed),
        grid_size: parseInt(gridSize),
        max_height: parseInt(maxHeight)
    };
    
    return await apiCall('/city/generate', 'POST', data);
}

// ==================== 区块链API ====================

// 区块链数据存证
async function storeBlockchainData(dataContent, walletAddress) {
    const data = {
        data_content: dataContent,
        wallet_address: walletAddress
    };
    
    return await apiCall('/blockchain/store', 'POST', data);
}

// 获取区块链统计
async function getBlockchainStats() {
    return await apiCall('/blockchain/stats');
}

// ==================== 系统统计API ====================

// 获取系统总览
async function getSystemOverview() {
    return await apiCall('/stats/overview');
}

// ==================== 实时数据更新 ====================

// 启动实时数据更新
function startRealtimeUpdates() {
    // 交通数据更新
    if (document.getElementById('current-vehicles')) {
        setInterval(async () => {
            try {
                const data = await getRealtimeTraffic();
                updateTrafficDisplay(data);
            } catch (error) {
                console.error('交通数据更新失败:', error);
            }
        }, 3000);
    }
    
    // 健康数据更新
    if (document.getElementById('realtime-hr')) {
        setInterval(async () => {
            try {
                const data = await getRealtimeHealth();
                updateHealthDisplay(data);
            } catch (error) {
                console.error('健康数据更新失败:', error);
            }
        }, 3000);
    }
    
    // 区块链统计更新
    if (document.getElementById('current-block')) {
        setInterval(async () => {
            try {
                const data = await getBlockchainStats();
                updateBlockchainDisplay(data);
            } catch (error) {
                console.error('区块链数据更新失败:', error);
            }
        }, 5000);
    }
}

// 更新交通数据显示
function updateTrafficDisplay(data) {
    const elements = {
        'current-vehicles': data.vehicle_count,
        'avg-speed-display': data.avg_speed,
        'wait-time': data.wait_time,
        'efficiency': data.efficiency + '%',
        'traffic-flow': data.vehicle_count,
        'signal-status': data.signal_status
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// 更新健康数据显示
function updateHealthDisplay(data) {
    const elements = {
        'realtime-hr': data.heart_rate,
        'body-temp': data.body_temperature,
        'spo2': data.spo2,
        'avg-hr': data.heart_rate,
        'daily-steps': data.daily_steps.toLocaleString(),
        'health-score': data.health_score
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// 更新区块链数据显示
function updateBlockchainDisplay(data) {
    const elements = {
        'current-block': data.current_block.toLocaleString(),
        'gas-price': data.gas_price,
        'network-tps': data.tps,
        'total-transactions': data.total_transactions.toLocaleString(),
        'network-hashrate': data.network_hashrate
    };
    
    Object.entries(elements).forEach(([id, value]) => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = value;
        }
    });
}

// 页面加载完成后启动实时更新
document.addEventListener('DOMContentLoaded', function() {
    startRealtimeUpdates();
});

// ==================== 表单提交处理 ====================

// 交通优化表单提交
async function handleTrafficOptimization() {
    const vehicleCount = document.getElementById('traffic-volume')?.value;
    const avgSpeed = document.getElementById('avg-speed')?.value;
    const signalCycle = document.getElementById('signal-cycle')?.value;
    
    if (!vehicleCount || !avgSpeed || !signalCycle) {
        alert('请填写所有交通参数');
        return;
    }
    
    try {
        const button = document.getElementById('analyzeBtn');
        button.innerHTML = '<span class="button-text">🔄 分析中...</span><div class="button-glow"></div>';
        
        const result = await optimizeTraffic(vehicleCount, avgSpeed, signalCycle);
        
        // 更新结果显示
        if (result.success) {
            const data = result.data;
            document.getElementById('green-time').textContent = data.signal_optimization.green_time + '秒';
            document.getElementById('red-time').textContent = data.signal_optimization.red_time + '秒';
            document.getElementById('efficiency-improvement').textContent = data.signal_optimization.efficiency_improvement + '%';
            
            // 显示成功状态
            button.innerHTML = '<span class="button-text">✅ 分析完成</span><div class="button-glow"></div>';
            setTimeout(() => {
                button.innerHTML = '<span class="button-text">🤖 开始AI分析</span><div class="button-arrow">→</div><div class="button-glow"></div>';
            }, 2000);
        }
    } catch (error) {
        alert('交通优化分析失败: ' + error.message);
        const button = document.getElementById('analyzeBtn');
        button.innerHTML = '<span class="button-text">🤖 开始AI分析</span><div class="button-arrow">→</div><div class="button-glow"></div>';
    }
}

// 健康分析表单提交
async function handleHealthAnalysis() {
    const heartRate = document.getElementById('heart-rate')?.value;
    const systolic = document.getElementById('systolic')?.value;
    const diastolic = document.getElementById('diastolic')?.value;
    const exercise = document.getElementById('exercise')?.value;
    const sleep = document.getElementById('sleep')?.value;
    
    if (!heartRate || !systolic || !diastolic || !exercise || !sleep) {
        alert('请填写所有健康参数');
        return;
    }
    
    try {
        const button = document.getElementById('analyzeBtn');
        button.innerHTML = '<span class="button-text">🔄 分析中...</span><div class="button-glow"></div>';
        
        const result = await analyzeHealth(heartRate, systolic, diastolic, exercise, sleep);
        
        // 更新结果显示
        if (result.success) {
            const data = result.data;
            // 这里可以更新健康评估结果的显示
            console.log('健康分析结果:', data);
            
            // 显示成功状态
            button.innerHTML = '<span class="button-text">✅ 分析完成</span><div class="button-glow"></div>';
            setTimeout(() => {
                button.innerHTML = '<span class="button-text">🤖 开始健康分析</span><div class="button-arrow">→</div><div class="button-glow"></div>';
            }, 2000);
        }
    } catch (error) {
        alert('健康分析失败: ' + error.message);
        const button = document.getElementById('analyzeBtn');
        button.innerHTML = '<span class="button-text">🤖 开始健康分析</span><div class="button-arrow">→</div><div class="button-glow"></div>';
    }
}

// 城市生成表单提交
async function handleCityGeneration() {
    const seed = document.getElementById('seed')?.value;
    const grid = document.getElementById('grid')?.value;
    const maxH = document.getElementById('maxH')?.value;
    
    if (!seed || !grid || !maxH) {
        alert('请填写所有城市参数');
        return;
    }
    
    try {
        const button = document.getElementById('genBtn');
        button.innerHTML = '<span class="button-text">🔄 生成中...</span><div class="button-glow"></div>';
        
        const result = await generateCity(seed, grid, maxH);
        
        // 更新结果显示
        if (result.success) {
            const data = result.data;
            console.log('城市生成结果:', data);
            
            // 这里可以更新3D城市显示
            updateCityDisplay(data);
            
            // 显示成功状态
            button.innerHTML = '<span class="button-text">✅ 生成完成</span><div class="button-glow"></div>';
            setTimeout(() => {
                button.innerHTML = '<span class="button-text">🚀 重新生成城市</span><div class="button-arrow">→</div><div class="button-glow"></div>';
            }, 2000);
        }
    } catch (error) {
        alert('城市生成失败: ' + error.message);
        const button = document.getElementById('genBtn');
        button.innerHTML = '<span class="button-text">🚀 重新生成城市</span><div class="button-arrow">→</div><div class="button-glow"></div>';
    }
}

// 更新城市显示
function updateCityDisplay(data) {
    // 更新统计信息
    const stats = data.statistics;
    const features = data.sustainable_features;
    
    // 这里可以更新城市统计显示
    console.log('城市统计:', stats);
    console.log('可持续特性:', features);
}

// 区块链数据存证
async function handleBlockchainStorage() {
    const dataContent = document.getElementById('data-content')?.value;
    const walletAddress = document.getElementById('wallet-address')?.value;
    
    if (!dataContent || !walletAddress) {
        alert('请填写数据内容和钱包地址');
        return;
    }
    
    try {
        const button = document.getElementById('storeBtn');
        button.innerHTML = '<span class="button-text">🔄 存证中...</span><div class="button-glow"></div>';
        
        const result = await storeBlockchainData(dataContent, walletAddress);
        
        // 更新结果显示
        if (result.success) {
            const data = result.data;
            console.log('区块链存证结果:', data);
            
            // 显示成功状态
            button.innerHTML = '<span class="button-text">✅ 存证完成</span><div class="button-glow"></div>';
            setTimeout(() => {
                button.innerHTML = '<span class="button-text">🔗 数据上链存证</span><div class="button-arrow">→</div><div class="button-glow"></div>';
            }, 2000);
        }
    } catch (error) {
        alert('区块链存证失败: ' + error.message);
        const button = document.getElementById('storeBtn');
        button.innerHTML = '<span class="button-text">🔗 数据上链存证</span><div class="button-arrow">→</div><div class="button-glow"></div>';
    }
}