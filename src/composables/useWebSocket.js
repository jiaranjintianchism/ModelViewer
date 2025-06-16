import { ref } from 'vue';

export function useWebSocket(jobIdRef) {
  const models = ref([]); // {id, url}
  const status = ref('connecting'); // connecting | connected | disconnected | error
  const lastMessage = ref(null);
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
        let fullUrl;
        if (data.path) {
          if (data.path.startsWith('http')) {
            // 如果后端发的是绝对路径但 host 是 localhost，则替换为配置的服务器地址
            const urlObj = new URL(data.path);
            const configured = new URL(import.meta.env.VITE_SERVER_URL);
            if (urlObj.hostname === 'localhost') {
              urlObj.protocol = configured.protocol;
              urlObj.host = configured.host;
              fullUrl = urlObj.toString();
            } else {
              fullUrl = data.path;
            }
          } else {
            fullUrl = `${import.meta.env.VITE_SERVER_URL}${data.path}`;
          }
        }
        lastMessage.value = { ...data, modelUrl: fullUrl }; // attach full modelUrl for watchers
        if (data.type === 'MODEL_READY' && fullUrl) {
          models.value.unshift({ id: data.jobId || data.prompt || Date.now().toString(), url: fullUrl });
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

  return { models, status, lastMessage, connect, disconnect };
}
