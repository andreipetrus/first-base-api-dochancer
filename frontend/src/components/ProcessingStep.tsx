import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import LinearProgress from '@mui/material/LinearProgress';
import Paper from '@mui/material/Paper';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { APIEndpoint, ProcessingStatus, ProjectConfig } from '@api-dochancer/shared';
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
    step: 'parsing',
    progress: 0,
    message: 'Starting processing...',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    processDocument();
  }, []);

  const processDocument = async () => {
    try {
      setStatus({
        step: 'extracting',
        progress: 20,
        message: 'Extracting API endpoints...',
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
        progress: 50,
        message: 'Categorizing and enhancing documentation...',
      });

      if (config.baseUrl && config.testApiKey) {
        setStatus({
          step: 'testing',
          progress: 70,
          message: 'Testing API endpoints...',
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
        });

        onProcessComplete(testedEndpoints);
      } else {
        setStatus({
          step: 'complete',
          progress: 100,
          message: `Processing complete! Found ${endpoints.length} endpoints.`,
        });

        onProcessComplete(endpoints);
      }

      onStatusChange(status);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to process document');
      setStatus({
        step: 'error',
        progress: 0,
        message: 'Processing failed',
      });
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