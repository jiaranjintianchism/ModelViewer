import { ref } from 'vue';

export function useWebSocket() {
  const models = ref([]); // {id, url}
  let ws;
  let reconnectTimer;

  function connect() {
    const wsUrl = import.meta.env.VITE_SERVER_URL.replace(/^http/, 'ws');
    ws = new WebSocket(wsUrl);

    ws.addEventListener('open', () => {
      console.log('[WS] connected');
    });

    ws.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'MODEL_READY') {
          const fullUrl = `${import.meta.env.VITE_SERVER_URL}${data.path}`;
          models.value.unshift({ id: data.prompt || Date.now().toString(), url: fullUrl });
        }
      } catch (e) {
        console.warn('WS message parse error', e);
      }
    });

    ws.addEventListener('close', () => {
      console.log('[WS] disconnected, retrying in 3s');
      reconnectTimer = setTimeout(connect, 3000);
    });

    ws.addEventListener('error', () => {
      ws.close();
    });
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws && ws.close();
  }

  return { models, connect, disconnect };
}
