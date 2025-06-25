<template>
  <canvas ref="canvas"></canvas>
  <template v-if="loading">
    <div class="overlay">
      <div v-if="errorMsg">{{ errorMsg }}</div>
      <div v-else>加载中 {{ progress }}%</div>
    </div>
  </template>
</template>

<script setup>
import { watch, onMounted, onUnmounted, ref } from 'vue';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

const props = defineProps({ modelUrl: String });
const canvas = ref(null);
let renderer, scene, camera, controls, loader, dirLight, ambientLight, hemiLight;
let currentModel;
const loading = ref(false);
const progress = ref(0);
const errorMsg = ref('');

function init() {
  scene = new THREE.Scene();
  // 使用深灰色背景以避免纯黑导致的对比过强问题
  scene.background = new THREE.Color(0x202020);

  camera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
  camera.position.set(2, 2, 2);

  renderer = new THREE.WebGLRenderer({ canvas: canvas.value, antialias: true });
  resize();

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // 方向光作为主光源
  dirLight = new THREE.DirectionalLight(0xffffff, 1.5); // 提高默认强度
  dirLight.position.set(5, 10, 7.5);
  scene.add(dirLight);

  // 环境光让整体更柔和
  ambientLight = new THREE.AmbientLight(0xffffff, 0.6); // 提高默认强度
  scene.add(ambientLight);

  // 半球光提升空间感
  hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.8); // 提高默认强度
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);


  const manager = new THREE.LoadingManager();
  loader = new GLTFLoader(manager);
  // Configure DRACO loader (uses Google hosted decoder)
  const dracoLoader = new DRACOLoader();
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/');
  loader.setDRACOLoader(dracoLoader);
  animate();
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}

function resize() {
  const { clientWidth, clientHeight } = canvas.value.parentElement;
  renderer.setSize(clientWidth, clientHeight);
  camera.aspect = clientWidth / clientHeight;
  camera.updateProjectionMatrix();
}

window.addEventListener('resize', () => {
  if (renderer) resize();
});

function loadModel(url) {
  if (!url) return;
  loading.value = true;
  progress.value = 0;
  errorMsg.value = '';
  loader.load(
    url,
    (gltf) => {
      if (currentModel) scene.remove(currentModel);
      currentModel = gltf.scene;
      scene.add(currentModel);
      fitCameraToObject(currentModel);
      loading.value = false;
    },
    (xhr) => {
      if (xhr.total) {
        progress.value = Math.round((xhr.loaded / xhr.total) * 100);
      } else {
        // total may be 0 for compressed/chunked responses; show spinner
        progress.value = 0;
      }
    },
    (error) => {
      console.error('模型加载失败', error);
      errorMsg.value = '加载失败，3 秒后自动重试…';
      setTimeout(() => loadModel(url), 3000);
    }
  );
}

function fitCameraToObject(object) {
  const box = new THREE.Box3().setFromObject(object);
  const size = box.getSize(new THREE.Vector3()).length();
  const center = box.getCenter(new THREE.Vector3());

  controls.reset();

  object.position.x += object.position.x - center.x;
  object.position.y += object.position.y - center.y;
  object.position.z += object.position.z - center.z;

  camera.near = size / 100;
  camera.far = size * 100;
  camera.updateProjectionMatrix();

  camera.position.copy(center);
  camera.position.x += size;
  camera.position.y += size;
  camera.position.z += size;
  camera.lookAt(center);
}

// ========= 可调光照相关 =========
function setLightColor(color) {
  if (dirLight) dirLight.color.set(color);
}
function setLightIntensity(intensity) {
  if (dirLight) dirLight.intensity = intensity;
}

function setAmbientIntensity(intensity) {
  // 现在此滑块只控制环境光，解除与半球光的耦合
  if (ambientLight) ambientLight.intensity = intensity;
  console.log('Setting ambient light intensity to:', intensity);
}
function setLightDirection(pitch, yaw) {
  if (dirLight) {
    const r = 10;
    const radP = THREE.MathUtils.degToRad(pitch);
    const radY = THREE.MathUtils.degToRad(yaw);
    dirLight.position.set(
      r * Math.cos(radP) * Math.sin(radY),
      r * Math.sin(radP),
      r * Math.cos(radP) * Math.cos(radY)
    );
  }
}

// 将方法暴露给父组件
defineExpose({
  setLightColor,
  setLightIntensity,
  setLightDirection,
  setAmbientIntensity,
});

watch(
  () => props.modelUrl,
  (url) => {
    loadModel(url);
  }
);

onMounted(init);

onUnmounted(() => {
  renderer.dispose();
});
</script>

<style scoped>
canvas {
  width: 100%;
  height: 100%;
  display: block;
}

.overlay {
  position:absolute;
  top:0;left:0;right:0;bottom:0;
  display:flex;
  flex-direction:column;
  align-items:center;
  justify-content:center;
  background:rgba(0,0,0,0.5);
  color:#fff;
  font-size:1rem;
  pointer-events:none;
}
</style>
