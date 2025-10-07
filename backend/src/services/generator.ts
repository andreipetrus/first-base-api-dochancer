import { APIEndpoint, GeneratedDocumentation } from '@api-dochancer/shared';
import * as fs from 'fs';
import * as path from 'path';
import { createLogger } from '../utils/logger';

const logger = createLogger();

export class OpenAPIGenerator {
  generate(
    endpoints: APIEndpoint[],
    metadata: {
      title?: string;
      description?: string;
      version?: string;
      baseUrl?: string;
      productIntro?: string;
    }
  ): any {
    // Use product intro if available, fallback to description
    const description = metadata.productIntro || metadata.description || 'Auto-generated API documentation';
    
    const openApiSpec = {
      openapi: '3.0.3',
      info: {
        title: metadata.title || 'API Documentation',
        description: description,
        version: metadata.version || '1.0.0',  // Will use inferred version if available
      },
      servers: metadata.baseUrl ? [{ url: metadata.baseUrl }] : [],
      paths: this.generatePaths(endpoints),
      components: {
        schemas: {},
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
          },
          apiKey: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
          },
        },
      },
      security: [
        { bearerAuth: [] },
        { apiKey: [] },
      ],
    };

    return openApiSpec;
  }

  async generateHTML(openApiSpec: any, outputDir: string): Promise<string> {
    const timestamp = Date.now();
    const fileName = `api-docs-${timestamp}`;
    const htmlPath = path.join(outputDir, `${fileName}.html`);
    const specPath = path.join(outputDir, `${fileName}-spec.json`);

    fs.writeFileSync(specPath, JSON.stringify(openApiSpec, null, 2));

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${openApiSpec.info.title}</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui.css">
    <style>
        body {
            margin: 0;
            padding: 0;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
        }
        #swagger-ui {
            padding: 20px;
        }
        .topbar {
            display: none;
        }
        .info {
            margin-bottom: 50px;
        }
        .scheme-container {
            background: #f7f7f7;
            padding: 15px;
            border-radius: 4px;
            margin-bottom: 20px;
        }
    </style>
</head>
<body>
    <div id="swagger-ui"></div>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
        const spec = ${JSON.stringify(openApiSpec)};
        
        window.onload = function() {
            window.ui = SwaggerUIBundle({
                spec: spec,
                dom_id: '#swagger-ui',
                deepLinking: true,
                presets: [
                    SwaggerUIBundle.presets.apis,
                    SwaggerUIStandalonePreset
                ],
                plugins: [
                    SwaggerUIBundle.plugins.DownloadUrl
                ],
                layout: "BaseLayout",
                tryItOutEnabled: true,
                supportedSubmitMethods: ['get', 'post', 'put', 'delete', 'patch'],
                onComplete: function() {
                    console.log('Swagger UI loaded successfully');
                }
            });
        };
    </script>
</body>
</html>`;

    fs.writeFileSync(htmlPath, html);
    logger.info(`Generated HTML documentation at: ${htmlPath}`);

    return fileName;
  }

  async createBundle(openApiSpec: any, outputDir: string): Promise<GeneratedDocumentation> {
    const fileName = await this.generateHTML(openApiSpec, outputDir);
    const warnings = this.validateSpec(openApiSpec);

    return {
      openApiSpec,
      htmlBundle: fileName,
      warnings,
      timestamp: new Date(),
    };
  }

  private generatePaths(endpoints: APIEndpoint[]): any {
    const paths: any = {};

    for (const endpoint of endpoints) {
      if (!paths[endpoint.path]) {
        paths[endpoint.path] = {};
      }

      const operation: any = {
        summary: endpoint.summary,
        description: endpoint.description,
        operationId: endpoint.id,
        tags: endpoint.category ? [endpoint.category] : [],
      };

      if (endpoint.parameters && endpoint.parameters.length > 0) {
        operation.parameters = endpoint.parameters.map(param => ({
          name: param.name,
          in: param.in,
          description: param.description,
          required: param.required,
          schema: param.schema,
        }));
      }

      if (endpoint.requestBody) {
        operation.requestBody = endpoint.requestBody;
      }

      if (endpoint.responses && endpoint.responses.length > 0) {
        operation.responses = {};
        for (const response of endpoint.responses) {
          operation.responses[response.statusCode] = {
            description: response.description || `${response.statusCode} response`,
            content: response.content,
          };
        }
      } else {
        operation.responses = {
          '200': {
            description: 'Successful response',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          '400': {
            description: 'Bad request',
          },
          '401': {
            description: 'Unauthorized',
          },
          '404': {
            description: 'Not found',
          },
          '500': {
            description: 'Internal server error',
          },
        };
      }

      if (endpoint.testResult) {
        const testNote = `Test Result: ${endpoint.testResult.status.toUpperCase()}`;
        if (endpoint.testResult.message) {
          operation.description = `${operation.description || ''}\n\n${testNote}: ${endpoint.testResult.message}`;
        }
      }

      paths[endpoint.path][endpoint.method.toLowerCase()] = operation;
    }

    return paths;
  }

  private validateSpec(spec: any): string[] {
    const warnings: string[] = [];

    if (!spec.info?.title) {
      warnings.push('Missing API title in info section');
    }

    if (!spec.info?.version) {
      warnings.push('Missing API version in info section');
    }

    if (!spec.servers || spec.servers.length === 0) {
      warnings.push('No servers defined - API base URL is missing');
    }

    const paths = spec.paths || {};
    if (Object.keys(paths).length === 0) {
      warnings.push('No API endpoints defined');
    }

    for (const [path, methods] of Object.entries(paths)) {
      for (const [method, operation] of Object.entries(methods as any)) {
        if (!operation.summary && !operation.description) {
          warnings.push(`${method.toUpperCase()} ${path}: Missing summary and description`);
        }
        
        if (!operation.responses) {
          warnings.push(`${method.toUpperCase()} ${path}: No responses defined`);
        }
      }
    }

    return warnings;
  }
}