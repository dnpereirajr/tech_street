import { spawn } from "child_process";
import { extractVideoId } from "../utils/validators";
import type { VideoInfo } from "@shared/schema";

export class YouTubeService {
  private ytDlpPath: string;

  constructor() {
    // Use the full path to yt-dlp from Nix store
    this.ytDlpPath = process.env.YT_DLP_PATH || "/nix/store/mj7z8g8zfm3nd2ihymkk83czk9yz4xzd-python3.11-yt-dlp-2024.5.27/bin/yt-dlp";
  }

  async getVideoInfo(url: string): Promise<VideoInfo> {
    return new Promise((resolve, reject) => {
      const videoId = extractVideoId(url);
      if (!videoId) {
        reject(new Error("Invalid YouTube URL"));
        return;
      }

      const ytDlp = spawn(this.ytDlpPath, [
        "--dump-json",
        "--no-download",
        "--ignore-errors",
        "--no-warnings",
        "--extractor-retries", "3",
        "--socket-timeout", "30",
        url
      ]);

      let stdout = "";
      let stderr = "";

      ytDlp.stdout.on("data", (data) => {
        stdout += data.toString();
      });

      ytDlp.stderr.on("data", (data) => {
        stderr += data.toString();
      });

      ytDlp.on("close", (code) => {
        if (code !== 0) {
          console.error("yt-dlp stderr:", stderr);
          reject(new Error(`Failed to get video info: ${stderr || "Unknown error"}`));
          return;
        }

        try {
          const videoData = JSON.parse(stdout);
          
          // Extract available qualities
          const formats = videoData.formats || [];
          const videoFormats = formats.filter((f: any) => f.vcodec !== "none" && f.height);
          const availableQualities = [...new Set(
            videoFormats
              .map((f: any) => `${f.height}p`)
              .sort((a: string, b: string) => parseInt(b) - parseInt(a))
          )];

          const videoInfo: VideoInfo = {
            id: videoId,
            title: videoData.title || "Unknown Title",
            description: videoData.description || "",
            duration: this.formatDuration(videoData.duration || 0),
            thumbnail: videoData.thumbnail || "",
            channel: videoData.uploader || videoData.channel || "Unknown Channel",
            views: this.formatViews(videoData.view_count || 0),
            uploadDate: videoData.upload_date ? this.formatDate(videoData.upload_date) : "Unknown",
            availableQualities,
          };

          resolve(videoInfo);
        } catch (error) {
          reject(new Error(`Failed to parse video info: ${error}`));
        }
      });

      ytDlp.on("error", (error) => {
        reject(new Error(`Failed to spawn yt-dlp: ${error.message}`));
      });
    });
  }

  private formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  }

  private formatViews(views: number): string {
    if (views >= 1000000) {
      return `${(views / 1000000).toFixed(1)}M`;
    } else if (views >= 1000) {
      return `${(views / 1000).toFixed(1)}K`;
    }
    return views.toString();
  }

  private formatDate(dateString: string): string {
    // dateString is in format YYYYMMDD
    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    return `${year}-${month}-${day}`;
  }
}
