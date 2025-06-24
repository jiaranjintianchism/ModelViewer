<template>
  <div class="card model-list">
    <h3>模型列表</h3>
    <ul>
      <li
        v-for="m in models"
        :key="m.id"
        class="model-item"
      >
        <span 
          @click="emit('select', m.url)" 
          class="model-name" 
          :title="m.id"
        >{{ m.id }}</span>
        <button @click.stop="download(m.url, m.id)" class="download-btn">下载</button>
      </li>
    </ul>
  </div>
</template>

<script setup>
const props = defineProps({ models: Array });
const emit = defineEmits(['select']);

function download(url, id) {
  // 提取文件名
  const fileName = url.split('/').pop() || id + '.gltf';
  fetch(url)
    .then(res => res.blob())
    .then(blob => {
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(link.href);
    })
    .catch(() => alert('下载失败'));
}
</script>

<style scoped>
ul {
  list-style: none;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.model-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 0.8rem;
  border: 1px solid var(--border-color);
  border-radius: 8px;
  background: var(--background-tertiary);
  cursor: pointer;
  transition: background-color 0.2s;
  justify-content: space-between;
  min-width: 0; /* 防止子元素导致容器扩展 */
}

.model-name {
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  cursor: pointer;
  margin-right: 8px; /* 确保与按钮有足够间距 */
}

.download-btn {
  flex-shrink: 0; /* 防止按钮被压缩 */
  min-width: 60px; /* 确保按钮有最小宽度 */
}
.model-item:hover {
  background: var(--button-hover-bg);
}
button {
  background: var(--accent-color);
  color: #fff;
  border: none;
  border-radius: 6px;
  padding: 0.35rem 0.9rem;
  cursor: pointer;
  font-size: 0.9rem;
  transition: background-color 0.2s;
}
button:hover {
  background: var(--accent-color-darker);
}

</style>
