import { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  Card,
  CardContent,
  CardActions,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add as AddIcon,
  AccountTree as TreeIcon,
  People as PeopleIcon,
  ArrowForward as ArrowForwardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

const Home = () => {
  const [families, setFamilies] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [newFamilyName, setNewFamilyName] = useState('');
  const [newFamilyDescription, setNewFamilyDescription] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadFamilies();
  }, []);

  const loadFamilies = async () => {
    try {
      // Get families with their member counts
      const { data: families, error: familiesError } = await supabase
        .from('families')
        .select('*, family_members(count)');

      if (familiesError) throw familiesError;

      // Get actual count for each family
      const familiesWithCounts = await Promise.all(
        families.map(async (family) => {
          const { count } = await supabase
            .from('family_members')
            .select('*', { count: 'exact', head: true })
            .eq('family_id', family.id);

          return {
            ...family,
            member_count: count || 0,
          };
        })
      );

      setFamilies(familiesWithCounts);
    } catch (error) {
      console.error('Error loading families:', error);
    }
  };

  const handleCreateFamily = async () => {
    try {
      const { data, error } = await supabase
        .from('families')
        .insert([
          {
            name: newFamilyName,
            description: newFamilyDescription,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setOpenDialog(false);
      setNewFamilyName('');
      setNewFamilyDescription('');
      await loadFamilies();
      navigate(`/chat/${data.id}`);
    } catch (error) {
      console.error('Error creating family:', error);
    }
  };

  return (
    <Container maxWidth='lg'>
      <Box sx={{ mt: 10, mb: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 6 }}>
          <Typography variant='h2' component='h1' gutterBottom>
            Treely
          </Typography>
          <Typography variant='h5' color='text.secondary' sx={{ mb: 4 }}>
            Build your family tree through natural conversations
          </Typography>
          <Button
            variant='contained'
            size='large'
            startIcon={<AddIcon />}
            onClick={() => setOpenDialog(true)}
          >
            Create New Family Tree
          </Button>
        </Box>

        <Grid container spacing={3}>
          {families.map((family) => (
            <Grid item xs={12} sm={6} md={4} key={family.id}>
              <Card
                elevation={2}
                sx={{
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TreeIcon sx={{ mr: 1, color: 'primary.main' }} />
                    <Typography variant='h6' component='div'>
                      {family.name}
                    </Typography>
                  </Box>
                  <Typography color='text.secondary' paragraph>
                    {family.description || 'No description provided'}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleIcon sx={{ color: 'text.secondary' }} />
                    <Typography variant='body2' color='text.secondary'>
                      {family.member_count || 0} members
                    </Typography>
                  </Box>
                </CardContent>
                <CardActions sx={{ justifyContent: 'flex-end' }}>
                  <Tooltip title='Open chat'>
                    <IconButton
                      color='primary'
                      onClick={() => navigate(`/chat/${family.id}`)}
                    >
                      <ArrowForwardIcon />
                    </IconButton>
                  </Tooltip>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth='sm'
          fullWidth
        >
          <DialogTitle>Create New Family Tree</DialogTitle>
          <DialogContent>
            <TextField
              autoFocus
              margin='dense'
              label='Family Name'
              fullWidth
              value={newFamilyName}
              onChange={(e) => setNewFamilyName(e.target.value)}
              sx={{ mb: 2 }}
            />
            <TextField
              margin='dense'
              label='Description (optional)'
              fullWidth
              multiline
              rows={3}
              value={newFamilyDescription}
              onChange={(e) => setNewFamilyDescription(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button
              onClick={handleCreateFamily}
              variant='contained'
              disabled={!newFamilyName.trim()}
            >
              Create
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default Home;
