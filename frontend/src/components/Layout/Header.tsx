'use client';

import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth'; // Assuming you have an auth hook

const Header = () => {
  const router = useRouter();
  const { isAuthenticated, logout } = useAuth(); // Use auth context/hook

  return (
    <AppBar position="sticky" elevation={1}>
      <Toolbar>
        <Typography
          variant="h6"
          component="h1"
          sx={{ flexGrow: 1, fontWeight: 700 }}
        >
          Your App Name
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2 }}>
          {isAuthenticated ? (
            <Button
              color="inherit"
              onClick={logout}
              sx={{ fontWeight: 600 }}
            >
              Logout
            </Button>
          ) : (
            <>
              <Button
                color="inherit"
                onClick={() => router.push('/login')}
                sx={{ fontWeight: 600 }}
              >
                Login
              </Button>
              <Button
                variant="outlined"
                color="inherit"
                onClick={() => router.push('/signup')}
                sx={{ fontWeight: 600 }}
              >
                Sign Up
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
