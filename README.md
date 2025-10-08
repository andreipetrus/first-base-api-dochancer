# API DocHancer v1.1

An open-source application that transforms existing API documentation into OpenAPI-compliant specifications with AI-powered enhancements. No backend modifications required - simply reorganize, enhance, and provide a Swagger interface for real-time API testing.

## Features

- **Multi-Format Support**: Accept documentation via URL upload or files (PDF, DOC, DOCX, HTML, JSON, TXT, MD)
- **AI-Powered Enhancement**: Integrate with Claude AI to categorize endpoints, improve descriptions, and fix grammar
- **Automatic API Testing**: Test endpoints with generated dummy data and report issues
- **OpenAPI 3.0 Generation**: Create standard-compliant OpenAPI specifications
- **Interactive Swagger UI**: Test APIs in real-time with custom or generated data
- **Chat Interface**: Iteratively improve documentation through AI conversation
- **Downloadable Output**: Export complete HTML documentation bundle

## Architecture

- **Frontend**: React + TypeScript + Material-UI + Vite
- **Backend**: Node.js + Express + TypeScript  
- **AI Integration**: Anthropic Claude API
- **Testing**: Playwright for E2E testing
- **Monorepo Structure**: NPM workspaces for shared types

### Dependencies

#### Frontend
- React 18.x - UI framework
- TypeScript 5.x - Type safety
- Material-UI 5.x - Component library
- Vite 5.x - Build tool and dev server
- Axios - HTTP client
- React Markdown - Markdown rendering

#### Backend  
- Express 4.x - Web framework
- TypeScript 5.x - Type safety
- Multer - File upload handling
- PDF-parse - PDF parsing
- Mammoth - DOCX parsing
- Anthropic SDK - Claude AI integration
- Swagger UI - OpenAPI documentation viewer

#### Testing
- Playwright 1.56+ - E2E testing framework
- @playwright/test - Test runner and assertions

#### Development
- Concurrently - Run multiple npm scripts
- ESLint - Code linting
- TSX - TypeScript execution for Node.js

## Core Contributors

- **Andrei Petrus** - `andrei[dot]petrus[at]live[dot]com`

## Prerequisites

- Node.js 18+ and npm 9+
- npm 9+ (for workspace support)
- Claude API key from Anthropic
- (Optional) API key for testing authenticated endpoints

## Installation

1. Clone the repository:
```bash
git clone https://github.com/andreipetrus/first-base-api-dochancer.git
cd first-base-api-dochancer
```

2. Install dependencies:
```bash
npm install
```

3. Install Playwright for E2E testing:
```bash
npx playwright install
```

4. Configure environment (optional):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your preferences
```

5. For development testing (optional):
Create `frontend/.env.local` and `backend/.env.local` with test credentials:
```bash
# frontend/.env.local
VITE_TEST_MODE=true
VITE_TEST_CLAUDE_KEY=your-claude-api-key
VITE_TEST_API_KEY=your-test-api-key
VITE_TEST_BASE_URL=https://api.example.com
VITE_TEST_DOC_URL=https://api.example.com/docs

# backend/.env.local
TEST_MODE=true
```
**Note**: `.env.local` files are gitignored and never committed

## Usage

1. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend server on http://localhost:3001
- Frontend application on http://localhost:5173

2. Open the frontend in your browser and follow the workflow:
   - **Step 1**: Upload documentation file or provide URL
   - **Step 2**: Configure API keys (Claude API key required)
   - **Step 3**: Automatic processing and extraction
   - **Step 4**: Review extracted endpoints and test results
   - **Step 5**: Generate and download documentation

## Workflow Steps

### 1. Input Documentation
- Upload files: PDF, DOC, DOCX, HTML, JSON, TXT, MD
- Or provide a URL to existing documentation
- Optionally add product URL for context

### 2. Configuration
- **Claude API Key** (required): For AI processing
- **Test API Key** (optional): For endpoint testing
- **Base URL** (optional): API base URL for testing
- **Product URL** (optional): For additional context

### 3. Processing
The app will:
- Parse and extract API endpoints
- Understand endpoint functionality
- Categorize endpoints by user flows
- Fix grammar and spelling
- Test endpoints with dummy data (if configured)

### 4. Review
- View categorized endpoints
- See test results (success/warning/failure)
- Review endpoint details

### 5. Generate Documentation
- Creates OpenAPI 3.0 specification
- Generates interactive Swagger UI
- Provides downloadable HTML bundle
- Offers AI chat for improvements

## API Endpoints

### Backend Routes

- `POST /api/upload/file` - Upload documentation file
- `POST /api/upload/url` - Fetch documentation from URL
- `POST /api/process/extract` - Extract and enhance endpoints
- `POST /api/process/test` - Test API endpoints
- `POST /api/generate/openapi` - Generate OpenAPI spec
- `POST /api/generate/html` - Create HTML documentation
- `GET /api/generate/download/:fileName` - Download bundle
- `POST /api/chat/message` - AI chat interaction
- `GET /api/preview/:fileName` - Preview generated docs

## Testing Infrastructure

### Playwright E2E Testing

The project includes comprehensive end-to-end testing using Playwright:

#### Test Structure
```
tests/
├── e2e/
│   ├── fixtures/         # Test data and configurations
│   ├── helpers/          # Test utilities and custom fixtures
│   ├── upload.spec.ts    # Upload flow tests
│   ├── full-workflow.spec.ts  # Complete workflow tests
│   ├── preview.spec.ts   # Preview functionality tests
│   └── start-over.spec.ts # Start over functionality tests
├── playwright.config.ts  # Playwright configuration
└── playwright-report/    # HTML test reports
```

#### Running Tests

Before running tests, ensure the development servers are running:
```bash
npm run dev
```

Then run tests:
```bash
# Run all tests headless
npm run test:e2e

# Run tests with browser visible
npm run test:e2e:headed

# Debug tests interactively
npm run test:e2e:debug

# Open Playwright UI
npm run test:e2e:ui

# Run specific test suite
npm run test:upload
npm run test:workflow
npm run test:preview
```

#### Test Configuration

Tests are configured to:
- Run in headless mode by default
- Use Chromium browser
- Capture screenshots on failure
- Record videos on failure
- Generate trace files for debugging
- Reuse existing dev servers
- Generate HTML reports in `playwright-report/`

## Development

### Project Structure
```
/
├── frontend/          # React frontend (Vite + TypeScript)
├── backend/           # Express backend (Node.js + TypeScript)
├── shared/            # Shared TypeScript types
├── tests/             # E2E tests with Playwright
├── playwright-report/ # Test reports
├── test-results/      # Test artifacts
└── package.json       # Root package with workspaces
```

### Available Scripts

#### Development
- `npm run dev` - Start both frontend and backend in development mode
- `npm run dev:frontend` - Start only the frontend
- `npm run dev:backend` - Start only the backend

#### Building
- `npm run build` - Build all packages for production
- `npm run build:shared` - Build shared types package
- `npm run build:backend` - Build backend
- `npm run build:frontend` - Build frontend
- `npm start` - Start production server

#### Testing
- `npm run test` - Run unit tests in all workspaces
- `npm run test:e2e` - Run all Playwright E2E tests (headless)
- `npm run test:e2e:headed` - Run Playwright tests with browser visible
- `npm run test:e2e:debug` - Debug Playwright tests interactively
- `npm run test:e2e:ui` - Open Playwright UI mode
- `npm run test:e2e:report` - Show last test run report
- `npm run test:upload` - Run upload flow tests only
- `npm run test:workflow` - Run full workflow tests only
- `npm run test:preview` - Run preview feature tests only

#### Code Quality
- `npm run lint` - Lint all packages

### Building for Production

```bash
npm run build
npm start
```

## Configuration

### Environment Variables (backend/.env)

- `PORT` - Backend server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `CORS_ORIGIN` - Frontend URL for CORS
- `UPLOAD_DIR` - Directory for uploaded files
- `GENERATED_DIR` - Directory for generated docs
- `MAX_FILE_SIZE` - Maximum upload size in bytes

## Contributing

1. Fork the repository
2. Create a feature branch
3. Commit your changes
4. Push to the branch
5. Open a Pull Request

## License

MIT

## Support

For issues and feature requests, please use the [GitHub Issues](https://github.com/andreipetrus/first-base-api-dochancer/issues) page.
