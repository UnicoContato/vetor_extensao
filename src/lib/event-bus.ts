type Listener = (...args: any[]) => void;

class EventBus {
  private listeners: { [key: string]: Listener[] } = {};

  // Método para um componente "escutar" um evento
  on(event: string, listener: Listener) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(listener);
  }

  // Método para parar de escutar
  off(event: string, listener: Listener) {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(l => l !== listener);
  }

  // Método para "disparar" um evento para todos os ouvintes
  emit(event: string, ...args: any[]) {
    if (!this.listeners[event]) return;
    this.listeners[event].forEach(listener => listener(...args));
  }
}

// Exportamos uma única instância para toda a aplicação usar o mesmo "mural"
export const eventBus = new EventBus();