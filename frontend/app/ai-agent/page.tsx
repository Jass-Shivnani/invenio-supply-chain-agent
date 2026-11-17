'use client';

import { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  IconButton,
  CircularProgress,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Tooltip,
  Divider,
  Slider,
  Stack,
} from '@mui/material';
import {
  AutoAwesome,
  Send,
  Warning,
  CheckCircle,
  SwapHoriz,
  ShoppingCart,
  Speed,
  Shield,
  Psychology,
  Refresh,
  RestartAlt,
  Warehouse,
  Storefront,
  LocalShipping,
  ShowChart,
  Settings,
  ArrowForward,
  TrendingUp,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agenticAI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AIAgentPage() {
  const [apiKey, setApiKey] = useState('');
  const [openSettingsDialog, setOpenSettingsDialog] = useState(false);
  const [isLiveLlmMode, setIsLiveLlmMode] = useState(false);
  const [selectedSkuForChart, setSelectedSkuForChart] = useState('SKU-YOGURT-04');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent'; text: string; mode?: string }>>([
    {
      sender: 'agent',
      text: 'Invenio Autonomous Inventory Copilot online. Actively monitoring Bhiwandi Central Hub (WH-A), Turbhe Cold Hub (WH-B), and Chembur Retail Store (ST-C). All nodes synchronized.',
      mode: 'COGNITIVE_COPILOT',
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [vendorBDelay, setVendorBDelay] = useState(0.0);
  const [serviceZ, setServiceZ] = useState(1.645);
  const [actionNotice, setActionNotice] = useState<{ severity: 'success' | 'info' | 'error'; message: string } | null>(null);

  const queryClient = useQueryClient();

  // 1. Live Agent State
  const { data: agentState, isLoading, refetch } = useQuery({
    queryKey: ['agenticState', serviceZ],
    queryFn: () => agenticAI.getState(serviceZ).then((res) => res.data),
    refetchInterval: 10000,
  });

  // 2. Live Agent Activity & Audit Feed ("Where & Why")
  const { data: auditFeedData, refetch: refetchAudit } = useQuery({
    queryKey: ['auditFeed'],
    queryFn: () => agenticAI.getAuditFeed(15).then((res) => res.data),
    refetchInterval: 6000,
  });

  // 3. Selected SKU Demand History
  const { data: demandHistoryData } = useQuery({
    queryKey: ['demandHistory', selectedSkuForChart],
    queryFn: () => agenticAI.getDemandHistory(selectedSkuForChart).then((res) => res.data),
  });

  // 4. Live Supplier Delay Simulation (What-If Stress Test)
  const { data: simulationData } = useQuery({
    queryKey: ['supplierSimulation', vendorBDelay, serviceZ],
    queryFn: () =>
      agenticAI
        .simulate({
          service_level_z: serviceZ,
          simulated_delays: { 'SKU-MILK-01': { 'VEN-B': vendorBDelay } },
        })
        .then((res) => res.data),
  });

  const milkSimReport = simulationData?.sku_reports?.find((s: any) => s.sku === 'SKU-MILK-01');
  const simVendors = milkSimReport?.vendor_intelligence?.all_vendors || [];
  const selectedVendor = milkSimReport?.vendor_intelligence?.selected_vendor;

  // 4. Mutations
  const rebalanceMutation = useMutation({
    mutationFn: () => agenticAI.executeRebalance(),
    onSuccess: (res) => {
      setActionNotice({ severity: 'success', message: res.data.message });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['auditFeed'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      setActionNotice({ severity: 'error', message: 'Inter-hub shift failed.' });
    },
  });

  const autoRestockMutation = useMutation({
    mutationFn: () => agenticAI.autoRestock(serviceZ),
    onSuccess: (res) => {
      setActionNotice({ severity: 'success', message: res.data.message });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['auditFeed'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: () => {
      setActionNotice({ severity: 'error', message: 'Restock dispatch failed.' });
    },
  });

  const cognitiveCycleMutation = useMutation({
    mutationFn: () => agenticAI.triggerCognitiveCycle(apiKey, serviceZ),
    onSuccess: (res) => {
      setActionNotice({
        severity: 'success',
        message: `Autonomous Cognitive Cycle Executed via ${res.data.engine_mode}. Executed ${res.data.decisions_executed?.length || 0} autonomous actions.`,
      });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['auditFeed'] });
    },
  });

  const resetDbMutation = useMutation({
    mutationFn: () => agenticAI.resetDb(),
    onSuccess: () => {
      setActionNotice({ severity: 'info', message: 'Inventory network reset to benchmark baseline.' });
      queryClient.invalidateQueries();
    },
  });

  const handleSaveApiKey = async () => {
    if (!apiKey.trim()) return;
    try {
      await agenticAI.configureKey(apiKey.trim());
      setIsLiveLlmMode(true);
      setActionNotice({ severity: 'success', message: 'Gemini 2.5 Flash API Key activated. Cognitive agent is ready.' });
      setOpenSettingsDialog(false);
    } catch {
      setActionNotice({ severity: 'error', message: 'Failed to activate Gemini API Key.' });
    }
  };

  const handleSendMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    const newHistory = [...chatHistory, { sender: 'user' as const, text: textToSend }];
    setChatHistory(newHistory);
    if (!msgText) setChatInput('');
    setChatLoading(true);

    try {
      const res = await agenticAI.chat(textToSend, apiKey || undefined);
      setChatHistory([
        ...newHistory,
        {
          sender: 'agent' as const,
          text: res.data.reply,
          mode: res.data.mode,
        },
      ]);
    } catch {
      setChatHistory([
        ...newHistory,
        {
          sender: 'agent' as const,
          text: 'Autonomous copilot temporarily unavailable. Operating on local telemetry.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const kpis = agentState?.kpis || {
    total_skus_monitored: 8,
    high_stockout_risk_skus: 2,
    projected_service_level_pct: 98.5,
    net_cost_and_penalty_saved: 17643.0,
    total_units_in_network: 1710,
  };

  const auditFeed = auditFeedData?.auditFeed || [];

  return (
    <ProtectedRoute>
      <MainLayout>
        <Box sx={{ p: { xs: 2, md: 3 }, maxWidth: 1600, mx: 'auto' }}>
          {/* Header Strip */}
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
                <AutoAwesome sx={{ color: '#7c3aed', fontSize: 32 }} />
                <Typography variant="h5" sx={{ fontWeight: 700, letterSpacing: '-0.02em' }}>
                  Autonomous Inventory Command Center
                </Typography>
                <Chip
                  icon={<Psychology />}
                  label={isLiveLlmMode ? 'Gemini 2.5 Flash' : 'Quantitative Core (Autonomous)'}
                  size="small"
                  color={isLiveLlmMode ? 'success' : 'primary'}
                  variant="outlined"
                  sx={{ fontWeight: 600 }}
                />
              </Box>
              <Typography variant="body2" color="text.secondary">
                Live multi-hub orchestration: Bhiwandi Mega Hub (WH-A) • Turbhe Cold Hub (WH-B) • Chembur Retail (ST-C)
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              <Button
                variant="outlined"
                size="small"
                startIcon={<Settings />}
                onClick={() => setOpenSettingsDialog(true)}
              >
                Model Settings
              </Button>
              <Button
                variant="outlined"
                size="small"
                startIcon={<RestartAlt />}
                onClick={() => resetDbMutation.mutate()}
                disabled={resetDbMutation.isPending}
              >
                Reset Baseline
              </Button>
              <Button
                variant="contained"
                size="small"
                startIcon={<Speed />}
                onClick={() => cognitiveCycleMutation.mutate()}
                disabled={cognitiveCycleMutation.isPending}
                sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
              >
                {cognitiveCycleMutation.isPending ? 'Executing...' : 'Run Autonomous Cycle'}
              </Button>
            </Box>
          </Box>

          {/* Action Notice Banner */}
          {actionNotice && (
            <Alert
              severity={actionNotice.severity}
              onClose={() => setActionNotice(null)}
              sx={{ mb: 3, borderRadius: 2 }}
            >
              {actionNotice.message}
            </Alert>
          )}

          {/* Executive KPI Visual Strip */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: 'repeat(4, 1fr)' },
              gap: 2,
              mb: 3,
            }}
          >
            <Card sx={{ borderRadius: 3, border: '1px solid #fee2e2', bgcolor: '#fff5f5' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#dc2626', textTransform: 'uppercase' }}>
                    Stockout Risk Deficits
                  </Typography>
                  <Warning sx={{ color: '#dc2626', fontSize: 20 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#991b1b' }}>
                  {kpis.high_stockout_risk_skus} <Typography component="span" variant="body2" sx={{ color: '#dc2626' }}>SKUs</Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#7f1d1d' }}>
                  Pasteurized Milk (2.4d) & Greek Yogurt Surge
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #dcfce7', bgcolor: '#f0fdf4' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#16a34a', textTransform: 'uppercase' }}>
                    Capital & Loss Protected
                  </Typography>
                  <Shield sx={{ color: '#16a34a', fontSize: 20 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#14532d' }}>
                  ₹{Number(kpis.net_cost_and_penalty_saved).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                </Typography>
                <Typography variant="caption" sx={{ color: '#166534' }}>
                  Saved via inter-hub transfer & SLA routing
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #e0e7ff', bgcolor: '#eef2ff' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#4f46e5', textTransform: 'uppercase' }}>
                    Network Service Level
                  </Typography>
                  <Speed sx={{ color: '#4f46e5', fontSize: 20 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#312e81' }}>
                  {kpis.projected_service_level_pct}%
                </Typography>
                <Typography variant="caption" sx={{ color: '#3730a3' }}>
                  Target: 95.0% • Volatility safety buffered
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ borderRadius: 3, border: '1px solid #f3e8ff', bgcolor: '#faf5ff' }}>
              <CardContent sx={{ p: 2.5 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                  <Typography variant="caption" sx={{ fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase' }}>
                    Active Network Stock
                  </Typography>
                  <Warehouse sx={{ color: '#7c3aed', fontSize: 20 }} />
                </Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#581c87' }}>
                  {Number(kpis.total_units_in_network).toLocaleString('en-IN')} <Typography component="span" variant="body2" sx={{ color: '#7c3aed' }}>units</Typography>
                </Typography>
                <Typography variant="caption" sx={{ color: '#6b21a8' }}>
                  Balanced across 3 distribution hubs
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Interactive Multi-Hub Visual Flow Strip */}
          <Card sx={{ borderRadius: 3, mb: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warehouse sx={{ color: '#2563eb' }} /> Multi-Hub Distribution Network
                </Typography>
                <Chip label="Real-time Inventory Balance" size="small" sx={{ bgcolor: '#eff6ff', color: '#1d4ed8', fontWeight: 600 }} />
              </Box>

              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr auto 1fr auto 1fr' },
                  alignItems: 'center',
                  gap: 2,
                }}
              >
                {/* Node WH-A */}
                <Box sx={{ p: 2, border: '1px solid #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>WH-A: Bhiwandi Central Hub</Typography>
                    <Chip label="Mega Reserve" size="small" sx={{ bgcolor: '#e2e8f0', fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">Capacity: 1,240 / 2,000 units</Typography>
                  <LinearProgress variant="determinate" value={62} sx={{ my: 1, height: 6, borderRadius: 3, bgcolor: '#e2e8f0' }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#16a34a' }}>✓ Surplus Stock Available</Typography>
                    <Typography variant="caption" color="text.secondary">Bay 1-8</Typography>
                  </Box>
                </Box>

                {/* Transfer Arrow A -> B */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', px: 1 }}>
                  <Chip
                    icon={<SwapHoriz sx={{ fontSize: '1rem !important' }} />}
                    label="TR-201: 50u Atta"
                    size="small"
                    color="secondary"
                    sx={{ mb: 0.5, fontWeight: 600 }}
                  />
                  <ArrowForward sx={{ color: '#7c3aed', fontSize: 24 }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>4h Local Transit</Typography>
                </Box>

                {/* Node WH-B */}
                <Box sx={{ p: 2, border: '1px solid #bfdbfe', borderRadius: 2, bgcolor: '#f0f9ff' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>WH-B: Turbhe Cold Hub</Typography>
                    <Chip label="Cold Chain" size="small" color="info" sx={{ fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">Capacity: 280 / 800 units</Typography>
                  <LinearProgress variant="determinate" value={35} color="warning" sx={{ my: 1, height: 6, borderRadius: 3 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#0284c7' }}>Rebalanced via WH-A</Typography>
                    <Typography variant="caption" color="text.secondary">Rack 12</Typography>
                  </Box>
                </Box>

                {/* Transfer Arrow B -> C */}
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', px: 1 }}>
                  <ArrowForward sx={{ color: '#0ea5e9', fontSize: 24 }} />
                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.68rem' }}>Daily Dispatch</Typography>
                </Box>

                {/* Node ST-C */}
                <Box sx={{ p: 2, border: '1px solid #cbd5e1', borderRadius: 2, bgcolor: '#f8fafc' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>ST-C: Chembur Retail Store</Typography>
                    <Chip label="Direct POS" size="small" sx={{ bgcolor: '#e2e8f0', fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">Capacity: 190 / 300 units</Typography>
                  <LinearProgress variant="determinate" value={63} color="success" sx={{ my: 1, height: 6, borderRadius: 3 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ fontWeight: 600, color: '#16a34a' }}>Active Walk-in Sales</Typography>
                    <Typography variant="caption" color="text.secondary">POS 1 & 2</Typography>
                  </Box>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* Core Operations Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 3,
              mb: 3,
            }}
          >
            {/* Action Card 1: Shift Surplus Stock */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <SwapHoriz sx={{ color: '#7c3aed' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Shift Surplus Stock Between Hubs
                    </Typography>
                  </Box>
                  <Chip label="Zero Supplier Cost" size="small" color="success" sx={{ fontWeight: 600 }} />
                </Box>

                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Chakki Fresh Whole Wheat Atta (10kg)
                    </Typography>
                    <Chip label="50 Units" size="small" sx={{ bgcolor: '#ede9fe', color: '#6d28d9', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    • Source: <b>Bhiwandi Central Hub (Bay 4)</b> (Holds 195 units, 80u safety buffer)
                    <br />
                    • Destination: <b>Turbhe Cold Hub (Rack 12)</b> (Stock 35 units, runout in 0.8 days)
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                      Savings: ₹15,025 vs supplier spot purchase
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Transit: ₹475 (4 hrs)</Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<LocalShipping />}
                  onClick={() => rebalanceMutation.mutate()}
                  disabled={rebalanceMutation.isPending}
                  sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, py: 1.2, fontWeight: 600 }}
                >
                  {rebalanceMutation.isPending ? 'Executing Transfer...' : 'Authorize Inter-Hub Stock Shift (TR-201)'}
                </Button>
              </CardContent>
            </Card>

            {/* Action Card 2: Authorize Supplier Restock */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShoppingCart sx={{ color: '#2563eb' }} />
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Authorize Urgent Supplier Restock
                    </Typography>
                  </Box>
                  <Chip label="Critical SLA Shield" size="small" color="error" sx={{ fontWeight: 600 }} />
                </Box>

                <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', mb: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      Pasteurized Full-Cream Milk (1L Pack)
                    </Typography>
                    <Chip label="PO-1024: 200u" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontWeight: 700 }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                    • Selected: <b>Vendor B (Amul Express Cold-Chain)</b> @ ₹55/unit (2.0-day SLA)
                    <br />
                    • Rejected: Vendor A (Govind Dairy) due to 5.0-day delivery delay risking total stockout
                  </Typography>
                  <Divider sx={{ my: 1 }} />
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: '#16a34a', fontWeight: 600 }}>
                      Penalty Defended: ₹2,618 avoided
                    </Typography>
                    <Typography variant="caption" color="text.secondary">Total Cost: ₹11,000</Typography>
                  </Box>
                </Box>

                <Button
                  variant="contained"
                  fullWidth
                  startIcon={<ShoppingCart />}
                  onClick={() => autoRestockMutation.mutate()}
                  disabled={autoRestockMutation.isPending}
                  sx={{ bgcolor: '#2563eb', '&:hover': { bgcolor: '#1d4ed8' }, py: 1.2, fontWeight: 600 }}
                >
                  {autoRestockMutation.isPending ? 'Authorizing...' : 'Authorize Purchase Orders for Risk SKUs'}
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* Interactive Stress Test & Demand Radar Grid */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 3,
              mb: 3,
            }}
          >
            {/* Live Supplier Disruption Simulator */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Speed sx={{ color: '#ea580c' }} /> What-If Supplier Delay Simulator
                  </Typography>
                  <Chip
                    label={vendorBDelay > 0 ? `+${vendorBDelay.toFixed(1)}d Disruption Simulated` : 'Baseline SLA (2.0d)'}
                    size="small"
                    color={vendorBDelay >= 1.5 ? 'warning' : 'default'}
                    sx={{ fontWeight: 600, fontSize: '0.72rem' }}
                  />
                </Box>

                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Drag slider to test vendor reliability shocks (e.g. transport strike or cold-chain breakdown on Amul):
                </Typography>

                <Box sx={{ px: 2, mb: 2 }}>
                  <Slider
                    value={vendorBDelay}
                    min={0.0}
                    max={3.0}
                    step={0.5}
                    marks={[
                      { value: 0, label: '0d Normal' },
                      { value: 1, label: '+1d' },
                      { value: 2, label: '+2d Drift' },
                      { value: 3, label: '+3d Strike' },
                    ]}
                    onChange={(_, val) => setVendorBDelay(val as number)}
                    sx={{ color: vendorBDelay >= 1.5 ? '#ea580c' : '#2563eb' }}
                  />
                </Box>

                {/* Disruption Alert or Optimal Selection */}
                {vendorBDelay >= 1.5 ? (
                  <Alert severity="warning" sx={{ mb: 2, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                      🚨 Amul Express Delivery Drift ({ (2.0 + vendorBDelay).toFixed(1) } days) exceeds 2.4-day runout horizon!
                    </Typography>
                    <Typography variant="caption">
                      Agent dynamically demoted Amul and selected <b>Vendor C (Mother Dairy Metro Direct)</b> with 2.5-day guaranteed SLA to prevent stockout.
                    </Typography>
                  </Alert>
                ) : (
                  <Alert severity="success" sx={{ mb: 2, borderRadius: 2 }}>
                    <Typography variant="caption" sx={{ fontWeight: 700, display: 'block' }}>
                      ✓ Vendor B (Amul Express Cold-Chain) Ranked #1
                    </Typography>
                    <Typography variant="caption">
                      2.0-day SLA delivers before the 2.4-day depletion window. Protects ₹2,618 in stockout penalty.
                    </Typography>
                  </Alert>
                )}

                {/* Supplier Comparison Mini Table */}
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Supplier</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Lead Time</TableCell>
                      <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Price</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Agent Utility</TableCell>
                      <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 700 }}>Routing</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {simVendors.map((v: any) => (
                      <TableRow key={v.vendor_id} hover selected={v.selected}>
                        <TableCell sx={{ fontSize: '0.75rem', fontWeight: v.selected ? 700 : 500 }}>
                          {v.vendor_name}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                          {v.effective_lead_time_days}d
                        </TableCell>
                        <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 600 }}>
                          ₹{v.unit_price}
                        </TableCell>
                        <TableCell align="center" sx={{ fontSize: '0.75rem' }}>
                          {(v.utility_score * 100).toFixed(0)}%
                        </TableCell>
                        <TableCell align="center">
                          {v.selected ? (
                            <Chip label="Selected" size="small" color="success" sx={{ fontSize: '0.65rem', height: 18, fontWeight: 700 }} />
                          ) : (
                            <Chip label="Backup" size="small" sx={{ fontSize: '0.65rem', height: 18 }} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Demand Radar & Anomaly Surge Visualizer */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShowChart sx={{ color: '#7c3aed' }} /> Demand Radar & Anomaly Burst
                  </Typography>
                  <Chip label="Holt-Winters (α=0.45, β=0.25)" size="small" sx={{ bgcolor: '#f5f3ff', color: '#6d28d9', fontSize: '0.68rem', fontWeight: 600 }} />
                </Box>

                {/* SKU Selector Pills */}
                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 2 }}>
                  {[
                    { id: 'SKU-YOGURT-04', label: 'Greek Yogurt (+308% Promo Spike)' },
                    { id: 'SKU-MILK-01', label: 'Full-Cream Milk (50u/d Steady)' },
                    { id: 'SKU-OIL-05', label: 'Sunflower Oil (High Volatility)' },
                    { id: 'SKU-WHEAT-03', label: 'Whole Wheat Atta (40u/d)' },
                  ].map((s) => (
                    <Chip
                      key={s.id}
                      label={s.label}
                      size="small"
                      clickable
                      onClick={() => setSelectedSkuForChart(s.id)}
                      color={selectedSkuForChart === s.id ? 'primary' : 'default'}
                      variant={selectedSkuForChart === s.id ? 'filled' : 'outlined'}
                      sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                    />
                  ))}
                </Box>

                {/* SVG Responsive Demand Chart */}
                <Box sx={{ width: '100%', height: 170, bgcolor: '#f8fafc', borderRadius: 2, p: 1, border: '1px solid #e2e8f0', position: 'relative' }}>
                  {demandHistoryData?.series && demandHistoryData.series.length > 0 ? (
                    <svg viewBox="0 0 540 140" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                      {/* Grid Lines */}
                      <line x1="30" y1="20" x2="520" y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="60" x2="520" y2="60" stroke="#e2e8f0" strokeDasharray="3 3" />
                      <line x1="30" y1="100" x2="520" y2="100" stroke="#e2e8f0" strokeDasharray="3 3" />

                      {/* Render 14 Historical Bars */}
                      {demandHistoryData.series.slice(0, 14).map((pt: any, idx: number) => {
                        const val = pt.historical || 0;
                        const maxVal = Math.max(...demandHistoryData.series.map((p: any) => p.historical || p.forecast || 50), 100);
                        const h = (val / maxVal) * 90;
                        const x = 35 + idx * 22;
                        const y = 110 - h;
                        const isPromo = pt.promo;

                        return (
                          <g key={idx}>
                            <rect
                              x={x}
                              y={y}
                              width={14}
                              height={h}
                              rx={2}
                              fill={isPromo ? '#ea580c' : '#8b5cf6'}
                            />
                            {isPromo && idx === 13 && (
                              <text x={x - 15} y={y - 8} fontSize="9" fontWeight="bold" fill="#ea580c">
                                +308% Burst
                              </text>
                            )}
                          </g>
                        );
                      })}

                      {/* Render 7 Forecast Points (D+1 to D+7) */}
                      {demandHistoryData.series.slice(14).map((pt: any, idx: number) => {
                        const val = pt.forecast || 0;
                        const maxVal = Math.max(...demandHistoryData.series.map((p: any) => p.historical || p.forecast || 50), 100);
                        const h = (val / maxVal) * 90;
                        const x = 360 + idx * 22;
                        const y = 110 - h;

                        return (
                          <g key={idx}>
                            <circle cx={x + 7} cy={y} r={3.5} fill="#2563eb" />
                            {idx < 6 && (
                              <line
                                x1={x + 7}
                                y1={y}
                                x2={x + 29}
                                y2={110 - (demandHistoryData.series[15 + idx]?.forecast / maxVal) * 90}
                                stroke="#2563eb"
                                strokeDasharray="3 2"
                                strokeWidth="2"
                              />
                            )}
                          </g>
                        );
                      })}

                      {/* Axis Labels */}
                      <text x="35" y="128" fontSize="9" fill="#64748b">Day 1</text>
                      <text x="180" y="128" fontSize="9" fill="#64748b">Day 7</text>
                      <text x="310" y="128" fontSize="9" fill="#ea580c" fontWeight="bold">Day 14 (Promo)</text>
                      <text x="440" y="128" fontSize="9" fill="#2563eb" fontWeight="bold">D+1..D+7 Forecast</text>
                    </svg>
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      <CircularProgress size={20} />
                    </Box>
                  )}
                </Box>

                {/* Key Insights Chips */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5 }}>
                  <Typography variant="caption" sx={{ color: '#64748b' }}>
                    Historical Baseline: <b>25.0 u/d</b>
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#ea580c', fontWeight: 700 }}>
                    Surge Peak: <b>102.0 u/d</b> (Z = 68.25)
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#2563eb', fontWeight: 700 }}>
                    Projected 7D: <b>102.0 u/d</b>
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Live Decision Feed & Copilot */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' },
              gap: 3,
            }}
          >
            {/* Live Activity & Decision Feed ("Where & Why") */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Shield sx={{ color: '#16a34a' }} /> Live Agent Activity & Audit Feed
                  </Typography>
                  <IconButton size="small" onClick={() => refetchAudit()}>
                    <Refresh fontSize="small" />
                  </IconButton>
                </Box>

                <Box sx={{ maxHeight: 420, overflowY: 'auto', pr: 1 }}>
                  {auditFeed.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                      No audit activities logged yet.
                    </Typography>
                  ) : (
                    auditFeed.map((item: any) => (
                      <Box
                        key={item.log_id}
                        sx={{
                          p: 1.5,
                          mb: 1.5,
                          borderRadius: 2,
                          bgcolor: item.action_type === 'STOCK_TRANSFER' ? '#faf5ff' : item.action_type === 'DEMAND_SURGE' ? '#fffbeb' : '#f0fdf4',
                          border: '1px solid',
                          borderColor: item.action_type === 'STOCK_TRANSFER' ? '#f3e8ff' : item.action_type === 'DEMAND_SURGE' ? '#fef3c7' : '#dcfce7',
                        }}
                      >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 0.5 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Chip
                              label={item.agent_name}
                              size="small"
                              sx={{ fontSize: '0.68rem', fontWeight: 700, height: 20 }}
                            />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>
                              {item.action_type.replace('_', ' ')}
                            </Typography>
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            {item.timestamp ? item.timestamp.split(' ')[1] || item.timestamp : 'Just now'}
                          </Typography>
                        </Box>

                        <Typography variant="body2" sx={{ fontSize: '0.82rem', mb: 0.5 }}>
                          {item.why_reason}
                        </Typography>

                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            📍 {item.location_from} ➔ {item.location_to}
                          </Typography>
                          {item.financial_impact > 0 && (
                            <Chip
                              label={`+₹${item.financial_impact.toLocaleString('en-IN')} Saved`}
                              size="small"
                              color="success"
                              variant="outlined"
                              sx={{ fontSize: '0.65rem', height: 18 }}
                            />
                          )}
                        </Box>
                      </Box>
                    ))
                  )}
                </Box>
              </CardContent>
            </Card>

            {/* Conversational Inventory Copilot */}
            <Card sx={{ borderRadius: 3, border: '1px solid #e2e8f0', boxShadow: 'none' }}>
              <CardContent sx={{ p: 3, display: 'flex', flexDirection: 'column', height: 500 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Psychology sx={{ color: '#7c3aed' }} /> Autonomous Inventory Copilot
                  </Typography>
                  <Chip
                    label={isLiveLlmMode ? 'Gemini 2.5 Flash' : 'Local Cognitive Engine'}
                    size="small"
                    color={isLiveLlmMode ? 'success' : 'default'}
                    sx={{ fontSize: '0.7rem' }}
                  />
                </Box>

                {/* Quick Prompts */}
                <Box sx={{ display: 'flex', gap: 0.8, flexWrap: 'wrap', mb: 1.5 }}>
                  {[
                    'Why Vendor B for Milk?',
                    'Explain Yogurt demand spike',
                    'Review Wheat transfer',
                    'Network health status',
                  ].map((p) => (
                    <Chip
                      key={p}
                      label={p}
                      size="small"
                      clickable
                      onClick={() => handleSendMessage(p)}
                      sx={{ fontSize: '0.72rem', bgcolor: '#f1f5f9' }}
                    />
                  ))}
                </Box>

                {/* Chat Message Scroll */}
                <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 1, border: '1px solid #f1f5f9', borderRadius: 2, mb: 2 }}>
                  {chatHistory.map((msg, i) => (
                    <Box
                      key={i}
                      sx={{
                        display: 'flex',
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        mb: 1.5,
                      }}
                    >
                      <Box
                        sx={{
                          maxWidth: '85%',
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: msg.sender === 'user' ? '#7c3aed' : '#f8fafc',
                          color: msg.sender === 'user' ? '#ffffff' : '#1e293b',
                          border: msg.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                        }}
                      >
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap', fontSize: '0.85rem' }}>
                          {msg.text}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
                  {chatLoading && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                      <CircularProgress size={16} sx={{ color: '#7c3aed' }} />
                      <Typography variant="caption" color="text.secondary">Copilot reasoning...</Typography>
                    </Box>
                  )}
                </Box>

                {/* Input Strip */}
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <TextField
                    size="small"
                    fullWidth
                    placeholder="Ask about inventory, supplier delays, or inter-hub rebalancing..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSendMessage();
                    }}
                  />
                  <IconButton
                    color="primary"
                    onClick={() => handleSendMessage()}
                    disabled={chatLoading || !chatInput.trim()}
                    sx={{ bgcolor: '#7c3aed', color: '#fff', '&:hover': { bgcolor: '#6d28d9' } }}
                  >
                    <Send fontSize="small" />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Model Settings Dialog */}
          <Dialog open={openSettingsDialog} onClose={() => setOpenSettingsDialog(false)} maxWidth="sm" fullWidth>
            <DialogTitle sx={{ fontWeight: 700 }}>AI Agent & LLM Configuration</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Enter your Google Gemini API Key to enable live Gemini 2.5 Flash cognitive function calling and autonomous decisions. If left empty, Invenio runs on its deterministic quantitative solver.
              </Typography>
              <TextField
                label="Google Gemini API Key"
                type="password"
                fullWidth
                size="small"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSy..."
                sx={{ mb: 2 }}
              />
              <Typography variant="caption" color="text.secondary">
                Model: <b>gemini-2.5-flash</b> • Zero-latency tool execution enabled.
              </Typography>
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={() => setOpenSettingsDialog(false)}>Cancel</Button>
              <Button variant="contained" onClick={handleSaveApiKey} sx={{ bgcolor: '#7c3aed' }}>
                Save & Activate
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </MainLayout>
    </ProtectedRoute>
  );
}
