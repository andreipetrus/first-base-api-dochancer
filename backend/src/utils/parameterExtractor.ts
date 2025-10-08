import { APIEndpoint, APIParameter } from '@api-dochancer/shared';

export function extractCommonParameters(endpoints: APIEndpoint[]): APIParameter[] {
  const paramMap = new Map<string, APIParameter>();
  const paramFrequency = new Map<string, number>();
  
  for (const endpoint of endpoints) {
    if (endpoint.parameters) {
      for (const param of endpoint.parameters) {
        const key = `${param.in}_${param.name}`;
        const frequency = paramFrequency.get(key) || 0;
        paramFrequency.set(key, frequency + 1);
        
        if (!paramMap.has(key)) {
          // Convert endpoint parameter to API parameter
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
  
  // Extract headers from endpoint paths (common auth headers)
  // Note: Generic parameter names like 'key', 'token', 'apikey' are NOT included here
  // because they could be query parameters. Let AI detection handle those.
  const commonHeaders = [
    'Authorization', 'X-API-Key', 'API-Key', 'X-Auth-Token', 
    'X-Access-Token', 'X-Request-ID', 'X-Session-ID'
  ];
  
  for (const headerName of commonHeaders) {
    const key = `header_${headerName}`;
    // Check if this header appears in endpoint descriptions, paths, or anywhere in the endpoint
    const isUsed = endpoints.some(ep => {
      const epString = JSON.stringify(ep).toLowerCase();
      const headerLower = headerName.toLowerCase();
      return epString.includes(headerLower) ||
             epString.includes('authentication') ||
             epString.includes('api key') ||
             epString.includes('auth');
    });
    
    if (isUsed && !paramMap.has(key)) {
      paramMap.set(key, {
        name: headerName,
        value: '',
        type: 'header',
        description: `${headerName} header for authentication`,
        generated: false,
      });
    }
  }
  
  // Return parameters that appear in at least 20% of endpoints or are auth headers
  const threshold = Math.ceil(endpoints.length * 0.2);
  const commonParams: APIParameter[] = [];
  
  for (const [key, param] of paramMap.entries()) {
    const frequency = paramFrequency.get(key) || 0;
    if (frequency >= threshold || param.type === 'header') {
      commonParams.push(param);
    }
  }
  
  // Always include Content-Type and Accept if API uses JSON
  const hasJsonEndpoints = endpoints.some(ep => 
    ep.requestBody?.content?.['application/json'] ||
    ep.responses?.some(r => r.content?.['application/json'])
  );
  
  if (hasJsonEndpoints) {
    if (!commonParams.find(p => p.name === 'Content-Type')) {
      commonParams.push({
        name: 'Content-Type',
        value: 'application/json',
        type: 'header',
        description: 'Content type of the request body',
        generated: true,
      });
    }
    
    if (!commonParams.find(p => p.name === 'Accept')) {
      commonParams.push({
        name: 'Accept',
        value: 'application/json',
        type: 'header',
        description: 'Accepted response content type',
        generated: true,
      });
    }
  }
  
  return commonParams;
}
