import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import IconButton from '@mui/material/IconButton';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Chip from '@mui/material/Chip';
import Grid from '@mui/material/Grid';
import Tooltip from '@mui/material/Tooltip';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import RefreshIcon from '@mui/icons-material/Refresh';
import { ProjectConfig, APIParameter } from '@api-dochancer/shared';

interface ConfigurationStepProps {
  config: ProjectConfig;
  onConfigChange: (config: ProjectConfig) => void;
  onNext: () => void;
  onBack: () => void;
  extractedBaseUrl?: string;
  extractedParameters?: APIParameter[];
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  config,
  onConfigChange,
  onNext,
  onBack,
  extractedBaseUrl,
  extractedParameters,
}) => {
  // Initialize with extracted parameters or existing config
  const [apiParams, setApiParams] = useState<APIParameter[]>(
    config.apiParameters || extractedParameters || []
  );
  // Update parameters when extracted parameters are provided
  useEffect(() => {
    if (extractedParameters && extractedParameters.length > 0 && apiParams.length === 0) {
      // Auto-generate values for extracted parameters
      const paramsWithValues = extractedParameters.map(param => ({
        ...param,
        value: param.value || generateParameterValue(param),
        generated: !param.value,
      }));
      setApiParams(paramsWithValues);
      onConfigChange({
        ...config,
        apiParameters: paramsWithValues,
      });
    }
  }, [extractedParameters]);

  // Prefill test values in development mode
  useEffect(() => {
    if (import.meta.env.VITE_TEST_MODE === 'true') {
      const testConfig: Partial<ProjectConfig> = {};
      
      // Only set values if they're not already set
      if (!config.claudeApiKey && import.meta.env.VITE_TEST_CLAUDE_KEY) {
        testConfig.claudeApiKey = import.meta.env.VITE_TEST_CLAUDE_KEY;
      }
      if (!config.testApiKey && import.meta.env.VITE_TEST_API_KEY) {
        testConfig.testApiKey = import.meta.env.VITE_TEST_API_KEY;
      }
      if (!config.productUrl && import.meta.env.VITE_TEST_PRODUCT_URL) {
        testConfig.productUrl = import.meta.env.VITE_TEST_PRODUCT_URL;
      }
      // Prefill base URL from test env if not already set (and not extracted from doc)
      if (!config.baseUrl && import.meta.env.VITE_TEST_BASE_URL) {
        testConfig.baseUrl = import.meta.env.VITE_TEST_BASE_URL;
      }
      
      if (Object.keys(testConfig).length > 0) {
        onConfigChange({
          ...config,
          ...testConfig,
        });
      }
    }
  }, []); // Run only once on mount

  const handleChange = (field: keyof ProjectConfig) => (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    onConfigChange({
      ...config,
      [field]: event.target.value,
    });
  };

  const generateParameterValue = (param: APIParameter): string => {
    // Smart value generation based on parameter name and format
    const name = param.name.toLowerCase();
    
    // API Keys
    if (name.includes('key') || name.includes('token') || name.includes('secret')) {
      return `test-${name.replace(/[^a-z0-9]/g, '-')}-${Math.random().toString(36).substring(2, 10)}`;
    }
    
    // IDs
    if (name.includes('id') || name.endsWith('_id')) {
      if (name.includes('uuid')) {
        return 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
      }
      return Math.floor(Math.random() * 10000).toString();
    }
    
    // Timestamps
    if (name.includes('timestamp') || name.includes('date') || name.includes('time')) {
      if (name.includes('unix')) {
        return Math.floor(Date.now() / 1000).toString();
      }
      return new Date().toISOString();
    }
    
    // Pagination
    if (name === 'page' || name === 'offset') {
      return '1';
    }
    if (name === 'limit' || name === 'size' || name === 'per_page') {
      return '10';
    }
    
    // Sorting
    if (name === 'sort' || name === 'order_by') {
      return 'created_at';
    }
    if (name === 'order' || name === 'direction') {
      return 'desc';
    }
    
    // Boolean flags
    if (name.includes('enabled') || name.includes('active') || name.includes('is_')) {
      return 'true';
    }
    
    // Version
    if (name === 'version' || name === 'api_version') {
      return 'v2';
    }
    
    // Format
    if (name === 'format' || name === 'response_format') {
      return 'json';
    }
    
    // Default
    return `sample-${name}`;
  };

  const addParameter = () => {
    const newParam: APIParameter = {
      name: '',
      value: '',
      type: 'header',
      generated: false,
    };
    const updatedParams = [...apiParams, newParam];
    setApiParams(updatedParams);
    onConfigChange({
      ...config,
      apiParameters: updatedParams,
    });
  };

  const updateParameter = (index: number, field: keyof APIParameter, value: any) => {
    const updatedParams = [...apiParams];
    updatedParams[index] = {
      ...updatedParams[index],
      [field]: value,
    };
    setApiParams(updatedParams);
    onConfigChange({
      ...config,
      apiParameters: updatedParams,
    });
  };

  const generateValue = (index: number) => {
    const param = apiParams[index];
    if (param.name) {
      const generatedValue = generateParameterValue(param);
      updateParameter(index, 'value', generatedValue);
      updateParameter(index, 'generated', true);
    }
  };

  const removeParameter = (index: number) => {
    const updatedParams = apiParams.filter((_, i) => i !== index);
    setApiParams(updatedParams);
    onConfigChange({
      ...config,
      apiParameters: updatedParams,
    });
  };

  // Add common API parameters if none exist
  const addCommonParameters = () => {
    const commonParams: APIParameter[] = [
      { name: 'Authorization', value: '', type: 'header', description: 'Bearer token or API key', generated: false },
      { name: 'Content-Type', value: 'application/json', type: 'header', generated: false },
      { name: 'Accept', value: 'application/json', type: 'header', generated: false },
    ];
    setApiParams(commonParams);
    onConfigChange({
      ...config,
      apiParameters: commonParams,
    });
  };

  const isValid = config.claudeApiKey && config.claudeApiKey.length > 0;

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Configure API Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Provide API keys and additional context for enhanced documentation generation
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Your API keys are only used for this session and are not stored permanently.
      </Alert>

      {extractedBaseUrl && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Base URL detected from documentation: <strong>{extractedBaseUrl}</strong>
        </Alert>
      )}

      {extractedParameters && extractedParameters.length > 0 && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Extracted <strong>{extractedParameters.length}</strong> common parameters from the API documentation. 
          Values have been auto-generated where possible. You can modify them below.
        </Alert>
      )}

      {import.meta.env.VITE_TEST_MODE === 'true' && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          <strong>Test Mode:</strong> Development credentials are prefilled. Remember to add your Claude API key manually if not set in .env.local
        </Alert>
      )}

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Required Configuration
        </Typography>
        
        <TextField
          fullWidth
          label="Claude API Key"
          type="password"
          value={config.claudeApiKey || ''}
          onChange={handleChange('claudeApiKey')}
          margin="normal"
          required
          helperText="Required for AI-powered documentation enhancement"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Optional Configuration
        </Typography>

        <TextField
          fullWidth
          label="Test API Key"
          type="password"
          value={config.testApiKey || ''}
          onChange={handleChange('testApiKey')}
          margin="normal"
          helperText="API key for testing endpoints (if authentication is required)"
        />

        <TextField
          fullWidth
          label="API Base URL"
          value={config.baseUrl || ''}
          onChange={handleChange('baseUrl')}
          margin="normal"
          placeholder="https://api.example.com"
          helperText="Base URL for testing API endpoints"
        />

        <TextField
          fullWidth
          label="Product URL"
          value={config.productUrl || ''}
          onChange={handleChange('productUrl')}
          margin="normal"
          placeholder="https://example.com"
          helperText="Product website URL for additional context"
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            API Parameters
          </Typography>
          {apiParams.length === 0 && (
            <Button
              size="small"
              startIcon={<AutoFixHighIcon />}
              onClick={addCommonParameters}
              sx={{ mr: 1 }}
            >
              Add Common Headers
            </Button>
          )}
          <IconButton color="primary" onClick={addParameter}>
            <AddCircleIcon />
          </IconButton>
        </Box>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Define common parameters that will be used when testing API endpoints
        </Typography>

        {apiParams.length === 0 ? (
          <Alert severity="info">
            No API parameters defined. Click the + button to add parameters or use "Add Common Headers" to get started.
          </Alert>
        ) : (
          apiParams.map((param, index) => (
            <Grid container spacing={2} key={index} sx={{ mb: 2 }}>
              <Grid item xs={12} sm={3}>
                <FormControl fullWidth size="small">
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={param.type}
                    label="Type"
                    onChange={(e) => updateParameter(index, 'type', e.target.value)}
                  >
                    <MenuItem value="header">Header</MenuItem>
                    <MenuItem value="query">Query</MenuItem>
                    <MenuItem value="path">Path</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={3}>
                <TextField
                  fullWidth
                  size="small"
                  label="Name"
                  value={param.name}
                  onChange={(e) => updateParameter(index, 'name', e.target.value)}
                  placeholder="e.g., Authorization"
                />
              </Grid>
              
              <Grid item xs={12} sm={4}>
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <TextField
                    fullWidth
                    size="small"
                    label="Value"
                    value={param.value}
                    onChange={(e) => {
                      updateParameter(index, 'value', e.target.value);
                      updateParameter(index, 'generated', false);
                    }}
                    placeholder="Enter or generate value"
                    InputProps={{
                      endAdornment: param.generated && (
                        <Chip 
                          size="small" 
                          label="Generated" 
                          color="info" 
                          variant="outlined"
                        />
                      ),
                    }}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={2}>
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Generate value based on name pattern">
                    <IconButton
                      size="small"
                      onClick={() => generateValue(index)}
                      disabled={!param.name}
                      color="primary"
                    >
                      <RefreshIcon />
                    </IconButton>
                  </Tooltip>
                  <Tooltip title="Remove parameter">
                    <IconButton
                      size="small"
                      onClick={() => removeParameter(index)}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>
              </Grid>
              
              {param.description && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary">
                    {param.description}
                  </Typography>
                </Grid>
              )}
            </Grid>
          ))
        )}
      </Paper>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button
          variant="contained"
          onClick={onNext}
          disabled={!isValid}
        >
          Continue
        </Button>
      </Box>
    </Box>
  );
};

export default ConfigurationStep;