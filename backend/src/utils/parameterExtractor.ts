import { APIEndpoint, APIParameter } from '@api-dochancer/shared';

export function extractCommonParameters(endpoints: APIEndpoint[]): APIParameter[] {
  const paramMap = new Map<string, APIParameter>();
  
  for (const endpoint of endpoints) {
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        const key = `${param.in}_${param.name}`;
        
        if (!paramMap.has(key)) {
          const apiParam: APIParameter = {
            name: param.name,
            value: param.example?.toString() || '',
            type: param.in === 'path' ? 'path' : param.in === 'query' ? 'query' : 'header',
            description: param.description,
            format: param.schema?.format,
            generated: false,
          };
          paramMap.set(key, apiParam);
        }
      }
    }
  }
  
  const allParams: APIParameter[] = [];
  
  for (const [key, param] of paramMap.entries()) {
    if (param.type !== 'path') {
      allParams.push(param);
    }
  }
  
  // Always include Content-Type and Accept if API uses JSON
  const hasJsonEndpoints = endpoints.some(ep => 
    ep.requestBody?.content?.['application/json'] ||
    ep.responses?.some(r => r.content?.['application/json'])
  );
  
  if (hasJsonEndpoints) {
    if (!allParams.find(p => p.name === 'Content-Type')) {
      allParams.push({
        name: 'Content-Type',
        value: 'application/json',
        type: 'header',
        description: 'Content type of the request body',
        generated: true,
      });
    }
    
    if (!allParams.find(p => p.name === 'Accept')) {
      allParams.push({
        name: 'Accept',
        value: 'application/json',
        type: 'header',
        description: 'Accepted response content type',
        generated: true,
      });
    }
  }
  
  return allParams;
}
