import * as fs from 'fs';
import * as path from 'path';
import * as cheerio from 'cheerio';
import mammoth from 'mammoth';
import pdf from 'pdf-parse';
import axios from 'axios';
import { ParsedDocument, APIEndpoint } from '@api-dochancer/shared';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export class DocumentParser {
  async parseFile(filePath: string): Promise<ParsedDocument> {
    const ext = path.extname(filePath).toLowerCase();
    const content = fs.readFileSync(filePath);

    switch (ext) {
      case '.pdf':
        return this.parsePDF(content);
      case '.doc':
      case '.docx':
        return this.parseDOCX(filePath);
      case '.html':
      case '.htm':
        return this.parseHTML(content.toString());
      case '.json':
        return this.parseJSON(content.toString());
      case '.txt':
      case '.md':
        return this.parseText(content.toString());
      default:
        throw new Error(`Unsupported file type: ${ext}`);
    }
  }

  async parseURL(url: string): Promise<ParsedDocument> {
    try {
      const response = await axios.get(url, { 
        headers: { 'User-Agent': 'API-Dochancer/1.0' },
        timeout: 30000 
      });
      
      if (response.headers['content-type']?.includes('application/json')) {
        return this.parseJSON(JSON.stringify(response.data));
      }
      
      return this.parseHTML(response.data);
    } catch (error) {
      logger.error('Error fetching URL:', error);
      throw new Error('Failed to fetch documentation from URL');
    }
  }

  private async parsePDF(buffer: Buffer): Promise<ParsedDocument> {
    const data = await pdf(buffer);
    return this.extractAPIInfo(data.text);
  }

  private async parseDOCX(filePath: string): Promise<ParsedDocument> {
    const result = await mammoth.extractRawText({ path: filePath });
    return this.extractAPIInfo(result.value);
  }

  private parseHTML(html: string): ParsedDocument {
    const $ = cheerio.load(html);
    
    $('script, style').remove();
    
    const text = $.text();
    const doc = this.extractAPIInfo(text);
    
    doc.title = $('title').text() || $('h1').first().text() || undefined;
    doc.description = $('meta[name="description"]').attr('content') || undefined;
    
    // Try to find base URL in specific HTML elements
    if (!doc.baseUrl) {
      // Look for base URL in code blocks
      $('code, pre').each((i, elem) => {
        const codeText = $(elem).text();
        const baseMatch = codeText.match(/https?:\/\/[^\s\/]+(?:\/api(?:\/v\d+)?)?/);
        if (baseMatch && !doc.baseUrl) {
          doc.baseUrl = baseMatch[0];
        }
      });
      
      // Look for base URL in links
      if (!doc.baseUrl) {
        $('a[href*="://"]').each((i, elem) => {
          const href = $(elem).attr('href');
          if (href && href.includes('api') && !doc.baseUrl) {
            const baseMatch = href.match(/(https?:\/\/[^\/]+(?:\/api(?:\/v\d+)?)?)/);
            if (baseMatch) {
              doc.baseUrl = baseMatch[1];
            }
          }
        });
      }
    }
    
    return doc;
  }

  private parseJSON(jsonStr: string): ParsedDocument {
    try {
      const data = JSON.parse(jsonStr);
      
      if (data.openapi || data.swagger) {
        return this.parseOpenAPI(data);
      }
      
      return this.extractAPIInfo(JSON.stringify(data, null, 2));
    } catch (error) {
      logger.error('Error parsing JSON:', error);
      return this.extractAPIInfo(jsonStr);
    }
  }

  private parseText(text: string): ParsedDocument {
    return this.extractAPIInfo(text);
  }

  private parseOpenAPI(spec: any): ParsedDocument {
    const endpoints: APIEndpoint[] = [];
    
    const servers = spec.servers || [{ url: spec.host ? `https://${spec.host}${spec.basePath || ''}` : '' }];
    const baseUrl = servers[0]?.url || '';
    
    const paths = spec.paths || {};
    
    for (const [pathStr, pathItem] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (['get', 'post', 'put', 'delete', 'patch', 'head', 'options'].includes(method.toLowerCase())) {
          const op = operation as any;
          
          endpoints.push({
            id: `${method.toUpperCase()}_${pathStr.replace(/[^a-zA-Z0-9]/g, '_')}`,
            method: method.toUpperCase() as any,
            path: pathStr,
            summary: op.summary,
            description: op.description,
            parameters: this.parseParameters(op.parameters || []),
            requestBody: this.parseRequestBody(op.requestBody),
            responses: this.parseResponses(op.responses || {}),
          });
        }
      }
    }
    
    return {
      title: spec.info?.title,
      description: spec.info?.description,
      version: spec.info?.version,
      baseUrl,
      endpoints,
      rawContent: JSON.stringify(spec),
    };
  }

  private parseParameters(params: any[]): any[] {
    return params.map(p => ({
      name: p.name,
      in: p.in,
      description: p.description,
      required: p.required,
      schema: p.schema || { type: p.type },
    }));
  }

  private parseRequestBody(body: any): any {
    if (!body) return undefined;
    
    return {
      description: body.description,
      required: body.required,
      content: body.content,
    };
  }

  private parseResponses(responses: any): any[] {
    return Object.entries(responses).map(([code, response]: [string, any]) => ({
      statusCode: code,
      description: response.description,
      content: response.content,
    }));
  }

  private extractAPIInfo(text: string): ParsedDocument {
    const endpoints: APIEndpoint[] = [];
    let baseUrl: string | undefined;
    
    // Extract base URL patterns
    const baseUrlPatterns = [
      /(?:base\s*url|api\s*endpoint|host|server)[:\s]+([https?:\/\/][^\s\n]+)/gi,
      /https?:\/\/[^\s]+\/api(?:\/v\d+)?(?=[\s\n])/gi,
      /https?:\/\/api\.[^\s\/]+(?:\/v\d+)?/gi,
      /https?:\/\/[^\s]+\.com(?:\/api)?(?:\/v\d+)?/gi,
      /curl\s+['"]*([https?:\/\/][^\s'"]+)/gi,
    ];
    
    for (const pattern of baseUrlPatterns) {
      const matches = text.matchAll(pattern);
      for (const match of matches) {
        const url = match[1] || match[0];
        // Clean up the URL
        const cleanUrl = url
          .replace(/['"`,;]$/, '')
          .replace(/\/$/, '')
          .replace(/\/\{[^}]+\}$/, ''); // Remove path parameters at the end
        
        // Validate it looks like a base URL (not too long, no query params)
        if (cleanUrl.length < 100 && !cleanUrl.includes('?') && cleanUrl.includes('://')) {
          baseUrl = cleanUrl;
          break;
        }
      }
      if (baseUrl) break;
    }
    
    // Extract endpoints
    const methodPattern = /(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS)\s+([\/\w\-\{\}:]+)/gi;
    const matches = text.matchAll(methodPattern);
    
    for (const match of matches) {
      const method = match[1].toUpperCase() as any;
      const path = match[2];
      
      if (path.startsWith('/')) {
        endpoints.push({
          id: `${method}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
          method,
          path,
          summary: `${method} ${path}`,
        });
      }
    }
    
    // Also look for full URL patterns to extract both base URL and endpoints
    const urlPattern = /https?:\/\/[^\s]+\/api[^\s]*/gi;
    const urlMatches = text.matchAll(urlPattern);
    
    for (const match of urlMatches) {
      const url = match[0];
      
      // Try to extract base URL if we don't have one
      if (!baseUrl) {
        const baseMatch = url.match(/(https?:\/\/[^\/]+(?:\/api(?:\/v\d+)?)?)/);
        if (baseMatch) {
          baseUrl = baseMatch[1];
        }
      }
      
      const pathMatch = url.match(/\/api[\/\w\-\{\}:]*/);
      
      if (pathMatch) {
        const existingEndpoint = endpoints.find(e => e.path === pathMatch[0]);
        
        if (!existingEndpoint) {
          endpoints.push({
            id: `GET_${pathMatch[0].replace(/[^a-zA-Z0-9]/g, '_')}`,
            method: 'GET',
            path: pathMatch[0],
            summary: `API endpoint: ${pathMatch[0]}`,
          });
        }
      }
    }
    
    return {
      baseUrl,
      endpoints,
      rawContent: text.substring(0, 10000),
    };
  }
}