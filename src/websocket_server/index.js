import  { WebSocketServer } from "ws";

export const wss = new WebSocketServer({port: 3000});

wss.on('connection', function connection(ws) {
    console.log("websocket connection established");

    ws.on('message', function incoming(message) {

        const parsedMessage = JSON.parse(message.toString());
        if (parsedMessage.type === 'reg') {
            const name = parsedMessage.data;
            console.log(`registering ${name}`);
            ws.send(JSON.stringify({
                type: 'reg',
                data: JSON.stringify({
                    name: "John Doe",
                    index: 1,
                    error: false,
                    errorText: '',
                }),
            }));
            ws.send(JSON.stringify({
            type: 'update_room',
            data: JSON.stringify([{
                roomId: 1,
                roomUsers: [{
                    name: "Jack",
                    index: 2,
                }]},{
            roomId: 2,
                roomUsers: [{
                    name: "Black",
                    index: 3,
                }],
            }])
        }))

            ws.send(JSON.stringify({
                type: 'update_winners',
                data: JSON.stringify([{
                    name: "Jack",
                    wins: 2,
                },{
                    name: "James",
                    wins: 3,
                }])
            }));
                return;
            }

        console.log(`received: ${message}`);
    });

    ws.on('close', function close() {
        console.log('websocket connection closed');
    });
    
    ws.send(JSON.stringify({message: 'wow, that works!'}));
});