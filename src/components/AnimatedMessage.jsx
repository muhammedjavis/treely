import { motion } from 'framer-motion';
import { Paper, Typography } from '@mui/material';

const AnimatedMessage = ({ message, isUser }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2 }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 2,
          maxWidth: '70%',
          bgcolor: isUser ? 'primary.main' : 'grey.50',
          color: isUser ? 'white' : 'text.primary',
          borderRadius: isUser ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
          boxShadow: isUser
            ? '0 4px 6px -1px rgba(63, 81, 181, 0.2)'
            : '0 4px 6px -1px rgba(0, 0, 0, 0.05)',
        }}
      >
        <Typography variant='body1' sx={{ lineHeight: 1.6 }}>
          {message.content}
        </Typography>
        <Typography
          variant='caption'
          sx={{
            display: 'block',
            mt: 1,
            opacity: 0.8,
            textAlign: isUser ? 'right' : 'left',
          }}
        >
          {new Date(message.timestamp).toLocaleTimeString()}
        </Typography>
      </Paper>
    </motion.div>
  );
};

export default AnimatedMessage;
