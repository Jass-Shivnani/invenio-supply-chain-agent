'use client';

import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { invoicesAPI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  Chip,
  IconButton,
  Paper,
} from '@mui/material';
import { ArrowBack, Print, Download, Receipt } from '@mui/icons-material';

export default function InvoiceDetailPage() {
  const params = useParams();
  const router = useRouter();
  const invoiceId = params.id as string;

  const { data: response, isLoading, error } = useQuery({
    queryKey: ['invoice', invoiceId],
    queryFn: () => invoicesAPI.getById(invoiceId).then((res) => res.data),
  });

  // Extract invoice from response
  const invoice = response?.invoice;

  // Debug logging
  console.log('Invoice response:', response);
  console.log('Invoice data:', invoice);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Today';
    const d = new Date(dateString);
    return isNaN(d.getTime()) ? 'Today' : d.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleDownloadPDF = () => {
    // Create a print-friendly version and trigger download
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Invoice ${invoice?.invoiceNumber}</title>
            <style>
              body { font-family: Arial, sans-serif; padding: 20px; }
              .invoice-header { display: flex; justify-content: space-between; margin-bottom: 30px; }
              .company-info h2 { margin: 0 0 10px 0; }
              .invoice-info { text-align: right; }
              .customer-section { margin: 20px 0; }
              table { width: 100%; border-collapse: collapse; margin: 20px 0; }
              th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
              th { background-color: #f5f5f5; font-weight: bold; }
              .totals { margin-left: auto; width: 300px; margin-top: 20px; }
              .totals div { display: flex; justify-content: space-between; padding: 5px 0; }
              .total-row { font-weight: bold; font-size: 1.2em; border-top: 2px solid #333; padding-top: 10px; }
              @media print {
                body { margin: 0; }
                @page { size: A4; margin: 15mm; }
              }
            </style>
          </head>
          <body>
            <div class="invoice-header">
              <div class="company-info">
                <h2>${invoice?.template?.companyName || 'Your Company'}</h2>
                <p>${invoice?.template?.companyAddress || ''}</p>
                <p>${invoice?.template?.companyEmail || ''}</p>
                <p>${invoice?.template?.companyPhone || ''}</p>
              </div>
              <div class="invoice-info">
                <h1>INVOICE</h1>
                <p><strong>Invoice #:</strong> ${invoice?.invoiceNumber}</p>
                <p><strong>Date:</strong> ${formatDate(invoice?.createdAt || '')}</p>
                <p><strong>Status:</strong> ${invoice?.status}</p>
              </div>
            </div>
            
            <div class="customer-section">
              <p><strong>BILL TO:</strong></p>
              <h3>${invoice?.customerName}</h3>
              ${invoice?.customerEmail ? `<p>${invoice.customerEmail}</p>` : ''}
              ${invoice?.customerPhone ? `<p>${invoice.customerPhone}</p>` : ''}
              ${invoice?.customerAddress ? `<p>${invoice.customerAddress}</p>` : ''}
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Quantity</th>
                  <th>Unit Price</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice?.items?.map((item: any) => `
                  <tr>
                    <td>${item.productName}</td>
                    <td>${item.quantity}</td>
                    <td>${formatCurrency(item.unitPrice)}</td>
                    <td>${formatCurrency(item.total)}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="totals">
              <div><span>Subtotal:</span><span>${formatCurrency(invoice?.subtotal || 0)}</span></div>
              ${invoice?.taxRate > 0 ? `<div><span>Tax (${invoice.taxRate}%):</span><span>${formatCurrency(invoice?.tax || 0)}</span></div>` : ''}
              ${invoice?.discount > 0 ? `<div><span>Discount:</span><span>-${formatCurrency(invoice?.discount || 0)}</span></div>` : ''}
              <div class="total-row"><span>Total:</span><span>${formatCurrency(invoice?.total || 0)}</span></div>
            </div>
            
            ${invoice?.notes ? `
              <div style="margin-top: 30px;">
                <p><strong>NOTES:</strong></p>
                <p>${invoice.notes}</p>
              </div>
            ` : ''}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.focus();
      
      // Wait for content to load, then trigger print
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (isLoading) {
    return (
      <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
          <CircularProgress />
        </Box>
      </MainLayout>
    );
  }

  if (error || !invoice) {
    return (
      <MainLayout>
        <Box>
          <Alert severity="error">Failed to load invoice details</Alert>
          <Button sx={{ mt: 2 }} onClick={() => router.push('/sales')}>
            Back to Sales
          </Button>
        </Box>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Box>
        {/* Print Styles */}
        <style jsx global>{`
          @media print {
            header, nav, .MuiAppBar-root, .MuiDrawer-root {
              display: none !important;
            }
            .no-print {
              display: none !important;
            }
            body {
              margin: 0;
              padding: 20px;
            }
            @page {
              size: A4;
              margin: 15mm;
            }
          }
        `}</style>

        {/* Header */}
        <Box className="no-print" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <IconButton onClick={() => router.push('/sales')}>
              <ArrowBack />
            </IconButton>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Invoice Details
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {invoice.invoiceNumber}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={handleDownloadPDF}
            >
              Download PDF
            </Button>
            <Button
              variant="contained"
              startIcon={<Print />}
              onClick={handlePrint}
            >
              Print
            </Button>
          </Box>
        </Box>

        {/* Invoice Card */}
        <Card elevation={0} sx={{ border: 1, borderColor: 'divider', mb: 3 }}>
          <CardContent sx={{ p: 4 }}>
            {/* Invoice Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4 }}>
              <Box>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  {invoice.template?.companyName || 'Your Company'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.template?.companyAddress || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.template?.companyEmail || ''}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {invoice.template?.companyPhone || ''}
                </Typography>
              </Box>
              <Box sx={{ textAlign: 'right' }}>
                <Typography variant="h5" fontWeight={700} color="primary.main" gutterBottom>
                  INVOICE
                </Typography>
                <Typography variant="body2">
                  <strong>Invoice #:</strong> {invoice.invoiceNumber}
                </Typography>
                <Typography variant="body2">
                  <strong>Date:</strong> {formatDate(invoice.date || invoice.createdAt)}
                </Typography>
                <Chip
                  label={invoice.status}
                  size="small"
                  color={invoice.status === 'PAID' ? 'success' : 'default'}
                  sx={{ mt: 1 }}
                />
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Customer Details */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                BILL TO
              </Typography>
              <Typography variant="h6" fontWeight={600}>
                {invoice.customerName}
              </Typography>
              {invoice.customerEmail && (
                <Typography variant="body2" color="text.secondary">
                  {invoice.customerEmail}
                </Typography>
              )}
              {invoice.customerPhone && (
                <Typography variant="body2" color="text.secondary">
                  {invoice.customerPhone}
                </Typography>
              )}
              {invoice.customerAddress && (
                <Typography variant="body2" color="text.secondary">
                  {invoice.customerAddress}
                </Typography>
              )}
            </Box>

            {/* Items Table */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell><strong>Item</strong></TableCell>
                    <TableCell align="right"><strong>Quantity</strong></TableCell>
                    <TableCell align="right"><strong>Unit Price</strong></TableCell>
                    <TableCell align="right"><strong>Total</strong></TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {invoice.items?.map((item: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell>
                        <Typography variant="body2" fontWeight={500}>
                          {item.productName}
                        </Typography>
                        {item.sku && (
                          <Typography variant="caption" color="text.secondary">
                            SKU: {item.sku}
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">{item.quantity}</TableCell>
                      <TableCell align="right">{formatCurrency(item.unitPrice)}</TableCell>
                      <TableCell align="right">{formatCurrency(item.total)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Totals */}
            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Box sx={{ minWidth: 300 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="body2">Subtotal:</Typography>
                  <Typography variant="body2">{formatCurrency(invoice.subtotal)}</Typography>
                </Box>
                {invoice.taxRate > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Tax ({invoice.taxRate}%):</Typography>
                    <Typography variant="body2">{formatCurrency(invoice.tax)}</Typography>
                  </Box>
                )}
                {invoice.discount > 0 && (
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2">Discount:</Typography>
                    <Typography variant="body2">-{formatCurrency(invoice.discount)}</Typography>
                  </Box>
                )}
                <Divider sx={{ my: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                  <Typography variant="h6" fontWeight={700}>Total:</Typography>
                  <Typography variant="h6" fontWeight={700} color="primary.main">
                    {formatCurrency(invoice.total)}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Notes */}
            {invoice.notes && (
              <Box sx={{ mt: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  NOTES
                </Typography>
                <Typography variant="body2">{invoice.notes}</Typography>
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>
    </MainLayout>
  );
}
