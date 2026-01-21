import { defineStore } from 'pinia';

export interface INotification {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp: Date;
  read: boolean;
  link?: string;
}

export const useNotificationStore = defineStore('notification', () => {
  const notifications = ref<INotification[]>([]);
  const isConnected = ref(false);
  let eventSource: EventSource | null = null;
  const config = useRuntimeConfig();

  const unreadCount = computed(() => notifications.value.filter(n => !n.read).length);

  function addNotification(notification: Omit<INotification, 'id' | 'timestamp' | 'read'>) {
    notifications.value.unshift({
      id: crypto.randomUUID(),
      timestamp: new Date(),
      read: false,
      ...notification
    });
  }

  function markAsRead(id: string) {
    const notification = notifications.value.find(n => n.id === id);
    if (notification) {
      notification.read = true;
    }
  }

  function markAllAsRead() {
    notifications.value.forEach(n => n.read = true);
  }

  function connect() {
    if (typeof window === 'undefined' || eventSource) return;

    // Use relative path for API
    const url = '/api/sse';
    console.log('[SSE] Connecting to', url);

    eventSource = new EventSource(url);

    eventSource.onopen = () => {
      console.log('[SSE] Connected');
      isConnected.value = true;
    };

    eventSource.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (payload.event === 'connected') return;

        console.log('[SSE] Message received:', payload);
        
        if (payload.event === 'notification') {
           addNotification({
             title: payload.data.title || 'Notification',
             message: payload.data.message || '',
             type: payload.data.type || 'info',
             link: payload.data.link
           });
           
           // Trigger a toast
           const toast = useToast();
           toast.add({
             title: payload.data.title,
             description: payload.data.message,
             icon: payload.data.icon || 'i-heroicons-information-circle',
             color: payload.data.color || 'primary',
             duration: 5000,
             actions: [
                {
                    icon: 'i-heroicons-information-circle',
                    onClick: () => { navigateTo(payload.data.link) }
                }
             ]
           });
        }

      } catch (err) {
        console.error('[SSE] Failed to parse message', err);
      }
    };

    eventSource.onerror = (err) => {
      console.error('[SSE] Error:', err);
      isConnected.value = false;
      eventSource?.close();
      eventSource = null;
      
      // Retry connection after 5s
      setTimeout(connect, 5000);
    };
  }

  return {
    notifications,
    isConnected,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    connect
  };
});
