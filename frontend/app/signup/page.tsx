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
  Divider,
} from '@mui/material';
import {
  Visibility,
  VisibilityOff,
  PersonAdd,
  Login,
} from '@mui/icons-material';
import { useAuth } from '@/contexts/AuthContext';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signUp } = useAuth();
  const router = useRouter();

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [field]: e.target.value });
  };

  const validateForm = () => {
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (!/[A-Z]/.test(formData.password)) {
      setError('Password must contain at least one uppercase letter');
      return false;
    }

    if (!/[a-z]/.test(formData.password)) {
      setError('Password must contain at least one lowercase letter');
      return false;
    }

    if (!/[0-9]/.test(formData.password)) {
      setError('Password must contain at least one number');
      return false;
    }

    if (!/[!@#$%^&*]/.test(formData.password)) {
      setError('Password must contain at least one special character (!@#$%^&*)');
      return false;
    }

    if (formData.phone && !formData.phone.match(/^\+91\s?\d{10}$/)) {
      setError('Phone number must be in format: +91 XXXXXXXXXX');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const result = await signUp(
        formData.email,
        formData.password,
        formData.name,
        formData.phone || undefined
      );

      if (result.isSignUpComplete) {
        router.push('/signin');
      } else if (result.nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        router.push(`/confirm-signup?email=${encodeURIComponent(formData.email)}`);
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      
      if (err.name === 'UsernameExistsException') {
        setError('An account with this email already exists. Please sign in instead.');
      } else if (err.name === 'InvalidPasswordException') {
        setError('Password does not meet requirements. Please check the password criteria.');
      } else if (err.name === 'InvalidParameterException') {
        setError('Invalid input. Please check your information and try again.');
      } else {
        setError(err.message || 'Failed to create account. Please try again.');
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
      <Card sx={{ maxWidth: 500, width: '100%' }}>
        <CardContent sx={{ p: 4 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <Typography variant="h4" fontWeight="bold" gutterBottom>
              Create Account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Join Invenio Inventory Management
            </Typography>
          </Box>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <Stack spacing={3}>
              <TextField
                label="Full Name"
                fullWidth
                required
                value={formData.name}
                onChange={handleChange('name')}
                autoComplete="name"
                placeholder="John Doe"
              />

              <TextField
                label="Email Address"
                type="email"
                fullWidth
                required
                value={formData.email}
                onChange={handleChange('email')}
                autoComplete="email"
                placeholder="john@invenio.in"
              />

              <TextField
                label="Phone Number (Optional)"
                fullWidth
                value={formData.phone}
                onChange={handleChange('phone')}
                autoComplete="tel"
                placeholder="+91 98765 43210"
                helperText="Format: +91 XXXXXXXXXX"
              />

              <TextField
                label="Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                value={formData.password}
                onChange={handleChange('password')}
                autoComplete="new-password"
                helperText="Min 8 chars, uppercase, lowercase, number, special char"
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

              <TextField
                label="Confirm Password"
                type={showPassword ? 'text' : 'password'}
                fullWidth
                required
                value={formData.confirmPassword}
                onChange={handleChange('confirmPassword')}
                autoComplete="new-password"
              />

              <Button
                type="submit"
                variant="contained"
                size="large"
                fullWidth
                disabled={loading}
                startIcon={<PersonAdd />}
              >
                {loading ? 'Creating Account...' : 'Sign Up'}
              </Button>

              <Divider>OR</Divider>

              <Button
                component={Link}
                href="/signin"
                variant="outlined"
                size="large"
                fullWidth
                startIcon={<Login />}
              >
                Sign In to Existing Account
              </Button>
            </Stack>
          </form>

          <Box sx={{ mt: 3, textAlign: 'center' }}>
            <Typography variant="caption" color="text.secondary">
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Typography>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
