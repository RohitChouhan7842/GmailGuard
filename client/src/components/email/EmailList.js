import React from 'react';
import {
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Avatar,
  Typography,
  Box,
  Chip,
  IconButton,
  Tooltip,
  Paper,
} from '@mui/material';
import {
  Star,
  StarBorder,
  LabelImportant,
  LabelImportantOutlined,
  Security,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { emailAPI } from '../../services/api';
import toast from 'react-hot-toast';
import { RouterProvider } from 'react-router-dom';

const EmailList = ({ emails, onEmailSelect, selectedEmail, currentLabel, router }) => {
  const queryClient = useQueryClient();

  const starMutation = useMutation(emailAPI.star, {
    onSuccess: () => {
      queryClient.invalidateQueries(['emails', currentLabel]);
      toast.success('Email starred');
    },
    onError: () => {
      toast.error('Failed to update star status');
    },
  });

  const importantMutation = useMutation(emailAPI.important, {
    onSuccess: () => {
      queryClient.invalidateQueries(['emails', currentLabel]);
      toast.success('Email marked as important');
    },
    onError: () => {
      toast.error('Failed to update important status');
    },
  });

  const handleStarClick = (e, email) => {
    e.stopPropagation();
    starMutation.mutate(email._id);
  };

  const handleImportantClick = (e, email) => {
    e.stopPropagation();
    importantMutation.mutate(email._id);
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

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return 'Today';
    if (diffDays === 2) return 'Yesterday';
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getSenderInitials = (from) => {
    if (from.name) {
      return from.name.split(' ').map(n => n[0]).join('').toUpperCase();
    }
    return from.email.charAt(0).toUpperCase();
  };

  return (
    <Paper sx={{ height: '100%', overflow: 'auto' }}>
      <List sx={{ p: 0 }}>
        {emails.map((email) => (
          <ListItem
            key={email._id}
            disablePadding
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              backgroundColor: selectedEmail?._id === email._id ? 'action.selected' : 'transparent',
            }}
          >
            <ListItemButton
              onClick={() => onEmailSelect(email)}
              sx={{ py: 1.5 }}
            >
              <ListItemAvatar>
                <Avatar sx={{ bgcolor: 'primary.main' }}>
                  {getSenderInitials(email.from)}
                </Avatar>
              </ListItemAvatar>

              <ListItemText
                primary={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography
                      variant="subtitle2"
                      sx={{
                        fontWeight: email.isRead ? 'normal' : 'bold',
                        flex: 1,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {email.from.name || email.from.email}
                    </Typography>
                    
                    {email.fraudAnalysis?.riskLevel && email.fraudAnalysis.riskLevel !== 'low' && (
                      <Chip
                        icon={<Security />}
                        label={email.fraudAnalysis.riskLevel}
                        size="small"
                        color={getSecurityColor(email.fraudAnalysis.riskLevel)}
                        variant="outlined"
                      />
                    )}
                  </Box>
                }
                secondary={
                  <Box>
                    <Typography
                      variant="body2"
                      sx={{
                        fontWeight: email.isRead ? 'normal' : 'bold',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        mb: 0.5,
                      }}
                    >
                      {email.subject}
                    </Typography>
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        display: 'block',
                      }}
                    >
                      {email.preview}
                    </Typography>
                  </Box>
                }
              />

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 1 }}>
                <Tooltip title={email.isStarred ? 'Remove star' : 'Add star'}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleStarClick(e, email)}
                  >
                    {email.isStarred ? (
                      <Star color="warning" fontSize="small" />
                    ) : (
                      <StarBorder fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>

                <Tooltip title={email.isImportant ? 'Remove important' : 'Mark important'}>
                  <IconButton
                    size="small"
                    onClick={(e) => handleImportantClick(e, email)}
                  >
                    {email.isImportant ? (
                      <LabelImportant color="warning" fontSize="small" />
                    ) : (
                      <LabelImportantOutlined fontSize="small" />
                    )}
                  </IconButton>
                </Tooltip>

                <Typography variant="caption" color="text.secondary">
                  {formatDate(email.receivedDate)}
                </Typography>
              </Box>
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      {emails.length === 0 && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '200px',
            color: 'text.secondary',
          }}
        >
          <Typography variant="h6">No emails found</Typography>
          <Typography variant="body2">
            {currentLabel === 'INBOX' ? 'Your inbox is empty' : 
             `No ${currentLabel.toLowerCase()} emails`}
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default EmailList;
