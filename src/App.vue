<template>
  <header>Hunyuan Model Viewer</header>
  <main :class="appClasses">
    <section class="sidebar" v-show="showSidebar">
      <div v-if="wsStatus !== 'connected'" class="alert">
        与服务器连接状态：{{ wsStatus }}
      </div>
      <div class="mode-selector">
        <button :class="{ active: generationMode === 'text' }" @click="generationMode = 'text'">文生3D</button>
        <button :class="{ active: generationMode === 'image' }" @click="generationMode = 'image'">图生3D</button>
      </div>

      <div v-if="generationMode === 'text'" class="text-input-area">
        <textarea v-model="prompt" placeholder="请输入想要生成的内容。建议以单主体为主。例如: 一只棕色的猫雕塑, 尾巴卷曲, 卡通风格"></textarea>
      </div>

      <div v-if="generationMode === 'image'" class="image-input-area">
        <!-- Temporarily hiding URL input and 'or' text to match reference image style -->
        <!-- <input type="text" v-model="imageUrl" placeholder="请输入图片URL" /> -->
        <!-- <p>或者</p> -->
        <label for="file-upload" class="file-upload-label styled-upload-area">
          <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="upload-icon"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          <span class="upload-area-text">上传图片</span>
          <span class="upload-area-subtext">支持png/jpg/webp格式, 图片大小最大不超过10M</span>
        </label>
        <input id="file-upload" type="file" @change="handleFileUpload" accept="image/png, image/jpeg, image/webp" />
        <div v-if="imageBase64Preview" class="image-preview">
          <p>图片预览:</p>
          <img :src="imageBase64Preview" alt="Image preview" style="max-width: 200px; max-height: 200px;" />
        </div>
      </div>

      <!-- 高级选项折叠面板 -->
      <details class="advanced" v-cloak>
        <summary>高级选项</summary>
        <div class="adv-grid">
          <label><input type="checkbox" v-model="removeBg" /> 抠图 Remove BG</label>
          <label class="full"><span>推理步数: {{ steps }}</span>
            <input type="range" v-model.number="steps" min="1" max="100" step="1" />
          </label>
          <label class="full"><span>指导尺度: {{ guidanceScale }}</span>
            <input type="range" v-model.number="guidanceScale" min="1" max="15" step="0.5" />
          </label>
          <label><input type="number" v-model.number="octreeResolution" min="16" max="512" step="16" /> Octree 分辨率</label>
          <label>
            纹理分辨率
            <select v-model.number="paintResolution">
              <option :value="512">512</option>
              <option :value="768">768</option>
            </select>
          </label>
          <label>
            视角数量
            <select v-model.number="maxView">
              <option v-for="n in [6,7,8,9]" :key="n" :value="n">{{ n }}</option>
            </select>
          </label>
        </div>
      </details>

      <button type="submit" @click="submitGenerationJob">生成模型</button>
      <p>{{ status }}</p>
      <ModelList :models="models" @select="handleSelect" />

<!-- 光照调节面板 -->


    </section>
    <section class="viewer">
      <div v-if="loading" class="loading-overlay"><div class="spinner"></div></div>
      <Viewer ref="viewerRef" :modelUrl="currentModelUrl" />
    </section>
  </main>

<!-- 左侧汉堡菜单按钮 -->
<button class="hamburger-menu" :class="{ 'active': !showSidebar }" @click="toggleSidebar">
  <span></span>
  <span></span>
  <span></span>
</button>

<!-- 右侧浮动光照面板 -->
<LightingPanel
  v-if="showLighting"
  class="floating-lighting open"
  v-model:color="lightColor"
  v-model:intensity="lightIntensity"
  v-model:pitch="lightPitch"
  v-model:yaw="lightYaw"
  v-model:ambient="ambientIntensity"
/>
<!-- 右侧展开/收起按钮 -->
<button class="settings-toggle" :class="{ 'active': showLighting }" @click="showLighting = !showLighting" aria-label="显示或隐藏光照设置">
  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="12" cy="12" r="3"></circle>
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
  </svg>
</button>

</template>

<script setup>
import { onMounted, ref, watch, computed } from 'vue';
import Viewer from './components/Viewer.vue';
import LightingPanel from './components/LightingPanel.vue';
import ModelList from './components/ModelList.vue';
import { useWebSocket } from './composables/useWebSocket';

const currentJobId = ref(null);
const { models, status: wsStatus, connect, lastMessage } = useWebSocket(currentJobId);
connect();

const generationMode = ref('text');
const prompt = ref('');
const imageUrl = ref('');
const imageFile = ref(null); // raw File object
const imageBase64Preview = ref(null);

// 高级选项 refs
const removeBg = ref(false);
const steps = ref(50);
const guidanceScale = ref(7.5);
const octreeResolution = ref(128);
const paintResolution = ref(512);
const maxView = ref(8);

// 状态
const status = ref('Ready');
const currentModelUrl = ref('');
const loading = ref(false);

// 光照参数
const lightColor = ref('#ffffff');
const lightIntensity = ref(1);
const lightPitch = ref(45);
const lightYaw = ref(45);
const ambientIntensity = ref(0.4); // 环境光强度

// 面板显隐
const showSidebar = ref(true);
const showLighting = ref(false);

const viewerRef = ref(null);

const appClasses = computed(() => {
  return {
    'lighting-visible': showLighting
  };
});

const updateLight = () => {
  if (viewerRef.value) {
    viewerRef.value.setLightColor(lightColor.value);
    viewerRef.value.setLightIntensity(lightIntensity.value);
    viewerRef.value.setLightDirection(lightPitch.value, lightYaw.value);
    viewerRef.value.setAmbientIntensity(ambientIntensity.value);
  }
};

watch(lightColor, updateLight);
watch(lightIntensity, updateLight);
watch(lightPitch, updateLight);
watch(lightYaw, updateLight);
watch(ambientIntensity, updateLight);

const toggleSidebar = () => {
  showSidebar.value = !showSidebar.value;
  console.log('Sidebar toggled:', showSidebar.value);
};

onMounted(() => {
  // 初始化光照
  updateLight();
});

function handleFileUpload(event) {
  const file = event.target.files[0];
  if (!file) {
    imageFile.value = null;
    imageBase64Preview.value = null;
    return;
  }
  imageFile.value = file;
  const allowedTypes = ['image/png', 'image/jpeg', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    status.value = '错误：不支持的文件格式。请上传 JPG, PNG, 或 WEBP 图片。';
    imageFile.value = null;
    imageBase64Preview.value = null;
    event.target.value = null; 
    return;
  }

  const reader = new FileReader();
  reader.onload = (e) => {
    imageBase64Preview.value = e.target.result; 
    status.value = '图片已选择。';
    imageUrl.value = ''; 
  };
  reader.onerror = (error) => {
    console.error('FileReader error: ', error);
    status.value = '读取文件失败。';
    imageFile.value = null;
    imageBase64Preview.value = null;
  };
  reader.readAsDataURL(file);
}

async function submitGenerationJob() {
  status.value = '提交中...';
  loading.value = true;
  currentModelUrl.value = null; // Clear previous model from viewer

  // Logic to remove previously loaded model from Three.js scene if Viewer component exposes a method or event
  // For now, we assume Viewer handles new modelUrl by replacing old one.

  const fd = new FormData();
  if (generationMode.value === 'text') {
    if (!prompt.value.trim()) {
      status.value = '错误：文本提示不能为空。';
      loading.value = false;
      return;
    }
    fd.append('prompt', prompt.value.trim());
  } else if (generationMode.value === 'image') {
    if (imageFile.value) {
      fd.append('file', imageFile.value);
    } else {
      // Basic URL validation (optional, can be more robust)
      status.value = '错误：请上传图片文件。';
      loading.value = false;
      return;
    }
  } else {
    status.value = '错误：无效的生成模式。';
    loading.value = false;
    return;
  }

  // 附加高级参数（始终携带，保持后端默认一致）
  fd.append('bg_remove', removeBg.value);
  fd.append('steps', steps.value);
  fd.append('guidance_scale', guidanceScale.value);
  fd.append('octree_resolution', octreeResolution.value);
  fd.append('paint_resolution', paintResolution.value);
  fd.append('max_view', maxView.value);

  try {
    // const backendUrl = import.meta.env.VITE_SERVER_URL 
    const backendUrl = import.meta.env.VITE_SERVER_URL || window.location.origin;
    const response = await fetch(`${backendUrl}/generate`, {
      method: 'POST',
      body: fd,
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({ error: `HTTP error! status: ${response.status}` }));
      throw new Error(errData.error || `HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    status.value = `任务已提交: ${result.id}。等待模型...`;
    currentJobId.value = result.id; // Track current job
    console.log('Job submission response:', result);
  } catch (error) {
    status.value = `提交任务失败: ${error.message}`;
    console.error('Error submitting job:', error);
  } finally {
    loading.value = false;
  }
}

function handleSelect(url) {
  currentModelUrl.value = url;
  status.value = `正在加载历史模型: ${url.split('/').pop()}`;
}

// Watch for MODEL_READY messages from WebSocket
watch(lastMessage, (newMessage) => {
  if (newMessage && newMessage.type === 'MODEL_READY') {
    const modelUrl = newMessage.modelUrl || newMessage.path; // backend currently sends 'path'
    console.log(`[App.vue WS_MSG] Received MODEL_READY for JobID: ${newMessage.jobId}, Model URL: ${modelUrl}`);
    if (newMessage.jobId === currentJobId.value) {
      currentModelUrl.value = modelUrl;
      status.value = `模型已就绪: ${modelUrl.split('/').pop()}`;
    } else {
      console.log(`[App.vue WS_MSG] Ignoring MODEL_READY for a different JobID. Current: ${currentJobId.value}, Received: ${newMessage.jobId}`);
    }
  }
});
</script>

<style scoped>
:root {
  --primary-text: #E6E6E6; /* Lighter gray for primary text */
  --secondary-text: #A0A0A0; /* Softer gray for secondary text */
  --background-primary: #1A1B1E; /* Very dark, almost black */
  --background-secondary: #252629; /* Sidebar, card background */
  --background-tertiary: #36373B; /* Input fields, inactive buttons */
  --accent-color: #007AFF; /* Tencent-like blue */
  --accent-color-darker: #0056b3;
  --border-color: #404144; /* Subtle borders */
  --button-hover-bg: #4A4B4F;
  --button-active-bg: var(--accent-color);
  --input-bg: var(--background-tertiary);
  --text-placeholder: #707070;
}

header {
  background-color: var(--background-primary); /* Match main background */
  color: var(--primary-text);
  padding: 1rem 1.5rem;
  text-align: left; /* Align title to left */
  font-size: 1.25rem; /* Slightly smaller header */
  font-weight: 600;
  border-bottom: 1px solid var(--border-color);
}

main {
  display: flex;
  width: 100%;
  height: calc(100vh - 60px); /* 减去header高度 */
  overflow: hidden;
  background-color: var(--background-secondary);
  position: relative; /* 为绝对定位提供参考 */
}

.viewer {
  position: relative;
  width: 100%;
  height: 100%;
  flex-grow: 1;
}

/* 不再需要这个规则 */

.mode-selector {
  display: flex;
  background-color: var(--background-tertiary);
  border-radius: 8px;
  padding: 4px;
}

.mode-selector button {
  flex-grow: 1;
  padding: 0.6rem 0.5rem; /* Adjusted padding */
  background-color: transparent;
  color: var(--secondary-text);
  border: none;
  border-radius: 6px; /* Inner button radius */
  cursor: pointer;
  transition: background-color 0.2s, color 0.2s;
  font-size: 0.9rem;
  font-weight: 500;
}

.mode-selector button:hover {
  color: var(--primary-text);
  transform: translateY(-1px);
}

.mode-selector button.active {
  background-color: var(--accent-color);
  color: white;
  font-weight: 600;
}

.text-input-area textarea,
.image-input-area input[type="text"] {
  width: 100%;
  padding: 0.85rem;
  background-color: var(--input-bg);
  color: var(--primary-text);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 0.9rem;
}

.text-input-area textarea::placeholder,
.image-input-area input[type="text"]::placeholder {
  color: var(--text-placeholder);
}

.text-input-area textarea {
  min-height: 100px;
  resize: vertical;
}

/* Remove specific styling for the 'p' tag that said '或者' as it's now hidden */
/* .image-input-area p { ... } */

/* Styling for the file input */
.image-input-area input[type="file"] {
  display: none; /* Hide the default ugly button */
}

.file-upload-label.styled-upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2.5rem 1rem; /* Increased padding */
  background-color: var(--background-tertiary);
  color: var(--secondary-text);
  border: 1px solid var(--secondary-text);
  border-radius: 12px; /* More rounded */
  text-align: center;
  cursor: pointer;
  margin-top: 1rem; /* Add some space if URL input was there */
  margin-bottom: 1rem;
  transition: background-color 0.2s, border-color 0.2s;
  min-height: 180px; /* Give it some height */
}

.file-upload-label.styled-upload-area:hover {
  background-color: var(--button-hover-bg);
  border-color: var(--accent-color);
}

.upload-icon {
  color: var(--accent-color);
  margin-bottom: 0.75rem;
}

.upload-area-text {
  font-size: 1rem;
  font-weight: 500;
  color: var(--primary-text);
  margin-bottom: 0.25rem;
}

.upload-area-subtext {
  font-size: 0.8rem;
  color: var(--secondary-text);
}

.image-preview {
  margin-top: 1rem;
  text-align: center;
}

.image-preview p {
  margin-bottom: 0.5rem;
  color: var(--secondary-text);
}

.image-preview img {
  border: 1px solid var(--border-color);
  border-radius: 4px;
}

.sidebar button[type="submit"] {
  padding: 0.9rem 1rem; /* Adjusted padding */
  background-color: var(--accent-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600; /* Slightly less bold */
  transition: background-color 0.2s;
  width: 100%;
}

.sidebar button[type="submit"]:hover {
  background-color: var(--accent-color-darker);
}

.sidebar p {
  color: var(--secondary-text);
  font-size: 0.9rem;
  text-align: center;
}

.alert {
  background: #b91c1c; /* Darker red for alerts */
  color: #f0f0f0;
  padding: 0.75rem;
  margin-bottom: 1rem;
  border-radius: 6px;
  text-align: center;
  font-size: 0.9rem;
}

details.advanced {
  margin-top: 1rem;
  background: var(--background-tertiary);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 0.6rem 0.8rem;
}

summary {
  cursor: pointer;
  outline: none;
  color: var(--primary-text);
}

.adv-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.6rem 1rem;
  margin-top: 0.8rem;
  font-size: 0.85rem;
}

label.full {
  grid-column: 1 / -1;
  display: flex;
  flex-direction: column;
}
[v-cloak] { display: none; }

.floating-lighting {
  position: fixed;
  top: 70px; /* header 高度 */
  right: 0;
  width: 280px;
  height: calc(100vh - 70px);
  z-index: 1000;
  transform: translateX(100%);
  transition: transform 0.3s ease;
}
.floating-lighting.open {
  transform: translateX(0);
}
.sidebar {
  position: fixed;
  left: 0;
  top: 60px; /* 与header高度一致 */
  width: 300px;
  height: calc(100vh - 60px);
  padding: 20px;
  overflow-y: auto;
  background-color: var(--background-primary);
  border-right: 1px solid var(--border-color);
  z-index: 100;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 汉堡菜单按钮 */
.hamburger-menu {
  position: fixed;
  top: 50%;
  left: 5px;
  transform: translateY(-50%);
  width: 40px;
  height: 40px;
  background: rgb(242, 242, 242);
  border: none;
  border-radius: 50%;
  z-index: 1100;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-evenly;
  align-items: center;
  padding: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.15);
  transition: all 0.3s;
}

.hamburger-menu:hover {
  background: #e0e0e0;
}

.hamburger-menu span {
  display: block;
  width: 18px;
  height: 2px;
  background-color: #333;
  transition: all 0.3s;
}

.hamburger-menu.active span:nth-child(1) {
  transform: translateY(5px) rotate(45deg);
}

.hamburger-menu.active span:nth-child(2) {
  opacity: 0;
}

.hamburger-menu.active span:nth-child(3) {
  transform: translateY(-5px) rotate(-45deg);
}

/* 设置按钮 */
.settings-toggle {
  position: fixed;
  top: 80px;
  right: 16px;
  width: 40px;
  height: 40px;
  background: var(--accent-color);
  color: white;
  border: none;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  z-index: 1100;
  box-shadow: 0 2px 8px rgba(0,0,0,0.25);
  transition: all 0.3s;
}

.settings-toggle:hover {
  background: var(--accent-color-darker);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.3);
}

.settings-toggle.active {
  background: var(--accent-color-darker);
}

</style>
