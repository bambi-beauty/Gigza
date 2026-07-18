import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_ROOT = path.join(__dirname, '../../cache/users');
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

// Ensure cache directory exists
await fs.mkdir(CACHE_ROOT, { recursive: true });

// Helper: Get sharded file path for a user
function getUserCachePath(userId) {
    const safeId = String(userId);
    const shard = safeId.slice(0, 2);
    const shardDir = path.join(CACHE_ROOT, shard);
    return path.join(shardDir, `${safeId}.json`);
}

// Helper: Atomic write with optional encryption
async function atomicWrite(filePath, data) {
    const tempPath = `${filePath}.tmp.${Date.now()}.${crypto.randomBytes(4).toString('hex')}`;
    
    let dataToWrite;
    if (process.env.ENABLE_CACHE_ENCRYPTION === 'true') {
        const key = Buffer.from(process.env.CACHE_ENCRYPTION_KEY, 'hex');
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
        let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
        encrypted += cipher.final('hex');
        dataToWrite = JSON.stringify({ iv: iv.toString('hex'), data: encrypted });
    } else {
        dataToWrite = JSON.stringify(data);
    }
    
    await fs.writeFile(tempPath, dataToWrite);
    await fs.rename(tempPath, filePath);
}

// Write user data to cache
export async function writeUserToCache(userId, userData) {
    try {
        if (!userId) return false;
        
        const filePath = getUserCachePath(userId);
        const dir = path.dirname(filePath);
        await fs.mkdir(dir, { recursive: true });
        
        const cacheEntry = {
            version: Date.now(),
            userId: userId,
            data: userData,
            expiresAt: Date.now() + CACHE_TTL_MS
        };
        
        await atomicWrite(filePath, cacheEntry);
        return true;
    } catch (err) {
        console.error(`Cache write failed for user ${userId}:`, err.message);
        return false;
    }
}

// Read user data from cache
export async function readUserFromCache(userId) {
    try {
        if (!userId) return null;
        
        const filePath = getUserCachePath(userId);
        const raw = await fs.readFile(filePath, 'utf8');
        
        let cached;
        if (process.env.ENABLE_CACHE_ENCRYPTION === 'true') {
            const { iv, data } = JSON.parse(raw);
            const key = Buffer.from(process.env.CACHE_ENCRYPTION_KEY, 'hex');
            const decipher = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(iv, 'hex'));
            let decrypted = decipher.update(data, 'hex', 'utf8');
            decrypted += decipher.final('utf8');
            cached = JSON.parse(decrypted);
        } else {
            cached = JSON.parse(raw);
        }
        
        // Check if cache is expired
        if (cached.expiresAt < Date.now()) {
            await fs.unlink(filePath).catch(() => {});
            return null;
        }
        
        return cached.data;
    } catch (err) {
        if (err.code === 'ENOENT') return null;
        console.error(`Cache read failed for user ${userId}:`, err.message);
        return null;
    }
}

// Delete user cache (when user updates profile)
export async function invalidateUserCache(userId) {
    try {
        if (!userId) return false;
        
        const filePath = getUserCachePath(userId);
        await fs.unlink(filePath).catch(() => {});
        return true;
    } catch (err) {
        return false;
    }
}