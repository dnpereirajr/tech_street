import { z } from "zod";

export const youtubeUrlSchema = z.string().refine((url) => {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  return youtubeRegex.test(url);
}, "Invalid YouTube URL format");

export const downloadRequestSchema = z.object({
  url: youtubeUrlSchema,
  quality: z.enum(["2160p", "1440p", "1080p", "720p", "480p", "360p"]),
  format: z.enum(["mp4", "webm", "mp3", "m4a"]).default("mp4"),
});

export function extractVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}

export function isValidYouTubeUrl(url: string): boolean {
  try {
    youtubeUrlSchema.parse(url);
    return true;
  } catch {
    return false;
  }
}
