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

  async generateProductIntro(productUrl?: string, documentationUrl?: string, existingDescription?: string): Promise<string> {
    if (!this.client) {
      throw new Error('Claude service not initialized');
    }

    const context = [];
    if (productUrl) context.push(`Product URL: ${productUrl}`);
    if (documentationUrl) context.push(`Documentation URL: ${documentationUrl}`);
    if (existingDescription) context.push(`Existing description: ${existingDescription}`);

    const prompt = `Generate a technical product introduction for API documentation based on the following information:

${context.join('\n')}

Requirements:
- Use technical language appropriate for developers
- Focus on the API's capabilities and use cases
- Keep it concise (2-3 paragraphs, max 200 words)
- Include what the API enables developers to do
- Maintain a professional, technical tone

Return only the introduction text, no additional formatting or headers.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 800,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      return response.content[0].type === 'text' ? response.content[0].text : '';
    } catch (error) {
      logger.error('Error generating product intro:', error);
      return existingDescription || 'API documentation';
    }
  }

  async enhanceEndpointDocumentation(endpoint: APIEndpoint): Promise<APIEndpoint> {
    if (!this.client) {
      throw new Error('Claude service not initialized');
    }

    const originalDocs = endpoint.originalDocumentation || endpoint.description || '';
    if (!originalDocs) {
      return endpoint;
    }

    const prompt = `Review and enhance this API endpoint documentation:

Original Documentation:
${originalDocs}

Current Endpoint Structure:
Method: ${endpoint.method}
Path: ${endpoint.path}
Summary: ${endpoint.summary || 'Not provided'}
Description: ${endpoint.description || 'Not provided'}

Tasks:
1. Transfer the verbatim original documentation content in a way that's compatible with OpenAPI spec
2. Review grammar and spelling
3. Improve clarity and readability for developers
4. Maintain 100% technical accuracy - do not change technical details
5. Keep all original examples, code snippets, and technical specifications

Return a JSON object with:
{
  "summary": "brief one-line summary",
  "description": "enhanced description incorporating original docs",
  "technicalNotes": "any important technical details from original docs"
}`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2000,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const enhanced = JSON.parse(jsonMatch[0]);
        return {
          ...endpoint,
          summary: enhanced.summary || endpoint.summary,
          description: enhanced.description || endpoint.description,
        };
      }
      return endpoint;
    } catch (error) {
      logger.error('Error enhancing endpoint documentation:', error);
      return endpoint;
    }
  }

  async extractEndpointDetails(endpoint: APIEndpoint): Promise<APIEndpoint> {
    if (!this.client) {
      throw new Error('Claude service not initialized');
    }

    const documentation = endpoint.originalDocumentation || endpoint.description || '';
    if (!documentation || documentation.length < 50) {
      return endpoint;
    }

    const prompt = `Extract detailed API endpoint information from this documentation:

Endpoint: ${endpoint.method} ${endpoint.path}

Documentation:
${documentation}

Extract and return a JSON object with:
{
  "summary": "brief one-line summary",
  "description": "detailed description of what this endpoint does",
  "parameters": [
    {
      "name": "parameter_name",
      "in": "query|header|path|cookie",
      "description": "parameter description",
      "required": true|false,
      "schema": { "type": "string|integer|boolean|array|object" },
      "example": "example value if provided"
    }
  ],
  "requestBody": {
    "description": "request body description",
    "required": true|false,
    "content": {
      "application/json": {
        "schema": { "type": "object", "properties": {} }
      }
    }
  },
  "responses": [
    {
      "statusCode": "200",
      "description": "response description",
      "content": {
        "application/json": {
          "schema": { "type": "object" }
        }
      }
    }
  ]
}

CRITICAL INSTRUCTIONS - READ CAREFULLY:

1. **Extract ALL parameters mentioned in the documentation**, including:
   - Parameters shown in URL examples (e.g., ?key=xxx, ?fields=abc)
   - Parameters mentioned in curl commands
   - Parameters in JSON request/response examples
   - Path parameters (like :id, :account_key)
   - API keys and authentication parameters

2. **Parameter location detection rules**:
   - **Query parameters**: Appear after "?" in URLs (e.g., "?key=value&mode=test")
   - **Path parameters**: Appear in the path with ":" or "{}" (e.g., /:id/, /{id}/)
   - **Body parameters**: Appear in JSON objects in request examples or described as "request body"
   - **Headers**: Explicitly mentioned as "header" or "HTTP header"

3. **Common patterns in Fingerbank API**:
   - "key" parameter is ALWAYS a query parameter when shown as "?key=xxx"
   - JSON properties in response examples may also be valid body/query parameters
   - Look for curl command examples showing parameters

4. **Be thorough**: Search the entire documentation text for:
   - curl examples
   - URL patterns
   - JSON request/response examples
   - Parameter descriptions in plain text

Extract ALL parameters you find. Don't skip any.

Return ONLY the JSON object, no other text.`;

    try {
      const response = await this.client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4096,
        messages: [{
          role: 'user',
          content: prompt,
        }],
      });

      const content = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      
      if (jsonMatch) {
        const extracted = JSON.parse(jsonMatch[0]);
        
        return {
          ...endpoint,
          summary: extracted.summary || endpoint.summary,
          description: extracted.description || endpoint.description,
          parameters: extracted.parameters && extracted.parameters.length > 0 
            ? extracted.parameters 
            : endpoint.parameters,
          requestBody: extracted.requestBody || endpoint.requestBody,
          responses: extracted.responses && extracted.responses.length > 0
            ? extracted.responses
            : endpoint.responses,
        };
      }
      
      return endpoint;
    } catch (error) {
      logger.error('Error extracting endpoint details:', error);
      return endpoint;
    }
  }
}