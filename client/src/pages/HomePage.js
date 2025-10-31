import React, { useState, useEffect } from 'react';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Fab,
  Paper,
  Chip,
  Divider,
  Alert,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Inbox,
  Send,
  Drafts,
  Star,
  Delete,
  MoreVert,
  Add,
  Security,
  Settings,
  Logout,
  Search,
  FilterList,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from 'react-query';
import { emailAPI } from '../services/api';
import LoadingSpinner from '../components/common/LoadingSpinner';
import EmailList from '../components/email/EmailList';
import EmailDetail from '../components/email/EmailDetail';
import ComposeDialog from '../components/email/ComposeDialog';
import SecurityIndicator from '../components/security/SecurityIndicator';

const drawerWidth = 280;

const HomePage = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [selectedEmail, setSelectedEmail] = useState(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [currentLabel, setCurrentLabel] = useState('INBOX');
  const [searchQuery, setSearchQuery] = useState('');

  const { user, logout } = useAuth();

  // Fetch emails based on current label
  const { data: emailsData, isLoading, error, refetch } = useQuery(
    ['emails', currentLabel],
    () => emailAPI.getInbox(1, 50),
    {
      refetchInterval: 30000, // Refetch every 30 seconds
    }
  );

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const handleEmailSelect = (email) => {
    setSelectedEmail(email);
  };

  const handleComposeOpen = () => {
    setComposeOpen(true);
  };

  const handleComposeClose = () => {
    setComposeOpen(false);
  };

  const handleLabelChange = (label) => {
    setCurrentLabel(label);
    setSelectedEmail(null);
  };

  const drawer = (
    <Box>
      <Toolbar>
        <Typography variant="h6" noWrap component="div">
          Gmail Fraud Detection
        </Typography>
      </Toolbar>
      
      <Box sx={{ p: 2 }}>
        <Fab
          color="primary"
          aria-label="compose"
          onClick={handleComposeOpen}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          <Add />
          Compose
        </Fab>
      </Box>

      <List>
        {[
          { text: 'Inbox', icon: <Inbox />, label: 'INBOX' },
          { text: 'Starred', icon: <Star />, label: 'STARRED' },
          { text: 'Important', icon: <FilterList />, label: 'IMPORTANT' },
          { text: 'Sent', icon: <Send />, label: 'SENT' },
          { text: 'Drafts', icon: <Drafts />, label: 'DRAFT' },
          { text: 'Trash', icon: <Delete />, label: 'TRASH' },
        ].map((item) => (
          <ListItem key={item.text} disablePadding>
            <ListItemButton
              selected={currentLabel === item.label}
              onClick={() => handleLabelChange(item.label)}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.text} />
            </ListItemButton>
          </ListItem>
        ))}
      </List>

      <Divider sx={{ my: 1 }} />

      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => window.location.href = '/security'}>
            <ListItemIcon>
              <Security />
            </ListItemIcon>
            <ListItemText primary="Security Dashboard" />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => window.location.href = '/settings'}>
            <ListItemIcon>
              <Settings />
            </ListItemIcon>
            <ListItemText primary="Settings" />
          </ListItemButton>
        </ListItem>
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>
          
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1 }}>
            {currentLabel === 'INBOX' ? 'Inbox' : 
             currentLabel === 'STARRED' ? 'Starred' :
             currentLabel === 'IMPORTANT' ? 'Important' :
             currentLabel === 'SENT' ? 'Sent' :
             currentLabel === 'DRAFT' ? 'Drafts' :
             currentLabel === 'TRASH' ? 'Trash' : currentLabel}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SecurityIndicator />
            
            <IconButton color="inherit">
              <Search />
            </IconButton>
            
            <IconButton
              color="inherit"
              onClick={handleProfileMenuOpen}
            >
              <Avatar sx={{ width: 32, height: 32 }}>
                {user?.name?.charAt(0)?.toUpperCase()}
              </Avatar>
            </IconButton>
          </Box>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
      >
        <MenuItem onClick={handleProfileMenuClose}>
          <Avatar sx={{ mr: 1, width: 24, height: 24 }}>
            {user?.name?.charAt(0)?.toUpperCase()}
          </Avatar>
          {user?.name}
        </MenuItem>
        <MenuItem onClick={() => window.location.href = '/settings'}>
          <Settings sx={{ mr: 1 }} />
          Settings
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <Logout sx={{ mr: 1 }} />
          Logout
        </MenuItem>
      </Menu>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true,
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: 8,
        }}
      >
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            Failed to load emails. Please try again.
          </Alert>
        )}

        {isLoading ? (
          <LoadingSpinner message="Loading emails..." />
        ) : (
          <Box sx={{ display: 'flex', gap: 2, height: 'calc(100vh - 120px)' }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <EmailList
                emails={emailsData?.emails || []}
                onEmailSelect={handleEmailSelect}
                selectedEmail={selectedEmail}
                currentLabel={currentLabel}
              />
            </Box>
            
            {selectedEmail && (
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <EmailDetail
                  email={selectedEmail}
                  onEmailUpdate={refetch}
                />
              </Box>
            )}
          </Box>
        )}
      </Box>

      <ComposeDialog
        open={composeOpen}
        onClose={handleComposeClose}
        onEmailSent={refetch}
      />
    </Box>
  );
};

export default HomePage;
