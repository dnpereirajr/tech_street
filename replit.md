# YouTube Downloader Application

## Overview

This is a full-stack YouTube video downloader application built with a React frontend and Express.js backend. The application allows users to download YouTube videos in various qualities and formats, with real-time progress tracking via WebSockets.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

The application follows a monorepo structure with clear separation between client and server code:

- **Frontend**: React SPA with TypeScript, using Vite as the build tool
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for data persistence
- **Real-time Communication**: WebSockets for download progress updates
- **UI Framework**: shadcn/ui components with Tailwind CSS
- **Video Processing**: yt-dlp for YouTube video downloading

## Key Components

### Frontend Architecture
- **Component Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design tokens and dark theme support
- **State Management**: TanStack React Query for server state management
- **Routing**: Wouter for lightweight client-side routing
- **Form Handling**: React Hook Form with Zod validation
- **Real-time Updates**: Custom WebSocket hook for progress tracking

### Backend Architecture
- **API Framework**: Express.js with TypeScript
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Video Service**: YouTubeService for extracting video metadata
- **Download Service**: DownloadService for managing video downloads
- **Storage Layer**: Abstracted storage interface with in-memory implementation
- **WebSocket Server**: Real-time progress broadcasting to connected clients

### Database Schema
- **Videos Table**: Stores video metadata (title, duration, thumbnail, etc.)
- **Downloads Table**: Tracks download requests with status, progress, and file information
- **Migrations**: Managed through Drizzle Kit

## Data Flow

1. **Video Info Retrieval**: User enters YouTube URL → Backend validates URL → yt-dlp extracts metadata → Returns video info to frontend
2. **Download Initiation**: User selects quality/format → Frontend sends download request → Backend creates download record → yt-dlp starts download
3. **Progress Tracking**: yt-dlp progress → DownloadService captures updates → WebSocket broadcasts to connected clients → Frontend updates UI
4. **Download Management**: Users can view history, cancel downloads, and clear completed downloads

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Neon database client for PostgreSQL
- **drizzle-orm**: Type-safe database ORM
- **yt-dlp**: External binary for YouTube video downloading
- **ws**: WebSocket implementation for real-time communication

### Frontend Dependencies
- **@tanstack/react-query**: Server state management
- **@radix-ui/***: Headless UI component primitives
- **react-hook-form**: Form handling and validation
- **zod**: Schema validation
- **tailwindcss**: Utility-first CSS framework

### Development Dependencies
- **vite**: Build tool and dev server
- **typescript**: Type checking
- **tsx**: TypeScript execution for development

## Deployment Strategy

The application is configured for deployment with the following approach:

1. **Build Process**: 
   - Frontend built with Vite to static assets in `dist/public`
   - Backend compiled with esbuild to `dist/index.js`

2. **Environment Variables**:
   - `DATABASE_URL`: PostgreSQL connection string (required)
   - `YT_DLP_PATH`: Path to yt-dlp binary (optional, defaults to "yt-dlp")
   - `DOWNLOAD_DIR`: Directory for downloaded files (optional, defaults to "./downloads")

3. **Database Setup**:
   - Drizzle migrations stored in `./migrations`
   - Schema defined in `shared/schema.ts`
   - Push migrations with `npm run db:push`

4. **File Storage**:
   - Downloads stored locally in configurable directory
   - File paths tracked in database for serving/cleanup

5. **Process Management**:
   - Single Express server handles both API and static file serving
   - WebSocket server attached to HTTP server for real-time updates
   - yt-dlp spawned as child process for video downloads

The application uses a shared schema approach where database types and validation schemas are defined once in the `shared` directory and imported by both frontend and backend for type safety across the full stack.