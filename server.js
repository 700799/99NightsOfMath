const express = require("express");
const http = require("http");
const socketIO = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Serve static files
app.use(express.static("public"));

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// API endpoint for math problems (placeholder)
app.get("/api/problems", (req, res) => {
  res.json({
    message: "Here are your math problems!",
  });
});

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});