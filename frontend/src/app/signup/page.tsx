"use client";

import { Suspense } from 'react';
import SignupForm from '../../components/auth/SignupForm';
import Loading from '../../components/ui/Loading'; // Create this component
import { NextPage } from 'next';

const SignupPage: NextPage = () => {
  return (
    <Suspense fallback={<Loading />}>
      <SignupForm />
    </Suspense>
  );
};

export default SignupPage;