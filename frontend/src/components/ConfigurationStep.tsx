import React from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import { ProjectConfig } from '@api-dochancer/shared';

interface ConfigurationStepProps {
  config: ProjectConfig;
  onConfigChange: (config: ProjectConfig) => void;
  onNext: () => void;
  onBack: () => void;
}

const ConfigurationStep: React.FC<ConfigurationStepProps> = ({
  config,
  onConfigChange,
  onNext,
  onBack,
}) => {
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