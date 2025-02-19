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

const Chat = () => {
  const { familyId } = useParams();
  const navigate = useNavigate();
  const [family, setFamily] = useState(null);

  useEffect(() => {
    loadFamily();
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
            background: 'linear-gradient(135deg, #3f51b5 0%, #757de8 100%)',
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
        <FamilyTreeChat familyId={familyId} />
      </Container>
    </Box>
  );
};

export default Chat;
