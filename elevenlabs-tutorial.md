# ElevenLabs AI语音制作详细教程

## 步骤1：注册和登录 📝

1. **访问官网**：打开浏览器，访问 https://elevenlabs.io
2. **点击注册**：点击右上角 "Sign Up" 按钮
3. **填写信息**：
   - 输入邮箱地址
   - 设置密码
   - 验证邮箱（检查邮箱收到的验证邮件）
4. **登录账户**：验证后自动登录到控制台

## 步骤2：了解免费额度 💰

**免费版限制**：
- 每月 10,000 字符
- 3个自定义声音
- 基础音质
- 可商用

**付费版优势**：
- 更多字符额度
- 更高音质
- 更多声音选择
- 语音克隆功能

## 步骤3：选择声音模型 🎭

1. **进入语音生成页面**：登录后自动进入 "Speech Synthesis" 页面
2. **选择声音**：在左侧声音列表中选择合适的声音
   
   **推荐声音**：
   - **Adam** - 专业男声，适合技术演示
   - **Bella** - 清晰女声，亲和力强
   - **Charlie** - 年轻男声，活力十足
   - **Dorothy** - 成熟女声，权威感强

3. **试听声音**：点击声音名称旁的播放按钮试听
4. **调整参数**：
   - **Stability** (稳定性): 0.7-0.9 (推荐0.8)
   - **Clarity + Similarity Enhancement** (清晰度): 0.6-0.8 (推荐0.7)

## 步骤4：生成语音 🎵

### 方法1：分段生成（推荐）

1. **复制第一段脚本**：
```
Hello everyone! Welcome to SolarpunkSmartCity - an innovative smart city management platform that combines blockchain, AI, and big data technologies to create sustainable urban ecosystems. Today I'll demonstrate our five core modules that are revolutionizing urban management: Smart Traffic Optimization, Health Data Analytics, 3D City Visualization, Blockchain Transaction Monitoring, and City Data Services.
```

2. **粘贴到文本框**：将脚本粘贴到大文本框中
3. **点击生成**：点击 "Generate" 按钮
4. **等待生成**：通常需要10-30秒
5. **下载音频**：生成完成后点击下载按钮，保存为 "segment1-intro.mp3"

6. **重复操作**：对其他5个段落重复上述步骤
   - segment2-traffic.mp3
   - segment3-health.mp3
   - segment4-3d-city.mp3
   - segment5-blockchain.mp3
   - segment6-data-services.mp3
   - segment7-conclusion.mp3

### 方法2：整段生成

1. **复制完整脚本**：从 `complete-ai-voice-script-english.txt` 复制全部内容
2. **检查字符数**：确保不超过10,000字符限制
3. **一次性生成**：粘贴后点击生成
4. **下载完整音频**：保存为 "complete-demo-voice.mp3"

## 步骤5：高级设置 ⚙️

### 语音控制标记（可选）
在文本中添加特殊标记来控制语音：

```
Hello everyone! <break time="1s"/> Welcome to SolarpunkSmartCity...
```

**常用标记**：
- `<break time="1s"/>` - 添加1秒停顿
- `<emphasis level="strong">重要词汇</emphasis>` - 强调
- `<prosody rate="slow">慢速朗读</prosody>` - 调整语速

### 语音参数调整
- **Stability**: 控制语音一致性
  - 低值(0.1-0.4): 更有表现力，但可能不稳定
  - 高值(0.7-1.0): 更稳定，但可能单调
- **Clarity**: 控制清晰度
  - 低值: 更自然
  - 高值: 更清晰

## 步骤6：下载和管理 📥

1. **下载音频**：
   - 格式：MP3 (默认)
   - 质量：44.1kHz, 立体声
   - 大小：约1MB/分钟

2. **文件命名建议**：
   - segment1-intro.mp3
   - segment2-traffic.mp3
   - segment3-health.mp3
   - segment4-3d-city.mp3
   - segment5-blockchain.mp3
   - segment6-data-services.mp3
   - segment7-conclusion.mp3

3. **历史记录**：在 "History" 页面可以查看和重新下载之前生成的音频

## 步骤7：质量检查 ✅

下载后检查音频质量：
- **播放测试**：用音频播放器播放检查
- **音量一致**：确保各段音量相近
- **发音准确**：检查技术术语发音
- **语速适中**：确保语速适合演示

## 故障排除 🔧

**常见问题**：
1. **生成失败**：
   - 检查网络连接
   - 减少文本长度
   - 重新尝试

2. **音质不佳**：
   - 调整Stability和Clarity参数
   - 尝试不同的声音模型
   - 检查文本中的特殊字符

3. **字符超限**：
   - 分段生成
   - 删除不必要的文字
   - 考虑升级付费版

## 成本控制建议 💡

**免费版优化使用**：
- 先用短文本测试声音和参数
- 确定最佳设置后再生成完整内容
- 分段生成便于修改和重用
- 保存好的音频文件避免重复生成

**字符计算**：
- 英文：1个字母 = 1个字符
- 标点符号也计入字符
- 空格也计入字符
- 你的完整脚本约2000字符，在免费额度内