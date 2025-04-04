import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';

const Loading = () => (
  <Box
    sx={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '200px',
      gap: 2,
    }}
  >
    <CircularProgress color="primary" />
    <Typography variant="body1" color="text.secondary">
      Loading...
    </Typography>
  </Box>
);

export default Loading;
