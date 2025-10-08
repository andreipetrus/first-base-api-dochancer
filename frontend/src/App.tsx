import React, { useState } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import Typography from '@mui/material/Typography';
import Link from '@mui/material/Link';
import Chip from '@mui/material/Chip';
import { APIEndpoint, ProcessingStatus, ProjectConfig } from '@api-dochancer/shared';
import UploadStep from './components/UploadStep';
import ConfigurationStep from './components/ConfigurationStep';
import ProcessingStep from './components/ProcessingStep';
import ReviewStep from './components/ReviewStep';
import GenerateStep from './components/GenerateStep';
import ChatInterface from './components/ChatInterface';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

const steps = [
  'Upload Documentation',
  'Configure Settings',
  'Process & Extract',
  'Review & Test',
  'Generate Documentation',
];

function App() {
  const [activeStep, setActiveStep] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<any>(null);
  const [config, setConfig] = useState<ProjectConfig>({});
  const [endpoints, setEndpoints] = useState<APIEndpoint[]>([]);
  const [openApiSpec, setOpenApiSpec] = useState<any>(null);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [extractedBaseUrl, setExtractedBaseUrl] = useState<string | undefined>();
  const [extractedMetadata, setExtractedMetadata] = useState<any>({});
  const [extractedParameters, setExtractedParameters] = useState<any[]>([]);

  const handleStartOver = () => {
    // Reset all state to initial values
    setActiveStep(0);
    setUploadedFile(null);
    setConfig({});
    setEndpoints([]);
    setOpenApiSpec(null);
    setProcessingStatus(null);
    setShowChat(false);
    setExtractedBaseUrl(undefined);
    setExtractedMetadata({});
    setExtractedParameters([]);
  };

  const handleNext = () => {
    setActiveStep((prevActiveStep) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep) => prevActiveStep - 1);
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <UploadStep
            onUpload={(file) => {
              setUploadedFile(file);
              // Extract and store the base URL if found
              if (file.parsed?.baseUrl) {
                setExtractedBaseUrl(file.parsed.baseUrl);
                setConfig(prev => ({ ...prev, baseUrl: file.parsed.baseUrl }));
              }
              handleNext();
            }}
          />
        );
      case 1:
        return (
          <ConfigurationStep
            config={config}
            onConfigChange={setConfig}
            onNext={handleNext}
            onBack={handleBack}
            extractedBaseUrl={extractedBaseUrl}
          />
        );
      case 2:
        return (
          <ProcessingStep
            uploadedFile={uploadedFile}
            config={config}
            onProcessComplete={(extractedEndpoints, metadata) => {
              setEndpoints(extractedEndpoints);
              setExtractedMetadata(metadata || {});
              if (metadata?.commonParameters) {
                setExtractedParameters(metadata.commonParameters);
              }
              handleNext();
            }}
            onStatusChange={setProcessingStatus}
          />
        );
      case 3:
        return (
          <ReviewStep
            endpoints={endpoints}
            config={config}
            onEndpointsChange={setEndpoints}
            onNext={handleNext}
            onBack={handleBack}
            extractedParameters={extractedParameters}
          />
        );
      case 4:
        return (
          <GenerateStep
            endpoints={endpoints}
            config={config}
            metadata={extractedMetadata}
            onSpecGenerated={setOpenApiSpec}
            onChatOpen={() => setShowChat(true)}
            onStartOver={handleStartOver}
            documentationUrl={uploadedFile?.url || uploadedFile?.filePath}
          />
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container maxWidth="lg">
        <Box sx={{ my: 4 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h3" component="h1" gutterBottom sx={{ mb: 0, flex: 1 }}>
              API DocHancer
            </Typography>
            <Chip label="v1.0" color="primary" variant="outlined" size="small" />
          </Box>
          <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
            Transform your API documentation into OpenAPI-compliant specifications with AI enhancement
          </Typography>

          <Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          <Box sx={{ mt: 3, mb: 2 }}>
            {getStepContent(activeStep)}
          </Box>
        </Box>

        {showChat && openApiSpec && (
          <ChatInterface
            open={showChat}
            onClose={() => setShowChat(false)}
            openApiSpec={openApiSpec}
            claudeApiKey={config.claudeApiKey || ''}
            onSpecUpdate={setOpenApiSpec}
          />
        )}

        <Box sx={{ mt: 8, mb: 4, pt: 4, borderTop: '1px solid', borderColor: 'divider', textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Created by{' '}
            <Link href="https://github.com/andreipetrus" target="_blank" rel="noopener">
              Andrei Petrus
            </Link>
            {' '}• {' '}
            <Link href="https://github.com/andreipetrus/first-base-api-dochancer" target="_blank" rel="noopener">
              GitHub
            </Link>
            {' '}• © 2025
          </Typography>
        </Box>
      </Container>
    </ThemeProvider>
  );
}

export default App;