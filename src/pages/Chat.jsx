/* eslint-disable react-hooks/exhaustive-deps */
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  IconButton,
  Paper,
  Divider,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  AccountTree as TreeIcon,
} from '@mui/icons-material';
import FamilyTreeChat from '../components/FamilyTreeChat';
import { supabase } from '../lib/supabase';
import WelcomeMessage from '../components/WelcomeMessage';
import FamilyTreeVisualization from '../components/FamilyTreeVisualization';

const Chat = () => {
  const { familyId } = useParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    loadFamily();
    // Add initial AI message if there are no messages
    if (messages.length === 0) {
      setMessages([
        {
          content:
            "Hi! I'm here to help you build your family tree. Could you tell me who you are?",
          role: 'assistant',
          timestamp: new Date().toISOString(),
        },
      ]);
    }
  }, [familyId]);

  const loadFamily = async () => {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single();

      if (error) throw error;
      setFamily(data);
    } catch (error) {
      console.error('Error loading family:', error);
      navigate('/');
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        bgcolor: 'background.default',
        pt: 8,
        pb: 4,
      }}
    >
      <Container maxWidth='lg'>
        <Paper
          elevation={0}
          sx={{
            p: 3,
            mb: 3,
            borderRadius: 3,
            background: 'linear-gradient(135deg, #8B7355 0%, #A68B6C 100%)',
            color: 'white',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <IconButton
              onClick={() => navigate('/')}
              sx={{
                mr: 2,
                color: 'white',
                bgcolor: 'rgba(255, 255, 255, 0.1)',
                '&:hover': {
                  bgcolor: 'rgba(255, 255, 255, 0.2)',
                },
              }}
            >
              <ArrowBackIcon />
            </IconButton>
            <TreeIcon sx={{ mr: 2, fontSize: 32 }} />
            <Typography variant='h4' sx={{ fontWeight: 600 }}>
              {family?.name || 'Loading...'}
            </Typography>
          </Box>
          {family?.description && (
            <>
              <Divider
                sx={{ my: 2, borderColor: 'rgba(255, 255, 255, 0.2)' }}
              />
              <Typography sx={{ opacity: 0.9 }}>
                {family.description}
              </Typography>
            </>
          )}
        </Paper>
        {!messages.length && <WelcomeMessage />}
        <FamilyTreeChat
          familyId={familyId}
          messages={messages}
          setMessages={setMessages}
        />
        <Box sx={{ mt: 4 }}>
          <Typography variant='h5' sx={{ mb: 2 }}>
            Family Tree Visualization
          </Typography>
          <FamilyTreeVisualization familyId={familyId} />
        </Box>
      </Container>
    </Box>
  );
};

export default Chat;
