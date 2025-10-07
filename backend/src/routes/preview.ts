import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { AppError } from '../middleware/errorHandler';
import { createLogger } from '../utils/logger';

const logger = createLogger();
const router = Router();

router.get('/:fileName', (req, res, next) => {
  try {
    const { fileName } = req.params;
    const generatedDir = path.resolve(process.env.GENERATED_DIR || './generated');
    const filePath = path.join(generatedDir, fileName);
    
    if (!fs.existsSync(filePath)) {
      throw new AppError(404, 'Preview file not found');
    }

    const ext = path.extname(fileName).toLowerCase();
    
    if (ext === '.html') {
      res.sendFile(filePath);
    } else if (ext === '.json') {
      const content = fs.readFileSync(filePath, 'utf8');
      res.json(JSON.parse(content));
    } else {
      res.sendFile(filePath);
    }
    
    logger.info(`Preview served for: ${fileName}`);
  } catch (error) {
    next(error);
  }
});

router.post('/server', (req, res) => {
  const port = 8080;
  const host = 'localhost';
  const previewUrl = `http://${host}:${port}`;
  
  logger.info(`Preview server info requested: ${previewUrl}`);
  
  res.json({
    success: true,
    url: previewUrl,
    port,
    host,
    message: 'Access your generated documentation at the URL above',
  });
});

export { router as previewRouter };