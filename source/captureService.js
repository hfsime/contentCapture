const WebSocket = require('ws');
const dataCapture = require('./dataCapture');

class CaptureService {
    constructor() {
        this._webSocket = null;
        this._dataCapture = new dataCapture();
    }

    async start() {
        this._webSocket = new WebSocket.Server({ port: 45654 });
        this._webSocket.on('connection', async client => {
            client.on('message', async (message) => {
                try {
                    let requestObj = JSON.parse(message);
                    switch (requestObj.opt) {
                        case "dataCapture":
                            break;
                    }
                    this.response(client, {});
                } catch (e) {
                    console.log(e);
                }
            });
        });
    }

    response(client, responseObj) {
        let responseContent = JSON.stringify(responseObj);
        client.send(responseContent);
    }

    stop() {
        this._webSocket.close();
    }
}

module.exports = CaptureService;
