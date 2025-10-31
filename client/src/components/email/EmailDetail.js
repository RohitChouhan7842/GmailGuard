import React from 'react';
import {
  Paper,
  Typography,
  Box,
  Divider,
  IconButton,
  Tooltip,
  Chip,
  Alert,
  Button,
  Avatar,
} from '@mui/material';
import {
  Star,
  StarBorder,
  LabelImportant,
  LabelImportantOutlined,
  Delete,
  Reply,
  Forward,
  Security,
  Warning,
  Block,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { emailAPI, fraudDetectionAPI } from '../../services/api';
import toast from 'react-hot-toast';
import ReactMarkdown from 'react-markdown';

const EmailDetail = ({ email, onEmailUpdate }) => {
  const queryClient = useQueryClient();

  const starMutation = useMutation(emailAPI.star, {
    onSuccess: () => {
      onEmailUpdate();
      toast.success('Email starred');
    },
  });

  const importantMutation = useMutation(emailAPI.important, {
    onSuccess: () => {
      onEmailUpdate();
      toast.success('Email marked as important');
    },
  });

  const deleteMutation = useMutation(emailAPI.delete, {
    onSuccess: () => {
      onEmailUpdate();
      toast.success('Email moved to trash');
    },
  });

  const scanMutation = useMutation(
    () => fraudDetectionAPI.scanEmail(email._id, 'manual'),
    {
      onSuccess: (response) => {
        onEmailUpdate();
        toast.success('Email scanned for fraud');
      },
      onError: () => {
        toast.error('Failed to scan email');
      },
    }
  );

  const handleStarClick = () => {
    starMutation.mutate(email._id);
  };

  const handleImportantClick = () => {
    importantMutation.mutate(email._id);
  };

  const handleDeleteClick = () => {
    deleteMutation.mutate(email._id);
  };

  const handleScanClick = () => {
    scanMutation.mutate();
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getSecurityColor = (riskLevel) => {
    switch (riskLevel) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high': return 'error';
      case 'critical': return 'error';
      default: return 'default';
    }
  };

  const getSecurityIcon = (riskLevel) => {
    switch (riskLevel) {
      case 'high':
      case 'critical':
        return <Block />;
      case 'medium':
        return <Warning />;
      default:
        return <Security />;
    }
  };

  return (
    <Paper sx={{ height: '100%', p: 3, overflow: 'auto' }}>
      {/* Email Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Avatar sx={{ bgcolor: 'primary.main' }}>
            {email.from.name?.charAt(0)?.toUpperCase() || email.from.email.charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6">
              {email.from.name || email.from.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {email.from.email}
            </Typography>
          </Box>
          <Typography variant="caption" color="text.secondary">
            {formatDate(email.receivedDate)}
          </Typography>
        </Box>

        <Typography variant="h5" sx={{ mb: 2 }}>
          {email.subject}
        </Typography>

        {/* Security Alert */}
        {email.fraudAnalysis?.riskLevel && email.fraudAnalysis.riskLevel !== 'low' && (
          <Alert
            severity={email.fraudAnalysis.riskLevel === 'critical' ? 'error' : 'warning'}
            icon={getSecurityIcon(email.fraudAnalysis.riskLevel)}
            sx={{ mb: 2 }}
          >
            <Typography variant="subtitle2">
              Security Risk Detected: {email.fraudAnalysis.riskLevel.toUpperCase()}
            </Typography>
            <Typography variant="body2">
              Fraud Score: {email.fraudAnalysis.fraudScore}/100
            </Typography>
            {email.fraudAnalysis.threats?.map((threat, index) => (
              <Typography key={index} variant="caption" display="block">
                • {threat.type}: {threat.description}
              </Typography>
            ))}
          </Alert>
        )}

        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
          <Tooltip title={email.isStarred ? 'Remove star' : 'Add star'}>
            <IconButton onClick={handleStarClick}>
              {email.isStarred ? <Star color="warning" /> : <StarBorder />}
            </IconButton>
          </Tooltip>

          <Tooltip title={email.isImportant ? 'Remove important' : 'Mark important'}>
            <IconButton onClick={handleImportantClick}>
              {email.isImportant ? (
                <LabelImportant color="warning" />
              ) : (
                <LabelImportantOutlined />
              )}
            </IconButton>
          </Tooltip>

          <Tooltip title="Reply">
            <IconButton>
              <Reply />
            </IconButton>
          </Tooltip>

          <Tooltip title="Forward">
            <IconButton>
              <Forward />
            </IconButton>
          </Tooltip>

          <Tooltip title="Delete">
            <IconButton onClick={handleDeleteClick}>
              <Delete />
            </IconButton>
          </Tooltip>

          {!email.fraudAnalysis?.isScanned && (
            <Button
              variant="outlined"
              startIcon={<Security />}
              onClick={handleScanClick}
              size="small"
            >
              Scan for Fraud
            </Button>
          )}
        </Box>

        <Divider sx={{ mb: 2 }} />
      </Box>

      {/* Email Body */}
      <Box sx={{ mb: 3 }}>
        {email.body?.html ? (
          <div
            dangerouslySetInnerHTML={{ __html: email.body.html }}
            style={{
              lineHeight: 1.6,
              fontSize: '14px',
            }}
          />
        ) : (
          <Typography
            variant="body1"
            sx={{
              whiteSpace: 'pre-wrap',
              lineHeight: 1.6,
            }}
          >
            {email.body?.text || 'No content available'}
          </Typography>
        )}
      </Box>

      {/* Attachments */}
      {email.attachments && email.attachments.length > 0 && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 1 }}>
            Attachments ({email.attachments.length})
          </Typography>
          {email.attachments.map((attachment, index) => (
            <Chip
              key={index}
              label={`${attachment.filename} (${(attachment.size / 1024).toFixed(1)} KB)`}
              variant="outlined"
              sx={{ mr: 1, mb: 1 }}
            />
          ))}
        </Box>
      )}

      {/* Security Analysis Details */}
      {email.fraudAnalysis?.isScanned && (
        <Box sx={{ mb: 3 }}>
          <Divider sx={{ mb: 2 }} />
          <Typography variant="h6" sx={{ mb: 2 }}>
            Security Analysis
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Chip
              icon={getSecurityIcon(email.fraudAnalysis.riskLevel)}
              label={`Risk Level: ${email.fraudAnalysis.riskLevel.toUpperCase()}`}
              color={getSecurityColor(email.fraudAnalysis.riskLevel)}
            />
            <Chip
              label={`Fraud Score: ${email.fraudAnalysis.fraudScore}/100`}
              variant="outlined"
            />
          </Box>

          {email.fraudAnalysis.threats?.length > 0 && (
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Detected Threats:
              </Typography>
              {email.fraudAnalysis.threats.map((threat, index) => (
                <Alert
                  key={index}
                  severity={threat.severity === 'critical' ? 'error' : 'warning'}
                  sx={{ mb: 1 }}
                >
                  <Typography variant="subtitle2">
                    {threat.type.replace('_', ' ').toUpperCase()}
                  </Typography>
                  <Typography variant="body2">
                    {threat.description}
                  </Typography>
                  <Typography variant="caption">
                    Confidence: {threat.confidence}%
                  </Typography>
                </Alert>
              ))}
            </Box>
          )}
        </Box>
      )}
    </Paper>
  );
};

export default EmailDetail;
