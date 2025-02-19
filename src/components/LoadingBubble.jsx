import { Box, CircularProgress } from '@mui/material';

const LoadingBubble = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 1,
        p: 2,
        bgcolor: 'grey.50',
        borderRadius: '20px 20px 20px 5px',
        maxWidth: 'fit-content',
      }}
    >
      <CircularProgress size={20} thickness={5} />
      <Box
        component='span'
        sx={{
          fontSize: '0.875rem',
          color: 'text.secondary',
        }}
      >
        Thinking...
      </Box>
    </Box>
  );
};

export default LoadingBubble;
