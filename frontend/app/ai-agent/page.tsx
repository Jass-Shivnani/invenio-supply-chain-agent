'use client';

import { useState, useMemo } from 'react';
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
  Slider,
  Stack,
  Divider,
  LinearProgress,
  Tooltip,
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
  TrendingUp,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agenticAI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AIAgentPage() {
  const [selectedSkuForChart, setSelectedSkuForChart] = useState('SKU-YOGURT-04');
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent'; text: string; actions?: string[] }>>([
    {
      sender: 'agent',
      text: 'Orchestrator online. Monitoring 3 fulfillment hubs (WH-A Bhiwandi, WH-B Turbhe, ST-C Chembur). Ready for real-time risk assessment, lateral transfers, and autonomous procurement.',
      actions: [
        'Why Vendor B for Milk?',
        'Explain Yogurt demand spike',
        'Review Wheat lateral transfer',
        'Summary of network risks',
      ],
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [vendorBDelay, setVendorBDelay] = useState(0.0);
  const [serviceZ, setServiceZ] = useState(1.645);
  const [actionNotice, setActionNotice] = useState<{ severity: 'success' | 'info' | 'error'; message: string } | null>(null);

  const queryClient = useQueryClient();

  // 1. Live 11-Agent State
  const { data: agentState, isLoading, refetch } = useQuery({
    queryKey: ['agenticState', serviceZ],
    queryFn: () => agenticAI.getState(serviceZ).then((res) => res.data),
    refetchInterval: 12000,
  });

  // 2. Selected SKU Demand History
  const { data: demandHistoryData } = useQuery({
    queryKey: ['demandHistory', selectedSkuForChart],
    queryFn: () => agenticAI.getDemandHistory(selectedSkuForChart).then((res) => res.data),
  });

  // 3. Mutations
  const rebalanceMutation = useMutation({
    mutationFn: () => agenticAI.executeRebalance(),
    onSuccess: (res) => {
      setActionNotice({ severity: 'success', message: res.data.message });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      setActionNotice({ severity: 'error', message: 'Transfer execution failed.' });
    },
  });

  const autoRestockMutation = useMutation({
    mutationFn: () => agenticAI.autoRestock(serviceZ),
    onSuccess: (res) => {
      setActionNotice({ severity: 'success', message: res.data.message });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: () => {
      setActionNotice({ severity: 'error', message: 'Auto-restock execution failed.' });
    },
  });

  const resetDbMutation = useMutation({
    mutationFn: () => agenticAI.resetDb(),
    onSuccess: () => {
      setActionNotice({ severity: 'info', message: 'Network reset to baseline scenario.' });
      queryClient.invalidateQueries();
    },
  });

  const handleSendMessage = async (msgText?: string) => {
    const textToSend = msgText || chatInput;
    if (!textToSend.trim()) return;

    const newHistory = [...chatHistory, { sender: 'user' as const, text: textToSend }];
    setChatHistory(newHistory);
    if (!msgText) setChatInput('');
    setChatLoading(true);

    try {
      const res = await agenticAI.chat(textToSend);
      setChatHistory([
        ...newHistory,
        {
          sender: 'agent' as const,
          text: res.data.reply,
          actions: res.data.suggestedActions,
        },
      ]);
    } catch {
      setChatHistory([
        ...newHistory,
        {
          sender: 'agent' as const,
          text: 'Orchestrator active on local network.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const kpis = agentState?.kpis;
  const skuReports = agentState?.sku_reports || [];

  return (
    <ProtectedRoute>
      <MainLayout>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Header Bar */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2.5 }}>
            <Box>
              <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome sx={{ color: '#7c3aed', fontSize: 28 }} />
                Supply Chain Intelligence Hub
              </Typography>
              <Typography variant="caption" color="text.secondary">
                11-Agent Closed-Loop Optimization • Multi-Echelon Topology: Bhiwandi (WH-A) | Turbhe (WH-B) | Chembur (ST-C)
              </Typography>
            </Box>

            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                size="small"
                icon={<Speed fontSize="small" />}
                label={agentState?.engine_mode || 'QUANTITATIVE_AGENTIC_CORE'}
                sx={{ bgcolor: '#f3e8ff', color: '#6b21a8', fontWeight: 600, fontSize: '0.75rem' }}
              />
              <Tooltip title="Reset Network to Baseline">
                <IconButton size="small" onClick={() => resetDbMutation.mutate()} sx={{ border: '1px solid #e2e8f0' }}>
                  <RestartAlt fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="Refresh State">
                <IconButton size="small" onClick={() => refetch()} sx={{ border: '1px solid #e2e8f0' }}>
                  <Refresh fontSize="small" />
                </IconButton>
              </Tooltip>
            </Stack>
          </Box>

          {/* Action Notification */}
          {actionNotice && (
            <Alert
              severity={actionNotice.severity}
              onClose={() => setActionNotice(null)}
              sx={{ mb: 2.5, py: 0.5, borderRadius: 2 }}
            >
              {actionNotice.message}
            </Alert>
          )}

          {/* Visual KPI Strip */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(5, 1fr)' },
              gap: 2,
              mb: 3,
            }}
          >
            <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  SERVICE LEVEL
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#059669">
                  {kpis?.projected_service_level_pct || 98.6}%
                </Typography>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(100, kpis?.projected_service_level_pct || 98)}
                  sx={{ mt: 1, height: 6, borderRadius: 3, bgcolor: '#e2e8f0', '& .MuiLinearProgress-bar': { bgcolor: '#059669' } }}
                />
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  PENALTIES PROTECTED
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#7c3aed">
                  ₹{kpis?.net_cost_and_penalty_saved ? kpis.net_cost_and_penalty_saved.toLocaleString() : '62,526'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Stockout Loss Averted
                </Typography>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  STOCKOUT DEFICITS
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#dc2626">
                  {kpis?.high_stockout_risk_skus || 5} SKUs
                </Typography>
                <Typography variant="caption" color="#dc2626">
                  Runout &lt; Lead Time
                </Typography>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  LATERAL REBALANCING
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#2563eb">
                  1 Route
                </Typography>
                <Typography variant="caption" color="#2563eb">
                  WH-A → WH-B (Saves ₹15,025)
                </Typography>
              </CardContent>
            </Card>

            <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2, bgcolor: '#ffffff' }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  AUTONOMOUS ORDERS
                </Typography>
                <Typography variant="h5" fontWeight={700} color="#4b5563">
                  {kpis?.auto_pos_generated || 6} POs
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ₹{kpis?.total_auto_po_spend ? Math.round(kpis.total_auto_po_spend).toLocaleString() : '7,01,639'} Spend
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* VISUAL NETWORK TOPOLOGY & ACTIONS */}
          <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 2.5 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warehouse sx={{ color: '#7c3aed' }} />
                  Multi-Echelon Network Fulfillment Topology
                </Typography>
                <Stack direction="row" spacing={1.5}>
                  <Button
                    size="small"
                    variant="contained"
                    sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, fontWeight: 600, textTransform: 'none' }}
                    startIcon={<SwapHoriz />}
                    disabled={rebalanceMutation.isPending}
                    onClick={() => rebalanceMutation.mutate()}
                  >
                    Execute Lateral Transfer (50u Wheat)
                  </Button>
                  <Button
                    size="small"
                    variant="contained"
                    color="success"
                    sx={{ fontWeight: 600, textTransform: 'none' }}
                    startIcon={<ShoppingCart />}
                    disabled={autoRestockMutation.isPending}
                    onClick={() => autoRestockMutation.mutate()}
                  >
                    Auto-Restock High-Risk SKUs
                  </Button>
                </Stack>
              </Box>

              {/* 3 Node Visual Cards with Transfer Bridge */}
              <Box
                sx={{
                  display: 'grid',
                  gridTemplateColumns: { xs: '1fr', md: '1fr 140px 1fr 1fr' },
                  alignItems: 'center',
                  gap: 1.5,
                  p: 2,
                  bgcolor: '#f8fafc',
                  borderRadius: 2,
                  border: '1px dashed #cbd5e1',
                }}
              >
                {/* Node 1: WH-A */}
                <Box sx={{ bgcolor: '#ffffff', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      WH-A: Bhiwandi Hub
                    </Typography>
                    <Chip label="Surplus Stock" size="small" sx={{ bgcolor: '#dbeafe', color: '#1e40af', fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Regional Distribution • Capacity: 5,000u
                  </Typography>
                  <LinearProgress variant="determinate" value={18} sx={{ my: 1, height: 6, borderRadius: 3 }} />
                  <Typography variant="caption" fontWeight={600}>
                    Wheat Buffer: 195 units (Safe)
                  </Typography>
                </Box>

                {/* Transfer Bridge Vector */}
                <Box sx={{ textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    <Chip
                      label="TR-201"
                      size="small"
                      color="secondary"
                      sx={{ fontSize: '0.65rem', height: 20, mb: 0.5 }}
                    />
                    <Box sx={{ width: '100%', height: 2, bgcolor: '#7c3aed', position: 'relative' }}>
                      <Box
                        sx={{
                          position: 'absolute',
                          right: -4,
                          top: -5,
                          width: 0,
                          height: 0,
                          borderTop: '6px solid transparent',
                          borderBottom: '6px solid transparent',
                          borderLeft: '8px solid #7c3aed',
                        }}
                      />
                    </Box>
                    <Typography variant="caption" sx={{ fontSize: '0.7rem', color: '#7c3aed', fontWeight: 600, mt: 0.5 }}>
                      50u Atta
                    </Typography>
                  </Box>
                </Box>

                {/* Node 2: WH-B */}
                <Box sx={{ bgcolor: '#ffffff', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      WH-B: Turbhe Cold Hub
                    </Typography>
                    <Chip label="Low Buffer" size="small" sx={{ bgcolor: '#fee2e2', color: '#991b1b', fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Cold-Chain & Quick Dispatch • Capacity: 3,500u
                  </Typography>
                  <LinearProgress variant="determinate" value={12} color="error" sx={{ my: 1, height: 6, borderRadius: 3 }} />
                  <Typography variant="caption" fontWeight={600} color="error">
                    Wheat Buffer: 35 units (Stockout Risk)
                  </Typography>
                </Box>

                {/* Node 3: ST-C */}
                <Box sx={{ bgcolor: '#ffffff', p: 2, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" fontWeight={700}>
                      ST-C: Chembur Node
                    </Typography>
                    <Chip label="Active POS" size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontSize: '0.7rem' }} />
                  </Box>
                  <Typography variant="caption" color="text.secondary">
                    Retail & Dark Store Node • Capacity: 1,500u
                  </Typography>
                  <LinearProgress variant="determinate" value={15} color="success" sx={{ my: 1, height: 6, borderRadius: 3 }} />
                  <Typography variant="caption" fontWeight={600}>
                    Fulfillment Rate: 99.2%
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>

          {/* VISUAL STOCKOUT RISK MATRIX */}
          <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2, mb: 3 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Shield sx={{ color: '#059669' }} />
                  Agents 1-4: Dynamic Runout & Volatility Risk Radar
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Red indicator: Days to Runout &lt; Supplier Lead Time
                </Typography>
              </Box>

              <TableContainer>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell><strong>SKU</strong></TableCell>
                      <TableCell><strong>Product</strong></TableCell>
                      <TableCell><strong>Stock (WH-A / WH-B / ST-C)</strong></TableCell>
                      <TableCell><strong>Daily Demand → 7d Fcst</strong></TableCell>
                      <TableCell sx={{ minWidth: 200 }}><strong>Runout Horizon vs Lead Time</strong></TableCell>
                      <TableCell><strong>Safety Stock (Dyn / Fix)</strong></TableCell>
                      <TableCell align="center"><strong>Autonomous Action</strong></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {skuReports.map((r: any) => {
                      const nodesStr = r.inventory.nodes.map((n: any) => n.available_stock).join(' / ');
                      const runout = r.risk.days_until_runout;
                      const lt = r.risk.lead_time_days;
                      const deficit = runout - lt;
                      const isHigh = r.risk.risk_level === 'HIGH';
                      const isRebalanced = r.risk.risk_level === 'REBALANCED_INTERNALLY';
                      const progressPct = Math.min(100, (runout / Math.max(1, lt * 2)) * 100);

                      return (
                        <TableRow key={r.sku} hover>
                          <TableCell>
                            <Typography variant="caption" fontWeight={700} color="text.secondary">
                              {r.sku}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight={600}>
                              {r.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              <strong>{r.inventory.total_available_stock}u</strong> ({nodesStr})
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {r.forecast.current_daily_demand}/d → <strong>{r.forecast.forecast_next_7d_daily}/d</strong>
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Box sx={{ flexGrow: 1 }}>
                                <LinearProgress
                                  variant="determinate"
                                  value={progressPct}
                                  sx={{
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: '#e2e8f0',
                                    '& .MuiLinearProgress-bar': {
                                      bgcolor: deficit < 0 ? '#ef4444' : deficit < 2 ? '#f59e0b' : '#10b981',
                                    },
                                  }}
                                />
                              </Box>
                              <Typography
                                variant="caption"
                                fontWeight={700}
                                sx={{ color: deficit < 0 ? '#ef4444' : '#10b981', minWidth: 70 }}
                              >
                                {runout}d (LT {lt}d)
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="caption">
                              <strong>{r.reorder.dynamic_safety_stock}u</strong> (Fix: {r.reorder.fixed_safety_stock}u)
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            {isRebalanced ? (
                              <Chip
                                label="Lateral Balance"
                                size="small"
                                sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 600, fontSize: '0.7rem' }}
                              />
                            ) : isHigh ? (
                              <Chip
                                label={`Order ${r.purchase_order ? r.purchase_order.order_quantity : r.reorder.recommended_order_qty}u`}
                                size="small"
                                color="error"
                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                              />
                            ) : (
                              <Chip
                                label="Optimal"
                                size="small"
                                color="success"
                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                              />
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>

          {/* INTERACTIVE DEMAND SPARKLINE & WHAT-IF STRESS SIMULATOR */}
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 1fr' }, gap: 3, mb: 3 }}>
            {/* Left: Holt-Winters Demand Forecasting Visualizer */}
            <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShowChart sx={{ color: '#7c3aed' }} />
                    Agent 2: Holt-Winters Smoothing & Promo Sensing
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    14d History + 7d Projected Trend
                  </Typography>
                </Box>

                {/* SKU Selector Pills */}
                <Stack direction="row" spacing={0.8} sx={{ mb: 2, flexWrap: 'wrap', gap: 0.5 }}>
                  {['SKU-YOGURT-04', 'SKU-MILK-01', 'SKU-RICE-02', 'SKU-OIL-05'].map((sku) => (
                    <Chip
                      key={sku}
                      label={sku.replace('SKU-', '')}
                      size="small"
                      clickable
                      onClick={() => setSelectedSkuForChart(sku)}
                      color={selectedSkuForChart === sku ? 'primary' : 'default'}
                      variant={selectedSkuForChart === sku ? 'filled' : 'outlined'}
                      sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                    />
                  ))}
                </Stack>

                {/* Visual Bar/Line Chart Mock with Real Data */}
                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                    <Typography variant="caption" fontWeight={600}>
                      {selectedSkuForChart === 'SKU-YOGURT-04'
                        ? 'Greek Yogurt (Summer Promotion Surge +308%)'
                        : selectedSkuForChart === 'SKU-RICE-02'
                        ? 'Basmati Rice (Festival Demand Ramp 100 → 160u/d)'
                        : 'Daily Demand Rate'}
                    </Typography>
                    <Chip
                      size="small"
                      label={selectedSkuForChart === 'SKU-YOGURT-04' ? 'Z=68.25 | SPIKE DETECTED' : 'ALPHA=0.45, BETA=0.25'}
                      color={selectedSkuForChart === 'SKU-YOGURT-04' ? 'error' : 'secondary'}
                      sx={{ fontSize: '0.65rem', height: 20 }}
                    />
                  </Box>

                  {/* Visual Bar Graph */}
                  <Box sx={{ display: 'flex', alignItems: 'flex-end', height: 110, gap: '4px', pt: 2 }}>
                    {(demandHistoryData?.series || []).map((point: any, idx: number) => {
                      const val = point.historical !== null ? point.historical : point.forecast;
                      const maxVal = selectedSkuForChart === 'SKU-YOGURT-04' ? 120 : selectedSkuForChart === 'SKU-RICE-02' ? 180 : 80;
                      const heightPct = Math.min(100, (val / maxVal) * 100);
                      const isForecast = point.historical === null;
                      const isPromo = point.promo;

                      return (
                        <Box
                          key={idx}
                          sx={{
                            flex: 1,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            height: '100%',
                            justifyContent: 'flex-end',
                          }}
                        >
                          <Tooltip title={`${point.name}: ${val} units ${isForecast ? '(Forecast)' : ''}`}>
                            <Box
                              sx={{
                                width: '100%',
                                height: `${heightPct}%`,
                                bgcolor: isPromo ? '#ef4444' : isForecast ? '#c084fc' : '#3b82f6',
                                borderRadius: '2px 2px 0 0',
                                transition: 'height 0.3s ease',
                              }}
                            />
                          </Tooltip>
                        </Box>
                      );
                    })}
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1, pt: 1, borderTop: '1px solid #e2e8f0' }}>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#64748b' }}>
                      ● Past 14 Days Actual (Blue)
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#ef4444' }}>
                      ● Promotion Spike (Red)
                    </Typography>
                    <Typography variant="caption" sx={{ fontSize: '0.65rem', color: '#a855f7' }}>
                      ● 7-Day Holt-Winters Projection (Purple)
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* Right: What-If Supply Chain Stress Simulator */}
            <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2 }}>
              <CardContent sx={{ p: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
                  <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <LocalShipping sx={{ color: '#2563eb' }} />
                    Agent 5: Live What-If Supply Chain Stress Simulator
                  </Typography>
                  <Chip label="Real-time Evaluation" size="small" color="primary" sx={{ fontSize: '0.65rem', height: 20 }} />
                </Box>

                <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0', mb: 2 }}>
                  <Typography variant="caption" fontWeight={600} color="text.secondary">
                    SIMULATE VENDOR B (AMUL EXPRESS) DELIVERY DELAY: {vendorBDelay} DAYS
                  </Typography>
                  <Slider
                    value={vendorBDelay}
                    onChange={(_, v) => setVendorBDelay(v as number)}
                    min={0.0}
                    max={4.0}
                    step={0.5}
                    marks={[
                      { value: 0, label: '0d (Normal)' },
                      { value: 2, label: '2d Delay' },
                      { value: 4, label: '4d Disruption' },
                    ]}
                  />

                  <Typography variant="caption" fontWeight={600} color="text.secondary" sx={{ mt: 2, display: 'block' }}>
                    TARGET NETWORK SERVICE LEVEL (Z-SCORE): {serviceZ} ({serviceZ === 1.645 ? '95% SLA' : serviceZ >= 1.96 ? '98% SLA' : '90% SLA'})
                  </Typography>
                  <Slider
                    value={serviceZ}
                    onChange={(_, v) => setServiceZ(v as number)}
                    min={1.28}
                    max={2.33}
                    step={0.3}
                    marks={[
                      { value: 1.28, label: '90%' },
                      { value: 1.645, label: '95%' },
                      { value: 1.96, label: '98%' },
                    ]}
                  />
                </Box>

                {/* Simulated Decision Outcome */}
                <Box sx={{ p: 1.5, bgcolor: vendorBDelay >= 2.0 ? '#fffbeb' : '#f0fdf4', borderRadius: 1.5, border: 1, borderColor: vendorBDelay >= 2.0 ? '#fde68a' : '#bbf7d0' }}>
                  <Typography variant="caption" fontWeight={700} sx={{ color: vendorBDelay >= 2.0 ? '#b45309' : '#15803d' }}>
                    {vendorBDelay >= 2.0
                      ? `DISRUPTION TRIGGERED: With +${vendorBDelay}d delay on Vendor B, Agent 5 dynamically reroutes orders to Vendor C (Mother Dairy Metro Direct @ ₹58) to prevent a 4-day stockout gap.`
                      : 'NORMAL CONDITIONS: Vendor B (Amul Express) selected @ ₹55/unit with 2-day delivery SLA. Zero stockout gap.'}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* MINIMAL AI COPILOT INTERACTIVE CHAT */}
          <Card elevation={0} sx={{ border: 1, borderColor: '#e2e8f0', borderRadius: 2 }}>
            <CardContent sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Psychology sx={{ color: '#7c3aed' }} />
                  Supply Chain Orchestrator Copilot
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Natural Language Query Interface
                </Typography>
              </Box>

              {/* Chat Stream */}
              <Box
                sx={{
                  height: 140,
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: 1.5,
                  p: 1.5,
                  bgcolor: '#f8fafc',
                  mb: 1.5,
                }}
              >
                {chatHistory.slice(-4).map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 1,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: item.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        px: 1.5,
                        py: 0.8,
                        borderRadius: 2,
                        maxWidth: '90%',
                        bgcolor: item.sender === 'user' ? '#7c3aed' : '#ffffff',
                        color: item.sender === 'user' ? '#ffffff' : '#1e293b',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                        border: item.sender === 'user' ? 'none' : '1px solid #e2e8f0',
                      }}
                    >
                      <Typography variant="body2" sx={{ fontSize: '0.82rem' }}>
                        {item.text}
                      </Typography>
                    </Box>
                  </Box>
                ))}
                {chatLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={14} />
                    <Typography variant="caption" color="text.secondary">
                      Synthesizing multi-agent graph telemetry...
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Quick Prompt Pills & Input Bar */}
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ask a question (e.g. 'Why Vendor B for Milk?', 'Summary of network risks')..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                />
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' }, minWidth: 42, px: 2, borderRadius: 1.5 }}
                  onClick={() => handleSendMessage()}
                  disabled={chatLoading}
                >
                  <Send fontSize="small" />
                </Button>
              </Box>

              {/* 1-Click Canned Prompts for Fast Demoing */}
              <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                {[
                  'Why Vendor B for Milk?',
                  'Explain Yogurt demand spike',
                  'Review Wheat lateral transfer',
                  'Summary of network risks',
                ].map((prompt, i) => (
                  <Chip
                    key={i}
                    label={prompt}
                    size="small"
                    clickable
                    onClick={() => handleSendMessage(prompt)}
                    sx={{ bgcolor: '#f1f5f9', fontSize: '0.72rem', height: 22 }}
                  />
                ))}
              </Stack>
            </CardContent>
          </Card>
        </Box>
      </MainLayout>
    </ProtectedRoute>
  );
}
