import React, { useEffect, useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import DownloadIcon from '@mui/icons-material/Download';
import PreviewIcon from '@mui/icons-material/Preview';
import ChatIcon from '@mui/icons-material/Chat';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import { APIEndpoint, ProjectConfig } from '@api-dochancer/shared';
import axios from 'axios';

interface GenerateStepProps {
  endpoints: APIEndpoint[];
  config: ProjectConfig;
  metadata?: any;
  onSpecGenerated: (spec: any) => void;
  onChatOpen: () => void;
  onStartOver?: () => void;
}

const GenerateStep: React.FC<GenerateStepProps> = ({
  endpoints,
  config,
  metadata,
  onSpecGenerated,
  onChatOpen,
  onStartOver,
}) => {
  const [loading, setLoading] = useState(false);
  const [generated, setGenerated] = useState(false);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    generateDocumentation();
  }, []);

  const generateDocumentation = async () => {
    setLoading(true);
    setError(null);

    try {
      // Use metadata from extraction, with fallbacks
      const specResponse = await axios.post('/api/generate/openapi', {
        endpoints,
        metadata: {
          title: metadata?.title || 'API Documentation',
          description: metadata?.description || 'Auto-generated OpenAPI documentation',
          version: metadata?.version || '1.0.0',
          baseUrl: config.baseUrl,
        },
      });

      const spec = specResponse.data.spec;
      onSpecGenerated(spec);

      const htmlResponse = await axios.post('/api/generate/html', { spec });
      
      setDownloadUrl(htmlResponse.data.downloadUrl);
      setPreviewUrl(htmlResponse.data.previewUrl);
      setWarnings(htmlResponse.data.warnings || []);
      
      setGenerated(true);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to generate documentation');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (downloadUrl) {
      // The URL already starts with /api which will be proxied
      window.open(downloadUrl, '_blank');
    }
  };

  const handlePreview = () => {
    if (previewUrl) {
      // Open preview in new tab - the URL already starts with /api which will be proxied
      window.open(previewUrl, '_blank');
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Generate OpenAPI Documentation
      </Typography>

      {loading && (
        <Paper sx={{ p: 3, mb: 3, textAlign: 'center' }}>
          <CircularProgress sx={{ mb: 2 }} />
          <Typography>Generating OpenAPI specification and documentation...</Typography>
        </Paper>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {generated && !loading && (
        <>
          <Alert 
            severity="success" 
            sx={{ mb: 3 }}
            icon={<CheckCircleIcon />}
          >
            Documentation generated successfully!
          </Alert>

          {warnings.length > 0 && (
            <Alert severity="warning" sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>
                Warnings:
              </Typography>
              <ul style={{ margin: 0, paddingLeft: 20 }}>
                {warnings.map((warning, index) => (
                  <li key={index}>{warning}</li>
                ))}
              </ul>
            </Alert>
          )}

          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" gutterBottom>
              Generated Files
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleDownload}
              >
                Download Bundle
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<PreviewIcon />}
                onClick={handlePreview}
              >
                Preview Documentation
              </Button>
              
              <Button
                variant="outlined"
                startIcon={<ChatIcon />}
                onClick={onChatOpen}
              >
                Improve with AI
              </Button>
            </Box>

            {onStartOver && (
              <Box sx={{ mt: 2 }}>
                <Button
                  variant="outlined"
                  color="secondary"
                  startIcon={<RestartAltIcon />}
                  onClick={onStartOver}
                >
                  Start Over
                </Button>
              </Box>
            )}

          </Paper>

          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Next Steps
            </Typography>
            <ul>
              <li>Download the generated HTML bundle for hosting</li>
              <li>Preview the documentation in your browser</li>
              <li>Use the AI chat to improve and refine the documentation</li>
              <li>Test the API endpoints directly from the Swagger UI</li>
            </ul>
          </Paper>
        </>
      )}
    </Box>
  );
};

export default GenerateStep;