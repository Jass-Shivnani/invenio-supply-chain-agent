'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  InputAdornment,
} from '@mui/material';
import { Save, ArrowBack, CloudUpload } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import MainLayout from '@/components/MainLayout';

export default function TemplateSettingsPage() {
  const router = useRouter();
  
  // Company Information
  const [companyName, setCompanyName] = useState('Invenio Trading Co.');
  const [companyAddress, setCompanyAddress] = useState('Shop No. 123, MG Road\nBangalore, Karnataka - 560001');
  const [companyEmail, setCompanyEmail] = useState('info@invenio.in');
  const [companyPhone, setCompanyPhone] = useState('+91 98765 43210');
  const [companyWebsite, setCompanyWebsite] = useState('www.invenio.in');
  
  // GST & Tax Details
  const [gstin, setGstin] = useState('29ABCDE1234F1Z5');
  const [pan, setPan] = useState('ABCDE1234F');
  const [stateCode, setStateCode] = useState('29');
  const [defaultGstRate, setDefaultGstRate] = useState(18);
  const [cgstEnabled, setCgstEnabled] = useState(true);
  const [sgstEnabled, setSgstEnabled] = useState(true);
  const [igstEnabled, setIgstEnabled] = useState(false);
  
  // Bank Details
  const [bankName, setBankName] = useState('State Bank of India');
  const [accountNumber, setAccountNumber] = useState('1234567890');
  const [ifscCode, setIfscCode] = useState('SBIN0001234');
  const [upiId, setUpiId] = useState('invenio@oksbi');
  
  // Template Design
  const [primaryColor, setPrimaryColor] = useState('#6750A4');
  const [logoUrl, setLogoUrl] = useState('');
  const [showBankDetails, setShowBankDetails] = useState(true);
  const [showTerms, setShowTerms] = useState(true);
  const [termsText, setTermsText] = useState('1. Payment due within 30 days\n2. Goods once sold cannot be returned\n3. Subject to Bangalore jurisdiction');

  const handleSave = () => {
    const template = {
      company: {
        name: companyName,
        address: companyAddress,
        email: companyEmail,
        phone: companyPhone,
        website: companyWebsite,
      },
      gst: {
        gstin,
        pan,
        stateCode,
        defaultRate: defaultGstRate,
        cgstEnabled,
        sgstEnabled,
        igstEnabled,
      },
      bank: {
        name: bankName,
        accountNumber,
        ifscCode,
        upiId,
      },
      design: {
        primaryColor,
        logoUrl,
        showBankDetails,
        showTerms,
        termsText,
      },
    };
    
    // Save to localStorage for now
    localStorage.setItem('invoiceTemplate', JSON.stringify(template));
    alert('Template settings saved successfully!');
  };

  return (
    <MainLayout>
      <Box>
        {/* Header */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Button startIcon={<ArrowBack />} onClick={() => router.push('/invoices')}>
              Back
            </Button>
            <Box>
              <Typography variant="h4" fontWeight={700}>
                Invoice Template Settings
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Configure your business details and invoice preferences
              </Typography>
            </Box>
          </Box>
          <Button variant="contained" startIcon={<Save />} onClick={handleSave} size="large">
            Save Settings
          </Button>
        </Box>

        <Alert severity="info" sx={{ mb: 3 }}>
          These settings will be used as default values for all new invoices. You can customize individual invoices during creation.
        </Alert>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Company Information */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Company Information
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Company Name"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  fullWidth
                  required
                />
                <TextField
                  label="Complete Address"
                  value={companyAddress}
                  onChange={(e) => setCompanyAddress(e.target.value)}
                  fullWidth
                  multiline
                  rows={3}
                  required
                  helperText="Include shop/office number, street, city, state, and PIN code"
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Email"
                    type="email"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="Phone Number"
                    value={companyPhone}
                    onChange={(e) => setCompanyPhone(e.target.value)}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="Website (Optional)"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                  fullWidth
                />
                <TextField
                  label="Logo URL (Optional)"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  fullWidth
                  placeholder="https://example.com/logo.png"
                  InputProps={{
                    endAdornment: <InputAdornment position="end"><CloudUpload /></InputAdornment>,
                  }}
                />
              </Box>
            </CardContent>
          </Card>

          {/* GST & Tax Details */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                GST & Tax Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                  <TextField
                    label="GSTIN"
                    value={gstin}
                    onChange={(e) => setGstin(e.target.value.toUpperCase())}
                    fullWidth
                    required
                    helperText="15-digit GST Number"
                    inputProps={{ maxLength: 15 }}
                  />
                  <TextField
                    label="PAN"
                    value={pan}
                    onChange={(e) => setPan(e.target.value.toUpperCase())}
                    fullWidth
                    required
                    helperText="10-digit PAN"
                    inputProps={{ maxLength: 10 }}
                  />
                  <TextField
                    label="State Code"
                    value={stateCode}
                    onChange={(e) => setStateCode(e.target.value)}
                    fullWidth
                    required
                    helperText="e.g., 29 for Karnataka"
                    inputProps={{ maxLength: 2 }}
                  />
                </Box>
                
                <TextField
                  label="Default GST Rate (%)"
                  type="number"
                  value={defaultGstRate}
                  onChange={(e) => setDefaultGstRate(parseFloat(e.target.value) || 0)}
                  fullWidth
                  helperText="Standard rate: 5%, 12%, 18%, or 28%"
                />

                <Box>
                  <Typography variant="subtitle2" gutterBottom>
                    Tax Components
                  </Typography>
                  <FormControlLabel
                    control={<Switch checked={cgstEnabled} onChange={(e) => setCgstEnabled(e.target.checked)} />}
                    label="Enable CGST (Central GST)"
                  />
                  <FormControlLabel
                    control={<Switch checked={sgstEnabled} onChange={(e) => setSgstEnabled(e.target.checked)} />}
                    label="Enable SGST (State GST)"
                  />
                  <FormControlLabel
                    control={<Switch checked={igstEnabled} onChange={(e) => setIgstEnabled(e.target.checked)} />}
                    label="Enable IGST (Integrated GST) - For interstate"
                  />
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Bank Details */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Bank Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Bank Name"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  fullWidth
                />
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                  <TextField
                    label="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    fullWidth
                  />
                  <TextField
                    label="IFSC Code"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    fullWidth
                  />
                </Box>
                <TextField
                  label="UPI ID"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  fullWidth
                  helperText="For digital payments"
                />
              </Box>
            </CardContent>
          </Card>

          {/* Template Design */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Invoice Design
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
                <TextField
                  label="Primary Brand Color"
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  fullWidth
                />
                
                <Divider sx={{ my: 1 }} />
                
                <FormControlLabel
                  control={<Switch checked={showBankDetails} onChange={(e) => setShowBankDetails(e.target.checked)} />}
                  label="Show Bank Details on Invoice"
                />
                <FormControlLabel
                  control={<Switch checked={showTerms} onChange={(e) => setShowTerms(e.target.checked)} />}
                  label="Show Terms & Conditions"
                />
                
                {showTerms && (
                  <TextField
                    label="Terms & Conditions"
                    value={termsText}
                    onChange={(e) => setTermsText(e.target.value)}
                    fullWidth
                    multiline
                    rows={4}
                    helperText="Enter each term on a new line"
                  />
                )}
              </Box>
            </CardContent>
          </Card>

          {/* Save Button */}
          <Card elevation={0} sx={{ border: 1, borderColor: 'divider', bgcolor: 'primary.main' }}>
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                  <Typography variant="h6" fontWeight={600} color="white">
                    Ready to save?
                  </Typography>
                  <Typography variant="body2" color="white" sx={{ opacity: 0.9 }}>
                    Your settings will be applied to all new invoices
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSave}
                  size="large"
                  sx={{
                    bgcolor: 'white',
                    color: 'primary.main',
                    '&:hover': { bgcolor: 'grey.100' },
                  }}
                >
                  Save Settings
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </MainLayout>
  );
}
