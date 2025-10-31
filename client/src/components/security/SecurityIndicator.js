import React from 'react';
import { Box, Typography, Chip } from '@mui/material';
import { Security, Warning, Error } from '@mui/icons-material';
import { useQuery } from 'react-query';
import { fraudDetectionAPI } from '../../services/api';

const SecurityIndicator = () => {
  const { data: stats, isLoading } = useQuery(
    'fraud-stats',
    () => fraudDetectionAPI.getStats(7), // Last 7 days
    {
      refetchInterval: 60000, // Refetch every minute
    }
  );

  if (isLoading || !stats) {
    return (
      <Chip
        icon={<Security />}
        label="Security"
        size="small"
        color="default"
        variant="outlined"
      />
    );
  }

  const { stats: fraudStats } = stats;
  const totalScans = fraudStats.totalScans || 0;
  const blockedEmails = fraudStats.blockedEmails || 0;
  const quarantinedEmails = fraudStats.quarantinedEmails || 0;

  // Determine security status based on recent activity
  let securityLevel = 'low';
  let color = 'success';
  let icon = <Security />;

  if (blockedEmails > 0 || quarantinedEmails > 0) {
    securityLevel = 'medium';
    color = 'warning';
    icon = <Warning />;
  }

  if (blockedEmails > 5 || quarantinedEmails > 10) {
    securityLevel = 'high';
    color = 'error';
    icon = <Error />;
  }

  return (
    <Chip
      icon={icon}
      label={`Security: ${securityLevel}`}
      size="small"
      color={color}
      variant="outlined"
      onClick={() => window.location.href = '/security'}
      sx={{ cursor: 'pointer' }}
    />
  );
};

export default SecurityIndicator;
