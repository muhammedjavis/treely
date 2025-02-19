import PropTypes from 'prop-types';
import { Card, CardContent, CardMedia, Typography, Box } from '@mui/material';

const FamilyMemberCard = ({ member }) => {
  return (
    <Card sx={{ maxWidth: 345, m: 2 }}>
      <CardMedia
        component='img'
        height='200'
        image={member.photo || '/placeholder-profile.jpg'}
        alt={member.name}
      />
      <CardContent>
        <Typography gutterBottom variant='h6' component='div'>
          {member.name}
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Typography variant='body2' color='text.secondary'>
            Born: {member.birthDate}
          </Typography>
          <Typography variant='body2' color='text.secondary'>
            Relation: {member.relation}
          </Typography>
          {member.occupation && (
            <Typography variant='body2' color='text.secondary'>
              Occupation: {member.occupation}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
};

FamilyMemberCard.propTypes = {
  member: PropTypes.shape({
    name: PropTypes.string.isRequired,
    photo: PropTypes.string,
    birthDate: PropTypes.string.isRequired,
    relation: PropTypes.string.isRequired,
    occupation: PropTypes.string,
  }).isRequired,
};

export default FamilyMemberCard;
