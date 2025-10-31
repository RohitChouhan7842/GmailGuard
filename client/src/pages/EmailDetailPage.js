import React from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Paper } from '@mui/material';
import { useQuery } from 'react-query';
import { emailAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmailDetail from '../components/email/EmailDetail';

const EmailDetailPage = () => {
  const { id } = useParams();
  
  const { data: email, isLoading, error } = useQuery(
    ['email', id],
    () => emailAPI.getEmail(id),
    {
      enabled: !!id,
    }
  );

  if (isLoading) {
    return <LoadingSpinner message="Loading email..." />;
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6" color="error">
          Error loading email
        </Typography>
      </Box>
    );
  }

  if (!email) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">
          Email not found
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <EmailDetail email={email.email} />
    </Box>
  );
};

export default EmailDetailPage;
