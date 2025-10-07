import { Express } from 'express';
import { uploadRouter } from './upload';
import { processRouter } from './process';
import { generateRouter } from './generate';
import { chatRouter } from './chat';
import { previewRouter } from './preview';

export const setupRoutes = (app: Express) => {
  app.use('/api/upload', uploadRouter);
  app.use('/api/process', processRouter);
  app.use('/api/generate', generateRouter);
  app.use('/api/chat', chatRouter);
  app.use('/api/preview', previewRouter);

  app.get('/api/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  });
};