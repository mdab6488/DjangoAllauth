import React from 'react';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Link from 'next/link';
import { Theme } from '@mui/material/styles';

const Footer: React.FC = () => {
  const getBackgroundColor = (theme: Theme) =>
    theme.palette.mode === 'light'
      ? theme.palette.grey[200] || '#ffffff'
      : theme.palette.grey[800] || '#000000';

  return (
    <Box 
      component="footer"
      sx={(theme) => ({
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: getBackgroundColor(theme),
      })}
    >
      <Container maxWidth="sm">
        <Typography variant="body2" align="center" color="text.secondary">
          <Link href="/privacy" passHref legacyBehavior>
            <Typography
              component="a"
              color="inherit"
              sx={{ cursor: 'pointer', mx: 1 }}
            >
              Privacy Policy
            </Typography>
          </Link>
          |
          <Link href="/terms" passHref legacyBehavior>
            <Typography
              component="a"
              color="inherit"
              sx={{ cursor: 'pointer', mx: 1 }}
            >
              Terms of Service
            </Typography>
          </Link>
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;