# n8n Automation - Sheet to Trello

A production-ready NestJS monolithic application that automates Trello card creation from Google Sheets or Excel files. Features Google OAuth authentication, Google Sheets/Drive integration, Trello API integration, and optional n8n workflow support.

## Features

- 🔐 **Google OAuth Authentication** - Secure login with Google accounts
- 📊 **Google Sheets Integration** - Read data directly from Google Sheets
- 📁 **File Upload Support** - Upload Excel/CSV files for processing
- 🎯 **Trello Integration** - Automatically create cards from milestone data
- 🔄 **n8n Workflow Support** - Optional integration with self-hosted n8n instances
- 🎨 **Modern UI** - Server-rendered UI with TailwindCSS
- 🏗️ **Clean Architecture** - Modular structure with service-repository pattern
- ✅ **Type Safety** - Full TypeScript support with Drizzle ORM

## Tech Stack

- **Framework**: NestJS (latest)
- **Database**: PostgreSQL with Drizzle ORM
- **Template Engine**: EJS
- **Styling**: TailwindCSS
- **Authentication**: Passport.js with Google OAuth
- **File Processing**: XLSX parser
- **APIs**: Google Sheets API, Google Drive API, Trello REST API

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL database
- Google Cloud Project with OAuth credentials
- Trello API Key and Token
- (Optional) Self-hosted n8n instance

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd n8n-automation-sheet-to-trello
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   Create a `.env` file in the root directory:
   ```env
   # Google OAuth
   GOOGLE_CLIENT_ID=your-google-client-id
   GOOGLE_CLIENT_SECRET=your-google-client-secret
   GOOGLE_REDIRECT_URL=http://localhost:3000/auth/google/callback

   # Trello API
   TRELLO_API_KEY=your-trello-api-key
   TRELLO_TOKEN=your-trello-token

   # n8n Integration (Optional)
   N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/your-webhook-id

   # Database
   DATABASE_URL=postgresql://user:password@localhost:5432/n8n_automation

   # Session
   SESSION_SECRET=your-secret-key-change-in-production

   # Server
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up the database**
   ```bash
   # Run migrations
   npm run db:migrate
   ```

5. **Build the application**
   ```bash
   npm run build
   ```

6. **Start the application**
   ```bash
   # Development
   npm run start:dev

   # Production
   npm run start:prod
   ```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable Google Sheets API and Google Drive API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## Trello API Setup

1. Go to [Trello Developer Portal](https://developer.atlassian.com/cloud/trello/)
2. Generate an API key
3. Create a token with read/write permissions
4. Copy API Key and Token to `.env`

## Usage

### 1. Login
Navigate to `http://localhost:3000/login` and sign in with Google.

### 2. Select or Upload Data Source
- **Option A**: Select a Google Sheet from your Drive
- **Option B**: Upload an Excel/CSV file

### 3. Configure Trello
- Select a Trello board
- Select a list within the board
- (Optional) Enable n8n workflow mode

### 4. Review and Run
- Review the workflow configuration
- Click "Run Workflow" to create Trello cards

### 5. View Results
- Check the workflow status page for execution logs
- View created cards and any errors

## Excel File Format

Your Excel/CSV file should have the following columns (case-insensitive):

- **Title** (required) - Card title
- **Description** (optional) - Card description
- **Due Date** (optional) - Card due date
- **Owner** (optional) - Assigned owner
- **Priority** (optional) - Priority level
- **Status** (optional) - Current status

Example:
```
Title              | Description        | Due Date   | Owner | Priority | Status
-------------------|--------------------|------------|-------|----------|--------
Milestone 1        | First milestone    | 2024-01-15 | John  | High     | In Progress
Milestone 2        | Second milestone   | 2024-01-20 | Jane  | Medium   | Pending
```

## n8n Integration

To use n8n workflows instead of direct Trello API:

1. Set up a webhook in your n8n instance
2. Configure the webhook to receive milestone data
3. Enable "Use n8n Workflow" option in the UI
4. Enter your n8n webhook URL

The webhook will receive:
```json
{
  "milestones": [
    {
      "title": "Milestone 1",
      "description": "Description",
      "dueDate": "2024-01-15",
      "owner": "John",
      "priority": "High",
      "status": "In Progress"
    }
  ],
  "trelloBoardId": "board-id",
  "trelloListId": "list-id",
  "sheetName": "Sheet Name"
}
```

## Project Structure

```
src/
├── modules/
│   ├── auth/          # Authentication module
│   ├── google/         # Google Sheets/Drive integration
│   ├── trello/         # Trello API integration
│   ├── workflows/      # Workflow management
│   ├── ui/             # SSR UI controllers
│   └── n8n/            # n8n integration
├── database/
│   ├── schema/         # Drizzle ORM schemas
│   ├── migrations/     # Database migrations
│   └── repositories/   # Repository pattern
├── common/
│   ├── dto/            # Data Transfer Objects
│   ├── filters/        # Exception filters
│   ├── guards/         # Auth guards
│   ├── interceptors/   # Response interceptors
│   └── utils/          # Utility functions
├── config/             # Configuration module
└── main.ts             # Application entry point

views/                  # EJS templates
public/                 # Static assets
```

## API Endpoints

### Authentication
- `GET /auth/google` - Initiate Google OAuth
- `GET /auth/google/callback` - OAuth callback
- `GET /auth/logout` - Logout

### UI Routes
- `GET /login` - Login page
- `GET /dashboard` - Dashboard
- `GET /sheet/select` - Select Google Sheet
- `GET /trello/select` - Select Trello board/list
- `GET /workflow/review/:id` - Review workflow
- `GET /workflow/status/:id` - View workflow status

### API Routes
- `POST /api/workflows` - Create workflow
- `GET /api/workflows` - List workflows
- `GET /api/workflows/:id` - Get workflow
- `POST /api/workflows/:id/run` - Run workflow
- `POST /sheet/upload` - Upload Excel file
- `GET /trello/boards/:boardId/lists` - Get Trello lists

## Development

```bash
# Run in development mode
npm run start:dev

# Run migrations
npm run db:migrate

# Generate new migration
npm run db:generate

# Lint code
npm run lint

# Format code
npm run format
```

## Production Deployment

1. Set `NODE_ENV=production` in `.env`
2. Use a strong `SESSION_SECRET`
3. Update `GOOGLE_REDIRECT_URL` to production URL
4. Ensure PostgreSQL is accessible
5. Build and start:
   ```bash
   npm run build
   npm run start:prod
   ```

## License

MIT

## Support

For issues and questions, please open an issue in the repository.

