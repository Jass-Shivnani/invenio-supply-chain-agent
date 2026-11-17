'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Alert,
  Stack,
  TextField,
  Button,
  Divider,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Assessment,
  TrendingUp,
  ShoppingCart,
  Inventory,
  People,
  Download,
  Print,
  CalendarToday,
} from '@mui/icons-material';
import MainLayout from '@/components/MainLayout';
import { useQuery } from '@tanstack/react-query';
import { invoicesAPI, productsAPI, transactionsAPI, agenticAI } from '@/lib/api';

export default function ReportsPage() {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reportType, setReportType] = useState('sales');

  // Fetch data
  const { data: invoicesData, isLoading: invoicesLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: () => invoicesAPI.getAll().then((res) => res.data),
  });

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll().then((res) => res.data),
  });

  const { data: transactionsData, isLoading: transactionsLoading } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => transactionsAPI.getAll().then((res) => res.data),
  });

  const { data: aiStateData } = useQuery({
    queryKey: ['agenticState'],
    queryFn: () => agenticAI.getState().then((res) => res.data),
  });

  const isLoading = invoicesLoading || productsLoading || transactionsLoading;

  // Calculate metrics
  const invoices = invoicesData?.invoices || [];
  const products = productsData?.products || [];
  const transactions = transactionsData?.transactions || [];

  // Filter by date range
  const filteredInvoices = invoices.filter((inv: any) => {
    if (!startDate && !endDate) return true;
    const invDate = new Date(inv.date || inv.createdAt || Date.now());
    if (startDate && invDate < new Date(startDate)) return false;
    if (endDate && invDate > new Date(endDate)) return false;
    return true;
  });

  // Sales metrics
  const totalSales = filteredInvoices.reduce((sum: number, inv: any) => sum + (inv.total || 0), 0);
  const totalInvoices = filteredInvoices.length;
  const paidInvoices = filteredInvoices.filter((inv: any) => inv.status === 'PAID').length;
  const avgOrderValue = totalInvoices > 0 ? totalSales / totalInvoices : 0;

  // Product metrics
  const totalProducts = products.length;
  const lowStockProducts = products.filter((p: any) => (p.quantity || 0) > 0 && (p.quantity || 0) <= 10).length;
  const outOfStockProducts = products.filter((p: any) => (p.quantity || 0) === 0).length;
  const totalInventoryValue = products.reduce((sum: number, p: any) => 
    sum + ((p.quantity || 0) * (p.costPrice || p.price || 0)), 0
  );

  // Top selling products
  const productSales: { [key: string]: { name: string; quantity: number; revenue: number } } = {};
  
  filteredInvoices.forEach((inv: any) => {
    inv.items?.forEach((item: any) => {
      if (!productSales[item.productId]) {
        productSales[item.productId] = {
          name: item.productName,
          quantity: 0,
          revenue: 0,
        };
      }
      productSales[item.productId].quantity += item.quantity || 0;
      productSales[item.productId].revenue += (item.quantity || 0) * (item.unitPrice || 0);
    });
  });

  const topProducts = Object.entries(productSales)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Transaction summary
  const inTransactions = transactions.filter((t: any) => t.type === 'IN');
  const outTransactions = transactions.filter((t: any) => t.type === 'OUT');
  const totalIn = inTransactions.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);
  const totalOut = outTransactions.reduce((sum: number, t: any) => sum + (t.quantity || 0), 0);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleExport = () => {
    // Simple CSV export
    const csvContent = topProducts
      .map((p) => `${p.name},${p.quantity},${p.revenue}`)
      .join('\n');
    
    const blob = new Blob([`Product,Quantity Sold,Revenue\n${csvContent}`], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sales-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Reports & Analytics
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Business insights and performance metrics
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button startIcon={<Print />} onClick={handlePrint} variant="outlined">
              Print
            </Button>
            <Button startIcon={<Download />} onClick={handleExport} variant="contained">
              Export
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
          <CardContent>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
              <FormControl sx={{ minWidth: 200 }}>
                <InputLabel>Report Type</InputLabel>
                <Select
                  value={reportType}
                  label="Report Type"
                  onChange={(e) => setReportType(e.target.value)}
                >
                  <MenuItem value="sales">Sales Report</MenuItem>
                  <MenuItem value="inventory">Inventory Report</MenuItem>
                  <MenuItem value="products">Product Performance</MenuItem>
                  <MenuItem value="ai-impact">AI Cost Protection & Multi-Hub Report</MenuItem>
                </Select>
              </FormControl>
              <TextField
                label="Start Date"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <TextField
                label="End Date"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{ minWidth: 150 }}
              />
              <Typography variant="body2" color="text.secondary" sx={{ flexGrow: 1 }}>
                {startDate || endDate 
                  ? `Showing data from ${startDate || 'beginning'} to ${endDate || 'today'}`
                  : 'Showing all-time data'}
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {/* Key Metrics */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' }, gap: 3, mb: 3 }}>
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Box>
                        <Typography variant="body2" color="text.secondary" gutterBottom>
                          Total Sales
                        </Typography>
                        <Typography variant="h4" fontWeight={700} color="primary.main">
                          {formatCurrency(totalSales)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {totalInvoices} invoices
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'primary.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        <TrendingUp />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Avg Order Value
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="success.main">
                        {formatCurrency(avgOrderValue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {paidInvoices} paid invoices
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'success.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        <ShoppingCart />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Inventory Value
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="info.main">
                        {formatCurrency(totalInventoryValue)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {totalProducts} products
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'info.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        <Inventory />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>

              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Stock Alerts
                      </Typography>
                      <Typography variant="h4" fontWeight={700} color="warning.main">
                          {lowStockProducts + outOfStockProducts}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {lowStockProducts} low, {outOfStockProducts} out
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          bgcolor: 'warning.main',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                        }}
                      >
                        <Assessment />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
            </Box>

            {/* Top Selling Products */}
            {reportType === 'sales' || reportType === 'products' ? (
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Top Selling Products
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <TableContainer>
                    <Table>
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>#</strong></TableCell>
                          <TableCell><strong>Product Name</strong></TableCell>
                          <TableCell align="right"><strong>Qty Sold</strong></TableCell>
                          <TableCell align="right"><strong>Revenue</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {topProducts.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                              <Typography color="text.secondary">
                                No sales data available
                              </Typography>
                            </TableCell>
                          </TableRow>
                        ) : (
                          topProducts.map((product, index) => (
                            <TableRow key={product.id} hover>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={600}>
                                  {product.name}
                                </Typography>
                              </TableCell>
                              <TableCell align="right">
                                <Chip label={product.quantity} size="small" color="primary" variant="outlined" />
                              </TableCell>
                              <TableCell align="right">
                                <Typography variant="body2" fontWeight={700} color="primary.main">
                                  {formatCurrency(product.revenue)}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </CardContent>
              </Card>
            ) : null}

            {/* AI Cost Protection & Multi-Hub Report */}
            {reportType === 'ai-impact' ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                  <CardContent sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={700} gutterBottom sx={{ color: '#5b21b6' }}>
                      Agentic Cost Protection & Deficits Shielded
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Financial savings generated via inter-hub stock shifts and autonomous vendor SLA routing
                    </Typography>
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3, mb: 3 }}>
                      <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                          Inter-Hub Transfer Savings
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ color: '#14532d', my: 0.5 }}>
                          ₹15,025
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Saved by moving surplus from Bhiwandi to Turbhe instead of spot purchasing
                        </Typography>
                      </Paper>

                      <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#1e40af', textTransform: 'uppercase' }}>
                          Stockout Penalty Avoided
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ color: '#1e3a8a', my: 0.5 }}>
                          ₹2,618
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Protected by routing PO-1024 to Amul Express (2.0d SLA vs 5.0d delay)
                        </Typography>
                      </Paper>

                      <Paper elevation={0} sx={{ p: 2.5, bgcolor: '#faf5ff', border: '1px solid #e9d5ff', borderRadius: 2 }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#6b21a8', textTransform: 'uppercase' }}>
                          Net Capital Protected
                        </Typography>
                        <Typography variant="h4" fontWeight={800} sx={{ color: '#581c87', my: 0.5 }}>
                          ₹17,643
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Network projected service level: 98.5% across all 8 SKUs
                        </Typography>
                      </Paper>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                      Service Level & Volatility Buffer by Category
                    </Typography>
                    <Table size="small">
                      <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 700 }}>Category</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Active SKUs</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Service Level SLA</TableCell>
                          <TableCell align="center" sx={{ fontWeight: 700 }}>Volatility Buffer Delta</TableCell>
                          <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[
                          { cat: 'Dairy & Perishables', skus: 2, sla: '98.5%', delta: '+9 units', status: 'Protected' },
                          { cat: 'Staples & Grains', skus: 2, sla: '99.2%', delta: '+0 units', status: 'Optimal' },
                          { cat: 'Cooking Essentials', skus: 1, sla: '97.8%', delta: '+28 units', status: 'Buffered' },
                          { cat: 'Electronics (Invenio)', skus: 2, sla: '98.6%', delta: '+0 units', status: 'Optimal' },
                          { cat: 'Industrial Hardware', skus: 1, sla: '99.5%', delta: '+0 units', status: 'Optimal' },
                        ].map((row, i) => (
                          <TableRow key={i} hover>
                            <TableCell sx={{ fontWeight: 600 }}>{row.cat}</TableCell>
                            <TableCell align="center">{row.skus}</TableCell>
                            <TableCell align="center" sx={{ fontWeight: 700, color: '#16a34a' }}>{row.sla}</TableCell>
                            <TableCell align="center">{row.delta}</TableCell>
                            <TableCell>
                              <Chip label={row.status} size="small" color="success" sx={{ fontSize: '0.7rem', height: 20 }} />
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </Box>
            ) : null}

            {/* Inventory Summary */}
            {reportType === 'inventory' ? (
              <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Inventory Movement Summary
                  </Typography>
                  <Divider sx={{ my: 2 }} />
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' }, gap: 3 }}>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'success.lighter', border: 1, borderColor: 'success.main' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Stock In (Purchases)
                      </Typography>
                      <Typography variant="h3" fontWeight={700} color="success.main">
                        {totalIn}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {inTransactions.length} transactions
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'error.lighter', border: 1, borderColor: 'error.main' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Stock Out (Sales)
                      </Typography>
                      <Typography variant="h3" fontWeight={700} color="error.main">
                        {totalOut}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {outTransactions.length} transactions
                      </Typography>
                    </Paper>
                    <Paper elevation={0} sx={{ p: 3, bgcolor: 'info.lighter', border: 1, borderColor: 'info.main' }}>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        Net Movement
                      </Typography>
                      <Typography variant="h3" fontWeight={700} color="info.main">
                        {totalIn - totalOut}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Current balance
                      </Typography>
                    </Paper>
                  </Box>
                </CardContent>
              </Card>
            ) : null}
          </>
        )}
      </Box>
    </MainLayout>
  );
}

