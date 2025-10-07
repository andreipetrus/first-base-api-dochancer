import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import CircularProgress from '@mui/material/CircularProgress';
import { APIEndpoint, ProcessingStatus, ProjectConfig, ValidationResult } from '@api-dochancer/shared';
import axios from 'axios';

interface ProcessingStepProps {
  uploadedFile: any;
  config: ProjectConfig;
  onProcessComplete: (endpoints: APIEndpoint[]) => void;
  onStatusChange: (status: ProcessingStatus | null) => void;
}

const ProcessingStep: React.FC<ProcessingStepProps> = ({
  uploadedFile,
  config,
  onProcessComplete,
  onStatusChange,
}) => {
  const [status, setStatus] = useState<ProcessingStatus>({
    step: 'validating',
    progress: 0,
    message: 'Starting validation...',
    validations: [],
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processDocument();
  }, []);

  const processDocument = async () => {
    try {
      // Validation phase
      const validations: ValidationResult[] = [];
      
      // Validate URL if provided
      if (uploadedFile.url) {
        const urlValidation: ValidationResult = {
          type: 'url',
          status: 'checking',
          message: 'Checking URL accessibility...',
        };
        validations.push(urlValidation);
        
        setStatus({
          step: 'validating',
          progress: 10,
          message: 'Validating URL...',
          validations: [...validations],
        });

        try {
          const urlResponse = await axios.post('/api/validate/url', {
            url: uploadedFile.url,
          });
          urlValidation.status = urlResponse.data.status;
          urlValidation.message = urlResponse.data.message;
          urlValidation.details = urlResponse.data.details;
        } catch (err) {
          urlValidation.status = 'failure';
          urlValidation.message = 'Failed to validate URL';
        }

        setStatus(prev => ({
          ...prev,
          progress: 20,
          validations: [...validations],
        }));
      }

      // Validate Claude API key
      const claudeValidation: ValidationResult = {
        type: 'claude_api',
        status: 'checking',
        message: 'Verifying Claude API key...',
      };
      validations.push(claudeValidation);
      
      setStatus(prev => ({
        ...prev,
        progress: 30,
        message: 'Validating Claude API key...',
        validations: [...validations],
      }));

      try {
        const claudeResponse = await axios.post('/api/validate/claude-api', {
          apiKey: config.claudeApiKey,
        });
        claudeValidation.status = claudeResponse.data.status;
        claudeValidation.message = claudeResponse.data.message;
        claudeValidation.details = claudeResponse.data.details;
      } catch (err) {
        claudeValidation.status = 'failure';
        claudeValidation.message = 'Failed to validate Claude API key';
      }

      setStatus(prev => ({
        ...prev,
        progress: 40,
        validations: [...validations],
      }));

      // Validate test API key if provided
      if (config.testApiKey && config.baseUrl) {
        const testApiValidation: ValidationResult = {
          type: 'test_api',
          status: 'checking',
          message: 'Verifying test API key...',
        };
        validations.push(testApiValidation);
        
        setStatus(prev => ({
          ...prev,
          progress: 45,
          message: 'Validating test API key...',
          validations: [...validations],
        }));

        try {
          const testApiResponse = await axios.post('/api/validate/test-api', {
            apiKey: config.testApiKey,
            baseUrl: config.baseUrl,
          });
          testApiValidation.status = testApiResponse.data.status;
          testApiValidation.message = testApiResponse.data.message;
          testApiValidation.details = testApiResponse.data.details;
        } catch (err) {
          testApiValidation.status = 'failure';
          testApiValidation.message = 'Failed to validate test API key';
        }

        setStatus(prev => ({
          ...prev,
          progress: 50,
          validations: [...validations],
        }));
      }

      // Check if any critical validations failed
      const urlFailed = validations.find(v => v.type === 'url')?.status === 'failure';
      const claudeFailed = validations.find(v => v.type === 'claude_api')?.status === 'failure';

      if (urlFailed && uploadedFile.url) {
        throw new Error('URL validation failed - cannot access documentation');
      }

      if (claudeFailed) {
        throw new Error('Claude API key validation failed - cannot proceed without valid API key');
      }

      // Proceed with extraction
      setStatus({
        step: 'extracting',
        progress: 60,
        message: 'Extracting API endpoints...',
        validations,
      });

      const extractResponse = await axios.post('/api/process/extract', {
        filePath: uploadedFile.filePath,
        url: uploadedFile.url,
        productUrl: config.productUrl,
        claudeApiKey: config.claudeApiKey,
      });

      const endpoints = extractResponse.data.result.endpoints;

      setStatus({
        step: 'categorizing',
        progress: 70,
        message: 'Categorizing and enhancing documentation...',
        validations,
      });

      if (config.baseUrl && config.testApiKey) {
        setStatus({
          step: 'testing',
          progress: 85,
          message: 'Testing API endpoints...',
          validations,
        });

        const testResponse = await axios.post('/api/process/test', {
          endpoints,
          baseUrl: config.baseUrl,
          testApiKey: config.testApiKey,
          claudeApiKey: config.claudeApiKey,
        });

        const testedEndpoints = testResponse.data.endpoints;

        setStatus({
          step: 'complete',
          progress: 100,
          message: `Processing complete! Found ${testedEndpoints.length} endpoints.`,
          details: testResponse.data.status.details,
          validations,
        });

        onProcessComplete(testedEndpoints);
      } else {
        setStatus({
          step: 'complete',
          progress: 100,
          message: `Processing complete! Found ${endpoints.length} endpoints.`,
          validations,
        });

        onProcessComplete(endpoints);
      }

      onStatusChange(status);
    } catch (err: any) {
      const errorMessage = err.message || err.response?.data?.error || 'Failed to process document';
      setError(errorMessage);
      setStatus(prev => ({
        ...prev,
        step: 'error',
        progress: 0,
        message: 'Processing failed',
      }));
    }
  };

  const getStepIcon = (step: string) => {
    if (step === 'complete') {
      return <CheckCircleIcon color="success" sx={{ mr: 1 }} />;
    }
    if (step === 'error') {
      return <ErrorIcon color="error" sx={{ mr: 1 }} />;
    }
    return null;
  };

  const getValidationIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" />;
      case 'failure':
        return <ErrorIcon color="error" />;
      case 'checking':
        return <CircularProgress size={20} />;
      default:
        return <PendingIcon color="action" />;
    }
  };

  const getValidationLabel = (type: string) => {
    switch (type) {
      case 'url':
        return 'Documentation URL';
      case 'claude_api':
        return 'Claude API Key';
      case 'test_api':
        return 'Test API Key';
      default:
        return type;
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Processing Documentation
      </Typography>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            {getStepIcon(status.step)}
            {status.message}
          </Typography>
          <LinearProgress 
            variant="determinate" 
            value={status.progress} 
            sx={{ height: 10, borderRadius: 5 }}
          />
        </Box>

        {status.validations && status.validations.length > 0 && (
          <Box sx={{ mt: 3, mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Validation Status:
            </Typography>
            <List dense>
              {status.validations.map((validation, index) => (
                <ListItem key={index}>
                  <ListItemIcon>
                    {getValidationIcon(validation.status)}
                  </ListItemIcon>
                  <ListItemText
                    primary={getValidationLabel(validation.type)}
                    secondary={
                      <Box>
                        <Typography variant="body2" component="span">
                          {validation.message}
                        </Typography>
                        {validation.details && (
                          <Typography variant="caption" display="block" color="text.secondary">
                            {validation.details}
                          </Typography>
                        )}
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        )}

        {status.details && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Test Results:
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total: {status.details.total} endpoints
            </Typography>
            <Typography variant="body2" color="success.main">
              Success: {status.details.success}
            </Typography>
            <Typography variant="body2" color="warning.main">
              Warnings: {status.details.warnings}
            </Typography>
            <Typography variant="body2" color="error.main">
              Failures: {status.details.failures}
            </Typography>
          </Box>
        )}

        {error && (
          <Typography color="error" sx={{ mt: 2 }}>
            {error}
          </Typography>
        )}
      </Paper>

      <Typography variant="body2" color="text.secondary">
        This process may take a few moments depending on the size of your documentation...
      </Typography>
    </Box>
  );
};

export default ProcessingStep;