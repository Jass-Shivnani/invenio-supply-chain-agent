'use client';

import { useState, useEffect } from 'react';
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
  Chip,
  Switch,
  FormControlLabel,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Delete,
  Download,
  Print,
  Save,
  ArrowBack,
  Settings,
  Warning,
} from '@mui/icons-material';
import { useQuery, useMutation } from '@tanstack/react-query';
import { productsAPI, invoicesAPI, inventoryAPI, customersAPI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';
import { useRouter } from 'next/navigation';

// Indian States with GST Codes
const INDIAN_STATES = [
  { code: '01', name: 'Jammu and Kashmir' },
  { code: '02', name: 'Himachal Pradesh' },
  { code: '03', name: 'Punjab' },
  { code: '04', name: 'Chandigarh' },
  { code: '05', name: 'Uttarakhand' },
  { code: '06', name: 'Haryana' },
  { code: '07', name: 'Delhi' },
  { code: '08', name: 'Rajasthan' },
  { code: '09', name: 'Uttar Pradesh' },
  { code: '10', name: 'Bihar' },
  { code: '11', name: 'Sikkim' },
  { code: '12', name: 'Arunachal Pradesh' },
  { code: '13', name: 'Nagaland' },
  { code: '14', name: 'Manipur' },
  { code: '15', name: 'Mizoram' },
  { code: '16', name: 'Tripura' },
  { code: '17', name: 'Meghalaya' },
  { code: '18', name: 'Assam' },
  { code: '19', name: 'West Bengal' },
  { code: '20', name: 'Jharkhand' },
  { code: '21', name: 'Odisha' },
  { code: '22', name: 'Chhattisgarh' },
  { code: '23', name: 'Madhya Pradesh' },
  { code: '24', name: 'Gujarat' },
  { code: '26', name: 'Dadra and Nagar Haveli and Daman and Diu' },
  { code: '27', name: 'Maharashtra' },
  { code: '29', name: 'Karnataka' },
  { code: '30', name: 'Goa' },
  { code: '31', name: 'Lakshadweep' },
  { code: '32', name: 'Kerala' },
  { code: '33', name: 'Tamil Nadu' },
  { code: '34', name: 'Puducherry' },
  { code: '35', name: 'Andaman and Nicobar Islands' },
  { code: '36', name: 'Telangana' },
  { code: '37', name: 'Andhra Pradesh' },
  { code: '38', name: 'Ladakh' },
];

interface LineItem {
  productId: string;
  productName: string;
  hsnCode: string;
  quantity: number;
  rate: number;
  taxableValue: number;
  cgstRate: number;
  cgstAmount: number;
  sgstRate: number;
  sgstAmount: number;
  igstRate: number;
  igstAmount: number;
  total: number;
  availableStock?: number; // Track available stock
}

export default function CreateGSTInvoicePage() {
  const router = useRouter();
  
  // Customer Details
  const [customerName, setCustomerName] = useState('');
  const [customerGSTIN, setCustomerGSTIN] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [customerState, setCustomerState] = useState('29'); // Karnataka code
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerEmail, setCustomerEmail] = useState('');
  const [isLoadingCustomer, setIsLoadingCustomer] = useState(false);
  const [saveCustomer, setSaveCustomer] = useState(true);
  
  // Invoice Details
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [placeOfSupply, setPlaceOfSupply] = useState('29'); // Karnataka code
  const [items, setItems] = useState<LineItem[]>([]);
  const [isInterstate, setIsInterstate] = useState(false);
  const [gstRate, setGstRate] = useState(18);
  const [isMounted, setIsMounted] = useState(false);
  
  // Template from localStorage
  const [template, setTemplate] = useState<any>(null);

  useEffect(() => {
    setIsMounted(true);
    // Generate invoice number on client side only
    setInvoiceNumber(`INV-${Date.now()}`);
    
    const savedTemplate = localStorage.getItem('invoiceTemplate');
    if (savedTemplate) {
      setTemplate(JSON.parse(savedTemplate));
    } else {
      // Default template
      setTemplate({
        company: {
          name: 'Invenio Trading Co.',
          address: 'Shop No. 123, MG Road\nBangalore, Karnataka - 560001',
          email: 'info@invenio.in',
          phone: '+91 98765 43210',
          website: 'www.invenio.in',
        },
        gst: {
          gstin: '29ABCDE1234F1Z5',
          pan: 'ABCDE1234F',
          stateCode: '29',
          defaultRate: 18,
        },
        bank: {
          name: 'State Bank of India',
          accountNumber: '1234567890',
          ifscCode: 'SBIN0001234',
          upiId: 'invenio@oksbi',
        },
        design: {
          primaryColor: '#6750A4',
          logoUrl: '',
          showBankDetails: true,
          showTerms: true,
          termsText: '1. Payment due within 30 days\n2. Goods once sold cannot be returned\n3. Subject to Bangalore jurisdiction',
        },
      });
    }
  }, []);

  const { data: productsData } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll().then((res) => res.data),
  });

  // Create invoice mutation
  const createInvoiceMutation = useMutation({
    mutationFn: (data: any) => invoicesAPI.create(data),
    onSuccess: (response) => {
      alert('Invoice created successfully!');
      router.push('/sales');
    },
    onError: (error: any) => {
      alert(`Error creating invoice: ${error.response?.data?.message || error.message}`);
    },
  });

  // Get inventory data with stock levels from AWS backend
  const { data: inventoryData } = useQuery({
    queryKey: ['inventory-all'],
    queryFn: async () => {
      // Get all products with their inventory from AWS
      const products = await productsAPI.getAll().then(res => res.data);
      const inventoryList = products.products?.map((p: any) => ({
        productId: p.productId,
        quantity: p.quantity || 0, // Quantity comes from backend
      })) || [];
      
      return inventoryList;
    },
  });

  // Helper function to get available stock for a product
  const getAvailableStock = (productId: string) => {
    const inventory = inventoryData?.find((inv: any) => inv.productId === productId);
    return inventory?.quantity || 0;
  };

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
          setCustomerGSTIN(customer.gstin || '');
          setCustomerState(customer.state || '29');
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

  // Enhanced product list with stock status, excluding already added products
  const getProductsWithStock = () => {
    if (!productsData?.products) return [];
    
    const addedProductIds = items.map(item => item.productId);
    
    return productsData.products
      .filter((product: any) => !addedProductIds.includes(product.productId))
      .map((product: any) => ({
        ...product,
        availableStock: getAvailableStock(product.productId),
        inStock: getAvailableStock(product.productId) > 0,
      }))
      .sort((a: any, b: any) => {
        // Sort: in-stock items first, then out-of-stock
        if (a.inStock === b.inStock) return 0;
        return a.inStock ? -1 : 1;
      });
  };

  const handleAddItem = () => {
    const availableProducts = getProductsWithStock();
    if (availableProducts.length > 0) {
      const firstProduct = availableProducts[0];
      const availableStock = getAvailableStock(firstProduct.productId);
      const quantity = 1;
      const rate = firstProduct.price || 0;
      const taxableValue = quantity * rate;
      
      const cgstRate = isInterstate ? 0 : gstRate / 2;
      const sgstRate = isInterstate ? 0 : gstRate / 2;
      const igstRate = isInterstate ? gstRate : 0;
      
      const cgstAmount = (taxableValue * cgstRate) / 100;
      const sgstAmount = (taxableValue * sgstRate) / 100;
      const igstAmount = (taxableValue * igstRate) / 100;
      const total = taxableValue + cgstAmount + sgstAmount + igstAmount;

      setItems([
        ...items,
        {
          productId: firstProduct.productId,
          productName: firstProduct.name,
          hsnCode: firstProduct.hsnCode || '00000000', // Get HSN from product
          quantity,
          rate,
          taxableValue,
          cgstRate,
          cgstAmount,
          sgstRate,
          sgstAmount,
          igstRate,
          igstAmount,
          total,
          availableStock, // Add available stock to item
        },
      ]);
    } else {
      alert('No more products available to add or all products already added');
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
        item.hsnCode = product.hsnCode || '00000000'; // Get HSN from product
        item.rate = product.price || 0;
        item.availableStock = getAvailableStock(value); // Update stock info
      }
    } else if (field === 'quantity') {
      const requestedQty = parseFloat(value) || 0;
      const availableStock = item.availableStock || 0;
      
      // Stock validation
      if (requestedQty > availableStock) {
        alert(`Only ${availableStock} units available in stock!`);
        item.quantity = availableStock;
      } else {
        item.quantity = requestedQty;
      }
    } else if (field === 'rate') {
      item[field] = parseFloat(value) || 0;
    } else {
      item[field] = value;
    }

    // Recalculate
    item.taxableValue = item.quantity * item.rate;
    item.cgstRate = isInterstate ? 0 : gstRate / 2;
    item.sgstRate = isInterstate ? 0 : gstRate / 2;
    item.igstRate = isInterstate ? gstRate : 0;
    item.cgstAmount = (item.taxableValue * item.cgstRate) / 100;
    item.sgstAmount = (item.taxableValue * item.sgstRate) / 100;
    item.igstAmount = (item.taxableValue * item.igstRate) / 100;
    item.total = item.taxableValue + item.cgstAmount + item.sgstAmount + item.igstAmount;

    newItems[index] = item;
    setItems(newItems);
  };

  // Calculations
  const totalTaxableValue = items.reduce((sum, item) => sum + item.taxableValue, 0);
  const totalCGST = items.reduce((sum, item) => sum + item.cgstAmount, 0);
  const totalSGST = items.reduce((sum, item) => sum + item.sgstAmount, 0);
  const totalIGST = items.reduce((sum, item) => sum + item.igstAmount, 0);
  const grandTotal = items.reduce((sum, item) => sum + item.total, 0);

  const roundedTotal = Math.round(grandTotal);
  const roundOff = roundedTotal - grandTotal;

  const handleCreateInvoice = async () => {
    // Validate required fields for GST invoice
    if (!customerName.trim()) {
      alert('Please enter customer name');
      return;
    }
    
    if (!customerPhone.trim() || customerPhone.length < 10) {
      alert('Please enter a valid 10-digit phone number');
      return;
    }
    
    if (!customerAddress.trim()) {
      alert('Please enter customer address');
      return;
    }
    
    if (!customerGSTIN.trim()) {
      alert('GSTIN is mandatory for GST invoices');
      return;
    }
    
    if (items.length === 0) {
      alert('Please add at least one item');
      return;
    }
    
    // Check stock availability for all items
    for (const item of items) {
      const availableStock = getAvailableStock(item.productId);
      if (item.quantity > availableStock) {
        alert(`Insufficient stock for ${item.productName}. Available: ${availableStock}, Requested: ${item.quantity}`);
        return;
      }
    }
    
    // Save customer if new
    if (saveCustomer && customerPhone) {
      try {
        await customersAPI.create({
          name: customerName,
          phone: customerPhone,
          email: customerEmail,
          address: customerAddress,
          gstin: customerGSTIN,
          state: customerState,
        });
      } catch (error) {
        console.error('Error saving customer:', error);
        // Continue with invoice creation even if customer save fails
      }
    }
    
    const invoiceData = {
      customerName,
      customerGSTIN,
      customerAddress,
      customerPhone,
      customerEmail,
      items: items.map((item) => ({
        productId: item.productId,
        productName: item.productName,
        quantity: item.quantity,
        unitPrice: item.rate, // Backend expects 'unitPrice'
      })),
      taxRate: gstRate,
      discount: 0,
      status: 'PAID', // Default to PAID for retail sales
      template: {
        ...template,
        gstDetails: {
          customerGSTIN,
          placeOfSupply,
          isInterstate,
        },
      },
    };

    createInvoiceMutation.mutate(invoiceData);
  };

  if (!template || !isMounted) return null;

  // Format date consistently for both server and client
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.push('/sales')}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Create GST Invoice
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Professional Indian tax invoice with CGST/SGST/IGST
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              startIcon={<Settings />}
              onClick={() => router.push('/sales/settings')}
              variant="outlined"
            >
              Template Settings
            </Button>
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
            {/* Customer Details */}
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Customer Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <TextField
                    label="Customer Name"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    fullWidth
                    required
                  />
                  <TextField
                    label="Customer GSTIN (Optional)"
                    value={customerGSTIN}
                    onChange={(e) => setCustomerGSTIN(e.target.value.toUpperCase())}
                    fullWidth
                    inputProps={{ maxLength: 15 }}
                    helperText="15-digit GST number if applicable"
                  />
                  <TextField
                    label="Billing Address"
                    value={customerAddress}
                    onChange={(e) => setCustomerAddress(e.target.value)}
                    fullWidth
                    multiline
                    rows={2}
                    required
                  />
                  <FormControl fullWidth>
                    <InputLabel>Customer State</InputLabel>
                    <Select
                      value={customerState}
                      label="Customer State"
                      onChange={(e) => setCustomerState(e.target.value)}
                    >
                      {INDIAN_STATES.map((state) => (
                        <MenuItem key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                    <TextField
                      label="Phone Number *"
                      value={customerPhone}
                      onChange={(e) => handlePhoneLookup(e.target.value)}
                      fullWidth
                      required
                      helperText={isLoadingCustomer ? "Looking up customer..." : "Enter 10-digit phone number"}
                      InputProps={{
                        endAdornment: isLoadingCustomer ? <CircularProgress size={20} /> : null
                      }}
                    />
                    <TextField
                      label="Email"
                      type="email"
                      value={customerEmail}
                      onChange={(e) => setCustomerEmail(e.target.value)}
                      fullWidth
                    />
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Invoice Details */}
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Invoice Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                  <TextField
                    label="Invoice Date"
                    type="date"
                    value={invoiceDate}
                    onChange={(e) => setInvoiceDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{ shrink: true }}
                  />
                  <TextField
                    label="Place of Supply"
                    value={placeOfSupply}
                    onChange={(e) => setPlaceOfSupply(e.target.value)}
                    fullWidth
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isInterstate}
                        onChange={(e) => {
                          setIsInterstate(e.target.checked);
                          // Recalculate all items
                          const newItems = items.map((item) => {
                            const cgstRate = e.target.checked ? 0 : gstRate / 2;
                            const sgstRate = e.target.checked ? 0 : gstRate / 2;
                            const igstRate = e.target.checked ? gstRate : 0;
                            return {
                              ...item,
                              cgstRate,
                              sgstRate,
                              igstRate,
                              cgstAmount: (item.taxableValue * cgstRate) / 100,
                              sgstAmount: (item.taxableValue * sgstRate) / 100,
                              igstAmount: (item.taxableValue * igstRate) / 100,
                              total:
                                item.taxableValue +
                                (item.taxableValue * cgstRate) / 100 +
                                (item.taxableValue * sgstRate) / 100 +
                                (item.taxableValue * igstRate) / 100,
                            };
                          });
                          setItems(newItems);
                        }}
                      />
                    }
                    label="Interstate Transaction (Use IGST)"
                  />
                  <FormControl fullWidth>
                    <InputLabel>GST Rate</InputLabel>
                    <Select
                      value={gstRate}
                      onChange={(e) => setGstRate(Number(e.target.value))}
                      label="GST Rate"
                    >
                      <MenuItem value={5}>5%</MenuItem>
                      <MenuItem value={12}>12%</MenuItem>
                      <MenuItem value={18}>18%</MenuItem>
                      <MenuItem value={28}>28%</MenuItem>
                    </Select>
                  </FormControl>
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
                    <Box sx={{ display: 'flex', gap: 2, mb: 2, alignItems: 'flex-start' }}>
                      <Autocomplete
                        fullWidth
                        size="small"
                        options={[
                          ...getProductsWithStock(),
                          ...(productsData?.products?.filter((p: any) => p.productId === item.productId).map((p: any) => ({
                            ...p,
                            availableStock: getAvailableStock(p.productId),
                            inStock: getAvailableStock(p.productId) > 0,
                          })) || [])
                        ]}
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
                          // Sort: in-stock first, then out-of-stock
                          return filtered.sort((a: any, b: any) => {
                            if (a.inStock === b.inStock) return 0;
                            return a.inStock ? -1 : 1;
                          });
                        }}
                      />
                      <IconButton onClick={() => handleRemoveItem(index)} color="error" size="small">
                        <Delete />
                      </IconButton>
                    </Box>
                    <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                      <TextField
                        label="HSN Code"
                        size="small"
                        value={item.hsnCode}
                        onChange={(e) => handleUpdateItem(index, 'hsnCode', e.target.value)}
                        disabled
                      />
                      <TextField
                        label="Quantity"
                        type="number"
                        size="small"
                        value={item.quantity}
                        onChange={(e) => handleUpdateItem(index, 'quantity', e.target.value)}
                        inputProps={{ min: 1, max: item.availableStock || 0 }}
                        helperText={item.availableStock !== undefined ? `Available: ${item.availableStock}` : ''}
                        error={item.quantity > (item.availableStock || 0)}
                      />
                      <TextField
                        label="Rate"
                        type="number"
                        size="small"
                        value={item.rate}
                        onChange={(e) => handleUpdateItem(index, 'rate', e.target.value)}
                        InputProps={{
                          startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                        }}
                      />
                    </Box>
                    <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1 }}>
                      <Typography variant="caption" color="text.secondary">
                        Taxable: ₹{item.taxableValue.toFixed(2)} | {!isInterstate && `CGST: ₹${item.cgstAmount.toFixed(2)} | SGST: ₹${item.sgstAmount.toFixed(2)}`}
                        {isInterstate && `IGST: ₹${item.igstAmount.toFixed(2)}`} | <strong>Total: ₹{item.total.toFixed(2)}</strong>
                      </Typography>
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
          </Box>

          {/* RIGHT: GST Invoice Preview */}
          <Box sx={{ position: 'sticky', top: 24, height: 'fit-content' }}>
            <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
              <CardContent>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Live Preview
                </Typography>
              </CardContent>
              <Divider />

              {/* Professional GST Invoice */}
              <Box sx={{ p: 3, bgcolor: 'white', minHeight: '800px' }}>
                {/* Header with border */}
                <Box sx={{ border: 2, borderColor: template.design.primaryColor, p: 2 }}>
                  {/* Tax Invoice Title */}
                  <Box sx={{ textAlign: 'center', mb: 2 }}>
                    <Typography variant="h5" fontWeight={700} sx={{ color: template.design.primaryColor }}>
                      TAX INVOICE
                    </Typography>
                  </Box>

                  <Divider sx={{ mb: 2 }} />

                  {/* Company Details */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      {template.design.logoUrl && (
                        <Box
                          component="img"
                          src={template.design.logoUrl}
                          alt="Logo"
                          sx={{ height: 50, mb: 1 }}
                          onError={(e: any) => (e.target.style.display = 'none')}
                        />
                      )}
                      <Typography variant="h6" fontWeight={700} sx={{ color: template.design.primaryColor }}>
                        {template.company.name}
                      </Typography>
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {template.company.address}
                      </Typography>
                      <Typography variant="body2">
                        Phone: {template.company.phone}
                      </Typography>
                      <Typography variant="body2">
                        Email: {template.company.email}
                      </Typography>
                      {template.company.website && (
                        <Typography variant="body2">
                          Website: {template.company.website}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" color="text.secondary">
                        Invoice No.
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {invoiceNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Date
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {formatDate(invoiceDate)}
                      </Typography>
                      <Divider sx={{ my: 1 }} />
                      <Typography variant="caption" fontWeight={600}>
                        GSTIN: {template.gst.gstin}
                      </Typography>
                      <Typography variant="caption" display="block">
                        PAN: {template.gst.pan}
                      </Typography>
                      <Typography variant="caption" display="block">
                        State Code: {template.gst.stateCode}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Bill To / Ship To */}
                  <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, mb: 2 }}>
                    <Box>
                      <Typography variant="caption" fontWeight={700} sx={{ color: template.design.primaryColor }}>
                        BILL TO:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {customerName || 'Customer Name'}
                      </Typography>
                      {customerGSTIN && (
                        <Typography variant="caption">GSTIN: {customerGSTIN}</Typography>
                      )}
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                        {customerAddress || 'Customer Address'}
                      </Typography>
                      {customerState && (
                        <Typography variant="body2">
                          State: {INDIAN_STATES.find(s => s.code === customerState)?.name} ({customerState})
                        </Typography>
                      )}
                      {customerPhone && <Typography variant="body2">Phone: {customerPhone}</Typography>}
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="caption" fontWeight={700} sx={{ color: template.design.primaryColor }}>
                        PLACE OF SUPPLY:
                      </Typography>
                      <Typography variant="body2" fontWeight={600}>
                        {INDIAN_STATES.find(s => s.code === placeOfSupply)?.name} ({placeOfSupply})
                      </Typography>
                      <Chip
                        label={isInterstate ? 'INTERSTATE (IGST)' : 'INTRASTATE (CGST+SGST)'}
                        size="small"
                        color={isInterstate ? 'warning' : 'success'}
                        sx={{ mt: 1 }}
                      />
                    </Box>
                  </Box>

                  <Divider sx={{ my: 2 }} />

                  {/* Items Table */}
                  <TableContainer>
                    <Table size="small" sx={{ border: 1, borderColor: 'divider' }}>
                      <TableHead sx={{ bgcolor: `${template.design.primaryColor}15` }}>
                        <TableRow>
                          <TableCell><strong>#</strong></TableCell>
                          <TableCell><strong>Item Description</strong></TableCell>
                          <TableCell><strong>HSN</strong></TableCell>
                          <TableCell align="center"><strong>Qty</strong></TableCell>
                          <TableCell align="right"><strong>Rate</strong></TableCell>
                          <TableCell align="right"><strong>Taxable</strong></TableCell>
                          {!isInterstate && (
                            <>
                              <TableCell align="right"><strong>CGST</strong></TableCell>
                              <TableCell align="right"><strong>SGST</strong></TableCell>
                            </>
                          )}
                          {isInterstate && <TableCell align="right"><strong>IGST</strong></TableCell>}
                          <TableCell align="right"><strong>Total</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {items.length > 0 ? (
                          items.map((item, index) => (
                            <TableRow key={index}>
                              <TableCell>{index + 1}</TableCell>
                              <TableCell>{item.productName}</TableCell>
                              <TableCell>{item.hsnCode}</TableCell>
                              <TableCell align="center">{item.quantity}</TableCell>
                              <TableCell align="right">₹{(item.rate || 0).toFixed(2)}</TableCell>
                              <TableCell align="right">₹{item.taxableValue.toFixed(2)}</TableCell>
                              {!isInterstate && (
                                <>
                                  <TableCell align="right">
                                    <Typography variant="caption" display="block">
                                      {item.cgstRate}%
                                    </Typography>
                                    ₹{item.cgstAmount.toFixed(2)}
                                  </TableCell>
                                  <TableCell align="right">
                                    <Typography variant="caption" display="block">
                                      {item.sgstRate}%
                                    </Typography>
                                    ₹{item.sgstAmount.toFixed(2)}
                                  </TableCell>
                                </>
                              )}
                              {isInterstate && (
                                <TableCell align="right">
                                  <Typography variant="caption" display="block">
                                    {item.igstRate}%
                                  </Typography>
                                  ₹{item.igstAmount.toFixed(2)}
                                </TableCell>
                              )}
                              <TableCell align="right">
                                <strong>₹{item.total.toFixed(2)}</strong>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={isInterstate ? 8 : 9} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                              No items added
                            </TableCell>
                          </TableRow>
                        )}

                        {/* Totals Row */}
                        {items.length > 0 && (
                          <TableRow sx={{ bgcolor: 'grey.50' }}>
                            <TableCell colSpan={5} align="right">
                              <strong>TOTAL</strong>
                            </TableCell>
                            <TableCell align="right">
                              <strong>₹{totalTaxableValue.toFixed(2)}</strong>
                            </TableCell>
                            {!isInterstate && (
                              <>
                                <TableCell align="right">
                                  <strong>₹{totalCGST.toFixed(2)}</strong>
                                </TableCell>
                                <TableCell align="right">
                                  <strong>₹{totalSGST.toFixed(2)}</strong>
                                </TableCell>
                              </>
                            )}
                            {isInterstate && (
                              <TableCell align="right">
                                <strong>₹{totalIGST.toFixed(2)}</strong>
                              </TableCell>
                            )}
                            <TableCell align="right">
                              <strong>₹{grandTotal.toFixed(2)}</strong>
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Grand Total */}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                    <Box sx={{ minWidth: 300 }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Taxable Amount:</Typography>
                        <Typography variant="body2">₹{totalTaxableValue.toFixed(2)}</Typography>
                      </Box>
                      {!isInterstate && (
                        <>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">CGST:</Typography>
                            <Typography variant="body2">₹{totalCGST.toFixed(2)}</Typography>
                          </Box>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                            <Typography variant="body2">SGST:</Typography>
                            <Typography variant="body2">₹{totalSGST.toFixed(2)}</Typography>
                          </Box>
                        </>
                      )}
                      {isInterstate && (
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                          <Typography variant="body2">IGST:</Typography>
                          <Typography variant="body2">₹{totalIGST.toFixed(2)}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                        <Typography variant="body2">Round Off:</Typography>
                        <Typography variant="body2">₹{roundOff.toFixed(2)}</Typography>
                      </Box>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 1, bgcolor: `${template.design.primaryColor}15` }}>
                        <Typography variant="h6" fontWeight={700}>
                          Grand Total:
                        </Typography>
                        <Typography variant="h6" fontWeight={700} sx={{ color: template.design.primaryColor }}>
                          ₹{roundedTotal.toFixed(2)}
                        </Typography>
                      </Box>
                    </Box>
                  </Box>

                  {/* Amount in Words */}
                  <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50' }}>
                    <Typography variant="body2">
                      <strong>Amount in Words:</strong> Rupees {roundedTotal} Only
                    </Typography>
                  </Box>

                  {/* Bank Details */}
                  {template.design.showBankDetails && (
                    <Box sx={{ mt: 3, p: 2, border: 1, borderColor: 'divider' }}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Bank Details
                      </Typography>
                      <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                        <Typography variant="body2">Bank Name: {template.bank.name}</Typography>
                        <Typography variant="body2">A/C No: {template.bank.accountNumber}</Typography>
                        <Typography variant="body2">IFSC Code: {template.bank.ifscCode}</Typography>
                        <Typography variant="body2">UPI ID: {template.bank.upiId}</Typography>
                      </Box>
                    </Box>
                  )}

                  {/* Terms & Conditions */}
                  {template.design.showTerms && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} gutterBottom>
                        Terms & Conditions:
                      </Typography>
                      <Typography variant="caption" sx={{ whiteSpace: 'pre-line' }}>
                        {template.design.termsText}
                      </Typography>
                    </Box>
                  )}

                  {/* Signature */}
                  <Box sx={{ mt: 4, display: 'flex', justifyContent: 'space-between' }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Customer Signature
                      </Typography>
                    </Box>
                    <Box sx={{ textAlign: 'right' }}>
                      <Typography variant="body2" fontWeight={600}>
                        For {template.company.name}
                      </Typography>
                      <Box sx={{ height: 50 }} />
                      <Typography variant="caption">Authorized Signatory</Typography>
                    </Box>
                  </Box>
                </Box>

                {/* Footer */}
                <Box sx={{ mt: 2, textAlign: 'center' }}>
                  <Typography variant="caption" color="text.secondary">
                    This is a computer-generated invoice
                  </Typography>
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
                    Create GST Invoice
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
