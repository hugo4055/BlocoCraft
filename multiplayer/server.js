const http = require("http");
const { WebSocketServer, WebSocket } = require("ws");

const port = process.env.PORT || 10000;
const server = http.createServer((req, res) => {
  res.writeHead(200, { "content-type": "application/json", "access-control-allow-origin": "*" });
  res.end(JSON.stringify({ name: "BlocoCraft Multiplayer", status: "online", players: clients.size }));
});
const wss = new WebSocketServer({ server });
const clients = new Map();
const worldBlocks = new Map();
const blockKey = (x,y,z) => Math.round(x)+","+Math.round(y)+","+Math.round(z);
let nextId = 1;

function send(ws, data) {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(data));
}
function broadcast(data, except) {
  for (const client of clients.keys()) if (client !== except) send(client, data);
}
wss.on("connection", (ws) => {
  const id = String(nextId++);
  clients.set(ws, { id, name: "Jogador " + id, x: 0, y: 5, z: 0, yaw: 0, color: ["#ff6b6b","#ffd93d","#6bcb77","#4d96ff","#c77dff"][Number(id)%5] });
  send(ws, { type: "welcome", id, players: [...clients.values()], blocks: [...worldBlocks.values()] });
  broadcast({ type: "join", player: clients.get(ws) }, ws);
  ws.on("message", (raw) => {
    let msg; try { msg = JSON.parse(raw.toString()); } catch { return; }
    const player = clients.get(ws); if (!player || !msg || typeof msg.type !== "string") return;
    if (msg.type === "block" && (msg.action === "add" || msg.action === "remove")) {
      const x = Number(msg.x), y = Number(msg.y), z = Number(msg.z), t = Math.max(0, Math.min(5, Number(msg.t) || 0));
      if (![x,y,z].every(Number.isFinite) || Math.abs(x)>100000 || Math.abs(y)>10000 || Math.abs(z)>100000) return;
      const block = { type: "block", action: msg.action, x: Math.round(x), y: Math.round(y), z: Math.round(z), t };
      const key = blockKey(block.x,block.y,block.z);
      if (msg.action === "remove") worldBlocks.set(key, block);
      else worldBlocks.set(key, block);
      broadcast(block);
    } else if (msg.type === "state") {
      player.x = Number(msg.x) || 0; player.y = Number(msg.y) || 0; player.z = Number(msg.z) || 0; player.yaw = Number(msg.yaw) || 0;
      if (typeof msg.name === "string") player.name = msg.name.slice(0, 20);
      broadcast({ type: "state", player }, ws);
    } else if (msg.type === "chat" && typeof msg.text === "string") {
      const text = msg.text.trim().slice(0, 180);
      if (text) broadcast({ type: "chat", id: player.id, name: player.name, text });
    }
  });
  ws.on("close", () => {
    const player = clients.get(ws); clients.delete(ws);
    if (player) broadcast({ type: "leave", id: player.id });
  });
});
server.listen(port, "0.0.0.0", () => console.log("BlocoCraft multiplayer listening on " + port));
