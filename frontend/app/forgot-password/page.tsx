'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
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
import { ArrowBack, Send, LockReset } from '@mui/icons-material';
import Link from 'next/link';
import { resetPassword, confirmResetPassword } from 'aws-amplify/auth';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState<'request' | 'confirm'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleRequestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await resetPassword({ username: email });
      setSuccess('Verification code sent to your email!');
      setStep('confirm');
    } catch (err: any) {
      console.error('Reset password error:', err);
      if (err.name === 'UserNotFoundException') {
        setError('No account found with this email.');
      } else {
        setError(err.message || 'Failed to send verification code.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);

    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
      setSuccess('Password reset successfully! Redirecting to sign in...');
      setTimeout(() => router.push('/signin'), 2000);
    } catch (err: any) {
      console.error('Confirm reset error:', err);
      if (err.name === 'CodeMismatchException') {
        setError('Invalid verification code. Please try again.');
      } else if (err.name === 'ExpiredCodeException') {
        setError('Verification code has expired. Please request a new one.');
        setStep('request');
      } else {
        setError(err.message || 'Failed to reset password.');
      }
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
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Reset Password
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {step === 'request' 
                ? 'Enter your email to receive a verification code' 
                : 'Enter the code sent to your email'}
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

          {step === 'request' ? (
            <form onSubmit={handleRequestCode}>
              <Stack spacing={3}>
                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={<Send />}
                >
                  {loading ? 'Sending...' : 'Send Verification Code'}
                </Button>
              </Stack>
            </form>
          ) : (
            <form onSubmit={handleResetPassword}>
              <Stack spacing={3}>
                <TextField
                  label="Verification Code"
                  fullWidth
                  required
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  autoFocus
                  placeholder="Enter 6-digit code"
                />

                <TextField
                  label="New Password"
                  type="password"
                  fullWidth
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  helperText="At least 8 characters"
                />

                <TextField
                  label="Confirm Password"
                  type="password"
                  fullWidth
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  startIcon={<LockReset />}
                >
                  {loading ? 'Resetting...' : 'Reset Password'}
                </Button>

                <Button
                  onClick={() => {
                    setStep('request');
                    setCode('');
                    setNewPassword('');
                    setConfirmPassword('');
                    setError('');
                  }}
                  size="small"
                >
                  Resend Code
                </Button>
              </Stack>
            </form>
          )}

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Link href="/signin" passHref legacyBehavior>
              <Button startIcon={<ArrowBack />} size="small">
                Back to Sign In
              </Button>
            </Link>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
