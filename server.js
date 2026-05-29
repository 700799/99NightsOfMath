const express = require("express");
const http = require("http");
const socketIO = require("socket.io");
const problemRoutes = require("./routes/problemRoutes");
const rewardRoutes = require("./routes/rewardRoutes");
const { ratioLabel } = require("./utils/rewardConfig");

const app = express();
const server = http.createServer(app);
const io = socketIO(server);

const PORT = process.env.PORT || 3000;

// Parse JSON bodies (used by the admin reward-config endpoint).
app.use(express.json());

// Serve static files
app.use(express.static("public"));

// Math problem routes
app.use("/api", problemRoutes);

// Reward / mental-break routes (work-play ratio + mini-game catalog)
app.use("/api", rewardRoutes);

// Socket.IO connection
io.on("connection", (socket) => {
  console.log("A user connected: " + socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected: " + socket.id);
  });
});

// Only start listening when run directly (`node server.js`). When the module
// is imported by tests, the caller starts its own ephemeral server instead.
if (require.main === module) {
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Reward ratio: ${ratioLabel()}`);
    if (!process.env.ADMIN_KEY) {
      console.warn(
        "[reward] Using the default admin key (\"99nights-admin\"). " +
          "Set the ADMIN_KEY environment variable to secure ratio changes."
      );
    }
  });
}

module.exports = { app, server };
