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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  LinearProgress,
} from '@mui/material';
import { Edit, History, Warning } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryAPI, productsAPI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';

export default function InventoryPage() {
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [quantity, setQuantity] = useState(0);
  const [reorderLevel, setReorderLevel] = useState(0);
  const [location, setLocation] = useState('');

  const queryClient = useQueryClient();

  const { data: productsData, isLoading: productsLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll().then((res) => res.data),
  });

  // Get real inventory data from AWS backend
  const inventoryItems = productsData?.products?.map((product: any) => {
    // Use the inventory data from the product response
    // The backend already returns quantity in the product object
    return {
      productId: product.productId,
      productName: product.name,
      sku: product.sku,
      quantity: product.quantity || 0,
      reorderLevel: product.reorderLevel || product.minStockLevel || 10,
      location: product.location || 'Main Warehouse',
      categoryName: product.categoryName,
      price: product.unitPrice || product.price || 0,
    };
  }) || [];

  const lowStockItems = inventoryItems.filter((item: any) => item.quantity <= item.reorderLevel);

  const { data: lowStockData } = useQuery({
    queryKey: ['lowStock'],
    queryFn: () => inventoryAPI.getLowStock().then((res) => res.data),
  });

  const updateInventoryMutation = useMutation({
    mutationFn: ({ productId, data }: any) => {
      // Use real AWS API to update inventory
      return inventoryAPI.update(productId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['lowStock'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-all'] });
      setOpenUpdateDialog(false);
    },
  });

  const handleOpenUpdateDialog = (product: any) => {
    setSelectedProduct(product);
    setQuantity(product.quantity || 0);
    setReorderLevel(product.reorderLevel || 10);
    setLocation(product.location || 'Main Warehouse');
    setOpenUpdateDialog(true);
  };

  const handleUpdateInventory = () => {
    if (selectedProduct) {
      updateInventoryMutation.mutate({
        productId: selectedProduct.productId,
        data: {
          quantity,
          reorderLevel,
          location,
        },
      });
    }
  };

  const getStockStatus = (item: any) => {
    const qty = item.quantity || 0;
    const reorder = item.reorderLevel || 10;

    if (qty === 0) {
      return { label: 'Out of Stock', color: 'error' as const, severity: 'critical' };
    } else if (qty <= reorder) {
      return { label: 'Low Stock', color: 'warning' as const, severity: 'warning' };
    } else {
      return { label: 'In Stock', color: 'success' as const, severity: 'good' };
    }
  };

  const getStockPercentage = (item: any) => {
    const qty = item.quantity || 0;
    const reorder = item.reorderLevel || 10;
    const max = reorder * 3; // Assume max stock is 3x reorder level
    return Math.min((qty / max) * 100, 100);
  };

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" fontWeight={700} gutterBottom>
            Inventory Tracking
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Monitor stock levels and manage inventory
          </Typography>
        </Box>

        {/* Low Stock Alert */}
        {lowStockData && lowStockData.count > 0 && (
          <Alert severity="warning" icon={<Warning />} sx={{ mb: 3 }}>
            <Typography fontWeight={600}>
              {lowStockData.count} product{lowStockData.count > 1 ? 's' : ''} running low on stock!
            </Typography>
            <Typography variant="body2">
              These items need restocking soon to avoid running out.
            </Typography>
          </Alert>
        )}

        {/* Inventory Table */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Product</strong></TableCell>
                  <TableCell><strong>SKU</strong></TableCell>
                  <TableCell><strong>Location</strong></TableCell>
                  <TableCell align="center"><strong>Quantity</strong></TableCell>
                  <TableCell align="center"><strong>Reorder Level</strong></TableCell>
                  <TableCell><strong>Stock Status</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {productsLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : !productsData?.products || productsData.products.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">
                        No products found. Add products to track inventory.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  inventoryItems.map((item: any) => {
                    const status = getStockStatus(item);
                    const stockPercentage = getStockPercentage(item);

                    return (
                      <TableRow key={item.productId} hover>
                        <TableCell>
                          <Typography variant="body2" fontWeight={600}>
                            {item.productName}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={item.sku} size="small" variant="outlined" />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2" color="text.secondary">
                            {item.location || 'Main Warehouse'}
                          </Typography>
                        </TableCell>
                        <TableCell align="center">
                          <Box>
                            <Typography variant="h6" fontWeight={700}>
                              {item.quantity || 0}
                            </Typography>
                            <LinearProgress
                              variant="determinate"
                              value={stockPercentage}
                              sx={{
                                mt: 1,
                                height: 6,
                                borderRadius: 1,
                                bgcolor: 'grey.200',
                                '& .MuiLinearProgress-bar': {
                                  bgcolor:
                                    status.severity === 'critical'
                                      ? 'error.main'
                                      : status.severity === 'warning'
                                      ? 'warning.main'
                                      : 'success.main',
                                },
                              }}
                            />
                          </Box>
                        </TableCell>
                        <TableCell align="center">
                          <Typography variant="body2">
                            {item.reorderLevel || 10}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip label={status.label} size="small" color={status.color} />
                        </TableCell>
                        <TableCell align="right">
                          <Button
                            size="small"
                            startIcon={<Edit />}
                            onClick={() => handleOpenUpdateDialog(item)}
                          >
                            Update
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

        {/* Update Inventory Dialog */}
        <Dialog open={openUpdateDialog} onClose={() => setOpenUpdateDialog(false)} maxWidth="sm" fullWidth>
          <DialogTitle>
            Update Inventory - {selectedProduct?.name}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Quantity"
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value) || 0)}
                fullWidth
              />
              <TextField
                label="Reorder Level"
                type="number"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(parseInt(e.target.value) || 0)}
                fullWidth
                helperText="Alert when stock falls below this level"
              />
              <TextField
                label="Location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                fullWidth
                placeholder="e.g., Warehouse A, Shelf 12"
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenUpdateDialog(false)}>Cancel</Button>
            <Button onClick={handleUpdateInventory} variant="contained">
              Update
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
