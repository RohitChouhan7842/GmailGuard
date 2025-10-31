import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Switch,
  FormControlLabel,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
  Alert,
} from '@mui/material';
import {
  Person,
  Security,
  Notifications,
  Palette,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { userAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState(0);
  const { user, updateUser } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile, isLoading } = useQuery(
    'user-profile',
    userAPI.getProfile,
  );

  const updateProfileMutation = useMutation(userAPI.updateProfile, {
    onSuccess: (response) => {
      updateUser(response.data.user);
      toast.success('Profile updated successfully');
    },
    onError: () => {
      toast.error('Failed to update profile');
    },
  });

  const updatePreferencesMutation = useMutation(userAPI.updatePreferences, {
    onSuccess: () => {
      queryClient.invalidateQueries('user-profile');
      toast.success('Preferences updated successfully');
    },
    onError: () => {
      toast.error('Failed to update preferences');
    },
  });

  const updateSecurityMutation = useMutation(userAPI.updateSecuritySettings, {
    onSuccess: () => {
      queryClient.invalidateQueries('user-profile');
      toast.success('Security settings updated successfully');
    },
    onError: () => {
      toast.error('Failed to update security settings');
    },
  });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const profileData = {
      name: formData.get('name'),
      avatar: formData.get('avatar'),
    };
    updateProfileMutation.mutate(profileData);
  };

  const handlePreferencesUpdate = (preferences) => {
    updatePreferencesMutation.mutate(preferences);
  };

  const handleSecurityUpdate = (settings) => {
    updateSecurityMutation.mutate(settings);
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading settings..." />;
  }

  const userProfile = profile?.user || user;

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account settings and preferences
      </Typography>

      <Paper sx={{ mb: 3 }}>
        <Tabs value={activeTab} onChange={handleTabChange}>
          <Tab icon={<Person />} label="Profile" />
          <Tab icon={<Palette />} label="Preferences" />
          <Tab icon={<Security />} label="Security" />
          <Tab icon={<Notifications />} label="Notifications" />
        </Tabs>
      </Paper>

      {/* Profile Tab */}
      {activeTab === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Profile Information
          </Typography>
          
          <Box component="form" onSubmit={handleProfileUpdate}>
            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Full Name"
                  name="name"
                  defaultValue={userProfile.name}
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  value={userProfile.email}
                  disabled
                  helperText="Email cannot be changed"
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Avatar URL"
                  name="avatar"
                  defaultValue={userProfile.avatar}
                  placeholder="https://example.com/avatar.jpg"
                />
              </Grid>
              
              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={updateProfileMutation.isLoading}
                >
                  {updateProfileMutation.isLoading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      )}

      {/* Preferences Tab */}
      {activeTab === 1 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Display Preferences
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userProfile.preferences?.theme === 'dark'}
                    onChange={(e) => handlePreferencesUpdate({
                      theme: e.target.checked ? 'dark' : 'light'
                    })}
                  />
                }
                label="Dark Mode"
              />
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                select
                label="Language"
                value={userProfile.preferences?.language || 'en'}
                onChange={(e) => handlePreferencesUpdate({
                  language: e.target.value
                })}
                SelectProps={{ native: true }}
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </TextField>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Timezone"
                value={userProfile.preferences?.timezone || 'UTC'}
                onChange={(e) => handlePreferencesUpdate({
                  timezone: e.target.value
                })}
              />
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Security Tab */}
      {activeTab === 2 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Security Settings
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userProfile.securitySettings?.fraudDetectionEnabled}
                    onChange={(e) => handleSecurityUpdate({
                      fraudDetectionEnabled: e.target.checked
                    })}
                  />
                }
                label="Enable Fraud Detection"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userProfile.securitySettings?.autoQuarantine}
                    onChange={(e) => handleSecurityUpdate({
                      autoQuarantine: e.target.checked
                    })}
                  />
                }
                label="Auto-Quarantine Suspicious Emails"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userProfile.securitySettings?.twoFactorEnabled}
                    onChange={(e) => handleSecurityUpdate({
                      twoFactorEnabled: e.target.checked
                    })}
                  />
                }
                label="Two-Factor Authentication"
              />
            </Grid>
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>
                Custom Security Rules
              </Typography>
              
              {userProfile.securitySettings?.customRules?.length > 0 ? (
                <Box>
                  {userProfile.securitySettings.customRules.map((rule, index) => (
                    <Card key={index} sx={{ mb: 2 }}>
                      <CardContent>
                        <Typography variant="subtitle1">
                          {rule.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Pattern: {rule.pattern}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          Action: {rule.action}
                        </Typography>
                      </CardContent>
                    </Card>
                  ))}
                </Box>
              ) : (
                <Alert severity="info">
                  No custom security rules configured
                </Alert>
              )}
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* Notifications Tab */}
      {activeTab === 3 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Notification Preferences
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userProfile.preferences?.notifications?.email}
                    onChange={(e) => handlePreferencesUpdate({
                      notifications: {
                        ...userProfile.preferences?.notifications,
                        email: e.target.checked
                      }
                    })}
                  />
                }
                label="Email Notifications"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userProfile.preferences?.notifications?.desktop}
                    onChange={(e) => handlePreferencesUpdate({
                      notifications: {
                        ...userProfile.preferences?.notifications,
                        desktop: e.target.checked
                      }
                    })}
                  />
                }
                label="Desktop Notifications"
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={userProfile.preferences?.notifications?.mobile}
                    onChange={(e) => handlePreferencesUpdate({
                      notifications: {
                        ...userProfile.preferences?.notifications,
                        mobile: e.target.checked
                      }
                    })}
                  />
                }
                label="Mobile Push Notifications"
              />
            </Grid>
          </Grid>
        </Paper>
      )}
    </Box>
  );
};

export default SettingsPage;
