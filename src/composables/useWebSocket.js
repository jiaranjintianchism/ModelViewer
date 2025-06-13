import { ref } from 'vue';

export function useWebSocket() {
  const models = ref([]); // {id, url}
  const status = ref('connecting'); // connecting | connected | disconnected | error
  let ws;
  let reconnectTimer;

  function connect() {
    const wsUrl = import.meta.env.VITE_SERVER_URL.replace(/^http/, 'ws');
    ws = new WebSocket(wsUrl);

    status.value = 'connecting';
    ws.addEventListener('open', () => {
      console.log('[WS] connected');
      status.value = 'connected';
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
      status.value = 'disconnected';
      reconnectTimer = setTimeout(connect, 3000);
    });

    ws.addEventListener('error', () => {
      status.value = 'error';
      ws.close();
    });
  }

  function disconnect() {
    if (reconnectTimer) clearTimeout(reconnectTimer);
    ws && ws.close();
  }

  return { models, status, connect, disconnect };
}
