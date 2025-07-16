import { spawn } from "child_process";
import { promises as fs } from "fs";
import path from "path";
import type { Download } from "@shared/schema";
import { storage } from "../storage";

export class DownloadService {
  private ytDlpPath: string;
  private downloadDir: string;

  constructor() {
    this.ytDlpPath = process.env.YT_DLP_PATH || "/nix/store/mj7z8g8zfm3nd2ihymkk83czk9yz4xzd-python3.11-yt-dlp-2024.5.27/bin/yt-dlp";
    this.downloadDir = process.env.DOWNLOAD_DIR || path.join(process.cwd(), "downloads");
    this.ensureDownloadDir();
  }

  private async ensureDownloadDir() {
    try {
      await fs.access(this.downloadDir);
    } catch {
      await fs.mkdir(this.downloadDir, { recursive: true });
    }
  }

  async startDownload(
    downloadId: number,
    url: string,
    quality: string,
    format: string,
    onProgress?: (progress: any) => void
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const outputTemplate = path.join(
        this.downloadDir,
        `${downloadId}_%(title)s.%(ext)s`
      );

      const args = [
        "--format",
        this.getFormatSelector(quality, format),
        "--output",
        outputTemplate,
        "--newline",
        "--ignore-errors",
        "--no-warnings",
        "--extractor-retries", "3",
        "--socket-timeout", "30",
        url
      ];

      console.log(`Starting download with yt-dlp: ${this.ytDlpPath} ${args.join(" ")}`);

      const ytDlp = spawn(this.ytDlpPath, args);

      let currentFilePath: string | null = null;

      ytDlp.stdout.on("data", async (data) => {
        const output = data.toString();
        console.log("yt-dlp stdout:", output);

        // Parse progress information
        const progressMatch = output.match(/\[download\]\s+(\d+\.?\d*)%\s+of\s+([\d.]+\w+)\s+at\s+([\d.]+\w+\/s)\s+ETA\s+([\d:]+)/);
        if (progressMatch) {
          const [, progressStr, fileSize, speed, eta] = progressMatch;
          const progress = parseFloat(progressStr);

          await storage.updateDownload(downloadId, {
            status: "downloading",
            progress: Math.round(progress),
            fileSize,
            downloadSpeed: speed,
            eta,
          });

          if (onProgress) {
            onProgress({
              id: downloadId,
              progress: Math.round(progress),
              status: "downloading",
              downloadSpeed: speed,
              eta,
            });
          }
        }

        // Check for destination file
        const destinationMatch = output.match(/\[download\] Destination: (.+)/);
        if (destinationMatch) {
          currentFilePath = destinationMatch[1];
        }

        // Check for completion
        if (output.includes("[download] 100%") || output.includes("has already been downloaded")) {
          await storage.updateDownload(downloadId, {
            status: "completed",
            progress: 100,
            filePath: currentFilePath,
          });

          if (onProgress) {
            onProgress({
              id: downloadId,
              progress: 100,
              status: "completed",
            });
          }
        }
      });

      ytDlp.stderr.on("data", (data) => {
        const error = data.toString();
        console.error("yt-dlp stderr:", error);
      });

      ytDlp.on("close", async (code) => {
        if (code === 0) {
          resolve();
        } else {
          await storage.updateDownload(downloadId, {
            status: "failed",
            error: `Download failed with exit code ${code}`,
          });

          if (onProgress) {
            onProgress({
              id: downloadId,
              status: "failed",
              error: `Download failed with exit code ${code}`,
            });
          }

          reject(new Error(`Download failed with exit code ${code}`));
        }
      });

      ytDlp.on("error", async (error) => {
        await storage.updateDownload(downloadId, {
          status: "failed",
          error: `Failed to spawn yt-dlp: ${error.message}`,
        });

        if (onProgress) {
          onProgress({
            id: downloadId,
            status: "failed",
            error: error.message,
          });
        }

        reject(error);
      });
    });
  }

  private getFormatSelector(quality: string, format: string): string {
    const height = quality.replace("p", "");
    
    if (format === "mp3" || format === "m4a") {
      return "bestaudio/best";
    }
    
    // For video formats, try to get the best quality up to the specified resolution
    return `best[height<=${height}]/best`;
  }

  async getDownloadFile(filePath: string): Promise<Buffer> {
    return await fs.readFile(filePath);
  }

  async deleteDownloadFile(filePath: string): Promise<void> {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.warn(`Failed to delete file ${filePath}:`, error);
    }
  }
}
