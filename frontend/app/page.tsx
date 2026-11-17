'use client';

import { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Paper,
  Stack,
  Snackbar,
  Alert,
} from '@mui/material';
import {
  TrendingUp,
  TrendingDown,
  Inventory2,
  Warning,
  AttachMoney,
  ShoppingCart,
  ArrowForward,
  AutoAwesome,
  SwapHoriz,
  Psychology,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, inventoryAPI, invoicesAPI, agenticAI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useRouter } from 'next/navigation';

function DashboardContent() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const { data: products } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll().then((res) => res.data),
  });

  const { data: lowStock } = useQuery({
    queryKey: ['lowStock'],
    queryFn: () => inventoryAPI.getLowStock().then((res) => res.data),
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesAPI.getAll().then((res) => res.data),
  });

  const { data: aiState } = useQuery({
    queryKey: ['agenticState'],
    queryFn: () => agenticAI.getState().then((res) => res.data),
    refetchInterval: 20000,
  });

  const rebalanceMutation = useMutation({
    mutationFn: () => agenticAI.executeRebalance(),
    onSuccess: (res) => {
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const autoRestockMutation = useMutation({
    mutationFn: () => agenticAI.autoRestock(),
    onSuccess: (res) => {
      setSnackbar({ open: true, message: res.data.message, severity: 'success' });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
  });

  const stats = [
    {
      title: 'Total Products',
      value: products?.count || 0,
      change: '+12%',
      trend: 'up',
      icon: <Inventory2 />,
      color: '#6750A4',
    },
    {
      title: 'Low Stock Items',
      value: lowStock?.count || 0,
      change: '-5%',
      trend: 'down',
      icon: <Warning />,
      color: '#F59E0B',
    },
    {
      title: 'Total Invoices',
      value: invoices?.count || 0,
      change: '+8%',
      trend: 'up',
      icon: <ShoppingCart />,
      color: '#10B981',
    },
    {
      title: 'Revenue (Month)',
      value: `₹${(invoices?.invoices || []).reduce((sum: number, inv: any) => sum + (inv.total || 0), 0).toFixed(2)}`,
      change: '+23%',
      trend: 'up',
      icon: <AttachMoney />,
      color: '#6750A4',
    },
  ];

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 3 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Dashboard
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Welcome back! Here's what's happening with your inventory.
          </Typography>
        </Box>

        {/* Agentic AI Live Command Bar */}
        <Card
          sx={{
            mb: 4,
            background: 'linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%)',
            border: '1px solid #c4b5fd',
            borderRadius: 2,
            boxShadow: '0 4px 16px rgba(124, 58, 237, 0.08)',
          }}
        >
          <CardContent sx={{ p: 2.5 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box
                  sx={{
                    width: 44,
                    height: 44,
                    borderRadius: 2,
                    bgcolor: '#7c3aed',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <AutoAwesome />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: '#5b21b6' }}>
                    Agentic AI Network Status:{' '}
                    <span style={{ fontWeight: 500, color: '#334155' }}>
                      {aiState?.kpis?.high_stockout_risk_skus || 5} High Stockout Risks Detected • Milk (2.4d left) • Yogurt (+308% surge)
                    </span>
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Active Orchestration: Warehouse A (Bhiwandi) • Warehouse B (Turbhe) • Store C (Chembur Fulfillment)
                  </Typography>
                </Box>
              </Box>

              <Stack direction="row" spacing={1.5}>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: '#7c3aed', color: '#7c3aed', textTransform: 'none', fontWeight: 600 }}
                  startIcon={<SwapHoriz />}
                  disabled={rebalanceMutation.isPending}
                  onClick={() => rebalanceMutation.mutate()}
                >
                  Rebalance Wheat (WH-A → WH-B)
                </Button>
                <Button
                  size="small"
                  variant="contained"
                  sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, textTransform: 'none', fontWeight: 600 }}
                  startIcon={<AutoAwesome />}
                  disabled={autoRestockMutation.isPending}
                  onClick={() => autoRestockMutation.mutate()}
                >
                  Auto-Restock POs
                </Button>
                <Button
                  size="small"
                  variant="text"
                  sx={{ color: '#5b21b6', textTransform: 'none', fontWeight: 600 }}
                  endIcon={<ArrowForward />}
                  onClick={() => router.push('/ai-agent')}
                >
                  AI Copilot Hub
                </Button>
              </Stack>
            </Box>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(4, 1fr)' },
            gap: 3,
            mb: 4,
          }}
        >
          {stats.map((stat, index) => (
            <Card
              key={index}
              elevation={0}
              sx={{
                border: 1,
                borderColor: 'divider',
                transition: 'all 0.3s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                },
              }}
            >
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                  <Box
                    sx={{
                      width: 48,
                      height: 48,
                      borderRadius: 2,
                      bgcolor: `${stat.color}15`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stat.color,
                    }}
                  >
                    {stat.icon}
                  </Box>
                  <Chip
                    label={stat.change}
                    size="small"
                    icon={stat.trend === 'up' ? <TrendingUp fontSize="small" /> : <TrendingDown fontSize="small" />}
                    color={stat.trend === 'up' ? 'success' : 'error'}
                    sx={{ fontWeight: 600 }}
                  />
                </Box>
                <Typography variant="h4" fontWeight={700} sx={{ mb: 0.5 }}>
                  {stat.value}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {stat.title}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: 'repeat(2, 1fr)' },
            gap: 3,
          }}
        >
          {/* Low Stock Alert */}
          {lowStock && lowStock.count > 0 && (
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Low Stock Alerts
                  </Typography>
                  <Chip label={`${lowStock.count} items`} color="warning" size="small" />
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Product</TableCell>
                        <TableCell align="right">Stock</TableCell>
                        <TableCell align="right">Reorder</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {lowStock.items.slice(0, 5).map((item: any) => (
                        <TableRow key={item.productId}>
                          <TableCell>
                            <Typography variant="body2" fontWeight={500}>
                              {item.productName}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.sku}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Chip
                              label={item.quantity}
                              size="small"
                              color="error"
                              sx={{ minWidth: 50 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            <Typography variant="body2" color="text.secondary">
                              {item.reorderLevel}
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <Button
                  endIcon={<ArrowForward />}
                  sx={{ mt: 2 }}
                  href="/inventory"
                >
                  View All
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Recent Invoices */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" fontWeight={600}>
                  Recent Invoices
                </Typography>
                <Button size="small" endIcon={<ArrowForward />} href="/invoices">
                  View All
                </Button>
              </Box>
              {invoices && invoices.invoices.length > 0 ? (
                <Stack spacing={2}>
                  {invoices.invoices.slice(0, 5).map((invoice: any) => (
                    <Paper
                      key={invoice.invoiceId}
                      variant="outlined"
                      sx={{
                        p: 2,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                        <Avatar sx={{ bgcolor: 'primary.main' }}>
                          {invoice.customerName[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>
                            {invoice.customerName}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {invoice.invoiceNumber}
                          </Typography>
                        </Box>
                      </Box>
                      <Box sx={{ textAlign: 'right' }}>
                        <Typography variant="body2" fontWeight={600}>
                          ₹{invoice.total ? invoice.total.toFixed(2) : '0.00'}
                        </Typography>
                        <Chip
                          label={invoice.status}
                          size="small"
                          color={invoice.status === 'PAID' ? 'success' : 'default'}
                          sx={{ mt: 0.5 }}
                        />
                      </Box>
                    </Paper>
                  ))}
                </Stack>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Typography color="text.secondary">
                    No invoices yet. Create your first invoice!
                  </Typography>
                  <Button variant="contained" sx={{ mt: 2 }} href="/invoices/create">
                    Create Invoice
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert severity={snackbar.severity} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}

export default function Dashboard() {
  return (
    <ProtectedRoute>
      <DashboardContent />
    </ProtectedRoute>
  );
}

