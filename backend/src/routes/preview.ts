import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';
import { createLogger } from '../utils/logger';

const logger = createLogger();
const router = Router();

// Main preview route - serves HTML documentation
router.get('/docs/:fileName', (req, res, next) => {
  try {
    const { fileName } = req.params;
    const generatedDir = path.resolve(process.env.GENERATED_DIR || './generated');
    
    // Add .html extension if not present
    const htmlFileName = fileName.endsWith('.html') ? fileName : `${fileName}.html`;
    const filePath = path.join(generatedDir, htmlFileName);
    
    if (!fs.existsSync(filePath)) {
      throw new AppError(404, `Preview file not found: ${htmlFileName}`);
    }

    // Set proper content type and serve the HTML
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.sendFile(filePath);
    
    logger.info(`Preview served for: ${htmlFileName}`);
  } catch (error) {
    next(error);
  }
});

// Serve OpenAPI spec JSON
router.get('/spec/:fileName', (req, res, next) => {
  try {
    const { fileName } = req.params;
    const generatedDir = path.resolve(process.env.GENERATED_DIR || './generated');
    
    // Add .json extension if not present
    const jsonFileName = fileName.endsWith('.json') ? fileName : `${fileName}-spec.json`;
    const filePath = path.join(generatedDir, jsonFileName);
    
    if (!fs.existsSync(filePath)) {
      throw new AppError(404, `Spec file not found: ${jsonFileName}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    res.json(JSON.parse(content));
    
    logger.info(`Spec served for: ${jsonFileName}`);
  } catch (error) {
    next(error);
  }
});

// List available previews
router.get('/list', (req, res) => {
  try {
    const generatedDir = path.resolve(process.env.GENERATED_DIR || './generated');
    
    if (!fs.existsSync(generatedDir)) {
      return res.json({ success: true, files: [] });
    }
    
    const files = fs.readdirSync(generatedDir)
      .filter(file => file.endsWith('.html'))
      .map(file => ({
        name: file,
        url: `/api/preview/docs/${file}`,
        created: fs.statSync(path.join(generatedDir, file)).mtime,
      }));
    
    res.json({ success: true, files });
  } catch (error) {
    res.json({ success: false, files: [] });
  }
});

export { router as previewRouter };