'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  IconButton,
  Divider,
  InputAdornment,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  CircularProgress,
  Autocomplete,
  Chip,
} from '@mui/material';
import {
  Add,
  Delete,
  CloudUpload,
  Download,
  Print,
  Save,
  ArrowBack,
  Warning,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productsAPI, invoicesAPI, customersAPI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';
import { useRouter } from 'next/navigation';

interface LineItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  availableStock?: number;
}

export default function CreateInvoicePage() {
  const router = useRouter();
  const [customerName, setCustomerName] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [taxRate, setTaxRate] = useState(0); // Default 0 for non-GST
  const [discount, setDiscount] = useState(0);
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [saveCustomer, setSaveCustomer] = useState(true);

  // Template settings
  const [companyName, setCompanyName] = useState('Invenio Store');
  const [companyEmail, setCompanyEmail] = useState('store@invenio.in');
  const [companyPhone, setCompanyPhone] = useState('+91 98765 43210');
  const [companyAddress, setCompanyAddress] = useState('Shop No. 15, MG Road, Bangalore, Karnataka - 560001');
  const [primaryColor, setPrimaryColor] = useState('#6750A4');
  const [logoUrl, setLogoUrl] = useState('');

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll().then((res) => res.data),
  });

  // Helper function to get available stock for a product
  const getAvailableStock = (productId: string) => {
    const product = productsData?.products?.find((p: any) => p.productId === productId);
    return product?.quantity || 0;
  };

  // Get products with stock info, excluding already added products
  const getAvailableProducts = () => {
    if (!productsData?.products) return [];
    
    const addedProductIds = items.map(item => item.productId);
    
    return productsData.products
      .filter((product: any) => !addedProductIds.includes(product.productId))
      .map((product: any) => ({
        ...product,
        availableStock: product.quantity || 0,
        inStock: (product.quantity || 0) > 0,
      }))
      .sort((a: any, b: any) => {
        // Sort: in-stock items first, then out-of-stock
        if (a.inStock === b.inStock) return 0;
        return a.inStock ? -1 : 1;
      });
  };

  const createInvoiceMutation = useMutation({
    mutationFn: (invoiceData: any) => invoicesAPI.create(invoiceData),
    onSuccess: () => {
      alert('Invoice created successfully!');
      router.push('/sales');
    },
  });

  const handleAddItem = () => {
    const availableProducts = getAvailableProducts();
    if (availableProducts.length > 0) {
      const firstProduct = availableProducts[0];
      setItems([
        ...items,
        {
          productId: firstProduct.productId,
          productName: firstProduct.name,
          quantity: 1,
          price: firstProduct.price,
          availableStock: firstProduct.availableStock,
        },
      ]);
    } else {
      alert('No more products available to add or all products already added');
    }
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, field: keyof LineItem, value: any) => {
    const newItems = [...items];
    if (field === 'productId') {
      const product = productsData?.products.find((p: any) => p.productId === value);
      if (product) {
        newItems[index] = {
          ...newItems[index],
          productId: value,
          productName: product.name,
          price: product.price,
          availableStock: product.quantity || 0,
        };
      }
    } else {
      newItems[index] = { ...newItems[index], [field]: value };
    }
    setItems(newItems);
  };

  const subtotal = items.reduce((sum, item) => sum + item.quantity * item.price, 0);
  const taxAmount = (subtotal * taxRate) / 100;
  const discountAmount = (subtotal * discount) / 100;
  const total = subtotal + taxAmount - discountAmount;

  // Phone lookup to auto-fill customer details
  const handlePhoneLookup = async (phone: string) => {
    setCustomerPhone(phone);
    
    if (phone.length >= 10) {
      setIsLoadingCustomer(true);
      try {
        const response = await customersAPI.getByPhone(phone);
        if (response.data.success && response.data.customer) {
          const customer = response.data.customer;
          setCustomerName(customer.name || '');
          setCustomerEmail(customer.email || '');
          setCustomerAddress(customer.address || '');
          setSaveCustomer(false); // Don't create duplicate
        }
      } catch (error) {
        // Customer not found, allow new entry
        setSaveCustomer(true);
      } finally {
        setIsLoadingCustomer(false);
      }
    }
  };

  const handleCreateInvoice = async () => {
    // Minimal validation for shop-friendly Non-GST invoice
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    
    if (!customerPhone.trim()) {
      alert('Please enter customer phone number');
      return;
    }
    
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    
    // Validate stock availability
    for (const item of items) {
      if (item.quantity > (item.availableStock || 0)) {
        alert(`Insufficient stock for ${item.productName}. Available: ${item.availableStock}, Requested: ${item.quantity}`);
        return;
      }
      if (item.quantity <= 0) {
        alert(`Please enter a valid quantity for ${item.productName}`);
        return;
      }
    }
    
    // Save customer if new
    if (saveCustomer && customerPhone && customerName) {
      try {
        await customersAPI.create({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
        });
      } catch (error) {
        console.error('Error saving customer:', error);
        // Continue with invoice creation
      }
    }
    
    const invoiceData = {
      customerName,
      customerEmail,
      customerPhone,
      customerAddress,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.price, // Backend expects 'unitPrice'
      })),
      taxRate,
      discount,
      status: 'PAID', // Default to PAID for retail sales
      template: {
        companyName,
        companyEmail,
        companyPhone,
        companyAddress,
        primaryColor,
        logoUrl,
      },
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.push('/sales')}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Create Non-GST Invoice
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Generate a professional invoice with live preview
              </Typography>
            </Box>
          </Box>
        </Box>

        {/* Two Column Layout */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
            gap: 3,
          }}
        >
          {/* LEFT: Form Editor */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Customer Info */}
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Customer Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <TextField
                    label="Phone Number *"
                    value={customerPhone}
                    onChange={(e) => handlePhoneLookup(e.target.value)}
                    fullWidth
                    required
                    helperText={isLoadingCustomer ? "Looking up customer..." : "Enter phone to auto-fill details"}
                    InputProps={{
                      endAdornment: isLoadingCustomer ? <CircularProgress size={20} /> : null
                    }}
                  />
                  <TextField
                    label="Customer Name *"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Email (Optional)"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Address (Optional)"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                  />
                </Box>
              </CardContent>
            </Card>

            {/* Line Items */}
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6" fontWeight={600}>
                    Items
                  </Typography>
                  <Button startIcon={<Add />} onClick={handleAddItem} variant="outlined" size="small">
                    Add Item
                  </Button>
                </Box>

                {items.map((item, index) => (
                  <Box key={index} sx={{ mb: 2, p: 2, bgcolor: 'background.default', borderRadius: 2 }}>
                    <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                      <Autocomplete
                        fullWidth
                        size="small"
                        options={[
                          ...getAvailableProducts(),
                          ...(productsData?.products?.filter((p: any) => p.productId === item.productId) || [])
                        ].map((product: any) => ({
                          ...product,
                          availableStock: product.quantity || 0,
                          inStock: (product.quantity || 0) > 0,
                        }))}
                        getOptionLabel={(option: any) => option.name}
                        value={productsData?.products?.find((p: any) => p.productId === item.productId) || null}
                        onChange={(_, newValue) => {
                          if (newValue) {
                            handleUpdateItem(index, 'productId', newValue.productId);
                          }
                        }}
                        renderOption={(props, option: any) => (
                          <li {...props}>
                            <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                              <Box>
                                <Typography variant="body2">{option.name}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  SKU: {option.sku} | ₹{option.price}
                                </Typography>
                              </Box>
                              {option.inStock ? (
                                <Chip 
                                  label={`Stock: ${option.availableStock}`} 
                                  size="small" 
                                  color="success" 
                                  variant="outlined"
                                />
                              ) : (
                                <Chip 
                                  label="Out of Stock" 
                                  size="small" 
                                  color="error"
                                  icon={<Warning />}
                                />
                              )}
                            </Box>
                          </li>
                        )}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            label="Search Product"
                            placeholder="Type to search by name or SKU..."
                          />
                        )}
                        filterOptions={(options, state) => {
                          const filtered = options.filter((option: any) =>
                            option.name.toLowerCase().includes(state.inputValue.toLowerCase()) ||
                            option.sku.toLowerCase().includes(state.inputValue.toLowerCase())
                          );
                          return filtered;
                        }}
                      />
                      <IconButton onClick={() => handleRemoveItem(index)} color="error" size="small">
                        <Delete />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                      <TextField
                        label="Quantity"
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                        inputProps={{ min: 1, max: item.availableStock || 0 }}
                        helperText={item.availableStock !== undefined ? `Available: ${item.availableStock}` : ''}
                        error={item.quantity > (item.availableStock || 0) || item.quantity <= 0}
                      />
                      <TextField
                        label="Price"
                        type="number"
                        size="small"
                        value={item.price}
                        onChange={(e) => handleUpdateItem(index, 'price', parseFloat(e.target.value) || 0)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                      />
                    </Box>
                  </Box>
                ))}

                {items.length === 0 && (
                  <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                    No items added yet. Click "Add Item" to get started.
                  </Box>
                )}
              </CardContent>
            </Card>

            {/* Tax & Discount */}
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Tax & Discount
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mt: 2 }}>
                  <TextField
                    label="Tax Rate (%)"
                    type="number"
                    value={taxRate}
                    onChange={(e) => setTaxRate(parseFloat(e.target.value) || 0)}
                    fullWidth
                  />
                  <TextField
                    label="Discount (%)"
                    type="number"
                    value={discount}
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    fullWidth
                  />
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* RIGHT: Live Preview */}
          <Box sx={{ position: 'sticky', top: 24, height: 'fit-content' }}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Live Preview
                </Typography>
              </CardContent>
              <Divider />

              {/* Invoice Preview */}
              <Box sx={{ p: 4, bgcolor: 'white' }}>
                {/* Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
                  <Box>
                    {logoUrl && (
                      <Box
                        component="img"
                        src={logoUrl}
                        alt="Logo"
                        sx={{ height: 60, mb: 2 }}
                        onError={(e: any) => (e.target.style.display = 'none')}
                      />
                    )}
                    <Typography variant="h5" fontWeight={700} sx={{ color: primaryColor }}>
                      {companyName}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {companyEmail}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {companyPhone}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {companyAddress}
                    </Typography>
                  </Box>
                  <Box sx={{ textAlign: 'right' }}>
                    <Typography variant="h4" fontWeight={700} sx={{ color: primaryColor }}>
                      INVOICE
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Date: {new Date().toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Bill To */}
                <Box sx={{ mb: 3 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>
                    BILL TO:
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {customerName || 'Customer Name'}
                  </Typography>
                  {customerEmail && <Typography variant="body2">{customerEmail}</Typography>}
                  {customerPhone && <Typography variant="body2">{customerPhone}</Typography>}
                  {customerAddress && <Typography variant="body2">{customerAddress}</Typography>}
                </Box>

                {/* Items Table */}
                <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: `${primaryColor}15` }}>
                      <TableRow>
                        <TableCell><strong>Item</strong></TableCell>
                        <TableCell align="center"><strong>Qty</strong></TableCell>
                        <TableCell align="right"><strong>Price</strong></TableCell>
                        <TableCell align="right"><strong>Total</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {items.length > 0 ? (
                        items.map((item, index) => (
                          <TableRow key={index}>
                            <TableCell>{item.productName}</TableCell>
                            <TableCell align="center">{item.quantity}</TableCell>
                            <TableCell align="right">₹{(item.price || 0).toFixed(2)}</TableCell>
                            <TableCell align="right">₹{((item.quantity || 0) * (item.price || 0)).toFixed(2)}</TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                            No items added
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Totals */}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <Box sx={{ minWidth: 300 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Subtotal:</Typography>
                      <Typography>₹{subtotal.toFixed(2)}</Typography>
                    </Box>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography>Tax ({taxRate}%):</Typography>
                      <Typography>₹{taxAmount.toFixed(2)}</Typography>
                    </Box>
                    {discount > 0 && (
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography>Discount ({discount}%):</Typography>
                        <Typography color="error">-₹{discountAmount.toFixed(2)}</Typography>
                      </Box>
                    )}
                    <Divider sx={{ my: 1 }} />
                    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                      <Typography variant="h6" fontWeight={700}>
                        Total:
                      </Typography>
                      <Typography variant="h6" fontWeight={700} sx={{ color: primaryColor }}>
                        ₹{total.toFixed(2)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Divider />

              {/* Actions */}
              <CardContent>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                  <Button
                    variant="contained"
                    startIcon={<Save />}
                    onClick={handleCreateInvoice}
                    disabled={!customerName || items.length === 0}
                    fullWidth
                  >
                    Create Invoice
                  </Button>
                  <Button variant="outlined" startIcon={<Download />} fullWidth>
                    Download PDF
                  </Button>
                  <Button variant="outlined" startIcon={<Print />} fullWidth>
                    Print
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Box>
        </Box>
      </Box>
    </MainLayout>
  );
}
