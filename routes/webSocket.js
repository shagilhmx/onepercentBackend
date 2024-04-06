const WebSocket = require("ws");

const createWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    // Handle WebSocket connection
    console.log("WebSocket connected");

    // Listen for messages from clients
    ws.on("message", (message) => {
      console.log(`Received message: ${message}`);
    });

    // Send a message to the connected client
    ws.send("Hello, client!");

    // Handle WebSocket disconnection
    ws.on("close", () => {
      console.log("WebSocket disconnected");
    });
  });

  return wss;
};

module.exports = createWebSocketServer;
