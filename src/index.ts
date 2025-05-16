import { httpServer } from './http_server/index';
import { wss } from './websocket_server/index';

const HTTP_PORT = 8181;

console.log(`Start static http server on the ${HTTP_PORT} port!`);
httpServer.listen(HTTP_PORT);

console.log(`wss options: ${JSON.stringify(wss.options)}`);
