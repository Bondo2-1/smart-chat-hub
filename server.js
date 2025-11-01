import { createServer } from "http";
import next from "next";
import { initSocket } from "./lib/socketServer.js";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  const server = createServer((req, res) => handle(req, res));

  // Initialize Socket.IO
  initSocket(server);

  const port = process.env.PORT || 3000;
  server.listen(port, () =>
    console.log(`🚀 Server running on http://localhost:${port}`)
  );
});
