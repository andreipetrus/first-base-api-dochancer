import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Chip from '@mui/material/Chip';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import IconButton from '@mui/material/IconButton';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import CircularProgress from '@mui/material/CircularProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import CloseIcon from '@mui/icons-material/Close';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SettingsIcon from '@mui/icons-material/Settings';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import { APIEndpoint, ProjectConfig, APIParameter } from '@api-dochancer/shared';

interface ReviewStepProps {
  endpoints: APIEndpoint[];
  config: ProjectConfig;
  onEndpointsChange: (endpoints: APIEndpoint[]) => void;
  onNext: () => void;
  onBack: () => void;
  extractedParameters?: APIParameter[];
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  endpoints,
  config,
  onEndpointsChange,
  onNext,
  onBack,
  extractedParameters,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);
  const [showConfigDialog, setShowConfigDialog] = useState(false);
  const [testConfig, setTestConfig] = useState<{
    baseUrl: string;
    apiParameters: APIParameter[];
  }>({
    baseUrl: config.baseUrl || '',
    apiParameters: extractedParameters || config.apiParameters || [],
  });
  const [retesting, setRetesting] = useState(false);

  useEffect(() => {
    if (extractedParameters && extractedParameters.length > 0) {
      const paramsWithValues = extractedParameters.map(param => {
        if (param.name === 'key' && param.type === 'query' && config.testApiKey) {
          return { ...param, value: config.testApiKey };
        }
        if (param.name === 'Authorization' && param.type === 'header' && config.testApiKey) {
          return { ...param, value: `Bearer ${config.testApiKey}` };
        }
        return param;
      });
      
      setTestConfig(prev => ({
        ...prev,
        apiParameters: paramsWithValues,
      }));
    }
  }, [extractedParameters, config.testApiKey]);

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'success':
        return <CheckCircleIcon color="success" fontSize="small" />;
      case 'warning':
        return <WarningIcon color="warning" fontSize="small" />;
      case 'failure':
        return <ErrorIcon color="error" fontSize="small" />;
      default:
        return <PendingIcon color="action" fontSize="small" />;
    }
  };

  const getMethodColor = (method: string) => {
    const colors: { [key: string]: any } = {
      GET: 'primary',
      POST: 'success',
      PUT: 'warning',
      DELETE: 'error',
      PATCH: 'info',
      HEAD: 'default',
      OPTIONS: 'default',
    };
    return colors[method] || 'default';
  };

  const groupedEndpoints = endpoints.reduce((acc, endpoint) => {
    const category = endpoint.category || 'Uncategorized';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(endpoint);
    return acc;
  }, {} as { [key: string]: APIEndpoint[] });

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Review API Endpoints
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Review the extracted and categorized API endpoints. {config.baseUrl && 'Test results are shown for each endpoint.'}
      </Typography>

      <Paper sx={{ p: 2, mb: 3 }}>
        <Typography variant="subtitle1" gutterBottom>
          Summary
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Total Endpoints: {endpoints.length}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Categories: {Object.keys(groupedEndpoints).length}
        </Typography>
        {config.baseUrl && (
          <>
            <Typography variant="body2" color="success.main">
              Successful Tests: {endpoints.filter(e => e.testResult?.status === 'success').length}
            </Typography>
            <Typography variant="body2" color="warning.main">
              Warnings: {endpoints.filter(e => e.testResult?.status === 'warning').length}
            </Typography>
            <Typography variant="body2" color="error.main">
              Failed Tests: {endpoints.filter(e => e.testResult?.status === 'failure').length}
            </Typography>
          </>
        )}
      </Paper>

      {config.baseUrl && (
        <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            startIcon={<SettingsIcon />}
            onClick={() => setShowConfigDialog(true)}
          >
            Configure Test Parameters
          </Button>
          <Button
            variant="contained"
            startIcon={retesting ? <CircularProgress size={20} /> : <PlayArrowIcon />}
            onClick={async () => {
              setRetesting(true);
              try {
                const response = await fetch('/api/process/test', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    endpoints,
                    baseUrl: testConfig.baseUrl,
                    apiParameters: testConfig.apiParameters,
                  }),
                });
                const data = await response.json();
                if (data.endpoints) {
                  onEndpointsChange(data.endpoints);
                }
              } catch (error) {
                console.error('Error retesting endpoints:', error);
              } finally {
                setRetesting(false);
              }
            }}
            disabled={retesting}
          >
            {retesting ? 'Running Tests...' : 'Rerun Tests'}
          </Button>
        </Box>
      )}

      {Object.entries(groupedEndpoints).map(([category, categoryEndpoints]) => (
        <Paper key={category} sx={{ mb: 2 }}>
          <Box sx={{ p: 2, backgroundColor: 'grey.50' }}>
            <Typography variant="h6">{category}</Typography>
          </Box>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Method</TableCell>
                  <TableCell>Path</TableCell>
                  <TableCell>Description</TableCell>
                  {config.baseUrl && <TableCell>Test Status</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                {categoryEndpoints.map((endpoint) => (
                  <TableRow
                    key={endpoint.id}
                    hover
                    onClick={() => setSelectedEndpoint(endpoint)}
                    sx={{ cursor: 'pointer' }}
                  >
                    <TableCell>
                      <Chip
                        label={endpoint.method}
                        size="small"
                        color={getMethodColor(endpoint.method) as any}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {endpoint.path}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 300 }}>
                        {endpoint.summary || endpoint.description || '-'}
                      </Typography>
                    </TableCell>
                    {config.baseUrl && (
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          {getStatusIcon(endpoint.testResult?.status)}
                          <Typography variant="caption">
                            {endpoint.testResult?.statusCode || '-'}
                          </Typography>
                        </Box>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      ))}

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button onClick={onBack}>
          Back
        </Button>
        <Button variant="contained" onClick={onNext}>
          Generate Documentation
        </Button>
      </Box>

      <Dialog
        open={!!selectedEndpoint}
        onClose={() => setSelectedEndpoint(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedEndpoint && (
          <>
            <DialogTitle>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Chip
                  label={selectedEndpoint.method}
                  size="small"
                  color={getMethodColor(selectedEndpoint.method) as any}
                />
                <Typography variant="h6" component="span" sx={{ fontFamily: 'monospace' }}>
                  {selectedEndpoint.path}
                </Typography>
                <IconButton
                  sx={{ ml: 'auto' }}
                  onClick={() => setSelectedEndpoint(null)}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="subtitle1" gutterBottom>
                {selectedEndpoint.summary}
              </Typography>
              <Typography variant="body2" color="text.secondary" paragraph>
                {selectedEndpoint.description}
              </Typography>

              {selectedEndpoint.testResult && (
                <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                    {getStatusIcon(selectedEndpoint.testResult.status)}
                    <Typography variant="subtitle2">
                      Test Result: {selectedEndpoint.testResult.statusCode}
                    </Typography>
                  </Box>
                  {selectedEndpoint.testResult.message && (
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      {selectedEndpoint.testResult.message}
                    </Typography>
                  )}

                  {selectedEndpoint.testResult.response && (
                    <Accordion sx={{ mt: 2 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2" fontWeight="medium">
                          Response Body
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: 'grey.900',
                            color: 'grey.100',
                            overflow: 'auto',
                            maxHeight: 400,
                          }}
                        >
                          <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                            {JSON.stringify(selectedEndpoint.testResult.response, null, 2)}
                          </pre>
                        </Paper>
                      </AccordionDetails>
                    </Accordion>
                  )}

                  {selectedEndpoint.testResult.headers && (
                    <Accordion sx={{ mt: 1 }}>
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Typography variant="body2" fontWeight="medium">
                          Response Headers
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        <Paper
                          sx={{
                            p: 2,
                            bgcolor: 'grey.900',
                            color: 'grey.100',
                            overflow: 'auto',
                            maxHeight: 400,
                          }}
                        >
                          <pre style={{ margin: 0, fontSize: '0.875rem' }}>
                            {JSON.stringify(selectedEndpoint.testResult.headers, null, 2)}
                          </pre>
                        </Paper>
                      </AccordionDetails>
                    </Accordion>
                  )}
                </Paper>
              )}

              {selectedEndpoint.parameters && selectedEndpoint.parameters.length > 0 && (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Parameters
                  </Typography>
                  <TableContainer component={Paper} variant="outlined">
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>Name</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell>Required</TableCell>
                          <TableCell>Description</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {selectedEndpoint.parameters.map((param, idx) => (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontFamily: 'monospace' }}>{param.name}</TableCell>
                            <TableCell>
                              <Chip label={param.in} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                              {param.required ? (
                                <Chip label="Required" size="small" color="error" />
                              ) : (
                                <Chip label="Optional" size="small" />
                              )}
                            </TableCell>
                            <TableCell>{param.description || '-'}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setSelectedEndpoint(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Dialog
        open={showConfigDialog}
        onClose={() => setShowConfigDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          Configure Test Parameters
          <IconButton
            sx={{ position: 'absolute', right: 8, top: 8 }}
            onClick={() => setShowConfigDialog(false)}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <TextField
            fullWidth
            label="Base URL"
            value={testConfig.baseUrl}
            onChange={(e) => setTestConfig({ ...testConfig, baseUrl: e.target.value })}
            placeholder="https://api.example.com"
            sx={{ mb: 3 }}
          />

          <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle2">API Parameters</Typography>
            <Button
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setTestConfig({
                  ...testConfig,
                  apiParameters: [
                    ...testConfig.apiParameters,
                    { name: '', value: '', type: 'header', generated: false },
                  ],
                });
              }}
            >
              Add Parameter
            </Button>
          </Box>

          {testConfig.apiParameters.map((param, idx) => (
            <Paper key={idx} sx={{ p: 2, mb: 2 }} variant="outlined">
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start' }}>
                <TextField
                  label="Name"
                  value={param.name}
                  onChange={(e) => {
                    const newParams = [...testConfig.apiParameters];
                    newParams[idx] = { ...newParams[idx], name: e.target.value };
                    setTestConfig({ ...testConfig, apiParameters: newParams });
                  }}
                  size="small"
                  sx={{ flex: 1 }}
                />
                <TextField
                  label="Value"
                  value={param.value}
                  onChange={(e) => {
                    const newParams = [...testConfig.apiParameters];
                    newParams[idx] = { ...newParams[idx], value: e.target.value };
                    setTestConfig({ ...testConfig, apiParameters: newParams });
                  }}
                  size="small"
                  sx={{ flex: 2 }}
                />
                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Type</InputLabel>
                  <Select
                    value={param.type}
                    label="Type"
                    onChange={(e) => {
                      const newParams = [...testConfig.apiParameters];
                      newParams[idx] = { ...newParams[idx], type: e.target.value as any };
                      setTestConfig({ ...testConfig, apiParameters: newParams });
                    }}
                  >
                    <MenuItem value="header">Header</MenuItem>
                    <MenuItem value="query">Query</MenuItem>
                    <MenuItem value="path">Path</MenuItem>
                  </Select>
                </FormControl>
                <IconButton
                  color="error"
                  onClick={() => {
                    const newParams = testConfig.apiParameters.filter((_, i) => i !== idx);
                    setTestConfig({ ...testConfig, apiParameters: newParams });
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Paper>
          ))}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowConfigDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setShowConfigDialog(false);
            }}
          >
            Save Configuration
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ReviewStep;