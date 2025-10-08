import { Router } from 'express';
import { getServices } from '../services';
import { AppError } from '../middleware/errorHandler';
import { ProcessingStatus } from '@api-dochancer/shared';
import { createLogger } from '../utils/logger';
import { extractCommonParameters } from '../utils/parameterExtractor';

const logger = createLogger();
const router = Router();

router.post('/extract', async (req, res, next) => {
  try {
    const { filePath, url, productUrl, claudeApiKey } = req.body;
    
    if (!filePath && !url) {
      throw new AppError(400, 'Either filePath or url is required');
    }

    const { documentParser, apiExtractor, claudeService } = getServices();

    if (claudeApiKey) {
      claudeService.initialize(claudeApiKey);
    }

    const status: ProcessingStatus = {
      step: 'parsing',
      progress: 10,
      message: 'Parsing document...',
    };
    
    const parsedDoc = filePath 
      ? await documentParser.parseFile(filePath)
      : await documentParser.parseURL(url);

    status.step = 'extracting';
    status.progress = 40;
    status.message = 'Extracting API endpoints...';

    let endpoints = await apiExtractor.extractAndEnhance(parsedDoc, productUrl);

    // If Claude API key is provided, extract detailed information from documentation
    if (claudeApiKey && claudeService.isInitialized()) {
      status.step = 'analyzing';
      status.progress = 60;
      status.message = 'Analyzing endpoint documentation...';
      
      logger.info(`Extracting detailed information for ${endpoints.length} endpoints...`);
      
      const detailExtractionPromises = endpoints.map(endpoint => 
        claudeService.extractEndpointDetails(endpoint)
      );
      endpoints = await Promise.all(detailExtractionPromises);
      
      logger.info('Endpoint detail extraction complete');
    }

    // Extract common parameters AFTER documentation has been fetched and processed
    status.step = 'extracting-params';
    status.progress = 90;
    status.message = 'Extracting API parameters...';
    
    const extractedParameters = extractCommonParameters(endpoints);
    logger.info(`Extracted ${extractedParameters.length} common parameters`);

    status.step = 'complete';
    status.progress = 100;
    status.message = `Extracted ${endpoints.length} endpoints`;

    logger.info(`Extraction complete: ${endpoints.length} endpoints found`);

    res.json({
      success: true,
      status,
      result: {
        title: parsedDoc.title,
        description: parsedDoc.description,
        version: parsedDoc.version,  // This now includes the inferred version
        baseUrl: parsedDoc.baseUrl,
        endpoints,
        commonParameters: extractedParameters,  // Include extracted parameters
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/test', async (req, res, next) => {
  try {
    const { endpoints, baseUrl, testApiKey, claudeApiKey, apiParameters } = req.body;
    
    if (!endpoints || !Array.isArray(endpoints)) {
      throw new AppError(400, 'Endpoints array is required');
    }

    const { apiTester, claudeService } = getServices();

    if (claudeApiKey) {
      claudeService.initialize(claudeApiKey);
    }

    apiTester.configure(baseUrl || '', testApiKey || '', claudeService, apiParameters);

    const status: ProcessingStatus = {
      step: 'testing',
      progress: 50,
      message: `Testing ${endpoints.length} endpoints...`,
    };

    const testedEndpoints = await apiTester.testAllEndpoints(endpoints);

    const successCount = testedEndpoints.filter(e => e.testResult?.status === 'success').length;
    const warningCount = testedEndpoints.filter(e => e.testResult?.status === 'warning').length;
    const failureCount = testedEndpoints.filter(e => e.testResult?.status === 'failure').length;

    status.step = 'complete';
    status.progress = 100;
    status.message = `Testing complete: ${successCount} success, ${warningCount} warnings, ${failureCount} failures`;
    status.details = {
      total: endpoints.length,
      success: successCount,
      warnings: warningCount,
      failures: failureCount,
    };

    logger.info(`API testing complete: ${status.message}`);

    res.json({
      success: true,
      status,
      endpoints: testedEndpoints,
    });
  } catch (error) {
    next(error);
  }
});

export { router as processRouter };