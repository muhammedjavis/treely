import PropTypes from 'prop-types';
import { Box, Paper, Typography } from '@mui/material';

const FamilyTree = ({ familyData }) => {
  return (
    <Paper elevation={3} sx={{ p: 2, mt: 3 }}>
      <Typography variant='h6' gutterBottom>
        Your Family Tree
      </Typography>
      <Box sx={{ height: '400px', border: '1px dashed #ccc', borderRadius: 1 }}>
        {familyData ? (
          // TODO: Implement tree visualization
          <div>Tree visualization here</div>
        ) : (
          <Typography variant='body2' sx={{ textAlign: 'center', mt: 2 }}>
            Family tree visualization will appear here as you add members
            through the chat
          </Typography>
        )}
      </Box>
    </Paper>
  );
};

FamilyTree.propTypes = {
  familyData: PropTypes.shape({
    // Define the expected shape of your family data
    members: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
        // Add other member properties
      })
    ),
    relationships: PropTypes.arrayOf(
      PropTypes.shape({
        from: PropTypes.string.isRequired,
        to: PropTypes.string.isRequired,
        type: PropTypes.string.isRequired,
      })
    ),
  }),
};

export default FamilyTree;
