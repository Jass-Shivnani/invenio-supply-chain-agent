'use client';

import { useState } from 'react';
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
  TextField,
  InputAdornment,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  Autocomplete,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TableSortLabel,
  Stack,
} from '@mui/material';
import {
  Add,
  Search,
  Edit,
  Delete,
  Category,
  FilterList,
  ArrowUpward,
  ArrowDownward,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productsAPI, categoriesAPI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';

export default function ProductsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [selectedCategory, setSelectedCategory] = useState<any>(null);
  const [newCategoryData, setNewCategoryData] = useState({
    name: '',
    description: '',
  });
  const [formData, setFormData] = useState({
    name: '',
    sku: '',
    description: '',
    categoryId: '',
    price: '',
    costPrice: '',
    hsnCode: '',
  });
  
  // Filtering and sorting state
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStockStatus, setFilterStockStatus] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'sku' | 'price' | 'stock'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['products'],
    queryFn: () => productsAPI.getAll().then((res) => res.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: () => categoriesAPI.getAll().then((res) => res.data),
  });

  const createMutation = useMutation({
    mutationFn: (product: any) => productsAPI.create(product),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: any) => productsAPI.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      handleCloseDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => productsAPI.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const createCategoryMutation = useMutation({
    mutationFn: (category: any) => categoriesAPI.create(category),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      const newCategory = response.data.category;
      setSelectedCategory(newCategory);
      setFormData({ ...formData, categoryId: newCategory.categoryId });
      setOpenCategoryDialog(false);
      setNewCategoryData({ name: '', description: '' });
    },
  });

  const handleOpenDialog = (product?: any) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        sku: product.sku,
        description: product.description || '',
        categoryId: product.categoryId || '',
        price: product.price.toString(),
        costPrice: product.costPrice?.toString() || '',
        hsnCode: product.hsnCode || '',
      });
      // Find and set the selected category
      if (product.categoryId && categoriesData?.categories) {
        const category = categoriesData.categories.find(
          (cat: any) => cat.categoryId === product.categoryId
        );
        setSelectedCategory(category || null);
      }
    } else {
      setEditingProduct(null);
      setSelectedCategory(null);
      setFormData({
        name: '',
        sku: '',
        description: '',
        categoryId: '',
        price: '',
        costPrice: '',
        hsnCode: '',
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingProduct(null);
    setSelectedCategory(null);
  };

  const handleSubmit = () => {
    const productData = {
      ...formData,
      price: parseFloat(formData.price),
      costPrice: formData.costPrice ? parseFloat(formData.costPrice) : undefined,
      categoryName: selectedCategory?.name || '',
    };

    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.productId, data: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleDelete = (productId: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(productId);
    }
  };

  const handleCategoryChange = (event: any, newValue: any) => {
    if (newValue && newValue.addNew) {
      // Open the add category dialog
      setOpenCategoryDialog(true);
    } else {
      setSelectedCategory(newValue);
      setFormData({ ...formData, categoryId: newValue?.categoryId || '' });
    }
  };

  const handleCreateCategory = () => {
    if (newCategoryData.name.trim()) {
      createCategoryMutation.mutate(newCategoryData);
    }
  };

  const handleCloseCategoryDialog = () => {
    setOpenCategoryDialog(false);
    setNewCategoryData({ name: '', description: '' });
  };

  const categories = categoriesData?.categories || [];
  const categoryOptions = [
    ...categories,
    { categoryId: 'add-new', name: '+ Add New Category', addNew: true }
  ];

  // Enhanced filtering and sorting
  const filteredProducts = data?.products?.filter((product: any) => {
    // Search filter
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (product.description && product.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    // Category filter
    const matchesCategory = filterCategory === 'all' || product.categoryId === filterCategory;
    
    // Stock status filter
    const stock = product.quantity || 0;
    let matchesStock = true;
    if (filterStockStatus === 'in-stock') matchesStock = stock > 0;
    else if (filterStockStatus === 'low-stock') matchesStock = stock > 0 && stock <= 10;
    else if (filterStockStatus === 'out-of-stock') matchesStock = stock === 0;
    
    // Price range filter
    const price = product.price || 0;
    const matchesMinPrice = !minPrice || price >= parseFloat(minPrice);
    const matchesMaxPrice = !maxPrice || price <= parseFloat(maxPrice);
    
    return matchesSearch && matchesCategory && matchesStock && matchesMinPrice && matchesMaxPrice;
  }).sort((a: any, b: any) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'sku':
        comparison = a.sku.localeCompare(b.sku);
        break;
      case 'price':
        comparison = (a.price || 0) - (b.price || 0);
        break;
      case 'stock':
        comparison = (a.quantity || 0) - (b.quantity || 0);
        break;
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  }) || [];

  const handleSort = (column: 'name' | 'sku' | 'price' | 'stock') => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box>
            <Typography variant="h4" fontWeight={700} gutterBottom>
              Products
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Manage your product catalog
            </Typography>
          </Box>
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            size="large"
          >
            Add Product
          </Button>
        </Box>

        {/* Search and Filters */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
          <CardContent>
            <Stack spacing={2}>
              {/* Search Bar */}
              <TextField
                fullWidth
                placeholder="Search by name, SKU, or description..."
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
                {/* Category Filter */}
                <FormControl fullWidth>
                  <InputLabel>Category</InputLabel>
                  <Select
                    value={filterCategory}
                    label="Category"
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <MenuItem value="all">All Categories</MenuItem>
                    {categories.map((cat: any) => (
                      <MenuItem key={cat.categoryId} value={cat.categoryId}>
                        {cat.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                
                {/* Stock Status Filter */}
                <FormControl fullWidth>
                  <InputLabel>Stock Status</InputLabel>
                  <Select
                    value={filterStockStatus}
                    label="Stock Status"
                    onChange={(e) => setFilterStockStatus(e.target.value)}
                  >
                    <MenuItem value="all">All Stock</MenuItem>
                    <MenuItem value="in-stock">In Stock</MenuItem>
                    <MenuItem value="low-stock">Low Stock (≤10)</MenuItem>
                    <MenuItem value="out-of-stock">Out of Stock</MenuItem>
                  </Select>
                </FormControl>
              </Stack>
              
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                {/* Price Range */}
                <TextField
                  fullWidth
                  label="Min Price"
                  type="number"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
                <TextField
                  fullWidth
                  label="Max Price"
                  type="number"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Stack>
              
              {/* Results Count */}
              <Typography variant="body2" color="text.secondary">
                Showing {filteredProducts.length} of {data?.products?.length || 0} products
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'sku'}
                      direction={sortBy === 'sku' ? sortOrder : 'asc'}
                      onClick={() => handleSort('sku')}
                    >
                      <strong>SKU</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>
                    <TableSortLabel
                      active={sortBy === 'name'}
                      direction={sortBy === 'name' ? sortOrder : 'asc'}
                      onClick={() => handleSort('name')}
                    >
                      <strong>Name</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell><strong>Category</strong></TableCell>
                  <TableCell><strong>HSN Code</strong></TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortBy === 'price'}
                      direction={sortBy === 'price' ? sortOrder : 'asc'}
                      onClick={() => handleSort('price')}
                    >
                      <strong>Price</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right"><strong>Cost</strong></TableCell>
                  <TableCell align="right">
                    <TableSortLabel
                      active={sortBy === 'stock'}
                      direction={sortBy === 'stock' ? sortOrder : 'asc'}
                      onClick={() => handleSort('stock')}
                    >
                      <strong>Stock</strong>
                    </TableSortLabel>
                  </TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      <CircularProgress />
                    </TableCell>
                  </TableRow>
                ) : error ? (
                  <TableRow>
                    <TableCell colSpan={8}>
                      <Alert severity="error">Failed to load products</Alert>
                    </TableCell>
                  </TableRow>
                ) : filteredProducts.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 8 }}>
                      <Typography color="text.secondary">
                        {searchQuery || filterCategory !== 'all' || filterStockStatus !== 'all' || minPrice || maxPrice
                          ? 'No products found matching your filters'
                          : 'No products yet. Create your first product!'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredProducts.map((product: any) => (
                    <TableRow key={product.productId} hover>
                      <TableCell>
                        <Chip label={product.sku} size="small" variant="outlined" />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {product.name}
                        </Typography>
                        {product.description && (
                          <Typography variant="caption" color="text.secondary">
                            {product.description}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.categoryId ? (
                          <Chip
                            icon={<Category fontSize="small" />}
                            label={product.categoryName || product.categoryId}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No category
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        {product.hsnCode ? (
                          <Chip label={product.hsnCode} size="small" />
                        ) : (
                          <Typography variant="caption" color="text.secondary">
                            No HSN
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" fontWeight={600} color="primary.main">
                          ₹{product.price ? product.price.toFixed(2) : '0.00'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography variant="body2" color="text.secondary">
                          ₹{product.costPrice ? product.costPrice.toFixed(2) : '-'}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        {(() => {
                          const stock = product.quantity || 0;
                          let color: 'success' | 'warning' | 'error' = 'success';
                          if (stock === 0) color = 'error';
                          else if (stock <= 10) color = 'warning';
                          const whA = product.nodes?.['WH-A'] ?? '-';
                          const whB = product.nodes?.['WH-B'] ?? '-';
                          const stC = product.nodes?.['ST-C'] ?? '-';
                          
                          return (
                            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                              <Chip
                                label={`${stock} units`}
                                size="small"
                                color={color}
                                sx={{ fontWeight: 700 }}
                              />
                              {product.nodes && (
                                <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>
                                  WH-A: {whA} | WH-B: {whB} | ST-C: {stC}
                                </Typography>
                              )}
                            </Box>
                          );
                        })()}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton
                          size="small"
                          onClick={() => handleOpenDialog(product)}
                          color="primary"
                        >
                          <Edit fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(product.productId)}
                          color="error"
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
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>
            {editingProduct ? 'Edit Product' : 'Add New Product'}
          </DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Product Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="SKU"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                fullWidth
                required
              />
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
              <Autocomplete
                options={categoryOptions}
                getOptionLabel={(option) => option.name}
                value={selectedCategory}
                onChange={handleCategoryChange}
                isOptionEqualToValue={(option, value) => option.categoryId === value.categoryId}
                renderOption={(props, option) => (
                  <li {...props} key={option.categoryId}>
                    {option.addNew ? (
                      <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main', fontWeight: 600 }}>
                        <Add sx={{ mr: 1 }} fontSize="small" />
                        {option.name}
                      </Box>
                    ) : (
                      <Box>
                        <Typography variant="body2">{option.name}</Typography>
                        {option.description && (
                          <Typography variant="caption" color="text.secondary">
                            {option.description}
                          </Typography>
                        )}
                      </Box>
                    )}
                  </li>
                )}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Category"
                    placeholder="Search or select category..."
                    helperText={selectedCategory ? `${selectedCategory.name}` : 'Select a category or add new'}
                  />
                )}
                fullWidth
              />
              <TextField
                label="HSN Code"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                fullWidth
                inputProps={{ maxLength: 8 }}
                helperText="8-digit HSN code for GST invoicing"
              />
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <TextField
                  label="Price"
                  type="number"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  fullWidth
                  required
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
                <TextField
                  label="Cost Price"
                  type="number"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  fullWidth
                  InputProps={{
                    startAdornment: <InputAdornment position="start">₹</InputAdornment>,
                  }}
                />
              </Box>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={!formData.name || !formData.sku || !formData.price}
            >
              {editingProduct ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Add Category Dialog */}
        <Dialog open={openCategoryDialog} onClose={handleCloseCategoryDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Add New Category</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
              <TextField
                label="Category Name"
                value={newCategoryData.name}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, name: e.target.value })}
                fullWidth
                required
                autoFocus
              />
              <TextField
                label="Description"
                value={newCategoryData.description}
                onChange={(e) => setNewCategoryData({ ...newCategoryData, description: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseCategoryDialog}>Cancel</Button>
            <Button
              onClick={handleCreateCategory}
              variant="contained"
              disabled={!newCategoryData.name.trim() || createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? 'Creating...' : 'Create Category'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </MainLayout>
  );
}
