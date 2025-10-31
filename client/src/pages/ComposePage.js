import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import ComposeDialog from '../components/email/ComposeDialog';

const ComposePage = () => {
  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Compose Email
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Create and send a new email with integrated fraud detection
      </Typography>
      
      <Paper sx={{ p: 3, minHeight: '60vh' }}>
        <ComposeDialog open={true} onClose={() => window.history.back()} />
      </Paper>
    </Box>
  );
};

export default ComposePage;
