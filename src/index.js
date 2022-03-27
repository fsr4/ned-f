import * as fs from 'fs';
import { join } from 'path';
import * as http from 'http';
import { WebSocketServer } from 'ws';

const KEY_FILE_NAME = 'keys.txt';
const keys = [];

try {
    const data = fs.readFileSync(KEY_FILE_NAME, 'utf8');
    console.log('Opened existing keys.txt file with:');
    data.split(/\n/).forEach(key =>  {
        console.log('- ', key);
        if (key !== '') keys.push(key);
    });
} catch (err) {
    fs.open(KEY_FILE_NAME, 'w', function (err) {
        if (err) console.log(`Error opening file ${KEY_FILE_NAME}\n${err}`);
        console.log(`Created file ${KEY_FILE_NAME}`);
    });
}

const httpServer = http.createServer((req, res) => {
    if (req.url.charAt(req.url.length - 1) === '/') req.url += 'index.html';
    try {
        const data = fs.readFileSync(join(process.cwd(), 'src', req.url));
        res.writeHead(200);
        res.end(data);
    } catch (err) {
        res.writeHead(404);
        res.end(JSON.stringify(err));
    }
}).listen(8080);


const wsServer = new WebSocketServer({ port: 5001 });
wsServer.on('connection', connection => {
    console.log('socket connection established');
    connection.on('message', payload => {
        console.log('payload: ', payload.toString());
        const data = JSON.parse(payload.toString());
        console.log('message received: ', data);
        switch (data.type) {
            case 'keyDetected':
                notifyClient(data.key);
                break;
            case 'saveKey':
                saveKey(data.key);
                break;
        }
    });
});

function notifyClient(key) {
    console.log('key detected: ', key);
    wsServer.clients.forEach(ws => ws.send(JSON.stringify({
        type: 'keyDetected',
        key: key,
        exists: keys.includes(key)
    })));
}

function saveKey(key) {
    console.log('save key: ', key);
    try {
        fs.appendFileSync(KEY_FILE_NAME, `${key}\n`);
        keys.push(key);
        console.log('Saved Key: ' + key);
    } catch (err) {
        console.log('Error Saving Key: ' + key);
    }
}

function cleanup() {
    httpServer.close();
    wsServer.close();
    console.log('closed server');
}

['SIGTERM', 'SIGHUP', 'SIGINT'].forEach(signal => process.on(signal, cleanup));
