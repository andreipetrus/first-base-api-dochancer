import Anthropic from '@anthropic-ai/sdk';
import { APIEndpoint } from '@api-dochancer/shared';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export class ClaudeService {
  private client: Anthropic | null = null;

  initialize(apiKey: string) {
    this.client = new Anthropic({
      apiKey,
    });
    logger.info('Claude service initialized');
  }

  isInitialized(): boolean {
    return this.client !== null;
  }

  async categorizeEndpoints(endpoints: APIEndpoint[], productContext?: string): Promise<APIEndpoint[]> {
    if (!this.client) {
      throw new Error('Claude service not initialized');
    }

    const prompt = `Given these API endpoints and product context, categorize them into logical groups for user flows/actions. 
    Also improve the documentation for clarity, grammar, and spelling while maintaining technical accuracy.
    
    Product Context: ${productContext || 'Not provided'}
    
    Endpoints:
    ${JSON.stringify(endpoints, null, 2)}
    
    Return a JSON array of endpoints with added 'category' field and improved descriptions.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return endpoints;
    } catch (error) {
      logger.error('Error categorizing endpoints:', error);
      return endpoints;
    }
  }

  async generateTestData(endpoint: APIEndpoint): Promise<any> {
    if (!this.client) {
      throw new Error('Claude service not initialized');
    }

    const prompt = `Generate realistic test data for this API endpoint that is semantically correct and follows the expected format:
    
    ${JSON.stringify(endpoint, null, 2)}
    
    Return only valid JSON that can be used as request body or parameters.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return {};
    } catch (error) {
      logger.error('Error generating test data:', error);
      return {};
    }
  }

  async improveDocumentation(openApiSpec: any, feedback: string): Promise<any> {
    if (!this.client) {
      throw new Error('Claude service not initialized');
    }

    const prompt = `Improve this OpenAPI specification based on the following feedback:
    
    Feedback: ${feedback}
    
    Current Specification:
    ${JSON.stringify(openApiSpec, null, 2)}
    
    Return the improved OpenAPI specification as valid JSON.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 4000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      return openApiSpec;
    } catch (error) {
      logger.error('Error improving documentation:', error);
      return openApiSpec;
    }
  }

  async searchProductContext(productName: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude service not initialized');
    }

    const prompt = `Provide a brief summary of what ${productName} does, focusing on its main features and API capabilities. Keep it under 200 words.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-3-opus-20240229',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      logger.error('Error searching product context:', error);
      return '';
    }
  }
}