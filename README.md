# Hunyuan Model Viewer

Vue 3 + Three.js 前端，用于查看腾讯云混元 3D 生成模型。

## 功能
- 输入 prompt 请求生成 3D 模型
- WebSocket 实时接收生成完成通知
- Three.js 渲染 glTF 模型（网格地面 / 坐标轴 / 轨道控制）
- 列表点击加载模型
- 下载 glTF 按钮

## 部署

```bash
# 克隆并安装依赖
git clone [https://github.com/jiaranjintianchism/ModelViewer.git](https://github.com/jiaranjintianchism/ModelViewer.git)
cd ModelViewer
npm install

# 设置后端地址
cp .env.example .env
# 编辑 VITE_SERVER_URL=http://<server-ip>:3000

# 本地运行
npm run dev
