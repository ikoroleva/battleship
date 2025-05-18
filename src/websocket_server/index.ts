import { WebSocketServer } from 'ws';
import { MessageHandler } from './MessageHandler';

export const wss = new WebSocketServer({ port: 3000 });
const handler = MessageHandler.getInstance();

wss.on('connection', function connection(ws) {
  console.log('websocket connection established');

  ws.on('message', function incoming(message) {
    handler.handleMessage(ws, message.toString());
  });

  ws.on('close', function close() {
    console.log('websocket connection closed');
  });

  ws.send(
    JSON.stringify({
      type: 'hello',
      data: 'Connection established',
      id: 0,
    }),
  );
});
