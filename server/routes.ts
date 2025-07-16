import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { YouTubeService } from "./services/youtube-service";
import { DownloadService } from "./services/download-service";
import { downloadRequestSchema, extractVideoId } from "./utils/validators";
import { ZodError } from "zod";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);
  const youtubeService = new YouTubeService();
  const downloadService = new DownloadService();

  // WebSocket server for real-time progress updates
  const wss = new WebSocketServer({ server: httpServer, path: "/ws" });

  const connectedClients = new Set<WebSocket>();

  wss.on("connection", (ws) => {
    console.log("WebSocket client connected");
    connectedClients.add(ws);

    ws.on("close", () => {
      console.log("WebSocket client disconnected");
      connectedClients.delete(ws);
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      connectedClients.delete(ws);
    });
  });

  function broadcastProgress(progress: any) {
    const message = JSON.stringify({ type: "download_progress", data: progress });
    connectedClients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  // Get video information
  app.get("/api/video/info", async (req, res) => {
    try {
      const { url } = req.query;
      
      if (!url || typeof url !== "string") {
        return res.status(400).json({ 
          message: "URL parameter is required" 
        });
      }

      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ 
          message: "Invalid YouTube URL format" 
        });
      }

      // Check if we already have this video info
      let video = await storage.getVideo(videoId);
      
      if (!video) {
        // Fetch video info from YouTube
        const videoInfo = await youtubeService.getVideoInfo(url);
        
        // Store video info
        video = await storage.createVideo({
          videoId: videoInfo.id,
          url,
          title: videoInfo.title,
          description: videoInfo.description,
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail,
          channel: videoInfo.channel,
          views: videoInfo.views,
          uploadDate: videoInfo.uploadDate,
          availableQualities: videoInfo.availableQualities,
        });
      }

      res.json({
        id: video.videoId,
        title: video.title,
        description: video.description,
        duration: video.duration,
        thumbnail: video.thumbnail,
        channel: video.channel,
        views: video.views,
        uploadDate: video.uploadDate,
        availableQualities: video.availableQualities,
      });
    } catch (error: any) {
      console.error("Error getting video info:", error);
      res.status(500).json({ 
        message: error.message || "Failed to get video information" 
      });
    }
  });

  // Start video download
  app.post("/api/video/download", async (req, res) => {
    try {
      const validatedData = downloadRequestSchema.parse(req.body);
      const { url, quality, format } = validatedData;

      const videoId = extractVideoId(url);
      if (!videoId) {
        return res.status(400).json({ 
          message: "Invalid YouTube URL format" 
        });
      }

      // Get video info first
      let video = await storage.getVideo(videoId);
      if (!video) {
        const videoInfo = await youtubeService.getVideoInfo(url);
        video = await storage.createVideo({
          videoId: videoInfo.id,
          url,
          title: videoInfo.title,
          description: videoInfo.description,
          duration: videoInfo.duration,
          thumbnail: videoInfo.thumbnail,
          channel: videoInfo.channel,
          views: videoInfo.views,
          uploadDate: videoInfo.uploadDate,
          availableQualities: videoInfo.availableQualities,
        });
      }

      // Create download record
      const download = await storage.createDownload({
        videoId,
        url,
        title: video.title,
        quality,
        format,
        status: "pending",
        progress: 0,
        thumbnail: video.thumbnail,
      });

      // Start download in background
      downloadService.startDownload(
        download.id,
        url,
        quality,
        format,
        broadcastProgress
      ).catch((error) => {
        console.error(`Download ${download.id} failed:`, error);
      });

      res.json({
        id: download.id,
        status: download.status,
        progress: download.progress,
      });
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({ 
          message: "Invalid request data",
          errors: error.errors 
        });
      }
      
      console.error("Error starting download:", error);
      res.status(500).json({ 
        message: "Failed to start download" 
      });
    }
  });

  // Get download progress
  app.get("/api/download/:id/progress", async (req, res) => {
    try {
      const downloadId = parseInt(req.params.id);
      const download = await storage.getDownload(downloadId);

      if (!download) {
        return res.status(404).json({ 
          message: "Download not found" 
        });
      }

      res.json({
        id: download.id,
        status: download.status,
        progress: download.progress,
        downloadSpeed: download.downloadSpeed,
        eta: download.eta,
        error: download.error,
      });
    } catch (error) {
      console.error("Error getting download progress:", error);
      res.status(500).json({ 
        message: "Failed to get download progress" 
      });
    }
  });

  // Get download history
  app.get("/api/downloads/history", async (req, res) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 50;
      const downloads = await storage.getDownloadHistory(limit);

      res.json(downloads.map(download => ({
        id: download.id,
        url: download.url,
        title: download.title,
        quality: download.quality,
        format: download.format,
        status: download.status,
        progress: download.progress,
        thumbnail: download.thumbnail,
        createdAt: download.createdAt,
        completedAt: download.completedAt,
      })));
    } catch (error) {
      console.error("Error getting download history:", error);
      res.status(500).json({ 
        message: "Failed to get download history" 
      });
    }
  });

  // Clear download history
  app.delete("/api/downloads/history", async (req, res) => {
    try {
      await storage.clearDownloadHistory();
      res.json({ message: "Download history cleared" });
    } catch (error) {
      console.error("Error clearing download history:", error);
      res.status(500).json({ 
        message: "Failed to clear download history" 
      });
    }
  });

  // Serve downloaded files
  app.get("/api/files/serve/:id", async (req, res) => {
    try {
      const downloadId = parseInt(req.params.id);
      const download = await storage.getDownload(downloadId);

      if (!download || !download.filePath) {
        return res.status(404).json({ 
          message: "File not found" 
        });
      }

      const fileName = path.basename(download.filePath);
      const fileBuffer = await downloadService.getDownloadFile(download.filePath);

      res.setHeader("Content-Disposition", `attachment; filename="${fileName}"`);
      res.setHeader("Content-Type", "application/octet-stream");
      res.send(fileBuffer);
    } catch (error) {
      console.error("Error serving file:", error);
      res.status(500).json({ 
        message: "Failed to serve file" 
      });
    }
  });

  // Delete download
  app.delete("/api/downloads/:id", async (req, res) => {
    try {
      const downloadId = parseInt(req.params.id);
      const download = await storage.getDownload(downloadId);

      if (!download) {
        return res.status(404).json({ 
          message: "Download not found" 
        });
      }

      // Delete file if it exists
      if (download.filePath) {
        await downloadService.deleteDownloadFile(download.filePath);
      }

      // Delete download record
      await storage.deleteDownload(downloadId);

      res.json({ message: "Download deleted" });
    } catch (error) {
      console.error("Error deleting download:", error);
      res.status(500).json({ 
        message: "Failed to delete download" 
      });
    }
  });

  return httpServer;
}
