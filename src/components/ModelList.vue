<template>
  <div>
    <h3>模型列表</h3>
    <ul>
      <li
        v-for="m in models"
        :key="m.id"
        style="display: flex; align-items: center; gap: 0.5rem;"
      >
        <span @click="emit('select', m.url)" style="flex:1;cursor:pointer;">{{ m.id }}</span>
        <button @click.stop="download(m.url, m.id)">下载</button>
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
  gap: 0.25rem;
}
li {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  background: #333;
  cursor: pointer;
  justify-content: space-between;
}
li:hover {
  background: #444;
}
button {
  background: #3b82f6;
  color: #fff;
  border: none;
  border-radius: 3px;
  padding: 0.2rem 0.7rem;
  cursor: pointer;
  font-size: 0.95em;
}
button:hover {
  background: #2563eb;
}

</style>
