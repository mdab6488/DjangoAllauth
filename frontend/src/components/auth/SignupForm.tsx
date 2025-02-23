// frontend/src/components/auth/SignupForm.tsx
"use client";
import React from 'react';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  Grid,
  Link,
} from '@mui/material';
import { register as registerUser } from '../../services/auth';

interface SignupFormInputs {
  email: string;
  password1: string;
  password2: string;
  firstName: string;
  lastName: string;
}

const SignupForm = () => {
  const router = useRouter();
  const [error, setError] = useState('');
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormInputs>();
  const password = watch('password1');

  const onSubmit = async (data: SignupFormInputs) => {
    try {
      const response = await registerUser(data.email, data.password1, data.password2);
      localStorage.setItem('token', response.access);
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error && (err as { response?: { data?: { message?: string } } }).response?.data?.message) {
        const errorMessage = (err as unknown as { response: { data: { message: string } } }).response.data.message;
        setError(errorMessage);
      } else {
        setError('Registration failed');
      }
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h5">
          Sign up
        </Typography>
        {error && <Alert severity="error" sx={{ mt: 2, width: '100%' }}>{error}</Alert>}
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ mt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField
                autoComplete="given-name"
                required
                fullWidth
                label="First Name"
                {...register('firstName', {
                  required: 'First name is required',
                })}
                error={!!errors.firstName}
                helperText={errors.firstName?.message}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                required
                fullWidth
                label="Last Name"
                autoComplete="family-name"
                {...register('lastName', {
                  required: 'Last name is required',
                })}
                error={!!errors.lastName}
                helperText={errors.lastName?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Email Address"
                autoComplete="email"
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address',
                  },
                })}
                error={!!errors.email}
                helperText={errors.email?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Password"
                type="password"
                {...register('password1', {
                  required: 'Password is required',
                  minLength: {
                    value: 8,
                    message: 'Password must be at least 8 characters',
                  },
                })}
                error={!!errors.password1}
                helperText={errors.password1?.message}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                required
                fullWidth
                label="Confirm Password"
                type="password"
                {...register('password2', {
                  required: 'Please confirm your password',
                  validate: value => value === password || 'Passwords do not match',
                })}
                error={!!errors.password2}
                helperText={errors.password2?.message}
              />
            </Grid>
          </Grid>
          <Button
            type="submit"
            fullWidth
            variant="contained"
            sx={{ mt: 3, mb: 2 }}
          >
            Sign Up
          </Button>
          <Grid container justifyContent="flex-end">
            <Grid item>
              <Link href="/login" variant="body2">
                Already have an account? Sign in
              </Link>
            </Grid>
          </Grid>
        </Box>
      </Box>
    </Container>
  );
};

export default SignupForm;