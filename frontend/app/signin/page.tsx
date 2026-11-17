'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Box,
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Alert,
  InputAdornment,
  IconButton,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  Login as LoginIcon,
  ArrowForward,
  ArrowBack,
} from '@mui/icons-material';
import { signIn as amplifySignIn, confirmSignIn } from 'aws-amplify/auth';
import { useAuth } from '@/contexts/AuthContext';

type SignInStep = 'email' | 'password';

export default function SignInPage() {
  const [step, setStep] = useState<SignInStep>('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const router = useRouter();

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate email format
      if (!email || !email.includes('@')) {
        setError('Please enter a valid email address');
        setLoading(false);
        return;
      }

      // Move to password step
      setStep('password');
    } catch (err: any) {
      console.error('Email validation error:', err);
      setError(err.message || 'Invalid email address');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await amplifySignIn({
        username: email,
        password,
      });
      
      console.log('Sign in result:', result);
      console.log('Next step:', result.nextStep);

      if (result.isSignedIn) {
        // User signed in successfully
        // Use window.location to ensure proper navigation
        window.location.href = '/';
      } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        // User needs to verify email
        router.push(`/confirm-signup?email=${encodeURIComponent(email)}`);
      } else if (result.nextStep.signInStep === 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED') {
        // First-time user needs to set a new password - show dialog
        console.log('User needs to set new password');
        setShowPasswordDialog(true);
        setLoading(false);
        return;
      } else {
        console.log('Unexpected sign-in step:', result.nextStep.signInStep);
        setError('Unexpected sign-in state. Please contact support.');
      }
    } catch (err: any) {
      console.error('Sign in error:', err);
      
      if (err.name === 'UserNotFoundException') {
        setError('No account found with this email. Contact your administrator.');
      } else if (err.name === 'NotAuthorizedException') {
        setError('Incorrect password. Please try again.');
      } else if (err.name === 'UserNotConfirmedException') {
        setError('Please verify your email first.');
        router.push(`/confirm-signup?email=${encodeURIComponent(email)}`);
      } else {
        setError(err.message || 'Failed to sign in. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNewPasswordSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Validate new password
      if (newPassword.length < 8) {
        setError('Password must be at least 8 characters long');
        setLoading(false);
        return;
      }

      if (newPassword !== confirmPassword) {
        setError('Passwords do not match');
        setLoading(false);
        return;
      }

      // Confirm sign in with new password
      const result = await confirmSignIn({
        challengeResponse: newPassword,
      });

      console.log('New password set result:', result);

      if (result.isSignedIn) {
        setShowPasswordDialog(false);
        // Use window.location to ensure proper navigation
        window.location.href = '/';
      } else {
        setError('Failed to set new password. Please try again.');
      }
    } catch (err: any) {
      console.error('New password error:', err);
      setError(err.message || 'Failed to set new password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setError('');
    if (step === 'password') {
      setStep('email');
      setPassword('');
    }
  };

  const handleClosePasswordDialog = () => {
    setShowPasswordDialog(false);
    setNewPassword('');
    setConfirmPassword('');
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
              Invenio
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Inventory Management System
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {/* Email Step */}
          {step === 'email' && (
            <form onSubmit={handleEmailSubmit}>
              <Stack spacing={3}>
                <Typography variant="h6" gutterBottom>
                  Sign In
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Enter your email address to continue
                </Typography>

                <TextField
                  label="Email Address"
                  type="email"
                  fullWidth
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  autoFocus
                  placeholder="admin@invenio.in"
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={loading}
                  endIcon={<ArrowForward />}
                >
                  Continue
                </Button>

                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Contact your administrator to create an account.
                  </Typography>
                </Box>
              </Stack>
            </form>
          )}

          {/* Password Step */}
          {step === 'password' && (
            <form onSubmit={handlePasswordSubmit}>
              <Stack spacing={3}>
                <Typography variant="h6" gutterBottom>
                  Welcome Back
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {email}
                </Typography>

                <TextField
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  fullWidth
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  autoFocus
                  InputProps={{
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => setShowPassword(!showPassword)}
                          edge="end"
                        >
                          {showPassword ? <VisibilityOff /> : <Visibility />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button
                    variant="outlined"
                    size="large"
                    onClick={handleBack}
                    startIcon={<ArrowBack />}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    fullWidth
                    disabled={loading}
                    startIcon={<LoginIcon />}
                  >
                    {loading ? 'Signing in...' : 'Sign In'}
                  </Button>
                </Box>

                <Box sx={{ textAlign: 'center' }}>
                  <Button 
                    size="small" 
                    color="primary"
                    onClick={() => router.push('/forgot-password')}
                  >
                    Forgot Password?
                  </Button>
                </Box>
              </Stack>
            </form>
          )}

          {/* Demo Credentials Box (only show on email step) */}
          {step === 'email' && (
            <Box sx={{ mt: 4, p: 2, bgcolor: 'info.lighter', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                <strong>Demo Credentials:</strong>
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Admin: admin@invenio.in / Admin@123
              </Typography>
              <Typography variant="caption" color="text.secondary" display="block">
                Owner: jassshivnani11@gmail.com / Owner@123
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Manager: manager@invenio.in / Manager@123
              </Typography>
            </Box>
          )}
        </CardContent>
      </Card>

      {/* New Password Dialog */}
      <Dialog 
        open={showPasswordDialog} 
        onClose={() => {}} 
        maxWidth="sm" 
        fullWidth
        disableEscapeKeyDown
      >
        <DialogTitle>Set New Password</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mb: 3, mt: 1 }}>
            This is your first time signing in. Please set a new password for your account.
          </Alert>

          <Stack spacing={3}>
            <TextField
              label="New Password"
              type={showNewPassword ? 'text' : 'password'}
              fullWidth
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              autoFocus
              helperText="Minimum 8 characters, include uppercase, lowercase, number, and special character"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      edge="end"
                    >
                      {showNewPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Confirm New Password"
              type={showConfirmPassword ? 'text' : 'password'}
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      edge="end"
                    >
                      {showConfirmPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            {error && (
              <Alert severity="error">
                {error}
              </Alert>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={handleClosePasswordDialog}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleNewPasswordSubmit}
            variant="contained"
            disabled={loading}
          >
            {loading ? 'Setting Password...' : 'Set Password'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
