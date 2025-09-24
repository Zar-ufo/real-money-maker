const express = require("express");
const fs = require("fs");
const path = require("path");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = 3000;
const dataFile = path.join(__dirname, "views.json");

// Ensure file exists
if (!fs.existsSync(dataFile)) {
  fs.writeFileSync(dataFile, JSON.stringify({ views: 0 }));
}

function getViews() {
  return JSON.parse(fs.readFileSync(dataFile)).views;
}

function setViews(v) {
  fs.writeFileSync(dataFile, JSON.stringify({ views: v }));
}

// Serve frontend
app.use(express.static(__dirname));

// WebSocket handling
wss.on("connection", (ws) => {
  console.log("Client connected");

  // Send current views immediately
  ws.send(JSON.stringify({ type: "views", views: getViews() }));

  ws.on("message", (msg) => {
    const data = JSON.parse(msg);

    if (data.type === "add-view") {
      let views = getViews() + 1;
      setViews(views);

      // Broadcast new count to all clients
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ type: "views", views }));
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
