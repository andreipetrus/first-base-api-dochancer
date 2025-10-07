import { ClaudeService } from './claude';
import { DocumentParser } from './parser';
import { APIExtractor } from './extractor';
import { APITester } from './tester';
import { OpenAPIGenerator } from './generator';

let claudeService: ClaudeService;
let documentParser: DocumentParser;
let apiExtractor: APIExtractor;
let apiTester: APITester;
let openAPIGenerator: OpenAPIGenerator;

export const initializeServices = () => {
  claudeService = new ClaudeService();
  documentParser = new DocumentParser();
  apiExtractor = new APIExtractor(claudeService);
  apiTester = new APITester();
  openAPIGenerator = new OpenAPIGenerator();
};

export const getServices = () => ({
  claudeService,
  documentParser,
  apiExtractor,
  apiTester,
  openAPIGenerator,
});

export {
  ClaudeService,
  DocumentParser,
  APIExtractor,
  APITester,
  OpenAPIGenerator,
};