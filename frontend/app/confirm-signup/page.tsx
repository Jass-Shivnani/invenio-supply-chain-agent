'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  Stack,
} from '@mui/material';
import { VerifiedUser } from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

function ConfirmSignUpContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { confirmSignUp, resendConfirmationCode } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const emailParam = searchParams.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await confirmSignUp(email, code);
      setSuccess('Email verified successfully! Redirecting to sign in...');
      setTimeout(() => {
        router.push('/signin');
      }, 2000);
    } catch (err: any) {
      console.error('Confirmation error:', err);
      
      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code. Please check and try again.');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.');
      } else {
        setError(err.message || 'Failed to verify email. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      await resendConfirmationCode(email);
      setSuccess('New verification code sent to your email!');
    } catch (err: any) {
      console.error('Resend code error:', err);
      setError(err.message || 'Failed to resend code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        p: 2,
      }}
    >
      <Card sx={{ maxWidth: 450, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <VerifiedUser sx={{ fontSize: 60, color: 'primary.main', mb: 2 }} />
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Verify Your Email
            </Typography>
            <Typography variant="body2" color="text.secondary">
              We've sent a verification code to your email
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {success && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {success}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                disabled={!!searchParams.get('email')}
              />

              <TextField
                label="Verification Code"
                fullWidth
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter 6-digit code"
                inputProps={{ maxLength: 6 }}
                autoFocus
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
              >
                {loading ? 'Verifying...' : 'Verify Email'}
              </Button>

              <Button
                variant="text"
                fullWidth
                onClick={handleResendCode}
                disabled={loading}
              >
                Didn't receive the code? Resend
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              Check your spam folder if you don't see the email
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}

export default function ConfirmSignUpPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ConfirmSignUpContent />
    </Suspense>
  );
}
