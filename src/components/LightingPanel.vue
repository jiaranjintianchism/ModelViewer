<template>
  <div class="panel">
    <div class="panel-header">
      <h3>场景设置</h3>
    </div>
    
    <div class="panel-section">
      <div class="section-header" @click="toggleSection('lighting')">
        <h4>渲染打光</h4>
        <span class="arrow" :class="{ 'open': sections.lighting }">▼</span>
      </div>
      
      <div v-if="sections.lighting" class="section-content">
        <div class="angle-control">
          <h5>角度</h5>
          <div class="angle-sphere">
            <div class="sphere-container" @mousedown="startDrag" @touchstart="startDrag">
              <div class="sphere">
                <div class="light-indicator" :style="lightIndicatorStyle"></div>
              </div>
            </div>
          </div>
        </div>

        <div class="color-control">
          <h5>射灯色值</h5>
          <div class="color-picker">
            <label class="color-sample" :style="{backgroundColor: internalColor}">
              <input type="color" v-model="internalColor" class="hidden-input"/>
            </label>
            <div class="color-value">{{internalColor === '#ffffff' ? '255,255,255' : rgbValue}}</div>
          </div>
        </div>
        
        <div class="slider-control">
          <h5>射灯强度</h5>
          <div class="slider-container">
            <span class="slider-label">弱</span>
            <input type="range" min="0" max="5" step="0.1" v-model.number="internalIntensity" class="styled-slider"/>
            <span class="slider-label">强</span>
          </div>
        </div>
        
        <div class="slider-control">
          <h5>平面光强度</h5>
          <div class="slider-container">
            <span class="slider-label">弱</span>
            <input type="range" min="0" max="2" step="0.1" v-model.number="ambientIntensity" class="styled-slider"/>
            <span class="slider-label">强</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { watch, ref, computed, onMounted, onBeforeUnmount } from 'vue';

const props = defineProps({
  color: { type: String, default: '#ffffff' },
  intensity: { type: Number, default: 1 },
  pitch: { type: Number, default: 45 },
  yaw: { type: Number, default: 45 },
  ambient: { type: Number, default: 0.4 },
});

const emit = defineEmits(['update:color', 'update:intensity', 'update:pitch', 'update:yaw', 'update:ambient']);

// 内部状态管理
const internalColor = ref(props.color);
const internalIntensity = ref(props.intensity);
const internalPitch = ref(props.pitch);
const internalYaw = ref(props.yaw);
const ambientIntensity = ref(props.ambient || 0.4); // 平面光强度，默认与Viewer中的ambient一致

// 面板控制
const sections = ref({ lighting: true }); // 默认展开光照面板

function toggleSection(section) {
  sections.value[section] = !sections.value[section];
}

// 球形控制器逻辑
const isDragging = ref(false);
const sphereSize = 140; // 球大小，单位px
const halfSphere = sphereSize / 2;

// 光标位置计算
const lightIndicatorStyle = computed(() => {
  // 将3D球面坐标映射到2D圆形
  const radius = Math.min(90, Math.max(0, Math.abs(internalPitch.value))) / 90 * halfSphere;
  const angleRad = (internalYaw.value * Math.PI) / 180;
  
  // 边界控制，确保点始终在球内
  const x = halfSphere + radius * Math.sin(angleRad);
  const y = halfSphere - radius * Math.cos(angleRad); // y轴在DOM中是反的
  
  return {
    left: `${x}px`,
    top: `${y}px`,
    boxShadow: internalColor.value === '#ffffff' ? '0 0 5px 2px rgba(255,255,255,0.8)' : `0 0 5px 2px ${internalColor.value}`
  };
});

// RGB颜色值转换
const rgbValue = computed(() => {
  // 将hex转为rgb显示
  const hex = internalColor.value.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  return `${r},${g},${b}`;
});

// 拖拽控制
function startDrag(e) {
  e.preventDefault();
  isDragging.value = true;
  
  // 初始拖拽就更新一次位置
  updatePosition(e.type === 'touchstart' ? e.touches[0] : e);
  
  // 添加事件监听
  if (e.type === 'touchstart') {
    window.addEventListener('touchmove', handleDrag);
    window.addEventListener('touchend', stopDrag);
  } else {
    window.addEventListener('mousemove', handleDrag);
    window.addEventListener('mouseup', stopDrag);
  }
}

function handleDrag(e) {
  if (!isDragging.value) return;
  updatePosition(e.type === 'touchmove' ? e.touches[0] : e);
}

function stopDrag() {
  isDragging.value = false;
  window.removeEventListener('mousemove', handleDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', handleDrag);
  window.removeEventListener('touchend', stopDrag);
}

function updatePosition(event) {
  const sphereElement = document.querySelector('.sphere-container');
  if (!sphereElement) return;
  
  const rect = sphereElement.getBoundingClientRect();
  
  // 相对球心的坐标
  const x = event.clientX - rect.left - halfSphere;
  const y = event.clientY - rect.top - halfSphere;
  
  // 计算角度（弧度）
  const distance = Math.sqrt(x * x + y * y);
  const maxDistance = halfSphere;
  
  // 计算方位角（yaw），范围 -180 到 180
  let newYaw = Math.atan2(x, -y) * 180 / Math.PI; // 使用-y是因为DOM坐标系y轴向下
  
  // 计算俯仰角（pitch），范围 -90 到 90
  // 距离越远，俯仰角越大
  const normalizedDistance = Math.min(distance, maxDistance) / maxDistance;
  const newPitch = normalizedDistance * 90 * (y > 0 ? -1 : 1);
  
  // 更新角度
  internalPitch.value = Math.round(newPitch);
  internalYaw.value = Math.round(newYaw);
}

// 监听平面光强度变化
watch(ambientIntensity, (newValue) => {
  emit('update:ambient', newValue);
});

// 监听器清理
onBeforeUnmount(() => {
  window.removeEventListener('mousemove', handleDrag);
  window.removeEventListener('mouseup', stopDrag);
  window.removeEventListener('touchmove', handleDrag);
  window.removeEventListener('touchend', stopDrag);
});

// 向父组件同步变化
watch(internalColor, (v) => emit('update:color', v));
watch(internalIntensity, (v) => emit('update:intensity', v));
watch(internalPitch, (v) => emit('update:pitch', v));
watch(internalYaw, (v) => emit('update:yaw', v));

// 当父组件更新时，同步到内部副本
watch(() => props.color, (v) => { if (v !== internalColor.value) internalColor.value = v; });
watch(() => props.intensity, (v) => { if (v !== internalIntensity.value) internalIntensity.value = v; });
watch(() => props.pitch, (v) => { if (v !== internalPitch.value) internalPitch.value = v; });
watch(() => props.yaw, (v) => { if (v !== internalYaw.value) internalYaw.value = v; });
</script>

<style scoped>
.panel {
  padding: 16px;
  background: rgba(50, 50, 50, 0.85);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(0, 0, 0, 0.1);
  overflow: hidden;
  max-height: 80vh;
  overflow-y: auto;
  /* 自定义滚动条 */
  scrollbar-width: thin;
  scrollbar-color: var(--accent-color) #333333;
  /* 弹性布局 */
  display: flex;
  flex-direction: column;
  min-width: 280px;
  color: #e0e0e0;
}

.panel::-webkit-scrollbar {
  width: 6px;
}

.panel::-webkit-scrollbar-track {
  background: #333333;
  border-radius: 3px;
}

.panel::-webkit-scrollbar-thumb {
  background: var(--accent-color);
  border-radius: 3px;
}

.panel-header {
  padding: 0 0 12px 0;
  margin-bottom: 12px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #ffffff;
}

.panel-section {
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 0;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
}

.section-header:hover {
  color: var(--accent-color);
}

.section-header h4 {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 500;
  color: #e0e0e0;
}

.arrow {
  font-size: 12px;
  transition: transform 0.3s ease;
}

.arrow.open {
  transform: rotate(180deg);
}

.section-content {
  padding: 12px 0;
  animation: slideDown 0.3s ease;
}

@keyframes slideDown {
  from { opacity: 0; transform: translateY(-10px); }
  to { opacity: 1; transform: translateY(0); }
}

/* 球形控制器样式 */
.angle-control {
  margin-bottom: 20px;
}

.angle-sphere {
  display: flex;
  justify-content: center;
  margin-top: 10px;
}

.sphere-container {
  position: relative;
  width: 140px;
  height: 140px;
  cursor: pointer;
}

.sphere {
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background: radial-gradient(circle at 35% 35%, #f9f9f9, #e0e0e0);
  border: 1px solid #d0d0d0;
  box-shadow: inset 0 2px 10px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(255, 255, 255, 0.5);
  position: relative;
}

.light-indicator {
  position: absolute;
  width: 12px;
  height: 12px;
  margin: -6px 0 0 -6px;
  background: #ff9800;
  border-radius: 50%;
  box-shadow: 0 0 5px 2px rgba(255, 152, 0, 0.8);
  z-index: 2;
}

/* 标题样式 */
h5 {
  margin: 0 0 8px 0;
  font-size: 0.85rem;
  font-weight: 500;
  color: #b0b0b0;
}

/* 颜色选择器样式 */
.color-control {
  margin-bottom: 20px;
}

.color-picker {
  display: flex;
  align-items: center;
  gap: 10px;
}

.color-sample {
  display: block;
  width: 40px;
  height: 30px;
  border-radius: 4px;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  position: relative;
  overflow: hidden;
  transition: transform 0.2s;
}

.color-sample:hover {
  transform: scale(1.05);
}

.hidden-input {
  opacity: 0;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.color-value {
  font-size: 0.75rem;
  font-family: monospace;
  color: #b0b0b0;
}

/* 滑块控制器样式 */
.slider-control {
  margin-bottom: 20px;
}

.slider-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.slider-label {
  font-size: 0.7rem;
  color: #b0b0b0;
  width: 20px;
}

.styled-slider {
  -webkit-appearance: none;
  appearance: none;
  width: 100%;
  height: 6px;
  border-radius: 3px;
  background: #555555;
  outline: none;
  opacity: 0.8;
  transition: opacity 0.2s;
}

.styled-slider:hover {
  opacity: 1;
}

.styled-slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: background 0.2s;
}

.styled-slider::-webkit-slider-thumb:hover {
  background: var(--accent-color-darker);
}

.styled-slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: var(--accent-color);
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
  border: none;
  transition: background 0.2s;
}

.styled-slider::-moz-range-thumb:hover {
  background: var(--accent-color-darker);
}
</style>
