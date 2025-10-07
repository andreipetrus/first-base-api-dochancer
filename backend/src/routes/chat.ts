import { Router } from 'express';
import { getServices } from '../services';
import { AppError } from '../middleware/errorHandler';
import { ChatMessage } from '@api-dochancer/shared';
import { createLogger } from '../utils/logger';
import { v4 as uuidv4 } from 'uuid';

const logger = createLogger();
const router = Router();

const chatHistory: ChatMessage[] = [];

router.post('/message', async (req, res, next) => {
  try {
    const { message, openApiSpec, claudeApiKey } = req.body;
    
    if (!message) {
      throw new AppError(400, 'Message is required');
    }

    if (!claudeApiKey) {
      throw new AppError(400, 'Claude API key is required');
    }

    const { claudeService } = getServices();
    claudeService.initialize(claudeApiKey);

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: message,
      timestamp: new Date(),
    };
    chatHistory.push(userMessage);

    const improvedSpec = await claudeService.improveDocumentation(openApiSpec, message);

    const assistantMessage: ChatMessage = {
      id: uuidv4(),
      role: 'assistant',
      content: 'I\'ve updated the documentation based on your feedback. The changes have been applied to the OpenAPI specification.',
      timestamp: new Date(),
    };
    chatHistory.push(assistantMessage);

    logger.info('Chat message processed successfully');

    res.json({
      success: true,
      message: assistantMessage,
      updatedSpec: improvedSpec,
      history: chatHistory.slice(-10),
    });
  } catch (error) {
    next(error);
  }
});

router.get('/history', (req, res) => {
  res.json({
    success: true,
    history: chatHistory.slice(-50),
  });
});

export { router as chatRouter };