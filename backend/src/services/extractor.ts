import { APIEndpoint, ParsedDocument } from '@api-dochancer/shared';
import { ClaudeService } from './claude';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export class APIExtractor {
  constructor(private claudeService: ClaudeService) {}

  async extractAndEnhance(
    document: ParsedDocument,
    productUrl?: string
  ): Promise<APIEndpoint[]> {
    let endpoints = document.endpoints;

    if (!endpoints || endpoints.length === 0) {
      endpoints = await this.extractWithAI(document.rawContent || '');
    }

    endpoints = this.deduplicateEndpoints(endpoints);

    endpoints = this.enhanceEndpointInfo(endpoints, document.rawContent || '');

    let productContext = '';
    if (productUrl) {
      productContext = await this.fetchProductContext(productUrl);
    } else if (document.title) {
      productContext = await this.claudeService.searchProductContext(document.title);
    }

    if (this.claudeService.isInitialized()) {
      endpoints = await this.claudeService.categorizeEndpoints(endpoints, productContext);
    }

    return endpoints;
  }

  private async extractWithAI(content: string): Promise<APIEndpoint[]> {
    if (!this.claudeService.isInitialized()) {
      return [];
    }

    logger.info('Using AI to extract API endpoints from raw content');
    
    return [];
  }

  private deduplicateEndpoints(endpoints: APIEndpoint[]): APIEndpoint[] {
    const seen = new Set<string>();
    const unique: APIEndpoint[] = [];

    for (const endpoint of endpoints) {
      const key = `${endpoint.method}_${endpoint.path}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(endpoint);
      }
    }

    return unique;
  }

  private enhanceEndpointInfo(endpoints: APIEndpoint[], rawContent: string): APIEndpoint[] {
    return endpoints.map(endpoint => {
      const pathSegments = endpoint.path.split('/').filter(Boolean);
      
      if (!endpoint.category) {
        if (pathSegments[0]) {
          endpoint.category = this.capitalizeFirst(pathSegments[0]);
        }
      }

      if (!endpoint.parameters) {
        endpoint.parameters = this.extractPathParameters(endpoint.path);
      }

      if (!endpoint.description && rawContent) {
        const contextWindow = 200;
        const pathIndex = rawContent.indexOf(endpoint.path);
        if (pathIndex !== -1) {
          const start = Math.max(0, pathIndex - contextWindow);
          const end = Math.min(rawContent.length, pathIndex + endpoint.path.length + contextWindow);
          const context = rawContent.substring(start, end);
          
          const sentences = context.match(/[^.!?]+[.!?]+/g);
          if (sentences && sentences.length > 0) {
            endpoint.description = sentences[0].trim();
          }
        }
      }

      return endpoint;
    });
  }

  private extractPathParameters(path: string): any[] {
    const params: any[] = [];
    const paramPattern = /\{([^}]+)\}/g;
    let match;

    while ((match = paramPattern.exec(path)) !== null) {
      params.push({
        name: match[1],
        in: 'path',
        required: true,
        schema: { type: 'string' },
      });
    }

    return params;
  }

  private async fetchProductContext(url: string): Promise<string> {
    try {
      logger.info(`Fetching product context from: ${url}`);
      
      return `Product information from ${url}`;
    } catch (error) {
      logger.error('Error fetching product context:', error);
      return '';
    }
  }

  private capitalizeFirst(str: string): string {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }
}