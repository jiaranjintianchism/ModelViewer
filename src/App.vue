<template>
  <header>Hunyuan Model Viewer</header>
  <main>
    <section class="sidebar">
      <div v-if="wsStatus !== 'connected'" class="alert">
        与服务器连接状态：{{ wsStatus }}
      </div>
      <PromptForm @submitted="handleSubmit" :loading="loading" />
      <ModelList :models="models" @select="handleSelect" />
    </section>
    <section class="viewer">
      <Viewer :modelUrl="currentModelUrl" />
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue';
import PromptForm from './components/PromptForm.vue';
import ModelList from './components/ModelList.vue';
import Viewer from './components/Viewer.vue';
import { useWebSocket } from './composables/useWebSocket';

const { models, status: wsStatus, connect } = useWebSocket();
connect();

const loading = ref(false);
const currentModelUrl = ref(null);

function handleSubmit(prompt) {
  loading.value = true;
  fetch(`${import.meta.env.VITE_SERVER_URL}/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  })
    .then(() => {
      loading.value = false;
    })
    .catch(() => {
      loading.value = false;
      alert('生成请求失败');
    });
}

function handleSelect(url) {
  currentModelUrl.value = url;
}
</script>

<style scoped>
.alert{
  background:#dc2626;
  color:#fff;
  padding:.5rem;
  margin-bottom:.5rem;
  border-radius:4px;
  text-align:center;
  font-size:.9rem;
}
</style>
