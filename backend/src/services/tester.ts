import axios, { AxiosError } from 'axios';
import { APIEndpoint, TestResult } from '@api-dochancer/shared';
import { ClaudeService } from './claude';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export class APITester {
  private baseUrl: string = '';
  private apiKey: string = '';
  private claudeService?: ClaudeService;

  configure(baseUrl: string, apiKey: string, claudeService?: ClaudeService) {
    this.baseUrl = baseUrl;
    this.apiKey = apiKey;
    this.claudeService = claudeService;
  }

  async testEndpoint(endpoint: APIEndpoint): Promise<TestResult> {
    if (!this.baseUrl) {
      return {
        status: 'warning',
        message: 'No base URL configured for testing',
      };
    }

    try {
      const url = this.buildUrl(endpoint);
      const headers = this.buildHeaders();
      const data = await this.generateTestData(endpoint);

      logger.info(`Testing endpoint: ${endpoint.method} ${url}`);

      const response = await axios({
        method: endpoint.method.toLowerCase(),
        url,
        headers,
        data: ['POST', 'PUT', 'PATCH'].includes(endpoint.method) ? data : undefined,
        params: endpoint.method === 'GET' ? data : undefined,
        timeout: 10000,
        validateStatus: () => true,
      });

      const result: TestResult = {
        status: response.status >= 200 && response.status < 300 ? 'success' : 'warning',
        statusCode: response.status,
        message: `Received ${response.status} ${response.statusText}`,
        response: response.data,
        timestamp: new Date(),
      };

      return result;
    } catch (error) {
      const axiosError = error as AxiosError;
      
      return {
        status: 'failure',
        statusCode: axiosError.response?.status,
        message: axiosError.message,
        error: axiosError.stack,
        timestamp: new Date(),
      };
    }
  }

  async testAllEndpoints(endpoints: APIEndpoint[]): Promise<APIEndpoint[]> {
    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        const testResult = await this.testEndpoint(endpoint);
        return { ...endpoint, testResult };
      })
    );

    return results;
  }

  private buildUrl(endpoint: APIEndpoint): string {
    let path = endpoint.path;
    
    if (endpoint.parameters) {
      for (const param of endpoint.parameters.filter(p => p.in === 'path')) {
        const value = this.generateParamValue(param);
        path = path.replace(`{${param.name}}`, value);
      }
    }

    const url = new URL(path, this.baseUrl);
    
    if (endpoint.parameters) {
      for (const param of endpoint.parameters.filter(p => p.in === 'query')) {
        const value = this.generateParamValue(param);
        url.searchParams.append(param.name, value);
      }
    }

    return url.toString();
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
      headers['X-API-Key'] = this.apiKey;
    }

    return headers;
  }

  private async generateTestData(endpoint: APIEndpoint): Promise<any> {
    if (this.claudeService?.isInitialized()) {
      try {
        return await this.claudeService.generateTestData(endpoint);
      } catch (error) {
        logger.error('Error generating test data with AI:', error);
      }
    }

    const data: any = {};

    if (endpoint.requestBody?.content?.['application/json']?.schema) {
      return this.generateFromSchema(endpoint.requestBody.content['application/json'].schema);
    }

    if (endpoint.parameters) {
      for (const param of endpoint.parameters.filter(p => p.in === 'body')) {
        data[param.name] = this.generateParamValue(param);
      }
    }

    return data;
  }

  private generateFromSchema(schema: any): any {
    if (!schema) return {};

    switch (schema.type) {
      case 'object':
        const obj: any = {};
        if (schema.properties) {
          for (const [key, propSchema] of Object.entries(schema.properties)) {
            obj[key] = this.generateFromSchema(propSchema as any);
          }
        }
        return obj;

      case 'array':
        return [this.generateFromSchema(schema.items)];

      case 'string':
        if (schema.enum) return schema.enum[0];
        if (schema.format === 'email') return 'test@example.com';
        if (schema.format === 'date') return '2024-01-01';
        if (schema.format === 'date-time') return '2024-01-01T00:00:00Z';
        if (schema.format === 'uuid') return '123e4567-e89b-12d3-a456-426614174000';
        return 'test-string';

      case 'number':
      case 'integer':
        if (schema.enum) return schema.enum[0];
        return schema.minimum || 1;

      case 'boolean':
        return true;

      default:
        return null;
    }
  }

  private generateParamValue(param: any): string {
    const schema = param.schema || {};
    
    if (param.example !== undefined) {
      return String(param.example);
    }

    if (schema.enum && schema.enum.length > 0) {
      return String(schema.enum[0]);
    }

    switch (schema.type) {
      case 'integer':
      case 'number':
        return '1';
      case 'boolean':
        return 'true';
      default:
        if (param.name.toLowerCase().includes('id')) {
          return '123';
        }
        return 'test';
    }
  }
}