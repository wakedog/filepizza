# Overview

FilePizza is a web-based peer-to-peer file sharing application that enables direct browser-to-browser file transfers using WebRTC technology. The application eliminates the need for intermediate server storage by creating temporary channels for uploaders and downloaders to connect directly. Users can share files by generating shareable links (with optional password protection) that allow others to download files directly from their browser. The system supports multiple file uploads, mobile browsers, and includes safety features like reporting mechanisms.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend Architecture
The application uses **Next.js 15** with the App Router pattern, built with **React 19** and **TypeScript**. The UI is styled with **Tailwind CSS** and supports dark mode via `next-themes`. The frontend implements a single-page application pattern with client-side routing for the main upload interface and server-side rendered pages for download links.

**State Management**: Uses React's built-in state management with custom hooks for complex logic. **TanStack Query** handles server state and caching for API interactions.

**WebRTC Integration**: **PeerJS** library manages WebRTC connections, peer discovery, and data channel communication. The application implements custom hooks (`useDownloader`, `useUploaderConnections`) to handle the complexity of peer-to-peer file transfers.

## Backend Architecture
The backend follows a **serverless API** pattern using Next.js API routes. Core business logic is organized into modules:

- **Channel Management**: Handles temporary channel creation, renewal, and destruction
- **Slug Generation**: Creates human-readable short slugs and word-based long slugs for sharing
- **Message Protocol**: Implements a structured message system for peer communication
- **File Transfer Logic**: Manages chunked file transfers and progress tracking

**Repository Pattern**: The channel management uses a repository interface (`ChannelRepo`) that can be backed by either in-memory storage or Redis, allowing for horizontal scaling.

## Data Storage Solutions
**Primary Storage**: **Redis** (optional) for persistent channel state and TURN credentials. When Redis is not available, the system falls back to in-memory storage suitable for single-instance deployments.

**Temporary Data**: File transfers happen entirely in browser memory and are streamed directly between peers. No files are stored on servers.

**Channel TTL**: Channels automatically expire after 1 hour to prevent resource leaks.

## Authentication and Authorization
**Password Protection**: Optional password-based access control for individual file shares. Passwords are validated during the WebRTC handshake process.

**Ephemeral Credentials**: TURN server credentials are generated dynamically with time-based expiration for NAT traversal.

**No User Accounts**: The system is completely anonymous with no persistent user authentication.

## External Dependencies

### Core Technologies
- **PeerJS**: WebRTC peer connection management and signaling
- **Next.js**: Full-stack React framework with API routes
- **TanStack Query**: Server state management and caching
- **Tailwind CSS**: Utility-first CSS framework

### Infrastructure Services
- **Redis** (optional): Session storage and TURN credential management
- **TURN/STUN Servers**: NAT traversal for WebRTC connections (Coturn integration)
- **Google STUN**: Public STUN server for peer discovery

### Development Tools
- **TypeScript**: Type safety and developer experience
- **ESLint**: Code linting and style enforcement
- **Prettier**: Code formatting
- **Docker**: Containerization and development environment

### Browser APIs
- **WebRTC**: Direct peer-to-peer communication
- **Service Workers**: Streaming downloads with custom MIME handling
- **Web Streams API**: Efficient file streaming and ZIP creation
- **Clipboard API**: One-click link copying functionality

### Optional Integrations
- **Coturn**: Self-hosted TURN server for improved connection reliability
- **View Transitions API**: Smooth page transitions (temporarily disabled for React 19 compatibility)