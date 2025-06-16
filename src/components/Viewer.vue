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
let renderer, scene, camera, controls, loader;
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

  const light = new THREE.DirectionalLight(0xffffff, 1);
  light.position.set(5, 10, 7.5);
  scene.add(light);

  // 环境光让整体更柔和
  const ambient = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambient);

  // 半球光提升空间感
  const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
  hemiLight.position.set(0, 20, 0);
  scene.add(hemiLight);

  // 网格地面辅助，帮助用户感知空间
  const grid = new THREE.GridHelper(10, 20, 0x555555, 0x555555);
  grid.position.y = -0.01; // 略微下沉避免与模型z-fighting
  scene.add(grid);

  // 坐标轴辅助
  const axes = new THREE.AxesHelper(5);
  scene.add(axes);

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
