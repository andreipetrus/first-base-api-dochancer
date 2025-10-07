import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import archiver from 'archiver';
import { getServices } from '../services';
import { AppError } from '../middleware/errorHandler';
import { createLogger } from '../utils/logger';

const logger = createLogger();
const router = Router();

router.post('/openapi', async (req, res, next) => {
  try {
    const { endpoints, metadata, productUrl, documentationUrl, claudeApiKey } = req.body;
    
    if (!endpoints || !Array.isArray(endpoints)) {
      throw new AppError(400, 'Endpoints array is required');
    }

    const { openAPIGenerator, claudeService } = getServices();
    
    let enhancedMetadata = { ...metadata };
    let enhancedEndpoints = endpoints;
    
    // If Claude API key is provided, enhance documentation
    if (claudeApiKey) {
      try {
        claudeService.initialize(claudeApiKey);
        
        // Generate product intro
        logger.info('Generating product introduction...');
        const productIntro = await claudeService.generateProductIntro(
          productUrl,
          documentationUrl,
          metadata?.description
        );
        enhancedMetadata.productIntro = productIntro;
        
        // Enhance endpoint documentation (process in parallel for speed)
        logger.info(`Enhancing documentation for ${endpoints.length} endpoints...`);
        const enhancementPromises = endpoints.map(endpoint => 
          claudeService.enhanceEndpointDocumentation(endpoint)
        );
        enhancedEndpoints = await Promise.all(enhancementPromises);
        
        logger.info('Documentation enhancement complete');
      } catch (error) {
        logger.error('Error enhancing documentation:', error);
        // Continue with original endpoints if enhancement fails
      }
    }
    
    // Ensure version is passed through metadata
    const openApiSpec = openAPIGenerator.generate(enhancedEndpoints, enhancedMetadata);
    
    logger.info(`OpenAPI specification generated successfully (version: ${metadata?.version || '1.0.0'})`);

    res.json({
      success: true,
      spec: openApiSpec,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/html', async (req, res, next) => {
  try {
    const { spec } = req.body;
    
    if (!spec) {
      throw new AppError(400, 'OpenAPI specification is required');
    }

    const { openAPIGenerator } = getServices();
    const outputDir = path.resolve(process.env.GENERATED_DIR || './generated');
    
    const documentation = await openAPIGenerator.createBundle(spec, outputDir);
    
    logger.info(`HTML documentation generated: ${documentation.htmlBundle}`);

    res.json({
      success: true,
      fileName: documentation.htmlBundle,
      warnings: documentation.warnings,
      downloadUrl: `/api/generate/download/${documentation.htmlBundle}`,
      previewUrl: `/api/preview/docs/${documentation.htmlBundle}`,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/download/:fileName', (req, res, next) => {
  try {
    const { fileName } = req.params;
    const generatedDir = path.resolve(process.env.GENERATED_DIR || './generated');
    
    const htmlFile = path.join(generatedDir, `${fileName}.html`);
    const specFile = path.join(generatedDir, `${fileName}-spec.json`);
    
    if (!fs.existsSync(htmlFile)) {
      throw new AppError(404, 'File not found');
    }

    const zipFileName = `${fileName}.zip`;
    const archive = archiver('zip', {
      zlib: { level: 9 }
    });
    
    res.attachment(zipFileName);
    archive.pipe(res);
    
    archive.file(htmlFile, { name: 'index.html' });
    if (fs.existsSync(specFile)) {
      archive.file(specFile, { name: 'openapi-spec.json' });
    }
    
    archive.finalize();
    
    logger.info(`Download initiated for: ${fileName}`);
  } catch (error) {
    next(error);
  }
});

export { router as generateRouter };