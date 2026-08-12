import express from "express";
import cors from "cors";
import dotenv from "dotenv"; 
import { createServer } from "http";  
import fs from 'fs/promises';
import fsSync from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import swaggerUi from 'swagger-ui-express';
import yaml from 'js-yaml';

dotenv.config();

// Routes
import UserRoute from "../routers/UserRoute.js";
import RatingRoute from "../routers/RatingRoute.js";
import ReviewsRouter from "../routers/ReviewsRouter.js"
import DJ_Locator from '../routers/DJ_LocatorRouter.js'

// WebSocket Service
import { initializeWebSocket } from "../Services/WebSocketService.js";

const app = express();
const server = createServer(app);
const PORT = process.env.PORT;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize cache directory on startup
async function initializeCacheDirectory() {
    try {
        const cachePath = path.join(__dirname, 'cache', 'users');
        await fs.mkdir(cachePath, { recursive: true });
        console.log(`✅ Cache directory ready: ${cachePath}`);
        
        // Optional: Log cache size on startup
        const files = await fs.readdir(cachePath).catch(() => []);
        let totalFiles = 0;
        
        // Count files in sharded directories
        for (const item of files) {
            const itemPath = path.join(cachePath, item);
            const stat = await fs.stat(itemPath);
            if (stat.isDirectory()) {
                const shardFiles = await fs.readdir(itemPath);
                totalFiles += shardFiles.length;
            }
        }
        
        console.log(`📦 Current cache contains ${totalFiles} user files`);
        
    } catch (error) {
        console.error('❌ Failed to initialize cache directory:', error.message);
        // Don't crash the server - cache will be disabled
    }
}

// Optional: Cleanup old cache files (runs daily)
async function cleanupOldCacheFiles() {
    try {
        const cachePath = path.join(__dirname, 'cache', 'users');
        const CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
        const now = Date.now();
        let deletedCount = 0;
        
        async function scanDirectory(dir) {
            const entries = await fs.readdir(dir).catch(() => []);
            for (const entry of entries) {
                const fullPath = path.join(dir, entry);
                const stat = await fs.stat(fullPath);
                
                if (stat.isDirectory()) {
                    await scanDirectory(fullPath);
                } else if (stat.isFile() && entry.endsWith('.json')) {
                    // Check if file is older than max age
                    if (now - stat.mtimeMs > CACHE_MAX_AGE_MS) {
                        await fs.unlink(fullPath);
                        deletedCount++;
                    }
                }
            }
        }
        
        await scanDirectory(cachePath);
        
        if (deletedCount > 0) {
            console.log(`🧹 Cleaned up ${deletedCount} old cache files (older than 7 days)`);
        }
    } catch (error) {
        console.error('Cache cleanup error:', error.message);
    }
}

app.use(express.json());
app.use(cors());

// API documentation (Swagger UI)
const openapiPath = path.join(__dirname, '..', 'docs', 'openapi.yaml');
const openapiSpec = yaml.load(fsSync.readFileSync(openapiPath, 'utf8'));
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openapiSpec));

// Health check endpoint (useful for monitoring)
app.get("/api/health", (req, res) => {
    res.status(200).json({
        status: "OK",
        timestamp: new Date().toISOString(),
        cache: {
            enabled: true,
            directory: "/cache/users"
        }
    });
});

// WebSocket health check endpoint
app.get("/api/ws-health", (req, res) => {
    res.status(200).json({
        status: "OK",
        websocket: {
            active: true,
            message: "WebSocket server is running"
        }
    });
});

// Use Routes
app.use("/api", UserRoute);
app.use("/api",RatingRoute);
app.use("/api",DJ_Locator);
app.use("/api",ReviewsRouter);

// Initialize WebSocket after routes are set up
const io = initializeWebSocket(server);
console.log("🔌 WebSocket service initialized");

// Global error handler for uncaught exceptions
process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    // Don't crash - log and continue
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Start server (using server.listen instead of app.listen)
server.listen(PORT, async () => {
    await initializeCacheDirectory();
    
    // Run cache cleanup on startup (optional)
    await cleanupOldCacheFiles();
    
    // Schedule daily cache cleanup at 2 AM
    setInterval(async () => {
        const now = new Date();
        if (now.getHours() === 2) {
            await cleanupOldCacheFiles();
        }
    }, 60 * 60 * 1000); // Check every hour
    
    console.log(`🚀 Server is running on http://localhost:${PORT}/api/`);
    console.log(`🔌 WebSocket server is running on ws://localhost:${PORT}`);
    console.log(`📁 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Cache encryption: ${process.env.ENABLE_CACHE_ENCRYPTION === 'true' ? 'ENABLED' : 'DISABLED'}`);
});