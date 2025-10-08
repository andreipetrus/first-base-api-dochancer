import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import InputAdornment from '@mui/material/InputAdornment';
import IconButton from '@mui/material/IconButton';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { ProjectConfig } from '@api-dochancer/shared';

interface ConfigurationStepProps {
  config: ProjectConfig;
  onConfigChange: (config: ProjectConfig) => void;
  onNext: () => void;
  onBack: () => void;
  extractedBaseUrl?: string;
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  config,
  onConfigChange,
  onNext,
  onBack,
  extractedBaseUrl,
}) => {
  const [showClaudeKey, setShowClaudeKey] = useState(false);
  const [showTestKey, setShowTestKey] = useState(false);

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
          type={showClaudeKey ? 'text' : 'password'}
          value={config.claudeApiKey || ''}
          onChange={handleChange('claudeApiKey')}
          margin="normal"
          required
          helperText="Required for AI-powered documentation enhancement"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowClaudeKey(!showClaudeKey)}
                  edge="end"
                >
                  {showClaudeKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Optional Configuration
        </Typography>

        <TextField
          fullWidth
          label="Test API Key"
          type={showTestKey ? 'text' : 'password'}
          value={config.testApiKey || ''}
          onChange={handleChange('testApiKey')}
          margin="normal"
          helperText="API key for testing endpoints (if authentication is required)"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  onClick={() => setShowTestKey(!showTestKey)}
                  edge="end"
                >
                  {showTestKey ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
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