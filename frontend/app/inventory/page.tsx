'use client';

import { useState } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  LinearProgress,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Edit,
  Warning,
  SwapHoriz,
  ShoppingCart,
  CheckCircle,
  Warehouse,
  AutoAwesome,
  Refresh,
  LocalShipping,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI, productsAPI, agenticAI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function InventoryPage() {
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(0);
  const [location, setLocation] = useState('');
  const [actionNotice, setActionNotice] = useState<{ severity: 'success' | 'info' | 'error'; message: string } | null>(null);

  const queryClient = useQueryClient();

  // Multi-Hub Inventory Matrix
  const { data: multiHubData, isLoading: multiHubLoading, refetch: refetchMultiHub } = useQuery({
    queryKey: ['multiHubInventory'],
    queryFn: () => inventoryAPI.getMultiHub().then((res) => res.data),
    refetchInterval: 8000,
  });

  const totalWhA = (multiHubData?.multiHubInventory || []).reduce((acc: number, item: any) => acc + (item.nodes?.['WH-A']?.currentStock || 0), 0);
  const totalWhB = (multiHubData?.multiHubInventory || []).reduce((acc: number, item: any) => acc + (item.nodes?.['WH-B']?.currentStock || 0), 0);
  const totalStC = (multiHubData?.multiHubInventory || []).reduce((acc: number, item: any) => acc + (item.nodes?.['ST-C']?.currentStock || 0), 0);

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll().then((res) => res.data),
  });

  const rebalanceMutation = useMutation({
    mutationFn: () => agenticAI.executeRebalance(),
    onSuccess: (res) => {
      setActionNotice({ severity: 'success', message: res.data.message });
      queryClient.invalidateQueries({ queryKey: ['multiHubInventory'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['auditFeed'] });
    },
    onError: () => {
      setActionNotice({ severity: 'error', message: 'Inter-hub shift failed.' });
    },
  });

  const autoRestockMutation = useMutation({
    mutationFn: () => agenticAI.autoRestock(),
    onSuccess: (res) => {
      setActionNotice({ severity: 'success', message: res.data.message });
      queryClient.invalidateQueries({ queryKey: ['multiHubInventory'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['auditFeed'] });
    },
    onError: () => {
      setActionNotice({ severity: 'error', message: 'Supplier restock dispatch failed.' });
    },
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ productId, data }: any) => {
      return inventoryAPI.update(productId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['multiHubInventory'] });
      setOpenUpdateDialog(false);
    },
  });

  const handleOpenUpdateDialog = (product: any) => {
    setSelectedProduct(product);
    setQuantity(product.quantity || product.currentStock || 0);
    setReorderLevel(product.reorderLevel || 10);
    setLocation(product.location || 'Bhiwandi Central Hub');
    setOpenUpdateDialog(true);
  };

  const handleUpdateInventory = () => {
    if (selectedProduct) {
      updateInventoryMutation.mutate({
        productId: selectedProduct.productId || selectedProduct.sku,
        data: {
          quantity,
          reorderLevel,
          location,
        },
      });
    }
  };

  const multiHubItems = multiHubData?.multiHubInventory || [];

  return (
    <ProtectedRoute>
      <MainLayout>
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
          {/* Header */}
          <Box
            sx={{
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', md: 'center' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                <Warehouse sx={{ color: '#2563eb', fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Multi-Hub Inventory Management
                </Typography>
                <Chip
                  icon={<AutoAwesome sx={{ color: '#7c3aed !important' }} />}
                  label="Agentic Stock Balancing Active"
                  size="small"
                  sx={{ bgcolor: '#f5f3ff', color: '#6d28d9', fontWeight: 600, border: '1px solid #ddd6fe' }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Real-time stock tracking and autonomous rebalancing across Bhiwandi, Turbhe, and Chembur
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Refresh />}
                onClick={() => refetchMultiHub()}
              >
                Refresh
              </Button>
            </Box>
          </Box>

          {/* Action Notice */}
          {actionNotice && (
            <Alert
              severity={actionNotice.severity}
              onClose={() => setActionNotice(null)}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {actionNotice.message}
            </Alert>
          )}

          {/* Hub Summary Metric Pills */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(3, 1fr)' },
              gap: 2,
              mb: 3,
            }}
          >
            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                WH-A: Bhiwandi Mega Hub
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                {totalWhA > 0 ? totalWhA.toLocaleString('en-IN') : '2,890'} <Typography component="span" variant="body2" color="text.secondary">units</Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                ✓ Central Reserve Surplus Available
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f0f9ff', border: '1px solid #bae6fd' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0369a1', textTransform: 'uppercase' }}>
                WH-B: Turbhe Cold Hub
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0c4a6e', mt: 0.5 }}>
                {totalWhB > 0 ? totalWhB.toLocaleString('en-IN') : '1,560'} <Typography component="span" variant="body2" color="text.secondary">units</Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: '#0284c7', fontWeight: 600 }}>
                • Rebalance Target (Wheat Atta Deficit)
              </Typography>
            </Box>

            <Box sx={{ p: 2, borderRadius: 2.5, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase' }}>
                ST-C: Chembur Retail Store
              </Typography>
              <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', mt: 0.5 }}>
                {totalStC > 0 ? totalStC.toLocaleString('en-IN') : '780'} <Typography component="span" variant="body2" color="text.secondary">units</Typography>
              </Typography>
              <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                ✓ Walk-in Retail Point-of-Sale Active
              </Typography>
            </Box>
          </Box>

          {/* Multi-Hub Inventory Table */}
          <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <TableContainer>
              <Table size="medium">
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Product & SKU</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>WH-A Bhiwandi</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>WH-B Turbhe</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>ST-C Chembur</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 700 }}>Total Stock</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Agent Diagnostic</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700 }}>Autonomous Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {multiHubLoading ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <CircularProgress size={28} />
                      </TableCell>
                    </TableRow>
                  ) : multiHubItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                        <Typography color="text.secondary">No multi-hub inventory records found.</Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    multiHubItems.map((item: any) => {
                      const whA = item.nodes?.['WH-A']?.available ?? 0;
                      const whB = item.nodes?.['WH-B']?.available ?? 0;
                      const stC = item.nodes?.['ST-C']?.available ?? 0;

                      let statusBadge = (
                        <Chip label="Healthy" size="small" color="success" sx={{ fontWeight: 600, fontSize: '0.72rem' }} />
                      );
                      if (item.status === 'CRITICAL_DEFICIT') {
                        statusBadge = (
                          <Chip label="Critical Stockout Risk" size="small" color="error" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                        );
                      } else if (item.status === 'REBALANCE_OPPORTUNITY') {
                        statusBadge = (
                          <Chip label="Rebalance Opportunity" size="small" color="warning" sx={{ fontWeight: 700, fontSize: '0.72rem' }} />
                        );
                      } else if (item.status === 'DEMAND_SURGE') {
                        statusBadge = (
                          <Chip label="Demand Surge (+308%)" size="small" sx={{ bgcolor: '#fef3c7', color: '#b45309', fontWeight: 700, fontSize: '0.72rem' }} />
                        );
                      }

                      return (
                        <TableRow key={item.sku} hover>
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {item.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.sku} • {item.category}
                            </Typography>
                          </TableCell>

                          {/* WH-A */}
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {whA}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Bay 4</Typography>
                          </TableCell>

                          {/* WH-B */}
                          <TableCell align="center">
                            <Typography
                              variant="body2"
                              sx={{
                                fontWeight: 700,
                                color: whB < 40 ? '#dc2626' : 'inherit',
                              }}
                            >
                              {whB}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">Rack 12</Typography>
                          </TableCell>

                          {/* ST-C */}
                          <TableCell align="center">
                            <Typography variant="body2" sx={{ fontWeight: 700 }}>
                              {stC}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">POS 1</Typography>
                          </TableCell>

                          {/* Total Stock */}
                          <TableCell align="center">
                            <Typography variant="subtitle2" sx={{ fontWeight: 800 }}>
                              {item.totalStock}
                            </Typography>
                          </TableCell>

                          {/* Status */}
                          <TableCell>{statusBadge}</TableCell>

                          {/* Action Button */}
                          <TableCell align="right">
                            {item.status === 'REBALANCE_OPPORTUNITY' ? (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<LocalShipping />}
                                onClick={() => rebalanceMutation.mutate()}
                                disabled={rebalanceMutation.isPending}
                                sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Shift 50u to Turbhe
                              </Button>
                            ) : item.status === 'CRITICAL_DEFICIT' ? (
                              <Button
                                size="small"
                                variant="contained"
                                startIcon={<ShoppingCart />}
                                onClick={() => autoRestockMutation.mutate()}
                                disabled={autoRestockMutation.isPending}
                                sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, fontSize: '0.75rem', fontWeight: 600 }}
                              >
                                Order Restock (Amul)
                              </Button>
                            ) : (
                              <Button
                                size="small"
                                variant="outlined"
                                startIcon={<Edit />}
                                onClick={() => handleOpenUpdateDialog(item)}
                                sx={{ fontSize: '0.75rem' }}
                              >
                                Adjust
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Card>

          {/* Update Inventory Dialog */}
          <Dialog open={openUpdateDialog} onClose={() => setOpenUpdateDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>
              Adjust Inventory Buffer — {selectedProduct?.name}
            </DialogTitle>
            <DialogContent>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                <TextField
                  label="Physical Stock Count"
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                  fullWidth
                />
                <TextField
                  label="Safety Reorder Buffer"
                  type="number"
                  value={reorderLevel}
                  onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                  fullWidth
                />
                <TextField
                  label="Location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  fullWidth
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>
              <Button onClick={handleUpdateInventory} variant="contained" sx={{ bgcolor: '#2563eb' }}>
                Save Adjustment
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </MainLayout>
    </ProtectedRoute>
  );
}
