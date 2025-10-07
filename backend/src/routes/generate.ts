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
    const { endpoints, metadata } = req.body;
    
    if (!endpoints || !Array.isArray(endpoints)) {
      throw new AppError(400, 'Endpoints array is required');
    }

    const { openAPIGenerator } = getServices();
    
    // Ensure version is passed through metadata
    const openApiSpec = openAPIGenerator.generate(endpoints, metadata || {});
    
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