import { videos, downloads, type Video, type Download, type InsertVideo, type InsertDownload } from "@shared/schema";

export interface IStorage {
  // Video operations
  getVideo(videoId: string): Promise<Video | undefined>;
  createVideo(video: InsertVideo): Promise<Video>;
  
  // Download operations
  getDownload(id: number): Promise<Download | undefined>;
  getDownloadsByStatus(status: string): Promise<Download[]>;
  getDownloadHistory(limit?: number): Promise<Download[]>;
  createDownload(download: InsertDownload): Promise<Download>;
  updateDownload(id: number, updates: Partial<Download>): Promise<Download | undefined>;
  deleteDownload(id: number): Promise<boolean>;
  clearDownloadHistory(): Promise<void>;
}

export class MemStorage implements IStorage {
  private videos: Map<string, Video>;
  private downloads: Map<number, Download>;
  private downloadIdCounter: number;

  constructor() {
    this.videos = new Map();
    this.downloads = new Map();
    this.downloadIdCounter = 1;
  }

  async getVideo(videoId: string): Promise<Video | undefined> {
    return this.videos.get(videoId);
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    const video: Video = {
      ...insertVideo,
      id: Date.now(),
      createdAt: new Date(),
    };
    this.videos.set(video.videoId, video);
    return video;
  }

  async getDownload(id: number): Promise<Download | undefined> {
    return this.downloads.get(id);
  }

  async getDownloadsByStatus(status: string): Promise<Download[]> {
    return Array.from(this.downloads.values()).filter(
      (download) => download.status === status
    );
  }

  async getDownloadHistory(limit: number = 50): Promise<Download[]> {
    const allDownloads = Array.from(this.downloads.values());
    return allDownloads
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, limit);
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    const id = this.downloadIdCounter++;
    const download: Download = {
      ...insertDownload,
      id,
      createdAt: new Date(),
      completedAt: null,
    };
    this.downloads.set(id, download);
    return download;
  }

  async updateDownload(id: number, updates: Partial<Download>): Promise<Download | undefined> {
    const existing = this.downloads.get(id);
    if (!existing) return undefined;

    const updated: Download = {
      ...existing,
      ...updates,
    };

    if (updates.status === 'completed' && !existing.completedAt) {
      updated.completedAt = new Date();
    }

    this.downloads.set(id, updated);
    return updated;
  }

  async deleteDownload(id: number): Promise<boolean> {
    return this.downloads.delete(id);
  }

  async clearDownloadHistory(): Promise<void> {
    this.downloads.clear();
    this.downloadIdCounter = 1;
  }
}

export const storage = new MemStorage();
