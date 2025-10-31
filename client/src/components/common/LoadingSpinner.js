import React from 'react';
import { CircularProgress, Box } from '@mui/material';

const LoadingSpinner = ({ size = 40, message = 'Loading...' }) => {
  return (
    <Box
      display="flex"
      flexDirection="column"
      alignItems="center"
      justifyContent="center"
      p={3}
    >
      <CircularProgress size={size} />
      {message && (
        <Box mt={2} color="text.secondary">
          {message}
        </Box>
      )}
    </Box>
  );
};

export default LoadingSpinner;

