import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import LinkIcon from '@mui/icons-material/Link';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Alert from '@mui/material/Alert';
import CircularProgress from '@mui/material/CircularProgress';
import axios from 'axios';

interface UploadStepProps {
  onUpload: (file: any) => void;
}

const UploadStep: React.FC<UploadStepProps> = ({ onUpload }) => {
  // Prefill test URL in development mode
  const testDocUrl = import.meta.env.VITE_TEST_MODE === 'true' 
    ? import.meta.env.VITE_TEST_DOC_URL 
    : '';
  
  const [url, setUrl] = useState(testDocUrl || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successInfo, setSuccessInfo] = useState<any>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    const formData = new FormData();
    formData.append('document', file);

    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const response = await axios.post('/api/upload/file', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setSuccessInfo(response.data.parsed);
      setTimeout(() => {
        onUpload(response.data);
      }, 1500); // Brief delay to show success message
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to upload file');
    } finally {
      setLoading(false);
    }
  }, [onUpload]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'text/html': ['.html', '.htm'],
      'application/json': ['.json'],
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
    },
    maxFiles: 1,
  });

  const handleUrlSubmit = async () => {
    if (!url) return;

    setLoading(true);
    setError(null);
    setSuccessInfo(null);

    try {
      const response = await axios.post('/api/upload/url', { url });
      setSuccessInfo(response.data.parsed);
      setTimeout(() => {
        onUpload(response.data);
      }, 1500); // Brief delay to show success message
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to fetch documentation from URL');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Upload API Documentation
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Upload a document file or provide a URL to your existing API documentation
      </Typography>

      {import.meta.env.VITE_TEST_MODE === 'true' && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <strong>Test Mode Active</strong> - Using development test values
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successInfo && (
        <Alert 
          severity="success" 
          sx={{ mb: 2 }} 
          icon={<CheckCircleIcon />}
        >
          <Typography variant="subtitle2" gutterBottom>
            Document parsed successfully!
          </Typography>
          <Typography variant="body2">
            • Found {successInfo.endpointsCount} API endpoints
          </Typography>
          {successInfo.baseUrl && (
            <Typography variant="body2">
              • Extracted base URL: <strong>{successInfo.baseUrl}</strong>
            </Typography>
          )}
          {successInfo.title && (
            <Typography variant="body2">
              • Title: {successInfo.title}
            </Typography>
          )}
        </Alert>
      )}

      <Paper
        {...getRootProps()}
        sx={{
          p: 4,
          mb: 3,
          textAlign: 'center',
          cursor: 'pointer',
          backgroundColor: isDragActive ? 'action.hover' : 'background.paper',
          border: '2px dashed',
          borderColor: isDragActive ? 'primary.main' : 'divider',
        }}
      >
        <input {...getInputProps()} />
        <CloudUploadIcon sx={{ fontSize: 48, color: 'action.active', mb: 2 }} />
        <Typography variant="h6" gutterBottom>
          {isDragActive ? 'Drop the file here' : 'Drag & drop a file here, or click to select'}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Supported formats: PDF, DOC, DOCX, HTML, JSON, TXT, MD
        </Typography>
      </Paper>

      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
        <LinkIcon sx={{ mr: 1 }} />
        Or provide a URL
      </Typography>

      <Box sx={{ display: 'flex', gap: 2 }}>
        <TextField
          fullWidth
          label="Documentation URL"
          variant="outlined"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://api.example.com/docs"
          disabled={loading}
        />
        <Button
          variant="contained"
          onClick={handleUrlSubmit}
          disabled={!url || loading}
          sx={{ minWidth: 120 }}
        >
          {loading ? <CircularProgress size={24} /> : 'Fetch'}
        </Button>
      </Box>
    </Box>
  );
};

export default UploadStep;