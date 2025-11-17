# Memory Optimization Guide

## High RAM Consuming Processes Identified

### 1. **TypeScript Build Process** ⚠️ HIGH IMPACT
- **Issue**: TypeScript compilation can consume significant memory during build
- **Solution**: Added `--max-old-space-size=2048` (2GB) to build script
- **Location**: `package.json` → `build` script

### 2. **XLSX Library** ⚠️ HIGH IMPACT
- **Issue**: The `xlsx` library loads entire Excel files into memory
- **Solution**: 
  - Added 10MB file size limit to Multer uploads
  - Added file size validation in upload handler
- **Location**: 
  - `src/modules/ui/ui.controller.ts` → File upload endpoint
  - `src/common/utils/sheet-parser.util.ts` → Excel parsing

### 3. **Session Storage** ⚠️ MEDIUM IMPACT
- **Issue**: In-memory session storage accumulates data over time
- **Solution**: 
  - Changed `resave: false` (don't save unchanged sessions)
  - Changed `saveUninitialized: false` (don't save empty sessions)
  - Added `rolling: true` for better expiration management
- **Location**: `src/main.ts`

### 4. **Google Sheets API** ⚠️ MEDIUM IMPACT
- **Issue**: Fetching large ranges (A1:Z1000) can consume memory
- **Solution**: 
  - Added `maxRows` parameter with default limit of 1000 rows
  - Made range calculation more explicit
- **Location**: `src/modules/google/google.service.ts`

### 5. **Body Parser** ⚠️ MEDIUM IMPACT
- **Issue**: No limits on request body size
- **Solution**: Added 10MB limits to JSON and URL-encoded parsers
- **Location**: `src/main.ts`

### 6. **Runtime Memory** ⚠️ HIGH IMPACT
- **Issue**: Node.js default heap size may be insufficient
- **Solution**: Added `--max-old-space-size=1024` (1GB) to production start script
- **Location**: `package.json` → `start:prod` script

## Changes Made

### 1. Package.json Scripts
```json
"build": "node --max-old-space-size=2048 node_modules/@nestjs/cli/bin/nest.js build"
"start:prod": "node --max-old-space-size=1024 dist/main"
```

### 2. Render Configuration (render.yaml)
- Added memory-optimized build command
- Added memory-optimized start command
- Configured for Render's free tier

### 3. Session Configuration
- Optimized to reduce memory footprint
- Changed from saving all sessions to only modified ones

### 4. File Upload Limits
- 10MB maximum file size
- Validation at multiple levels

### 5. TypeScript Configuration
- Disabled source maps in production (reduces build memory)
- Added transpileOnly for ts-node

## Additional Recommendations

### For Production (If Still Experiencing Issues):

1. **Use Redis for Session Storage**
   ```bash
   npm install connect-redis redis
   ```
   - Move sessions out of memory
   - Better for horizontal scaling

2. **Consider Streaming for Large Files**
   - For very large Excel files, consider streaming parsers
   - Alternative: `exceljs` with streaming support

3. **Database Connection Pooling**
   - Already configured (max: 10 connections)
   - Monitor connection usage

4. **Upgrade Render Plan**
   - Free tier: 512MB RAM
   - Starter tier: 512MB RAM (but better performance)
   - Standard tier: 2GB+ RAM (recommended for production)

5. **Monitor Memory Usage**
   - Add memory monitoring endpoints
   - Log memory usage periodically

## Testing the Optimizations

1. **Build Test**: Run `npm run build` - should complete without OOM errors
2. **Upload Test**: Try uploading files > 10MB - should be rejected
3. **Deploy Test**: Deploy to Render and monitor memory usage

## Environment Variables

Make sure these are set in Render:
- `NODE_ENV=production`
- `PORT=10000` (or Render's assigned port)
- `DATABASE_URL` (your PostgreSQL connection string)
- `SESSION_SECRET` (secure random string)
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URL`
- Other required env vars

## Notes

- The XLSX library limitation is inherent - it loads entire files into memory
- For files > 10MB, consider splitting them or using alternative processing methods
- Free tier on Render has 512MB RAM limit - these optimizations should help stay within that



