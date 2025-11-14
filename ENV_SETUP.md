# Environment Variables Setup Guide

## Quick Reference - .env File Template

Create a `.env` file in the root directory with the following content:

```env
# ============================================
# Google OAuth Configuration
# ============================================
# Get these from: https://console.cloud.google.com/
# 1. Create a project or select existing one
# 2. Enable "Google Sheets API" and "Google Drive API"
# 3. Go to "Credentials" > "Create Credentials" > "OAuth 2.0 Client ID"
# 4. Application type: Web application
# 5. Authorized redirect URIs: http://localhost:3000/auth/google/callback
GOOGLE_CLIENT_ID=your-google-client-id-here.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-google-client-secret-here
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback

# ============================================
# Trello API Configuration
# ============================================
# Get these from: https://developer.atlassian.com/cloud/trello/
# 1. Go to: https://trello.com/app-key
# 2. Copy your "API Key"
# 3. Generate a "Token" with read/write permissions
TRELLO_API_KEY=your-trello-api-key-here
TRELLO_TOKEN=your-trello-token-here

# ============================================
# n8n Integration (Optional)
# ============================================
# Only needed if you want to use n8n workflows instead of direct Trello API
# Leave empty if using direct API mode
N8N_WEBHOOK_URL=
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id

# ============================================
# Database Configuration
# ============================================
# PostgreSQL connection string
# Format: postgresql://username:password@host:port/database_name
DATABASE_URL=postgresql://postgres:password@localhost:5432/n8n_automation

# ============================================
# Session Configuration
# ============================================
# Secret key for session encryption
# Generate a strong random string for production
# You can generate one using: openssl rand -base64 32 (for mac) OR 
[Convert]::ToBase64String((1..32 | ForEach-Object {Get-Random -Minimum 0 -Maximum 256}))  (for windows - in powershell)
SESSION_SECRET=your-super-secret-key-change-this-in-production-min-32-chars

# ============================================
# Encryption Configuration
# ============================================
# Secret key for encrypting Trello API credentials in database
# This should be a strong random string (32+ characters)
# Generate using: openssl rand -base64 32  (use wsl terminal)
# IMPORTANT: Keep this secret safe! If changed, existing encrypted data cannot be decrypted.
ENCRYPTION_KEY=your-encryption-key-for-trello-credentials-min-32-chars

# ============================================
# Server Configuration
# ============================================
PORT=3000
NODE_ENV=development
```

---

## Detailed Setup Instructions

### 1. Google OAuth Setup

**Step 1:** Go to [Google Cloud Console](https://console.cloud.google.com/)

**Step 2:** Create or select a project

**Step 3:** Enable APIs
- Go to "APIs & Services" > "Library"
- Enable: **Google Sheets API**
- Enable: **Google Drive API**

**Step 4:** Create OAuth Credentials
- Go to "APIs & Services" > "Credentials"
- Click "Create Credentials" > "OAuth 2.0 Client ID"
- If prompted, configure OAuth consent screen:
  - User Type: External
  - App name: "Sheet to Trello Automation"
  - Add scopes: `.../auth/spreadsheets.readonly` and `.../auth/drive.readonly`
- Application type: **Web application**
- Authorized redirect URIs: `http://localhost:3000/auth/google/callback`

**Step 5:** Copy credentials
- Client ID → `GOOGLE_CLIENT_ID`
- Client Secret → `GOOGLE_CLIENT_SECRET`

**Example:**
```env
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback
```

---

### 2. Trello API Setup

**Step 1:** Get API Key
- Visit: https://trello.com/app-key
- Copy your "API Key" → `TRELLO_API_KEY`

**Step 2:** Generate Token
- On the same page, scroll to "Token" section
- Click "Generate a Token"
- Authorize the application
- Copy the token → `TRELLO_TOKEN`

**Example:**
```env
TRELLO_API_KEY=your-32-character-api-key-here
TRELLO_TOKEN=your-64-character-token-here
```

---

### 3. n8n Integration (Optional)

Only needed if using n8n workflows instead of direct Trello API.

**Step 1:** Set up n8n instance
- Install and run n8n (self-hosted or cloud)
- Create a workflow with a Webhook node

**Step 2:** Copy webhook URL
- From your n8n workflow, copy the webhook URL

**Example:**
```env
# Leave empty if not using n8n
N8N_WEBHOOK_URL=

# Or if using n8n:
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/abc123def456
```

---

### 4. Database Setup

**PostgreSQL Connection String Format:**
```
postgresql://username:password@host:port/database_name
```

**Local PostgreSQL:**
```env
DATABASE_URL=postgresql://postgres:mypassword@localhost:5432/n8n_automation
```

**Steps:**
1. Install PostgreSQL (if not installed)
2. Create database:
   ```sql
   CREATE DATABASE n8n_automation;
   ```
3. Update connection string with your credentials

**Cloud Database Examples:**

Supabase:
```env
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

Railway:
```env
DATABASE_URL=postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/railway
```

---

### 5. Session Secret

Generate a strong random string:

**Using OpenSSL:**
```bash
openssl rand -base64 32
```

**Using Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

**Example:**
```env
SESSION_SECRET=super-secret-key-minimum-32-characters-long-for-security
```

⚠️ **Important:** Use a different secret for production!

---

### 6. Server Configuration

```env
PORT=3000
NODE_ENV=development
```

For production:
```env
PORT=3000
NODE_ENV=production
```

---

## Complete Example .env File

```env
# Google OAuth
GOOGLE_CLIENT_ID=123456789-abcdefghijklmnop.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=GOCSPX-abcdefghijklmnopqrstuvwxyz
GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback

# Trello API
TRELLO_API_KEY=your-trello-api-key-here
TRELLO_TOKEN=your-trello-token-here

# n8n (Optional - leave empty if not using)
N8N_WEBHOOK_URL=

# Database
DATABASE_URL=postgresql://postgres:password@localhost:5432/n8n_automation

# Session
SESSION_SECRET=your-super-secret-key-change-this-in-production-min-32-chars

# Encryption (for Trello credentials)
ENCRYPTION_KEY=your-encryption-key-for-trello-credentials-min-32-chars

# Server
PORT=3000
NODE_ENV=development
```

---

## Verification

After creating your `.env` file:

1. **Check file exists:**
   ```bash
   # Windows
   dir .env
   
   # Linux/Mac
   ls -la .env
   ```

2. **Start the application:**
   ```bash
   npm run start:dev
   ```

3. **Check for errors** - The app should start without environment variable errors

---

## Security Notes

⚠️ **Never commit `.env` to version control!**

- The `.gitignore` file already excludes `.env`
- Use different secrets for development and production
- Rotate secrets regularly in production

---

## Troubleshooting

### "DATABASE_URL is not defined"
- Make sure `.env` file exists in the root directory
- Check the connection string format
- Verify PostgreSQL is running

### "GOOGLE_CLIENT_ID is not defined"
- Verify Google OAuth credentials are set
- Check for typos in variable names
- Ensure no extra spaces around `=`

### "TRELLO_API_KEY is not defined"
- Verify Trello API credentials are set
- Make sure token has proper permissions

### Session not persisting
- Check `SESSION_SECRET` is set
- Use a strong secret (32+ characters)
- Clear browser cookies and try again

