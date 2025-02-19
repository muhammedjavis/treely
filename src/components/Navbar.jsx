import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Container,
  Button,
} from '@mui/material';
import { AccountTree as TreeIcon } from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <AppBar position='fixed' elevation={1} sx={{ bgcolor: 'white' }}>
      <Container maxWidth='lg'>
        <Toolbar disableGutters>
          <TreeIcon sx={{ color: 'primary.main', mr: 2, fontSize: 32 }} />
          <Typography
            variant='h5'
            component='div'
            sx={{
              flexGrow: 1,
              color: 'text.primary',
              fontWeight: 600,
              cursor: 'pointer',
            }}
            onClick={() => navigate('/')}
          >
            Family Tree AI
          </Typography>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              color='primary'
              variant={location.pathname === '/' ? 'contained' : 'text'}
              onClick={() => navigate('/')}
            >
              My Trees
            </Button>
            <Button
              color='primary'
              variant={
                location.pathname === '/family-tree' ? 'contained' : 'text'
              }
              onClick={() => navigate('/family-tree')}
            >
              Visualize
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar;
