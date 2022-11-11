const uuid_service = "1101";
const uuid_value_height = "2101";
let height = undefined;

const noble = require('@abandonware/noble');

noble.on('stateChange', async (state) => {
  if (state === 'poweredOn') {
    console.log("start scanning")
    await noble.startScanningAsync([uuid_service], false);
  }
});

noble.on('discover', async (peripheral) => {
  if (peripheral.advertisement.localName != "Andrew Arduino") {
    console.log("Ignoring", peripheral.advertisement.localName);
    return
  } else {
    console.log("Connecting to", peripheral.advertisement.localName);
  }

  await noble.stopScanningAsync();
  await peripheral.connectAsync();
  const {characteristics} = await peripheral.discoverSomeServicesAndCharacteristicsAsync(
    [uuid_service], 
    [uuid_value_height]
  );

  const height_char = characteristics.find(c => c.uuid == uuid_value_height);

  height_char.subscribe();

  console.log("Connected!");

  height_char.on('read', (data) => {
    height = data.readFloatLE();
  });
});

const WebSocket = require("ws");
const wss = new WebSocket.Server({ port: 3001 });

const sendData = (ws) => {
  return () => {
    if (height === undefined) return;
    ws.send(JSON.stringify({
      "height": height
    }));
  };
}

wss.on('connection', function connection(ws) {
  setInterval(sendData(ws), 50);
});

const fs = require('fs');
const http = require('http');

http.createServer(function (req, res) {
  fs.readFile(__dirname + req.url, function (err,data) {
    if (err) {
      res.writeHead(404);
      res.end(JSON.stringify(err));
      return;
    }
    res.writeHead(200);
    res.end(data);
  });
}).listen(3000);