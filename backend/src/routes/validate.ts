import { Router } from 'express';
import axios from 'axios';
import Anthropic from '@anthropic-ai/sdk';
import { ValidationResult } from '@api-dochancer/shared';
import { createLogger } from '../utils/logger';
import { AppError } from '../middleware/errorHandler';

const logger = createLogger();
const router = Router();

router.post('/url', async (req, res, next) => {
  try {
    const { url } = req.body;
    
    if (!url) {
      throw new AppError(400, 'URL is required');
    }

    const validation: ValidationResult = {
      type: 'url',
      status: 'checking',
      message: 'Validating URL accessibility...',
    };

    try {
      const response = await axios.get(url, {
        headers: { 
          'User-Agent': 'API-Dochancer/1.0',
          'Accept': 'text/html,application/xhtml+xml,application/xml,application/json'
        },
        timeout: 10000,
        maxRedirects: 5,
        validateStatus: (status) => status < 500,
      });

      const contentType = response.headers['content-type'] || '';
      const isNavigable = response.status === 200;
      const isParseable = contentType.includes('text/') || 
                          contentType.includes('application/json') ||
                          contentType.includes('application/pdf');

      if (isNavigable && isParseable) {
        validation.status = 'success';
        validation.message = 'URL is accessible and parseable';
        validation.details = `Content-Type: ${contentType}, Status: ${response.status}`;
      } else if (isNavigable) {
        validation.status = 'success';
        validation.message = 'URL is accessible but may have limited parsing';
        validation.details = `Content-Type: ${contentType}, Status: ${response.status}`;
      } else {
        validation.status = 'failure';
        validation.message = `URL returned status ${response.status}`;
        validation.details = response.statusText;
      }
    } catch (error: any) {
      validation.status = 'failure';
      validation.message = 'Failed to access URL';
      validation.details = error.message;
    }

    logger.info(`URL validation: ${validation.status} for ${url}`);
    res.json(validation);
  } catch (error) {
    next(error);
  }
});

router.post('/claude-api', async (req, res, next) => {
  try {
    const { apiKey } = req.body;
    
    if (!apiKey) {
      throw new AppError(400, 'Claude API key is required');
    }

    const validation: ValidationResult = {
      type: 'claude_api',
      status: 'checking',
      message: 'Validating Claude API key...',
    };

    try {
      const client = new Anthropic({ apiKey });
      
      const response = await client.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{
          role: 'user',
          content: 'Test',
        }],
      });

      if (response && response.content) {
        validation.status = 'success';
        validation.message = 'Claude API key is valid and working';
        validation.details = 'Successfully connected to Anthropic API';
      } else {
        validation.status = 'failure';
        validation.message = 'Unexpected response from Claude API';
      }
    } catch (error: any) {
      validation.status = 'failure';
      validation.message = 'Invalid Claude API key';
      
      if (error.status === 401) {
        validation.details = 'Authentication failed - please check your API key';
      } else if (error.status === 429) {
        validation.details = 'Rate limit exceeded - key is valid but over quota';
      } else {
        validation.details = error.message || 'Failed to connect to Anthropic API';
      }
    }

    logger.info(`Claude API validation: ${validation.status}`);
    res.json(validation);
  } catch (error) {
    next(error);
  }
});

router.post('/test-api', async (req, res, next) => {
  try {
    const { apiKey, baseUrl } = req.body;
    
    if (!apiKey) {
      throw new AppError(400, 'Test API key is required');
    }

    const validation: ValidationResult = {
      type: 'test_api',
      status: 'checking',
      message: 'Validating test API key...',
    };

    try {
      const testUrl = baseUrl || 'https://api.example.com';
      
      const headers: any = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      };

      if (apiKey.toLowerCase().startsWith('bearer ')) {
        headers['Authorization'] = apiKey;
      } else if (apiKey.includes(':')) {
        const encoded = Buffer.from(apiKey).toString('base64');
        headers['Authorization'] = `Basic ${encoded}`;
      } else {
        headers['Authorization'] = `Bearer ${apiKey}`;
        headers['X-API-Key'] = apiKey;
        headers['api-key'] = apiKey;
      }

      const response = await axios.get(testUrl, {
        headers,
        timeout: 10000,
        validateStatus: (status) => status < 500,
      });

      if (response.status === 401 || response.status === 403) {
        validation.status = 'failure';
        validation.message = 'API key authentication failed';
        validation.details = `Status ${response.status}: ${response.statusText}`;
      } else if (response.status >= 200 && response.status < 300) {
        validation.status = 'success';
        validation.message = 'Test API key is valid';
        validation.details = `Successfully authenticated with status ${response.status}`;
      } else if (response.status === 404) {
        validation.status = 'success';
        validation.message = 'API key appears valid (endpoint not found is expected)';
        validation.details = 'Authentication passed but specific endpoint not found';
      } else {
        validation.status = 'success';
        validation.message = 'API key validation inconclusive';
        validation.details = `Received status ${response.status} - key may be valid`;
      }
    } catch (error: any) {
      if (error.response?.status === 401 || error.response?.status === 403) {
        validation.status = 'failure';
        validation.message = 'Invalid test API key';
        validation.details = 'Authentication failed';
      } else if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        validation.status = 'failure';
        validation.message = 'Cannot connect to API server';
        validation.details = baseUrl ? `Cannot reach ${baseUrl}` : 'No base URL provided';
      } else {
        validation.status = 'success';
        validation.message = 'API key validation skipped';
        validation.details = 'Could not verify but will proceed';
      }
    }

    logger.info(`Test API validation: ${validation.status}`);
    res.json(validation);
  } catch (error) {
    next(error);
  }
});

export { router as validateRouter };