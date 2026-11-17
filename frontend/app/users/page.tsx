'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  InputAdornment,
  Avatar,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Search,
  ContentCopy,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { fetchAuthSession } from 'aws-amplify/auth';

interface User {
  username: string;
  email: string;
  name: string;
  role: 'admin' | 'owner' | 'manager' | 'staff' | 'buyer';
  status: string;
  enabled: boolean;
  createdAt: string;
}

export default function UsersPage() {
  const { user: currentUser } = useAuth();
  const router = useRouter();
  
  // Redirect staff members to dashboard
  useEffect(() => {
    if (currentUser && currentUser.role === 'staff') {
      router.push('/');
    }
  }, [currentUser, router]);
  
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createdUserPassword, setCreatedUserPassword] = useState('');

  const [formData, setFormData] = useState({
    email: '',
    name: '',
    role: 'staff' as 'admin' | 'owner' | 'manager' | 'staff' | 'buyer',
    tempPassword: '',
  });

  // Fetch users from Cognito on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');

      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      
      if (!idToken) {
        setError('Authentication token not found. Please sign in again.');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/users`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to fetch users: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data.users || []);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      setError('Failed to fetch users: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setFormData({
      email: '',
      name: '',
      role: 'staff',
      tempPassword: '',
    });
    setError('');
    setSuccess('');
    setCreatedUserPassword('');
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCreatedUserPassword('');
  };

  const handleCreateUser = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Check permissions
      const roleHierarchy = { admin: 5, owner: 4, manager: 3, buyer: 2, staff: 1 };
      const currentUserLevel = roleHierarchy[currentUser?.role || 'staff'];
      const newUserLevel = roleHierarchy[formData.role];
      
      // Owner/Admin can add managers or below
      // Managers can add staff only
      if (currentUser?.role === 'manager' && formData.role !== 'staff' && formData.role !== 'buyer') {
        setError('Managers can only create staff and buyer accounts');
        setLoading(false);
        return;
      }
      
      if (currentUser?.role === 'staff') {
        setError('Staff members cannot create accounts');
        setLoading(false);
        return;
      }

      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      
      if (!idToken) {
        setError('Authentication token not found. Please sign in again.');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/users`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.email,
          email: formData.email,
          name: formData.name,
          role: formData.role,
          tempPassword: formData.tempPassword || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to create user: ${response.status}`);
      }

      const result = await response.json();
      
      // Store the temporary password to show to the admin
      if (result.user && result.user.temporaryPassword) {
        setCreatedUserPassword(result.user.temporaryPassword);
      }

      setSuccess(`User ${formData.name} created successfully!`);
      
      // Refresh users list
      await fetchUsers();
      
      // Don't auto-close dialog if we need to show password
      if (!result.user?.temporaryPassword) {
        setTimeout(() => {
          handleCloseDialog();
          setSuccess('');
        }, 2000);
      }
      
    } catch (err: any) {
      console.error('Error creating user:', err);
      setError('Failed to create user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (username: string, email: string, role: string) => {
    // Cannot delete admin users
    if (role === 'admin') {
      setError('Cannot delete admin users. Admin accounts can only be edited.');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Check permissions
    if (currentUser?.role === 'manager' && role !== 'staff' && role !== 'buyer') {
      setError('Managers can only delete staff and buyer accounts');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (currentUser?.role === 'staff') {
      setError('Staff members cannot delete accounts');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${email}?`)) return;

    try {
      setLoading(true);
      setError('');

      const session = await fetchAuthSession();
      const idToken = session.tokens?.idToken?.toString();
      
      if (!idToken) {
        setError('Authentication token not found. Please sign in again.');
        setLoading(false);
        return;
      }

      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      const response = await fetch(`${apiUrl}/users/${username}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to delete user: ${response.status}`);
      }
      
      setSuccess('User deleted successfully!');
      
      // Refresh users list
      await fetchUsers();
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (err: any) {
      console.error('Error deleting user:', err);
      setError('Failed to delete user: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
        return 'success';
      case 'FORCE_CHANGE_PASSWORD':
        return 'warning';
      case 'UNCONFIRMED':
        return 'info';
      default:
        return 'default';
    }
  };

  const filteredUsers = users.filter((user) => {
    const matchesSearch =
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'active' && user.enabled) ||
      (filterStatus === 'inactive' && !user.enabled);

    return matchesSearch && matchesStatus;
  });

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              User Management
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage AWS Cognito user accounts
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={handleOpenDialog}
            size="large"
          >
            Add User
          </Button>
        </Box>

        {/* Success Alert */}
        {success && (
          <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Error Alert */}
        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
            {error}
          </Alert>
        )}

        {/* Filters */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              <TextField
                fullWidth
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search />
                    </InputAdornment>
                  ),
                }}
              />
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Users Table */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>User</strong></TableCell>
                  <TableCell><strong>Email</strong></TableCell>
                  <TableCell><strong>Role</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Created</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">
                        {searchQuery || filterStatus !== 'all'
                          ? 'No users found matching your filters'
                          : 'No users yet. Add your first user!'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => {
                    const canDelete = user.role !== 'admin' && (
                      (currentUser?.role === 'admin' || currentUser?.role === 'owner') ||
                      (currentUser?.role === 'manager' && (user.role === 'staff' || user.role === 'buyer'))
                    );
                    
                    const getRoleColor = (role: string) => {
                      switch (role) {
                        case 'admin': return 'error';
                        case 'owner': return 'secondary';
                        case 'manager': return 'primary';
                        case 'buyer': return 'info';
                        case 'staff': return 'default';
                        default: return 'default';
                      }
                    };
                    
                    return (
                    <TableRow key={user.username} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                          <Avatar sx={{ bgcolor: 'primary.main' }}>
                            {user.name.charAt(0).toUpperCase()}
                          </Avatar>
                          <Typography variant="body2" fontWeight={600}>
                            {user.name}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{user.email}</Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                          size="small"
                          color={getRoleColor(user.role) as any}
                          variant="outlined"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={user.status.replace('_', ' ')}
                          size="small"
                          color={getStatusColor(user.status) as any}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(user.createdAt).toLocaleDateString('en-IN')}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleDeleteUser(user.username, user.email, user.role)}
                          color="error"
                          disabled={!canDelete}
                          title={user.role === 'admin' ? 'Admin users cannot be deleted' : !canDelete ? 'No permission to delete this user' : 'Delete user'}
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Create Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {createdUserPassword ? 'User Created Successfully' : 'Add New User'}
          </DialogTitle>
          <DialogContent>
            {createdUserPassword ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Alert severity="success">
                  User created successfully! Please share these credentials with the user.
                </Alert>
                <Alert severity="warning">
                  The user must change this password on first login.
                </Alert>
                <TextField
                  label="Email"
                  value={formData.email}
                  fullWidth
                  InputProps={{ readOnly: true }}
                />
                <TextField
                  label="Temporary Password"
                  value={createdUserPassword}
                  fullWidth
                  InputProps={{ 
                    readOnly: true,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() => {
                            navigator.clipboard.writeText(createdUserPassword);
                            setSuccess('Password copied to clipboard!');
                            setTimeout(() => setSuccess(''), 2000);
                          }}
                          edge="end"
                        >
                          <ContentCopy />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  helperText="Click the copy icon to copy the password"
                />
              </Box>
            ) : (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  fullWidth
                  required
                />
                <TextField
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  fullWidth
                  required
                />
                <FormControl fullWidth required>
                  <InputLabel>Role</InputLabel>
                  <Select
                    value={formData.role}
                    label="Role"
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as any })}
                  >
                    {currentUser?.role === 'manager' ? [
                      <MenuItem key="buyer" value="buyer">Buyer</MenuItem>,
                      <MenuItem key="staff" value="staff">Staff</MenuItem>
                    ] : [
                      currentUser?.role === 'admin' && <MenuItem key="owner" value="owner">Owner</MenuItem>,
                      <MenuItem key="manager" value="manager">Manager</MenuItem>,
                      <MenuItem key="buyer" value="buyer">Buyer</MenuItem>,
                      <MenuItem key="staff" value="staff">Staff</MenuItem>
                    ].filter(Boolean)}
                  </Select>
                </FormControl>
                <TextField
                  label="Temporary Password (Optional)"
                  type="password"
                  value={formData.tempPassword}
                  onChange={(e) => setFormData({ ...formData, tempPassword: e.target.value })}
                  fullWidth
                  helperText="Leave empty to auto-generate. User must change on first login."
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions>
            {createdUserPassword ? (
              <Button 
                onClick={() => {
                  handleCloseDialog();
                  setCreatedUserPassword('');
                  setSuccess('');
                }}
                variant="contained"
              >
                Close
              </Button>
            ) : (
              <>
                <Button onClick={handleCloseDialog}>Cancel</Button>
                <Button
                  onClick={handleCreateUser}
                  variant="contained"
                  disabled={!formData.name || !formData.email}
                >
                  Create User
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
