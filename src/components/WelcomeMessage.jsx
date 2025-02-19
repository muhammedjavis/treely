import { Box, Typography, Paper } from '@mui/material';
import { AccountTree as TreeIcon } from '@mui/icons-material';

const WelcomeMessage = () => {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 3,
        background: 'linear-gradient(135deg, #3f51b5 0%, #757de8 100%)',
        color: 'white',
        textAlign: 'center',
      }}
    >
      <TreeIcon sx={{ fontSize: 48, mb: 2 }} />
      <Typography variant='h5' sx={{ mb: 1, fontWeight: 600 }}>
        Welcome to Family Tree AI
      </Typography>
      <Typography sx={{ opacity: 0.9 }}>
        I'm here to help you build your family tree through natural
        conversation. Just tell me about your family members and I'll organize
        everything for you.
      </Typography>
    </Paper>
  );
};

export default WelcomeMessage;
