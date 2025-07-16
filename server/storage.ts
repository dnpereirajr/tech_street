import { videos, downloads, type Video, type Download, type InsertVideo, type InsertDownload } from "@shared/schema";
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { eq, desc } from 'drizzle-orm';

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
      duration: insertVideo.duration || null,
      description: insertVideo.description || null,
      thumbnail: insertVideo.thumbnail || null,
      channel: insertVideo.channel || null,
      views: insertVideo.views || null,
      uploadDate: insertVideo.uploadDate || null,
      availableQualities: insertVideo.availableQualities ? insertVideo.availableQualities.map(q => String(q)) : null,
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
      progress: insertDownload.progress || 0,
      format: insertDownload.format || "mp4",
      status: insertDownload.status || "pending",
      filePath: insertDownload.filePath || null,
      fileSize: insertDownload.fileSize || null,
      downloadSpeed: insertDownload.downloadSpeed || null,
      eta: insertDownload.eta || null,
      error: insertDownload.error || null,
      thumbnail: insertDownload.thumbnail || null,
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

// Supabase Storage Implementation
export class SupabaseStorage implements IStorage {
  private db;

  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for Supabase');
    }
    const sql = neon(process.env.DATABASE_URL);
    this.db = drizzle(sql);
  }

  async getVideo(videoId: string): Promise<Video | undefined> {
    try {
      const result = await this.db.select().from(videos).where(eq(videos.videoId, videoId)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting video:', error);
      return undefined;
    }
  }

  async createVideo(insertVideo: InsertVideo): Promise<Video> {
    try {
      const result = await this.db.insert(videos).values({
        ...insertVideo,
        createdAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating video:', error);
      throw error;
    }
  }

  async getDownload(id: number): Promise<Download | undefined> {
    try {
      const result = await this.db.select().from(downloads).where(eq(downloads.id, id)).limit(1);
      return result[0] || undefined;
    } catch (error) {
      console.error('Error getting download:', error);
      return undefined;
    }
  }

  async getDownloadsByStatus(status: string): Promise<Download[]> {
    try {
      return await this.db.select().from(downloads).where(eq(downloads.status, status));
    } catch (error) {
      console.error('Error getting downloads by status:', error);
      return [];
    }
  }

  async getDownloadHistory(limit: number = 50): Promise<Download[]> {
    try {
      return await this.db.select().from(downloads).orderBy(desc(downloads.createdAt)).limit(limit);
    } catch (error) {
      console.error('Error getting download history:', error);
      return [];
    }
  }

  async createDownload(insertDownload: InsertDownload): Promise<Download> {
    try {
      const result = await this.db.insert(downloads).values({
        ...insertDownload,
        createdAt: new Date()
      }).returning();
      return result[0];
    } catch (error) {
      console.error('Error creating download:', error);
      throw error;
    }
  }

  async updateDownload(id: number, updates: Partial<Download>): Promise<Download | undefined> {
    try {
      const result = await this.db.update(downloads).set(updates).where(eq(downloads.id, id)).returning();
      return result[0] || undefined;
    } catch (error) {
      console.error('Error updating download:', error);
      return undefined;
    }
  }

  async deleteDownload(id: number): Promise<boolean> {
    try {
      const result = await this.db.delete(downloads).where(eq(downloads.id, id));
      return true;
    } catch (error) {
      console.error('Error deleting download:', error);
      return false;
    }
  }

  async clearDownloadHistory(): Promise<void> {
    try {
      await this.db.delete(downloads);
    } catch (error) {
      console.error('Error clearing download history:', error);
      throw error;
    }
  }
}

// Temporarily use MemStorage until DATABASE_URL is properly configured
// TODO: Switch to SupabaseStorage when DATABASE_URL is working
export const storage = new MemStorage();
// export const storage = process.env.DATABASE_URL ? new SupabaseStorage() : new MemStorage();
