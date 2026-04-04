// server/index.js - UPDATED VERSION
console.log("Server file is being executed...");
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import http from "http";
import * as url from "url";
import { initSocket } from "./socket/socketServer.js";
import gmailRoutes from "./routes/gmailRoutes.js";
import urlRoute from "./routes/urlRoute.js";
import imageRoutes from "./routes/imageRoutes.js";
import youtubeRoutes from "./routes/youtubeRoutes.js";
import audioRoutes from "./routes/audio.js";
import chatbotRoutes from "./routes/chatbotRoutes.js";
import threatRoutes from "./routes/threatRoutes.js";
import videoRoutes from "./routes/videoRoutes.js";
import { launchBot } from "./services/telegramService.js";

// launchBot();

const app = express();
const server = http.createServer(app);

// Initialize Socket.io
initSocket(server);

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/", gmailRoutes);
app.use("/", urlRoute);
app.use("/", imageRoutes);
app.use("/youtube", youtubeRoutes);
app.use("/", audioRoutes);
app.use("/chatbot-ui", chatbotRoutes);
app.use("/threat", threatRoutes);
app.use("/", videoRoutes);

// Environment variables
const PORT = process.env.PORT || 3000;



// Start Server - Directly for now to ensure it starts
server.listen(PORT, () => {
  console.log(`🚀 Server started successfully on port ${PORT}`);
  console.log(`🔗 Local status check: http://localhost:${PORT}/auth/status`);
});

// Export app and server
export { app, server };
