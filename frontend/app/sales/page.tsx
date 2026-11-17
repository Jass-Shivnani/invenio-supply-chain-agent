'use client';

import {
  Box,
  Typography,
  Button,
  Card,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  TextField,
  InputAdornment,
  Stack,
  CardContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
} from '@mui/material';
import { Add, Visibility, Receipt, ReceiptLong, Search } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import { invoicesAPI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function SalesPage() {
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minAmount, setMinAmount] = useState('');
  const [maxAmount, setMaxAmount] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'amount' | 'customer'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading, error } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesAPI.getAll().then((res) => res.data),
  });

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  // Filter invoices based on tab selection and additional filters
  const getFilteredInvoices = () => {
    if (!data?.invoices) return [];
    
    let invoices = data.invoices;
    
    // Tab filter
    switch (tabValue) {
      case 1: // GST Invoices
        invoices = invoices.filter((inv: any) => 
          inv.template?.gstDetails || inv.customerGSTIN
        );
        break;
      case 2: // Non-GST Invoices
        invoices = invoices.filter((inv: any) => 
          !inv.template?.gstDetails && !inv.customerGSTIN
        );
        break;
    }
    
    // Search filter
    invoices = invoices.filter((inv: any) => {
      const searchLower = searchQuery.toLowerCase();
      return (
        inv.invoiceNumber?.toLowerCase().includes(searchLower) ||
        inv.customerName?.toLowerCase().includes(searchLower) ||
        inv.customerEmail?.toLowerCase().includes(searchLower) ||
        inv.customerPhone?.toLowerCase().includes(searchLower)
      );
    });
    
    // Status filter
    if (filterStatus !== 'all') {
      invoices = invoices.filter((inv: any) => inv.status === filterStatus);
    }
    
    // Date range filter
    if (startDate) {
      invoices = invoices.filter((inv: any) => 
        new Date(inv.createdAt) >= new Date(startDate)
      );
    }
    if (endDate) {
      invoices = invoices.filter((inv: any) => 
        new Date(inv.createdAt) <= new Date(endDate)
      );
    }
    
    // Amount range filter
    if (minAmount) {
      invoices = invoices.filter((inv: any) => 
        (inv.total || 0) >= parseFloat(minAmount)
      );
    }
    if (maxAmount) {
      invoices = invoices.filter((inv: any) => 
        (inv.total || 0) <= parseFloat(maxAmount)
      );
    }
    
    // Sorting
    invoices.sort((a: any, b: any) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'amount':
          comparison = (a.total || 0) - (b.total || 0);
          break;
        case 'customer':
          comparison = (a.customerName || '').localeCompare(b.customerName || '');
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });
    
    return invoices;
  };

  const filteredInvoices = getFilteredInvoices();

  const handleSort = (column: 'date' | 'amount' | 'customer') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Calculate counts for each tab
  const allCount = data?.invoices?.length || 0;
  const gstCount = data?.invoices?.filter((inv: any) => 
    inv.template?.gstDetails || inv.customerGSTIN
  ).length || 0;
  const nonGstCount = data?.invoices?.filter((inv: any) => 
    !inv.template?.gstDetails && !inv.customerGSTIN
  ).length || 0;

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Sales & Invoices
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your GST and Non-GST invoices
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<ReceiptLong />}
              onClick={() => router.push('/sales/non-gst')}
            >
              Non-GST Invoice
            </Button>
            <Button
              variant="contained"
              startIcon={<Receipt />}
              onClick={() => router.push('/sales/gst')}
              size="large"
            >
              GST Invoice
            </Button>
          </Box>
        </Box>

        {/* Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)}>
            <Tab label={`All Sales (${allCount})`} />
            <Tab label={`GST Invoices (${gstCount})`} />
            <Tab label={`Non-GST Invoices (${nonGstCount})`} />
          </Tabs>
        </Box>

        {/* Search and Filters */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              {/* Search */}
              <TextField
                fullWidth
                placeholder="Search by invoice#, customer name, email, or phone..."
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
                {/* Status Filter */}
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={filterStatus}
                    label="Status"
                    onChange={(e) => setFilterStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Status</MenuItem>
                    <MenuItem value="PAID">Paid</MenuItem>
                    <MenuItem value="DRAFT">Draft</MenuItem>
                    <MenuItem value="CANCELLED">Cancelled</MenuItem>
                  </Select>
                </FormControl>
              
                {/* Date Range */}
                <TextField
                  fullWidth
                  label="Start Date"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
                <TextField
                  fullWidth
                  label="End Date"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Stack>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {/* Amount Range */}
                <TextField
                  fullWidth
                  label="Min Amount"
                  type="number"
                  value={minAmount}
                  onChange={(e) => setMinAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
                <TextField
                  fullWidth
                  label="Max Amount"
                  type="number"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              
                {/* Results Count */}
                <Box sx={{ display: 'flex', alignItems: 'center', minWidth: 250 }}>
                  <Typography variant="body2" color="text.secondary">
                    Showing {filteredInvoices.length} of {data?.invoices?.length || 0} invoices
                  </Typography>
                </Box>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        {/* Invoices Table */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Invoice #</strong></TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'customer'}
                      direction={sortBy === 'customer' ? sortOrder : 'asc'}
                      onClick={() => handleSort('customer')}
                    >
                      <strong>Customer</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'date'}
                      direction={sortBy === 'date' ? sortOrder : 'asc'}
                      onClick={() => handleSort('date')}
                    >
                      <strong>Date</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortBy === 'amount'}
                      direction={sortBy === 'amount' ? sortOrder : 'asc'}
                      onClick={() => handleSort('amount')}
                    >
                      <strong>Amount</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={6}>
                      <Alert severity="error">Failed to load invoices</Alert>
                    </TableCell>
                  </TableRow>
                ) : !filteredInvoices || filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary" gutterBottom>
                        {searchQuery || filterStatus !== 'all' || startDate || endDate || minAmount || maxAmount
                          ? 'No invoices found matching your filters'
                          : tabValue === 0 
                          ? 'No sales yet. Create your first invoice!'
                          : tabValue === 1
                          ? 'No GST invoices yet.'
                          : 'No Non-GST invoices yet.'
                        }
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', mt: 2 }}>
                        <Button
                          variant="outlined"
                          startIcon={<Add />}
                          onClick={() => router.push('/sales/non-gst')}
                        >
                          Non-GST Invoice
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<Add />}
                          onClick={() => router.push('/sales/gst')}
                        >
                          GST Invoice
                        </Button>
                      </Box>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((invoice: any) => {
                    const isGST = invoice.template?.gstDetails || invoice.customerGSTIN;
                    
                    return (
                    <TableRow key={invoice.invoiceId} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" fontWeight={600} color="primary.main">
                            {invoice.invoiceNumber}
                          </Typography>
                          <Chip
                            label={isGST ? 'GST' : 'Non-GST'}
                            size="small"
                            color={isGST ? 'primary' : 'default'}
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', height: 20 }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {invoice.customerName}
                        </Typography>
                        {invoice.customerEmail && (
                          <Typography variant="caption" color="text.secondary" display="block">
                            {invoice.customerEmail}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {formatDate(invoice.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={700} color="primary.main">
                          {formatCurrency(invoice.total || 0)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={invoice.status}
                          size="small"
                          color={invoice.status === 'PAID' ? 'success' : 'default'}
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          startIcon={<Visibility />}
                          onClick={() => router.push(`/sales/${invoice.invoiceId}`)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>
      </Box>
    </MainLayout>
  );
}
