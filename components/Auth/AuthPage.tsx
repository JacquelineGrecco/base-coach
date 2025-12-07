import React, { useState, useEffect } from 'react';
import { Login } from './Login';
import { Signup } from './Signup';
import { ForgotPassword } from './ForgotPassword';
import { ResetPassword } from './ResetPassword';
import { useAuth } from '../../contexts/AuthContext';

type AuthView = 'login' | 'signup' | 'forgot-password' | 'reset-password';

export function AuthPage() {
  const { clearProfileError } = useAuth();
  const [view, setView] = useState<AuthView>('login');

  // Check if we're coming from a password reset email link
  useEffect(() => {
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const type = hashParams.get('type');
    
    if (type === 'recovery') {
      setView('reset-password');
    }
  }, []);

  switch (view) {
    case 'signup':
      return <Signup onSwitchToLogin={() => {
        clearProfileError();
        setView('login');
      }} />;
    
    case 'forgot-password':
      return <ForgotPassword onBack={() => {
        clearProfileError();
        setView('login');
      }} />;
    
    case 'reset-password':
      return <ResetPassword onSuccess={() => {
        clearProfileError();
        setView('login');
      }} />;
    
    case 'login':
    default:
      return (
        <Login
          onSwitchToSignup={() => {
            clearProfileError();
            setView('signup');
          }}
          onForgotPassword={() => {
            clearProfileError();
            setView('forgot-password');
          }}
        />
      );
  }
}

