'use client';

import { useState, useEffect } from 'react';
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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  CircularProgress,
  Alert,
  InputAdornment,
  Autocomplete,
  Divider,
  Snackbar,
} from '@mui/material';
import {
  Add,
  Delete,
  Edit,
  ShoppingCart,
  CheckCircle,
  Pending,
  Inventory,
  AutoAwesome,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, inventoryAPI, purchaseOrdersAPI, transactionsAPI, agenticAI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';

interface PurchaseOrderItem {
  productId: string;
  productName: string;
  quantity: number;
  costPrice: number;
  total: number;
}

export default function PurchaseOrdersPage() {
  const [openDialog, setOpenDialog] = useState(false);
  const [editingPO, setEditingPO] = useState<any>(null);
  
  // PO Form Data
  const [poDate, setPoDate] = useState(new Date().toISOString().split('T')[0]);
  const [expectedDate, setExpectedDate] = useState('');
  const [items, setItems] = useState<PurchaseOrderItem[]>([]);
  const [notes, setNotes] = useState('');
  
  // UI State
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });

  const queryClient = useQueryClient();

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll().then((res) => res.data),
  });

  // Load Purchase Orders from AWS backend
  const { data: purchaseOrdersData, isLoading: poLoading } = useQuery({
    queryKey: ['purchaseOrders'],
    queryFn: () => purchaseOrdersAPI.getAll().then((res) => res.data),
  });

  const purchaseOrders = purchaseOrdersData?.purchaseOrders || [];

  const handleAddItem = () => {
    if (productsData?.products?.length > 0) {
      const firstProduct = productsData.products[0];
      setItems([
        ...items,
        {
          productId: firstProduct.productId,
          productName: firstProduct.name,
          quantity: 1,
          costPrice: firstProduct.costPrice || firstProduct.price || 0,
          total: firstProduct.costPrice || firstProduct.price || 0,
        },
      ]);
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: string, value: any) => {
    const newItems = [...items];
    const item = { ...newItems[index] } as any;

    if (field === 'productId') {
      const product = productsData?.products.find((p: any) => p.productId === value);
      if (product) {
        item.productId = value;
        item.productName = product.name;
        item.costPrice = product.costPrice || product.price || 0;
        item.total = item.quantity * item.costPrice;
      }
    } else if (field === 'quantity' || field === 'costPrice') {
      item[field] = parseFloat(value) || 0;
      item.total = item.quantity * item.costPrice;
    }

    newItems[index] = item;
    setItems(newItems);
  };

  const handleOpenDialog = (po?: any) => {
    if (po) {
      setEditingPO(po);
      // Load PO data
    } else {
      setEditingPO(null);
      setPoDate(new Date().toISOString().split('T')[0]);
      setExpectedDate('');
      setItems([]);
      setNotes('');
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingPO(null);
  };

  // Mutation to create Purchase Order
  const createPOMutation = useMutation({
    mutationFn: (poData: any) => purchaseOrdersAPI.create(poData),
    onSuccess: (response, variables) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setSnackbar({ 
        open: true, 
        message: 'Purchase Order created successfully!', 
        severity: 'success' 
      });
      handleCloseDialog();
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Error creating Purchase Order', severity: 'error' });
    },
  });

  const autoRestockMutation = useMutation({
    mutationFn: () => agenticAI.autoRestock(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      setSnackbar({
        open: true,
        message: res.data.message || 'AI Auto-Restock generated optimal Purchase Orders!',
        severity: 'success',
      });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Error running AI Auto-Restock', severity: 'error' });
    },
  });

  const handleSubmit = () => {
    const totalAmount = items.reduce((sum, item) => sum + item.total, 0);
    const poNumber = `PO-${new Date().getFullYear()}-${String((purchaseOrders?.length || 0) + 1).padStart(3, '0')}`;
    
    const poData = {
      poNumber,
      date: poDate,
      expectedDate,
      items,
      notes,
      totalAmount,
      status: 'pending',
      itemsCount: items.length,
    };

    createPOMutation.mutate(poData);
  };

  const handleReceivePO = async (po: any) => {
    if (!confirm(`Mark Purchase Order ${po.poNumber} as received and update inventory?`)) {
      return;
    }

    try {
      // First, mark PO as received
      await purchaseOrdersAPI.receive(po.poId, {});
      
      // Then update inventory for each item
      const inventoryUpdates = po.items.map(async (item: PurchaseOrderItem) => {
        // Get current product to find current quantity
        const productsResponse = await productsAPI.getAll();
        const currentProduct = productsResponse.data.products?.find((p: any) => p.productId === item.productId);
        const currentQty = currentProduct?.quantity || 0;
        
        // Update inventory through AWS API
        await inventoryAPI.update(item.productId, {
          quantity: currentQty + item.quantity,
          reorderLevel: currentProduct?.reorderLevel || 10,
          location: currentProduct?.location || 'Main Warehouse',
        });
        
        // Create transaction record
        const transactionData = {
          productId: item.productId,
          type: 'IN',  // Changed from 'purchase' to 'IN'
          quantity: item.quantity,
          notes: `PO ${po.poNumber} - Stock Received`,
          costPrice: item.costPrice || 0,
        };
        console.log('Creating transaction:', transactionData);
        await transactionsAPI.create(transactionData);
      });

      await Promise.all(inventoryUpdates);

      setSnackbar({ 
        open: true, 
        message: `${po.poNumber} received! Inventory updated for ${po.itemsCount} items.`, 
        severity: 'success' 
      });
      
      // Refresh all related data
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-all'] });
    } catch (error) {
      console.error('Error receiving PO:', error);
      setSnackbar({ open: true, message: 'Error updating inventory', severity: 'error' });
    }
  };

  const totalAmount = items.reduce((sum, item) => sum + item.total, 0);

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Purchase Orders
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage vendor purchases and track costs
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5 }}>
            <Button
              variant="outlined"
              sx={{ borderColor: '#2563eb', color: '#2563eb', fontWeight: 600 }}
              startIcon={<AutoAwesome />}
              disabled={autoRestockMutation.isPending}
              onClick={() => autoRestockMutation.mutate()}
              size="medium"
            >
              {autoRestockMutation.isPending ? 'Agents Evaluating Suppliers...' : 'Authorize Autonomous Restock'}
            </Button>
            <Button
              variant="contained"
              startIcon={<Add />}
              onClick={() => handleOpenDialog()}
              size="medium"
              sx={{ bgcolor: '#2563eb' }}
            >
              New Purchase Order
            </Button>
          </Box>
        </Box>

        {/* Purchase Orders Table */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <TableContainer>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>PO Number & Product</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Supplier & SLA</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Order Qty</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700 }}>Total Cost</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Agent Selection Rationale</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700 }}>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {purchaseOrders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <ShoppingCart sx={{ fontSize: 48, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="body1" color="text.secondary">
                        No purchase orders recorded yet
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  (purchaseOrders as any[]).map((po: any) => (
                    <TableRow key={po.poId || po.poNumber} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700 }}>
                            {po.poNumber || po.poId}
                          </Typography>
                          {po.expectedProfitProtected > 0 && (
                            <Chip label="Autonomous" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
                          )}
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          {po.productName || po.items?.[0]?.productName || 'Stock Reorder'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {po.vendorName || 'Direct Supplier'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {po.deliveryDeadlineDays ? `${po.deliveryDeadlineDays}d Lead Time SLA` : 'Standard SLA'}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Typography variant="body2" sx={{ fontWeight: 700 }}>
                          {po.quantity || po.items?.[0]?.quantity || 100} units
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1e40af' }}>
                          ₹{Number(po.totalAmount || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                        </Typography>
                      </TableCell>
                      <TableCell sx={{ maxWidth: 320 }}>
                        <Typography variant="caption" sx={{ color: '#475569', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {po.notes || 'Autonomous order generated by multi-constraint vendor scoring.'}
                        </Typography>
                        {po.expectedProfitProtected > 0 && (
                          <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600, display: 'block' }}>
                            ✓ Defended ₹{Number(po.expectedProfitProtected).toLocaleString('en-IN')} in stockout penalties
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {po.status === 'received' ? (
                          <Chip
                            icon={<CheckCircle fontSize="small" />}
                            label="Received"
                            size="small"
                            color="success"
                            sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                          />
                        ) : (
                          <Chip
                            icon={<Pending fontSize="small" />}
                            label="Pending Delivery"
                            size="small"
                            color="warning"
                            sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                          />
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          {po.status === 'pending' && (
                            <Button
                              size="small"
                              variant="contained"
                              color="success"
                              startIcon={<Inventory fontSize="small" />}
                              onClick={() => handleReceivePO(po)}
                              sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              Receive
                            </Button>
                          )}
                          <IconButton 
                            size="small" 
                            color="primary" 
                            onClick={() => handleOpenDialog(po)}
                            disabled={po.status === 'received'}
                          >
                            <Edit fontSize="small" />
                          </IconButton>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Card>

        {/* Create/Edit Purchase Order Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
          <DialogTitle>
            {editingPO ? 'Edit Purchase Order' : 'Create New Purchase Order'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, mt: 2 }}>
              {/* Date Fields */}
              <Box>
                <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                  Purchase Order Details
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="PO Date"
                    type="date"
                    value={poDate}
                    onChange={(e) => setPoDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Expected Delivery Date"
                    type="date"
                    value={expectedDate}
                    onChange={(e) => setExpectedDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                </Box>
              </Box>

              <Divider />

              {/* Items */}
              <Box>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle2" fontWeight={600}>
                    Order Items
                  </Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<Add />}
                    onClick={handleAddItem}
                    disabled={!productsData?.products?.length}
                  >
                    Add Item
                  </Button>
                </Box>

                <TableContainer component={Card} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell width="40%">Product</TableCell>
                        <TableCell width="20%">Quantity</TableCell>
                        <TableCell width="20%">Cost Price</TableCell>
                        <TableCell width="15%" align="right">Total</TableCell>
                        <TableCell width="5%"></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography variant="body2" color="text.secondary">
                              No items added yet. Click "Add Item" to start.
                            </Typography>
                          </TableCell>
                        </TableRow>
                      ) : (
                        items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>
                              <Autocomplete
                                size="small"
                                options={productsData?.products || []}
                                getOptionLabel={(option: any) => option.name}
                                value={productsData?.products?.find((p: any) => p.productId === item.productId) || null}
                                onChange={(_, newValue) => {
                                  if (newValue) {
                                    handleUpdateItem(index, 'productId', newValue.productId);
                                  }
                                }}
                                renderInput={(params) => <TextField {...params} />}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={item.quantity}
                                onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                                fullWidth
                                inputProps={{ min: 1 }}
                              />
                            </TableCell>
                            <TableCell>
                              <TextField
                                type="number"
                                size="small"
                                value={item.costPrice}
                                onChange={(e) => handleUpdateItem(index, 'costPrice', e.target.value)}
                                fullWidth
                                InputProps={{
                                  startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                                }}
                              />
                            </TableCell>
                            <TableCell align="right">
                              <Typography variant="body2" fontWeight={600}>
                                ₹{item.total.toFixed(2)}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleRemoveItem(index)}
                              >
                                <Delete fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                  <Box sx={{ minWidth: 250 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2">Subtotal:</Typography>
                      <Typography variant="body2" fontWeight={600}>
                        ₹{totalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                    <Divider />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Typography variant="h6">Total Amount:</Typography>
                      <Typography variant="h6" color="primary.main" fontWeight={700}>
                        ₹{totalAmount.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              {/* Notes */}
              <TextField
                label="Notes / Terms"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                multiline
                rows={3}
                fullWidth
                placeholder="Add any special instructions or terms..."
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={items.length === 0}
            >
              {editingPO ? 'Update' : 'Create'} Purchase Order
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar for notifications */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
          <Alert 
            onClose={() => setSnackbar({ ...snackbar, open: false })} 
            severity={snackbar.severity}
            sx={{ width: '100%' }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Box>
    </MainLayout>
  );
}
