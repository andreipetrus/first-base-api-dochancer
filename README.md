# API DocHancer

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
- **Monorepo Structure**: NPM workspaces for shared types

## Prerequisites

- Node.js 18+ and npm 9+
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

3. Configure environment (optional):
```bash
cp backend/.env.example backend/.env
# Edit backend/.env with your preferences
```

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

## Development

### Project Structure
```
/
├── frontend/          # React frontend
├── backend/           # Express backend
├── shared/            # Shared TypeScript types
└── package.json       # Root package with workspaces
```

### Available Scripts

- `npm run dev` - Start both frontend and backend
- `npm run build` - Build all packages
- `npm run test` - Run tests
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