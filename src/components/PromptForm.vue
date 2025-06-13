<template>
  <form @submit.prevent="submit">
    <input type="text" v-model="prompt" placeholder="输入提示词..." />
    <button type="submit" :disabled="loading || !prompt.trim()">
      {{ loading ? '生成中...' : '生成' }}
    </button>
  </form>
</template>

<script setup>
import { ref, watch } from 'vue';

const emit = defineEmits(['submitted']);
const props = defineProps({ loading: Boolean });
const prompt = ref('');

watch(
  () => props.loading,
  (val) => {
    if (!val) prompt.value = '';
  }
);

function submit() {
  if (!prompt.value.trim()) return;
  emit('submitted', prompt.value.trim());
}
</script>

<style scoped>
form {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 1rem;
}
</style>
