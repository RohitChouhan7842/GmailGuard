import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  Alert,
  Button,
} from '@mui/material';
import {
  Security,
  Warning,
  Error,
  CheckCircle,
  Block,
  Flag,
} from '@mui/icons-material';
import { useQuery } from 'react-query';
import { fraudDetectionAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';

const SecurityDashboardPage = () => {
  const { data: stats, isLoading: statsLoading } = useQuery(
    'fraud-stats-detailed',
    () => fraudDetectionAPI.getStats(30), // Last 30 days
  );

  const { data: logs, isLoading: logsLoading } = useQuery(
    'fraud-logs',
    () => fraudDetectionAPI.getLogs(1, 10),
  );

  if (statsLoading || logsLoading) {
    return <LoadingSpinner message="Loading security dashboard..." />;
  }

  const fraudStats = stats?.stats || {};
  const fraudLogs = logs?.logs || [];

  const getRiskLevelColor = (level) => {
    switch (level) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getRiskLevelIcon = (level) => {
    switch (level) {
      case 'low': return <CheckCircle />;
      case 'medium': return <Warning />;
      case 'high': return <Error />;
      case 'critical': return <Block />;
      default: return <Security />;
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Security Dashboard
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Monitor email security threats and fraud detection activity
      </Typography>

      <Grid container spacing={3}>
        {/* Security Overview */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Overview (Last 30 Days)
            </Typography>
            
            <Grid container spacing={2} sx={{ mb: 3 }}>
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="primary">
                      {fraudStats.totalScans || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Total Scans
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="error">
                      {fraudStats.blockedEmails || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Blocked Emails
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="warning">
                      {fraudStats.quarantinedEmails || 0}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Quarantined
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              
              <Grid item xs={6} md={3}>
                <Card>
                  <CardContent sx={{ textAlign: 'center' }}>
                    <Typography variant="h4" color="success">
                      {((fraudStats.totalScans || 0) - (fraudStats.blockedEmails || 0) - (fraudStats.quarantinedEmails || 0))}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Safe Emails
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Risk Level Breakdown */}
            {fraudStats.riskLevelBreakdown && fraudStats.riskLevelBreakdown.length > 0 && (
              <Box>
                <Typography variant="h6" gutterBottom>
                  Risk Level Breakdown
                </Typography>
                <Grid container spacing={1}>
                  {fraudStats.riskLevelBreakdown.map((item, index) => (
                    <Grid item key={index}>
                      <Chip
                        icon={getRiskLevelIcon(item._id)}
                        label={`${item._id.toUpperCase()}: ${item.count}`}
                        color={getRiskLevelColor(item._id)}
                        variant="outlined"
                        sx={{ mr: 1, mb: 1 }}
                      />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Recent Security Events */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Recent Security Events
            </Typography>
            
            {fraudLogs.length > 0 ? (
              <List>
                {fraudLogs.slice(0, 5).map((log, index) => (
                  <ListItem key={index} divider>
                    <ListItemIcon>
                      {getRiskLevelIcon(log.scanResult.riskLevel)}
                    </ListItemIcon>
                    <ListItemText
                      primary={
                        <Typography variant="body2">
                          {log.emailId?.subject || 'Unknown Email'}
                        </Typography>
                      }
                      secondary={
                        <Box>
                          <Typography variant="caption" display="block">
                            Risk: {log.scanResult.riskLevel.toUpperCase()}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {new Date(log.scanTimestamp).toLocaleString()}
                          </Typography>
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Alert severity="info">
                No recent security events
              </Alert>
            )}
          </Paper>
        </Grid>

        {/* Security Recommendations */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Security Recommendations
            </Typography>
            
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Alert severity="info" sx={{ height: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Enable Auto-Quarantine
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Automatically quarantine emails with high fraud scores
                  </Typography>
                  <Button size="small" variant="outlined">
                    Configure
                  </Button>
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Alert severity="warning" sx={{ height: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Review Custom Rules
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Update your custom fraud detection rules
                  </Typography>
                  <Button size="small" variant="outlined">
                    Review Rules
                  </Button>
                </Alert>
              </Grid>
              
              <Grid item xs={12} md={4}>
                <Alert severity="success" sx={{ height: '100%' }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Security Training
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Complete security awareness training
                  </Typography>
                  <Button size="small" variant="outlined">
                    Start Training
                  </Button>
                </Alert>
              </Grid>
            </Grid>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default SecurityDashboardPage;
