import { createTheme } from '@mui/material/styles';

// Define your custom theme creation logic
export const createAppTheme = () => {
  return createTheme({
    palette: {
      primary: {
        main: '#1976d2',
      },
      // Other palette configurations...
    },
  });
};

// Define and export your `useTheme` hook
export const useTheme = () => {
  // Here you can call createAppTheme or implement custom logic
  return createAppTheme(); // return the theme object
};
