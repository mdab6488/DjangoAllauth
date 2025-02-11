import { useEffect, useState } from 'react';
import { Typography, Container, Box } from '@mui/material';
import { getUserProfile } from '../services/auth';
import { User } from '../types';

const HomePage = () => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const userData = await getUserProfile();
        setUser(userData);
      } catch (error) {
        console.error('Error fetching user profile:', error);
      }
    };

    fetchUserProfile();
  }, []);

  return (
    <Container>
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Welcome {user ? `${user.firstName} ${user.lastName}` : 'Guest'}
        </Typography>
        <Typography variant="body1">
          This is your dashboard. You can start building your application content here.
        </Typography>
      </Box>
    </Container>
  );
};

export default HomePage;