import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Close,
  AttachFile,
  Send,
  Security,
} from '@mui/icons-material';
import { useMutation, useQueryClient } from 'react-query';
import { emailAPI } from '../../services/api';
import toast from 'react-hot-toast';

const ComposeDialog = ({ open, onClose, onEmailSent }) => {
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    body: '',
  });
  const [toList, setToList] = useState([]);
  const [ccList, setCcList] = useState([]);
  const [bccList, setBccList] = useState([]);
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const composeMutation = useMutation(emailAPI.compose, {
    onSuccess: () => {
      queryClient.invalidateQueries(['emails']);
      onEmailSent();
      handleClose();
      toast.success('Email sent successfully');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to send email');
    },
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleClose = () => {
    setFormData({
      to: '',
      cc: '',
      bcc: '',
      subject: '',
      body: '',
    });
    setToList([]);
    setCcList([]);
    setBccList([]);
    onClose();
  };

  const handleSend = () => {
    if (!formData.to.trim() || !formData.subject.trim() || !formData.body.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    const emailData = {
      to: toList.length > 0 ? toList : [{ email: formData.to, name: '' }],
      cc: ccList.length > 0 ? ccList : (formData.cc ? [{ email: formData.cc, name: '' }] : []),
      bcc: bccList.length > 0 ? bccList : (formData.bcc ? [{ email: formData.bcc, name: '' }] : []),
      subject: formData.subject,
      body: formData.body,
    };

    composeMutation.mutate(emailData);
  };

  const addEmailToList = (email, listType) => {
    if (!email.trim()) return;

    const emailObj = { email: email.trim(), name: '' };
    
    switch (listType) {
      case 'to':
        if (!toList.some(e => e.email === emailObj.email)) {
          setToList([...toList, emailObj]);
          setFormData({ ...formData, to: '' });
        }
        break;
      case 'cc':
        if (!ccList.some(e => e.email === emailObj.email)) {
          setCcList([...ccList, emailObj]);
          setFormData({ ...formData, cc: '' });
        }
        break;
      case 'bcc':
        if (!bccList.some(e => e.email === emailObj.email)) {
          setBccList([...bccList, emailObj]);
          setFormData({ ...formData, bcc: '' });
        }
        break;
    }
  };

  const removeEmailFromList = (email, listType) => {
    switch (listType) {
      case 'to':
        setToList(toList.filter(e => e.email !== email));
        break;
      case 'cc':
        setCcList(ccList.filter(e => e.email !== email));
        break;
      case 'bcc':
        setBccList(bccList.filter(e => e.email !== email));
        break;
    }
  };

  const handleKeyPress = (e, listType) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const fieldName = listType === 'to' ? 'to' : listType === 'cc' ? 'cc' : 'bcc';
      addEmailToList(formData[fieldName], listType);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: { height: '80vh' }
      }}
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography variant="h6">Compose Email</Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Security Scan Enabled">
              <Security color="success" />
            </Tooltip>
            <IconButton onClick={handleClose}>
              <Close />
            </IconButton>
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {/* To Field */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            To *
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            {toList.map((email, index) => (
              <Chip
                key={index}
                label={email.email}
                onDelete={() => removeEmailFromList(email.email, 'to')}
                size="small"
              />
            ))}
          </Box>
          <TextField
            fullWidth
            placeholder="Enter email address"
            value={formData.to}
            onChange={handleChange}
            onKeyPress={(e) => handleKeyPress(e, 'to')}
            onBlur={() => addEmailToList(formData.to, 'to')}
            name="to"
            size="small"
          />
        </Box>

        {/* CC Field */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            CC
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            {ccList.map((email, index) => (
              <Chip
                key={index}
                label={email.email}
                onDelete={() => removeEmailFromList(email.email, 'cc')}
                size="small"
              />
            ))}
          </Box>
          <TextField
            fullWidth
            placeholder="Enter CC email address"
            value={formData.cc}
            onChange={handleChange}
            onKeyPress={(e) => handleKeyPress(e, 'cc')}
            onBlur={() => addEmailToList(formData.cc, 'cc')}
            name="cc"
            size="small"
          />
        </Box>

        {/* BCC Field */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            BCC
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 1 }}>
            {bccList.map((email, index) => (
              <Chip
                key={index}
                label={email.email}
                onDelete={() => removeEmailFromList(email.email, 'bcc')}
                size="small"
              />
            ))}
          </Box>
          <TextField
            fullWidth
            placeholder="Enter BCC email address"
            value={formData.bcc}
            onChange={handleChange}
            onKeyPress={(e) => handleKeyPress(e, 'bcc')}
            onBlur={() => addEmailToList(formData.bcc, 'bcc')}
            name="bcc"
            size="small"
          />
        </Box>

        {/* Subject Field */}
        <TextField
          fullWidth
          label="Subject *"
          value={formData.subject}
          onChange={handleChange}
          name="subject"
          size="small"
        />

        {/* Body Field */}
        <TextField
          fullWidth
          label="Message *"
          multiline
          rows={12}
          value={formData.body}
          onChange={handleChange}
          name="body"
          placeholder="Type your message here..."
          sx={{ flex: 1 }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button
          onClick={handleClose}
          disabled={composeMutation.isLoading}
        >
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={handleSend}
          disabled={composeMutation.isLoading}
          startIcon={<Send />}
        >
          {composeMutation.isLoading ? 'Sending...' : 'Send'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ComposeDialog;
