import React, { useState } from 'react';
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
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import WarningIcon from '@mui/icons-material/Warning';
import ErrorIcon from '@mui/icons-material/Error';
import PendingIcon from '@mui/icons-material/Pending';
import { APIEndpoint, ProjectConfig } from '@api-dochancer/shared';

interface ReviewStepProps {
  endpoints: APIEndpoint[];
  config: ProjectConfig;
  onEndpointsChange: (endpoints: APIEndpoint[]) => void;
  onNext: () => void;
  onBack: () => void;
}

const ReviewStep: React.FC<ReviewStepProps> = ({
  endpoints,
  config,
  onEndpointsChange,
  onNext,
  onBack,
}) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<APIEndpoint | null>(null);

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
    </Box>
  );
};

export default ReviewStep;