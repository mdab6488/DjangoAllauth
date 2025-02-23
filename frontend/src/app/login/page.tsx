"use client";

import { Suspense } from 'react';
import LoginForm from '../../components/auth/LoginForm';
import Loading from '../../components/ui/Loading'; // Create this component

const LoginPage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <LoginForm />
    </Suspense>
  );
};

export default LoginPage;