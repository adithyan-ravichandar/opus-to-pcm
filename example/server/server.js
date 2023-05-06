const WebSocket = require('ws');
const fs = require('fs');

const opusPackets = './raw_opus/';

const output_opus = './raw_opus/output.opus';

let packets = [],
    source = [],
    interval = 0,
    count = 0,
    wss;

fs.readFile(output_opus, (err, data) => {
    if (err) {
        console.error(err);
        return;
      }

      let offset = 0;

      while (offset < data.length) {
        const length = data.readUInt32LE(offset);
        offset += 4;
        const packet = data.slice(offset, offset + length);
        offset += length;
        packets.push(packet);
        count++;
        
        if(count == 2001){
            console.log('Packets loaded');
            openSocket();
        }
      }
});


function openSocket() {
  wss = new WebSocket.Server({ port: 8080 });
  console.log('Server ready...');
  wss.on('connection', function connection(ws) {
        console.log('Socket connected. sending data...');
        if (interval) {
            clearInterval(interval);
        }
        interval = setInterval(function() {
          sendPacket();
        }, 10);
  });
}

function sendPacket() {
    let packet;
    if (packets.length == 0 && interval){
       clearInterval(interval);
       packets = source.slice();
       return;
    }
    
    packet = packets.shift();
    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
          client.send(packet);
          if (packets.length % 100 == 0){
              console.log(`Remainging packets ${packets.length}`);
          }
      }
    });
}