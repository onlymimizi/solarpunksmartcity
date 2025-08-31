#!/usr/bin/env python3
"""
Solarpunk Smart City 后端启动脚本
"""

import os
import sys
import subprocess
import time

def install_requirements():
    """安装依赖包"""
    print("🔧 安装Python依赖包...")
    try:
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "server/requirements.txt"])
        print("✅ 依赖包安装完成")
    except subprocess.CalledProcessError as e:
        print(f"❌ 依赖包安装失败: {e}")
        return False
    return True

def start_backend():
    """启动后端服务"""
    print("🚀 启动后端API服务...")
    try:
        os.chdir("server")
        subprocess.run([sys.executable, "main.py"])
    except KeyboardInterrupt:
        print("\n⏹️ 服务已停止")
    except Exception as e:
        print(f"❌ 服务启动失败: {e}")

def main():
    print("=" * 50)
    print("🌱 Solarpunk Smart City 后端服务")
    print("=" * 50)
    
    # 检查Python版本
    if sys.version_info < (3, 8):
        print("❌ 需要Python 3.8或更高版本")
        sys.exit(1)
    
    # 安装依赖
    if not install_requirements():
        sys.exit(1)
    
    print("\n🌐 后端服务将在以下地址启动:")
    print("   API文档: http://localhost:8000/docs")
    print("   API地址: http://localhost:8000/api")
    print("\n按 Ctrl+C 停止服务\n")
    
    time.sleep(2)
    
    # 启动服务
    start_backend()

if __name__ == "__main__":
    main()