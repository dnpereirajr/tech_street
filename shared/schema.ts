import { pgTable, text, serial, integer, boolean, timestamp, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const videos = pgTable("videos", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull().unique(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  duration: text("duration"),
  thumbnail: text("thumbnail"),
  channel: text("channel"),
  views: text("views"),
  uploadDate: text("upload_date"),
  availableQualities: jsonb("available_qualities").$type<string[]>(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const downloads = pgTable("downloads", {
  id: serial("id").primaryKey(),
  videoId: text("video_id").notNull(),
  url: text("url").notNull(),
  title: text("title").notNull(),
  quality: text("quality").notNull(),
  format: text("format").notNull().default("mp4"),
  status: text("status").notNull().default("pending"), // pending, downloading, completed, failed
  progress: integer("progress").default(0),
  filePath: text("file_path"),
  fileSize: text("file_size"),
  downloadSpeed: text("download_speed"),
  eta: text("eta"),
  error: text("error"),
  thumbnail: text("thumbnail"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  completedAt: timestamp("completed_at"),
});

export const insertVideoSchema = createInsertSchema(videos).omit({
  id: true,
  createdAt: true,
});

export const insertDownloadSchema = createInsertSchema(downloads).omit({
  id: true,
  createdAt: true,
  completedAt: true,
});

export type Video = typeof videos.$inferSelect;
export type Download = typeof downloads.$inferSelect;
export type InsertVideo = z.infer<typeof insertVideoSchema>;
export type InsertDownload = z.infer<typeof insertDownloadSchema>;

// API Response types
export interface VideoInfo {
  id: string;
  title: string;
  description?: string;
  duration: string;
  thumbnail: string;
  channel: string;
  views: string;
  uploadDate: string;
  availableQualities: string[];
}

export interface DownloadProgress {
  id: string;
  status: string;
  progress: number;
  downloadSpeed?: string;
  eta?: string;
  error?: string;
}

export interface DownloadRequest {
  url: string;
  quality: string;
  format: string;
}
