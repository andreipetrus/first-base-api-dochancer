import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { getServices } from '../services';
import { AppError } from '../middleware/errorHandler';
import { createLogger } from '../utils/logger';

const logger = createLogger();
const router = Router();

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

    res.json({
      success: true,
      fileName: req.file.originalname,
      filePath: req.file.path,
      parsed: {
        title: parsedDoc.title,
        baseUrl: parsedDoc.baseUrl,
        endpointsCount: parsedDoc.endpoints.length,
        hasContent: !!parsedDoc.rawContent,
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

    res.json({
      success: true,
      url,
      parsed: {
        title: parsedDoc.title,
        baseUrl: parsedDoc.baseUrl,
        endpointsCount: parsedDoc.endpoints.length,
        hasContent: !!parsedDoc.rawContent,
      },
    });
  } catch (error) {
    next(error);
  }
});

export { router as uploadRouter };