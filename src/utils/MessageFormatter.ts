import { WebSocket } from 'ws';

export class MessageFormatter {
  static formatMessage(type: string, data: any): string {
    return JSON.stringify({
      type,
      data: JSON.stringify(data),
      id: 0,
    });
  }

  static sendMessage(ws: WebSocket | null, type: string, data: any): void {
    if (ws) {
      ws.send(this.formatMessage(type, data));
    }
  }

  static sendToSockets(
    sockets: (WebSocket | null)[],
    type: string,
    data: any,
  ): void {
    const message = this.formatMessage(type, data);
    sockets.forEach((socket) => {
      if (socket) {
        socket.send(message);
      }
    });
  }
}
