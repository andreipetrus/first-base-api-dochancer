import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getServices } from '../services';
import { AppError } from '../middleware/errorHandler';
import { createLogger } from '../utils/logger';
import { APIEndpoint, APIParameter } from '@api-dochancer/shared';
import { extractCommonParameters } from '../utils/parameterExtractor';

const logger = createLogger();
const router = Router();

// Legacy function - now moved to utils/parameterExtractor.ts
// Keeping this comment for reference
function extractCommonParametersLegacy(endpoints: APIEndpoint[]): APIParameter[] {
  const paramMap = new Map<string, APIParameter>();
  const paramFrequency = new Map<string, number>();
  
  // Analyze all endpoints to find common parameters
  for (const endpoint of endpoints) {
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        const key = `${param.in}_${param.name}`;
        const frequency = paramFrequency.get(key) || 0;
        paramFrequency.set(key, frequency + 1);
        
        if (!paramMap.has(key)) {
          // Convert endpoint parameter to API parameter
          const apiParam: APIParameter = {
            name: param.name,
            value: param.example?.toString() || '',
            type: param.in === 'path' ? 'path' : param.in === 'query' ? 'query' : 'header',
            description: param.description,
            format: param.schema?.format,
            generated: false,
          };
          paramMap.set(key, apiParam);
        }
      }
    }
  }
  
  // Extract headers from endpoint paths (common auth headers)
  // Note: Generic parameter names like 'key', 'token', 'apikey' are NOT included here
  // because they could be query parameters. Let AI detection handle those.
  const commonHeaders = [
    'Authorization', 'X-API-Key', 'API-Key', 'X-Auth-Token', 
    'X-Access-Token', 'X-Request-ID', 'X-Session-ID'
  ];
  
  for (const headerName of commonHeaders) {
    const key = `header_${headerName}`;
    // Check if this header appears in endpoint descriptions, paths, or anywhere in the endpoint
    const isUsed = endpoints.some(ep => {
      const epString = JSON.stringify(ep).toLowerCase();
      const headerLower = headerName.toLowerCase();
      return epString.includes(headerLower) ||
             epString.includes('authentication') ||
             epString.includes('api key') ||
             epString.includes('auth');
    });
    
    if (isUsed && !paramMap.has(key)) {
      paramMap.set(key, {
        name: headerName,
        value: '',
        type: 'header',
        description: `${headerName} header for authentication`,
        generated: false,
      });
    }
  }
  
  // Return parameters that appear in at least 20% of endpoints or are auth headers
  const threshold = Math.ceil(endpoints.length * 0.2);
  const commonParams: APIParameter[] = [];
  
  for (const [key, param] of paramMap.entries()) {
    const frequency = paramFrequency.get(key) || 0;
    if (frequency >= threshold || param.type === 'header') {
      commonParams.push(param);
    }
  }
  
  // Always include Content-Type and Accept if API uses JSON
  const hasJsonEndpoints = endpoints.some(ep => 
    ep.requestBody?.content?.['application/json'] ||
    ep.responses?.some(r => r.content?.['application/json'])
  );
  
  if (hasJsonEndpoints) {
    if (!commonParams.find(p => p.name === 'Content-Type')) {
      commonParams.push({
        name: 'Content-Type',
        value: 'application/json',
        type: 'header',
        description: 'Content type header',
        generated: false,
      });
    }
    if (!commonParams.find(p => p.name === 'Accept')) {
      commonParams.push({
        name: 'Accept',
        value: 'application/json',
        type: 'header',
        description: 'Accept header',
        generated: false,
      });
    }
  }
  
  return commonParams;
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR || './uploads');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760'),
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['.pdf', '.doc', '.docx', '.html', '.htm', '.json', '.txt', '.md'];
    const ext = path.extname(file.originalname).toLowerCase();
    
    if (allowedTypes.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error(`File type ${ext} not supported`));
    }
  },
});

router.post('/file', upload.single('document'), async (req, res, next) => {
  try {
    if (!req.file) {
      throw new AppError(400, 'No file uploaded');
    }

    const { documentParser } = getServices();
    const parsedDoc = await documentParser.parseFile(req.file.path);

    logger.info(`File parsed successfully: ${req.file.originalname}`);

    // Extract common parameters from endpoints
    const extractedParams = extractCommonParameters(parsedDoc.endpoints);
    
    res.json({
      success: true,
      fileName: req.file.originalname,
      filePath: req.file.path,
      parsed: {
        title: parsedDoc.title,
        baseUrl: parsedDoc.baseUrl,
        endpointsCount: parsedDoc.endpoints.length,
        hasContent: !!parsedDoc.rawContent,
        commonParameters: extractedParams,
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/url', async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      throw new AppError(400, 'URL is required');
    }

    const { documentParser } = getServices();
    const parsedDoc = await documentParser.parseURL(url);

    logger.info(`URL parsed successfully: ${url}`);

    // Extract common parameters from endpoints
    const extractedParams = extractCommonParameters(parsedDoc.endpoints);
    
    res.json({
      success: true,
      url,
      parsed: {
        title: parsedDoc.title,
        baseUrl: parsedDoc.baseUrl,
        endpointsCount: parsedDoc.endpoints.length,
        hasContent: !!parsedDoc.rawContent,
        commonParameters: extractedParams,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as uploadRouter };