import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Download, Video, Loader2, ExternalLink, History, Trash2, Copy, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useWebSocket } from '@/hooks/use-websocket';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface QualityOption {
  value: string;
  label: string;
  resolution: string;
}

const qualityOptions: QualityOption[] = [
  { value: '2160p', label: '4K Ultra HD', resolution: '3840x2160' },
  { value: '1440p', label: '2K Quad HD', resolution: '2560x1440' },
  { value: '1080p', label: 'Full HD', resolution: '1920x1080' },
  { value: '720p', label: 'HD', resolution: '1280x720' },
  { value: '480p', label: 'SD', resolution: '854x480' },
  { value: '360p', label: 'Low Quality', resolution: '640x360' }
];

const formatOptions = [
  { value: 'mp4', label: 'MP4 (Video)' },
  { value: 'webm', label: 'WebM (Video)' },
  { value: 'mp3', label: 'MP3 (Audio Only)' },
  { value: 'm4a', label: 'M4A (Audio Only)' }
];

interface VideoInfo {
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

interface DownloadHistory {
  id: number;
  url: string;
  title: string;
  quality: string;
  format: string;
  status: string;
  progress: number;
  thumbnail: string;
  createdAt: string;
  completedAt?: string;
}

interface DownloadProgress {
  id: number;
  status: string;
  progress: number;
  downloadSpeed?: string;
  eta?: string;
  error?: string;
}

export default function VideoDownloader() {
  const [url, setUrl] = useState('');
  const [quality, setQuality] = useState('1080p');
  const [format, setFormat] = useState('mp4');
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState<Record<number, DownloadProgress>>({});

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // WebSocket for real-time progress updates
  useWebSocket({
    onMessage: (message) => {
      if (message.type === 'download_progress') {
        const progress = message.data as DownloadProgress;
        setDownloadProgress(prev => ({
          ...prev,
          [progress.id]: progress
        }));

        if (progress.status === 'completed') {
          toast({
            title: "✅ Download completed!",
            description: `Download finished successfully`,
          });
          queryClient.invalidateQueries({ queryKey: ['/api/downloads/history'] });
        } else if (progress.status === 'failed') {
          toast({
            title: "❌ Download failed",
            description: progress.error || "Download failed",
            variant: "destructive"
          });
        }
      }
    },
    onConnect: () => {
      console.log('WebSocket connected for real-time updates');
    }
  });

  // Fetch video info
  const { 
    data: fetchedVideoInfo, 
    isLoading: isLoadingVideoInfo, 
    refetch: fetchVideoInfo,
    error: videoInfoError 
  } = useQuery({
    queryKey: ['/api/video/info', url],
    enabled: false,
  });

  // Fetch download history
  const { data: downloadHistory = [] } = useQuery<DownloadHistory[]>({
    queryKey: ['/api/downloads/history'],
  });

  // Start download mutation
  const downloadMutation = useMutation({
    mutationFn: async (data: { url: string; quality: string; format: string }) => {
      const response = await apiRequest('POST', '/api/video/download', data);
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "📥 Download started",
        description: `Download initiated with ID: ${data.id}`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/downloads/history'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start download",
        variant: "destructive"
      });
    }
  });

  // Clear history mutation
  const clearHistoryMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('DELETE', '/api/downloads/history');
    },
    onSuccess: () => {
      toast({
        title: "History cleared",
        description: "All download records have been removed.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/downloads/history'] });
    }
  });

  useEffect(() => {
    if (fetchedVideoInfo) {
      setVideoInfo(fetchedVideoInfo as VideoInfo);
      setError(null);
    }
  }, [fetchedVideoInfo]);

  useEffect(() => {
    if (videoInfoError) {
      setError((videoInfoError as any).message || "Failed to fetch video info");
      setVideoInfo(null);
    }
  }, [videoInfoError]);

  const isValidYouTubeUrl = (url: string) => {
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/;
    return youtubeRegex.test(url);
  };

  const handleProcess = async () => {
    setError(null);
    
    if (!url.trim()) {
      setError("URL is required");
      toast({
        title: "URL required",
        description: "Please enter a YouTube URL.",
        variant: "destructive"
      });
      return;
    }

    if (!isValidYouTubeUrl(url)) {
      setError("Invalid URL format");
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL.",
        variant: "destructive"
      });
      return;
    }

    try {
      await fetchVideoInfo();
    } catch (error) {
      console.error("Error processing video:", error);
    }
  };

  const handleDownload = () => {
    if (!videoInfo) return;

    downloadMutation.mutate({
      url,
      quality,
      format
    });
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: "URL copied",
      description: "Link copied to clipboard.",
    });
  };

  const clearHistory = () => {
    clearHistoryMutation.mutate();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <div className="inline-flex items-center gap-2">
            <Video className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              StreetTech Downloader
            </h1>
          </div>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Download YouTube videos in high quality, up to 4K. Paste the URL, choose quality and download instantly.
          </p>
        </div>

        {/* Main Card */}
        <Card className="border-0 bg-gradient-to-br from-card/90 to-card/70 shadow-2xl">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              Download Video
            </CardTitle>
            <CardDescription>
              Paste YouTube URL and select desired quality
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* URL Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                YouTube URL
              </label>
              <div className="flex gap-2">
                <Input
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className={`flex-1 ${error ? 'border-destructive' : ''}`}
                />
                <Button
                  onClick={handleProcess}
                  disabled={isLoadingVideoInfo}
                  variant="default"
                  size="lg"
                >
                  {isLoadingVideoInfo ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Video className="w-4 h-4" />
                  )}
                  {isLoadingVideoInfo ? 'Processing...' : 'Process'}
                </Button>
                <Button
                  onClick={() => setShowHistory(!showHistory)}
                  variant="outline"
                  size="lg"
                >
                  <History className="w-4 h-4" />
                </Button>
              </div>
              {error && (
                <div className="flex items-center gap-2 text-destructive text-sm">
                  <AlertCircle className="w-4 h-4" />
                  {error}
                </div>
              )}
            </div>

            {/* Quality and Format Selection */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Video Quality
                </label>
                <Select value={quality} onValueChange={setQuality}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select quality" />
                  </SelectTrigger>
                  <SelectContent>
                    {qualityOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        <div className="flex items-center justify-between w-full">
                          <span>{option.label}</span>
                          <Badge variant="secondary" className="ml-2">
                            {option.resolution}
                          </Badge>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Download Format
                </label>
                <Select value={format} onValueChange={setFormat}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select format" />
                  </SelectTrigger>
                  <SelectContent>
                    {formatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Video Preview */}
            {videoInfo && (
              <Card className="border border-primary/10 bg-background/50">
                <CardContent className="p-4">
                  <div className="flex gap-4">
                    <div className="relative">
                      <img
                        src={videoInfo.thumbnail}
                        alt="Thumbnail"
                        className="w-32 h-20 object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = '/placeholder.svg';
                        }}
                      />
                      <div className="absolute inset-0 bg-black/20 rounded-md" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <h3 className="font-semibold text-foreground">
                        {videoInfo.title}
                      </h3>
                      <div className="flex gap-2 flex-wrap">
                        <Badge variant="outline">
                          <Clock className="w-3 h-3 mr-1" />
                          {videoInfo.duration}
                        </Badge>
                        <Badge variant="outline">
                          👁️ {videoInfo.views}
                        </Badge>
                        <Badge variant="outline">
                          📅 {videoInfo.uploadDate}
                        </Badge>
                        <Badge variant="outline">
                          📺 {videoInfo.channel}
                        </Badge>
                      </div>
                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={handleDownload}
                          disabled={downloadMutation.isPending}
                          variant="default"
                          size="sm"
                        >
                          {downloadMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Download className="w-4 h-4" />
                          )}
                          {downloadMutation.isPending ? 'Starting...' : `Download ${quality}`}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(url, '_blank')}
                        >
                          <ExternalLink className="w-4 h-4" />
                          View on YouTube
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>

        {/* Download Progress Cards */}
        {Object.values(downloadProgress).filter(p => p.status === 'downloading').map((progress) => (
          <Card key={progress.id} className="border border-primary/20 bg-primary/5">
            <CardContent className="p-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Download in progress...</span>
                  <span className="text-sm text-muted-foreground">{progress.progress}%</span>
                </div>
                <Progress value={progress.progress} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Download ID: {progress.id}</span>
                  {progress.downloadSpeed && <span>Speed: {progress.downloadSpeed}</span>}
                  {progress.eta && <span>ETA: {progress.eta}</span>}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {/* Download History */}
        {showHistory && (
          <Card className="border border-secondary/20">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <History className="w-5 h-5" />
                  Download History
                </CardTitle>
                {downloadHistory.length > 0 && (
                  <Button
                    onClick={clearHistory}
                    variant="outline"
                    size="sm"
                    disabled={clearHistoryMutation.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                    Clear
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {downloadHistory.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No downloads yet</p>
                </div>
              ) : (
                downloadHistory.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border/50"
                  >
                    <img
                      src={item.thumbnail}
                      alt="Thumbnail"
                      className="w-16 h-10 object-cover rounded"
                      onError={(e) => {
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-sm truncate">{item.title}</h4>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{item.quality}</span>
                        <span>•</span>
                        <span>{item.format.toUpperCase()}</span>
                        <span>•</span>
                        <span>{new Date(item.createdAt).toLocaleDateString()}</span>
                        <span>•</span>
                        <Badge 
                          variant={item.status === 'completed' ? 'default' : item.status === 'failed' ? 'destructive' : 'secondary'}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        onClick={() => copyUrl(item.url)}
                        variant="ghost"
                        size="sm"
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                      <Button
                        onClick={() => window.open(item.url, '_blank')}
                        variant="ghost"
                        size="sm"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Button>
                      {item.status === 'completed' && (
                        <Button
                          onClick={() => window.open(`/api/files/serve/${item.id}`, '_blank')}
                          variant="ghost"
                          size="sm"
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {/* Feature Cards */}
        <div className="grid md:grid-cols-4 gap-4">
          <Card className="text-center p-6 border-0 bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
            <div className="text-3xl font-bold text-primary mb-2">4K</div>
            <div className="text-sm text-muted-foreground">
              Maximum quality supported
            </div>
          </Card>
          <Card className="text-center p-6 border-0 bg-gradient-to-br from-secondary/20 to-secondary/10 shadow-lg">
            <div className="text-3xl font-bold text-secondary mb-2">∞</div>
            <div className="text-sm text-muted-foreground">
              Unlimited downloads
            </div>
          </Card>
          <Card className="text-center p-6 border-0 bg-gradient-to-br from-accent/20 to-accent/10 shadow-lg">
            <div className="text-3xl font-bold text-accent mb-2">⚡</div>
            <div className="text-sm text-muted-foreground">
              Fast processing
            </div>
          </Card>
          <Card className="text-center p-6 border-0 bg-gradient-to-br from-green-500/20 to-green-500/10 shadow-lg">
            <div className="text-3xl font-bold text-green-400 mb-2">🔒</div>
            <div className="text-sm text-muted-foreground">
              Secure & private
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
