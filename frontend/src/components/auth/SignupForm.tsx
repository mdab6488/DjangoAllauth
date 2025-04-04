"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/hooks/useAuth';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  Alert,
  Paper,
  Link,
  CircularProgress
} from '@mui/material';
import { AxiosError } from 'axios';

interface SignupFormInputs {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
}

interface PasswordValidationRules {
  required: string;
  minLength: {
    value: number;
    message: string;
  };
  validate: {
    hasUpper: (value: string) => true | string;
    hasNumber: (value: string) => true | string;
    hasSpecial: (value: string) => true | string;
  };
}

const passwordValidation: PasswordValidationRules = {
  required: 'Password is required',
  minLength: {
    value: 8,
    message: 'Password must be at least 8 characters',
  },
  validate: {
    hasUpper: value => /[A-Z]/.test(value) || 'Must contain at least one uppercase letter',
    hasNumber: value => /\d/.test(value) || 'Must contain at least one number',
    hasSpecial: value => /[!@#$%^&*]/.test(value) || 'Must contain at least one special character',
  }
};

const SignupForm = () => {
  const router = useRouter();
  const { signup } = useAuth();
  const [error, setError] = React.useState<string>('');
  const [isLoading, setIsLoading] = React.useState(false);
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm<SignupFormInputs>({
    mode: 'onBlur',
  });

  const password = watch('password');

  const onSubmit = async (data: SignupFormInputs) => {
    setIsLoading(true);
    setError('');
    
    try {
      await signup(data);
      router.push('/dashboard');
    } catch (err) {
      const error = err as AxiosError<{ message?: string }>;
      setError(error.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Typography component="h1" variant="h5" sx={{ fontWeight: 600 }}>
          Create Account
        </Typography>

        {error && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
        )}

        <Box
          component="form"
          onSubmit={handleSubmit(onSubmit)}
          sx={{ width: '100%', mt: 2 }}
        >
          <TextField
            margin="normal"
            required
            fullWidth
            label="First Name"
            autoComplete="given-name"
            error={!!errors.firstName}
            helperText={errors.firstName?.message}
            disabled={isLoading}
            {...register('firstName', {
              required: 'First name is required',
              minLength: {
                value: 2,
                message: 'Must be at least 2 characters',
              },
            })}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Last Name"
            autoComplete="family-name"
            error={!!errors.lastName}
            helperText={errors.lastName?.message}
            disabled={isLoading}
            {...register('lastName', {
              required: 'Last name is required',
              minLength: {
                value: 2,
                message: 'Must be at least 2 characters',
              },
            })}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Email Address"
            autoComplete="email"
            error={!!errors.email}
            helperText={errors.email?.message}
            disabled={isLoading}
            {...register('email', {
              required: 'Email is required',
              pattern: {
                value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                message: 'Invalid email address',
              },
            })}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Password"
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isLoading}
            {...register('password', passwordValidation)}
          />

          <TextField
            margin="normal"
            required
            fullWidth
            label="Confirm Password"
            type="password"
            error={!!errors.password}
            helperText={errors.password?.message}
            disabled={isLoading}
            {...register('confirmPassword', {
              validate: value => value === password || 'Passwords do not match',
            })}
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            sx={{ mt: 3, height: 48 }}
            disabled={isLoading}
          >
            {isLoading ? (
              <CircularProgress size={24} color="inherit" />
            ) : (
              'Create Account'
            )}
          </Button>

          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Link href="/login" variant="body2">
              Already have an account? Sign in
            </Link>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
};

export default SignupForm;