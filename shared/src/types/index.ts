export interface APIEndpoint {
  id: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
  path: string;
  summary?: string;
  description?: string;
  category?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses?: Response[];
  examples?: Example[];
  testResult?: TestResult;
}

export interface Parameter {
  name: string;
  in: 'path' | 'query' | 'header' | 'cookie';
  description?: string;
  required?: boolean;
  schema: Schema;
  example?: any;
}

export interface RequestBody {
  description?: string;
  required?: boolean;
  content: {
    [mediaType: string]: {
      schema: Schema;
      example?: any;
    };
  };
}

export interface Response {
  statusCode: string;
  description?: string;
  content?: {
    [mediaType: string]: {
      schema: Schema;
      example?: any;
    };
  };
}

export interface Schema {
  type: string;
  format?: string;
  properties?: { [key: string]: Schema };
  items?: Schema;
  required?: string[];
  enum?: any[];
  example?: any;
  description?: string;
}

export interface Example {
  name: string;
  description?: string;
  value: any;
}

export interface TestResult {
  status: 'success' | 'failure' | 'warning' | 'pending';
  statusCode?: number;
  message?: string;
  response?: any;
  error?: string;
  timestamp?: Date;
}

export interface ParsedDocument {
  title?: string;
  description?: string;
  version?: string;
  baseUrl?: string;
  endpoints: APIEndpoint[];
  rawContent?: string;
}

export interface ProcessingStatus {
  step: 'validating' | 'uploading' | 'parsing' | 'extracting' | 'categorizing' | 'testing' | 'generating' | 'complete' | 'error';
  progress: number;
  message: string;
  details?: any;
  validations?: ValidationResult[];
}

export interface ValidationResult {
  type: 'url' | 'claude_api' | 'test_api';
  status: 'pending' | 'checking' | 'success' | 'failure';
  message: string;
  details?: string;
}

export interface GeneratedDocumentation {
  openApiSpec: any;
  htmlBundle: string;
  warnings: string[];
  timestamp: Date;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface APIParameter {
  name: string;
  value: string;
  type: 'header' | 'query' | 'path';
  format?: string;
  description?: string;
  generated?: boolean;
}

export interface ProjectConfig {
  apiKey?: string;
  testApiKey?: string;
  claudeApiKey?: string;
  baseUrl?: string;
  productUrl?: string;
  apiParameters?: APIParameter[];
}