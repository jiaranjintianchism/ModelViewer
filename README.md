# Hunyuan Model Viewer

基于 Vue 3 + Three.js 的混元 3D 模型查看器。

## 主要特性
- 输入 Prompt，调用后端 `/generate` 接口生成 3D 模型
- WebSocket 实时接收 `MODEL_READY`，自动更新模型列表
- Three.js 加载并展示 glTF（含网格地面、坐标轴、轨道控制）
- 一键下载模型 glTF 文件
- 连接状态提示，断线自动重连

## 使用方法
```bash
# 克隆并安装
git clone https://github.com/jiaranjintianchism/ModelViewer.git
cd ModelViewer
npm install

# 配置后端地址
cp .env.example .env
# 编辑 .env，设置 VITE_SERVER_URL=http://<SERVER_IP>:3000

# 本地运行
npm run dev
```

## 构建生产包
```bash
npm run build
```

## 目录结构
```
├─ src
│  ├─ components      # Vue 组件
│  ├─ composables     # 逻辑复用
│  ├─ style.css       # 全局样式
│  └─ main.js         # 入口
├─ vite.config.js      # Vite 配置
└─ .env.example        # 环境变量示例
```

## License
MIT
