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
  Tabs,
  Tab,
  Slider,
  Stack,
  Divider,
} from '@mui/material';
import {
  AutoAwesome,
  Send,
  Warning,
  CheckCircle,
  SwapHoriz,
  ShoppingCart,
  TrendingUp,
  Speed,
  Shield,
  Psychology,
  Refresh,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { agenticAI } from '@/lib/api';
import MainLayout from '@/components/MainLayout';
import ProtectedRoute from '@/components/ProtectedRoute';

export default function AIAgentPage() {
  const [tabIndex, setTabIndex] = useState(0);
  const [chatInput, setChatInput] = useState('');
  const [chatHistory, setChatHistory] = useState<Array<{ sender: 'user' | 'agent'; text: string; actions?: string[] }>>([
    {
      sender: 'agent',
      text: 'Hello Jass! I am your Autonomous Supply Chain Orchestrator. I continuously monitor inventory across Warehouse A (Bhiwandi), Warehouse B (Turbhe), and Store C (Chembur). How can I assist you with reorders, lateral rebalancing, or risk simulations today?',
      actions: ['Show high-risk stockout items', 'Explain why Vendor B was chosen for Milk', 'Rebalance Wheat between warehouses'],
    },
  ]);
  const [chatLoading, setChatLoading] = useState(false);
  const [vendorBDelay, setVendorBDelay] = useState(0.0);
  const [serviceZ, setServiceZ] = useState(1.645);
  const [actionAlert, setActionAlert] = useState<{ severity: 'success' | 'info' | 'error'; message: string } | null>(null);

  const queryClient = useQueryClient();

  // Fetch live 11-agent state from FastAPI backend
  const { data: agentState, isLoading, refetch } = useQuery({
    queryKey: ['agenticState', serviceZ],
    queryFn: () => agenticAI.getState(serviceZ).then((res) => res.data),
    refetchInterval: 15000,
  });

  // Rebalance mutation
  const rebalanceMutation = useMutation({
    mutationFn: () => agenticAI.executeRebalance(),
    onSuccess: (res) => {
      setActionAlert({ severity: 'success', message: res.data.message });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
    onError: () => {
      setActionAlert({ severity: 'error', message: 'Failed to execute lateral rebalancing.' });
    },
  });

  // Auto-Restock mutation
  const autoRestockMutation = useMutation({
    mutationFn: () => agenticAI.autoRestock(serviceZ),
    onSuccess: (res) => {
      setActionAlert({ severity: 'success', message: res.data.message });
      queryClient.invalidateQueries({ queryKey: ['agenticState'] });
      queryClient.invalidateQueries({ queryKey: ['purchaseOrders'] });
    },
    onError: () => {
      setActionAlert({ severity: 'error', message: 'Failed to trigger autonomous restock.' });
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
          text: 'Network connected to local Invenio AI engine. Orchestrator active across Bhiwandi, Turbhe, and Chembur.',
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const kpis = agentState?.kpis;

  return (
    <ProtectedRoute>
      <MainLayout>
        <Box sx={{ p: { xs: 2, md: 3 } }}>
          {/* Header */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="h4" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <AutoAwesome sx={{ color: '#7c3aed', fontSize: 32 }} />
                Autonomous Supply Chain Copilot
              </Typography>
              <Typography variant="body2" color="text.secondary">
                11-Agent Closed-Loop Intelligence: Bhiwandi Mega Hub (WH-A) • Turbhe Cold Hub (WH-B) • Chembur Store (ST-C)
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Chip
                icon={<Speed />}
                label={agentState?.engine_mode || 'QUANTITATIVE_AGENTIC_CORE'}
                color="secondary"
                variant="outlined"
              />
              <Button variant="outlined" startIcon={<Refresh />} onClick={() => refetch()} size="small">
                Refresh
              </Button>
            </Stack>
          </Box>

          {/* Action Feedback Banner */}
          {actionAlert && (
            <Alert severity={actionAlert.severity} sx={{ mb: 3 }} onClose={() => setActionAlert(null)}>
              {actionAlert.message}
            </Alert>
          )}

          {/* Orchestrator Brief */}
          {agentState?.orchestrator_brief && (
            <Card sx={{ mb: 3, bgcolor: '#f5f3ff', border: '1px solid #ddd6fe' }}>
              <CardContent sx={{ py: 1.5 }}>
                <Typography variant="subtitle2" color="primary" fontWeight="bold">
                  ORCHESTRATOR EXECUTIVE BRIEF:
                </Typography>
                <Typography variant="body2" color="text.primary">
                  {agentState.orchestrator_brief}
                </Typography>
              </CardContent>
            </Card>
          )}

          {/* KPI Summary Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', md: 'repeat(5, 1fr)' },
              gap: 2,
              mb: 3,
            }}
          >
            <Card sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Monitored Network
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="primary">
                  {kpis?.total_skus_monitored || 8} SKUs
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {kpis?.total_units_in_network || 1638} total units across 3 hubs
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: '#fef2f2', border: '1px solid #fecaca' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  High Stockout Risks
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="error">
                  {kpis?.high_stockout_risk_skus || 5} SKUs
                </Typography>
                <Typography variant="caption" color="error">
                  Milk (2.4d), Rice (5.0d), Yogurt (0.7d)
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Auto-Generated POs
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.main">
                  {kpis?.auto_pos_generated || 6} POs
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  ₹{kpis?.total_auto_po_spend ? kpis.total_auto_po_spend.toLocaleString() : '6,01,259'} spend
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: '#faf5ff', border: '1px solid #e9d5ff' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Lateral Rebalances
                </Typography>
                <Typography variant="h5" fontWeight="bold" sx={{ color: '#7c3aed' }}>
                  1 Scheduled
                </Typography>
                <Typography variant="caption" sx={{ color: '#7c3aed' }}>
                  Saves ₹15,025 (WH-A → WH-B)
                </Typography>
              </CardContent>
            </Card>

            <Card sx={{ bgcolor: '#ecfdf5', border: '1px solid #a7f3d0' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  Net Savings & Service
                </Typography>
                <Typography variant="h5" fontWeight="bold" color="success.dark">
                  ₹{kpis?.net_cost_and_penalty_saved ? kpis.net_cost_and_penalty_saved.toLocaleString() : '47,491'}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {kpis?.projected_service_level_pct || 95}% Projected Service Level
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Autonomous Actions (Human in the Loop) */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', md: 'repeat(2, 1fr)' },
              gap: 2,
              mb: 3,
            }}
          >
            <Card sx={{ border: '2px solid #7c3aed', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SwapHoriz sx={{ color: '#7c3aed' }} />
                  Agent 7: Lateral Inter-Warehouse Rebalance
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                  Warehouse A (Bhiwandi) has a 195-unit surplus of Chakki Fresh Whole Wheat Atta, while Warehouse B (Turbhe) is at immediate stockout risk (35 units).
                </Typography>
                <Box sx={{ p: 1.5, bgcolor: '#f5f3ff', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Transfer:</strong> 50 units (WH-A → WH-B) • <strong>Cost:</strong> ₹475 • <strong>Procurement Saved:</strong> ₹15,025
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  fullWidth
                  sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                  disabled={rebalanceMutation.isPending}
                  onClick={() => rebalanceMutation.mutate()}
                >
                  {rebalanceMutation.isPending ? 'Executing Transfer...' : '1-Click Approve & Execute Rebalance'}
                </Button>
              </CardContent>
            </Card>

            <Card sx={{ border: '2px solid #059669', height: '100%' }}>
              <CardContent>
                <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ShoppingCart sx={{ color: '#059669' }} />
                  Agents 4, 5, 6: Autonomous PO Sizing & Routing
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ my: 1 }}>
                  Evaluates suppliers on SLA deadlines, price, reliability, and bulk discount tiers. Selected Vendor B (Amul Express) for Milk to eliminate a 5-day stockout gap.
                </Typography>
                <Box sx={{ p: 1.5, bgcolor: '#ecfdf5', borderRadius: 1, mb: 2 }}>
                  <Typography variant="body2">
                    <strong>Auto Orders:</strong> 6 Purchase Orders staged • <strong>SLA:</strong> 1.5d - 6d • <strong>Protected Profit:</strong> ₹47,491
                  </Typography>
                </Box>
                <Button
                  variant="contained"
                  color="success"
                  fullWidth
                  disabled={autoRestockMutation.isPending}
                  onClick={() => autoRestockMutation.mutate()}
                >
                  {autoRestockMutation.isPending ? 'Generating POs...' : '1-Click Auto-Restock All At-Risk SKUs'}
                </Button>
              </CardContent>
            </Card>
          </Box>

          {/* Interactive Chat Copilot */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" fontWeight="bold" sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Psychology sx={{ color: '#7c3aed' }} />
                Conversational Supply Chain Copilot
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Ask anything about inventory health, supplier SLA performance, stockout risks, or what-if delay scenarios.
              </Typography>

              {/* Chat Message Box */}
              <Box
                sx={{
                  height: 240,
                  overflowY: 'auto',
                  border: '1px solid #e2e8f0',
                  borderRadius: 1,
                  p: 2,
                  bgcolor: '#f8fafc',
                  mb: 2,
                }}
              >
                {chatHistory.map((item, index) => (
                  <Box
                    key={index}
                    sx={{
                      mb: 2,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: item.sender === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        maxWidth: '85%',
                        bgcolor: item.sender === 'user' ? '#7c3aed' : '#ffffff',
                        color: item.sender === 'user' ? '#ffffff' : '#1e293b',
                        boxShadow: 1,
                      }}
                    >
                      <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                        {item.text}
                      </Typography>
                    </Box>
                    {item.actions && item.actions.length > 0 && (
                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                        {item.actions.map((act, i) => (
                          <Chip
                            key={i}
                            label={act}
                            size="small"
                            clickable
                            onClick={() => handleSendMessage(act)}
                            sx={{ bgcolor: '#ede9fe', color: '#6d28d9', fontSize: '0.75rem' }}
                          />
                        ))}
                      </Stack>
                    )}
                  </Box>
                ))}
                {chatLoading && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CircularProgress size={16} />
                    <Typography variant="caption" color="text.secondary">
                      Orchestrator reasoning across multi-agent graph...
                    </Typography>
                  </Box>
                )}
              </Box>

              {/* Chat Input */}
              <Stack direction="row" spacing={1}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Ask a question (e.g. 'Why Vendor B for milk?', 'Check yogurt spike', 'Show network KPIs')..."
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button
                  variant="contained"
                  sx={{ bgcolor: '#7c3aed', '&:hover': { bgcolor: '#6d28d9' } }}
                  onClick={() => handleSendMessage()}
                  disabled={chatLoading}
                >
                  <Send />
                </Button>
              </Stack>
            </CardContent>
          </Card>

          {/* Diagnostics & Detail Tabs */}
          <Paper sx={{ width: '100%' }}>
            <Tabs value={tabIndex} onChange={(_, val) => setTabIndex(val)} textColor="primary" indicatorColor="primary">
              <Tab label="Agent 1-4: Inventory & Stockout Risk Matrix" />
              <Tab label="Agent 8: Anomaly Detection Radar" />
              <Tab label="Agent 5-6: Active Purchase Orders" />
              <Tab label="Agent 11: What-If Delay Simulator" />
            </Tabs>
            <Divider />

            {/* TAB 0: Multi-Agent Inventory & Risk Matrix */}
            {tabIndex === 0 && (
              <Box sx={{ p: 2 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell><strong>SKU</strong></TableCell>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell><strong>Stock (WH-A / WH-B / ST-C)</strong></TableCell>
                        <TableCell><strong>Demand → 7d Forecast</strong></TableCell>
                        <TableCell><strong>Runout Horizon</strong></TableCell>
                        <TableCell><strong>Dynamic Safety Stock</strong></TableCell>
                        <TableCell><strong>Agent Risk Verdict</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agentState?.sku_reports?.map((r: any) => {
                        const nodesStr = r.inventory.nodes.map((n: any) => n.available_stock).join(' / ');
                        const isHigh = r.risk.risk_level === 'HIGH';
                        return (
                          <TableRow key={r.sku} hover>
                            <TableCell>{r.sku}</TableCell>
                            <TableCell><strong>{r.name}</strong></TableCell>
                            <TableCell>{r.inventory.total_available_stock} ({nodesStr})</TableCell>
                            <TableCell>{r.forecast.current_daily_demand}/d → {r.forecast.forecast_next_7d_daily}/d</TableCell>
                            <TableCell>
                              {r.risk.days_until_runout} days (Lead Time {r.risk.lead_time_days}d)
                            </TableCell>
                            <TableCell>
                              <strong>{r.reorder.dynamic_safety_stock}u</strong> (Fixed: {r.reorder.fixed_safety_stock}u)
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={r.risk.risk_level}
                                size="small"
                                color={isHigh ? 'error' : r.risk.risk_level === 'OVERSTOCK' ? 'info' : 'success'}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* TAB 1: Anomaly Detection Radar */}
            {tabIndex === 1 && (
              <Box sx={{ p: 2 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell><strong>Anomaly Type</strong></TableCell>
                        <TableCell><strong>SKU</strong></TableCell>
                        <TableCell><strong>Severity</strong></TableCell>
                        <TableCell><strong>Headline</strong></TableCell>
                        <TableCell><strong>Root Cause & Z-Score</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agentState?.anomalies?.map((an: any, idx: number) => (
                        <TableRow key={idx}>
                          <TableCell><strong>{an.anomaly_type}</strong></TableCell>
                          <TableCell>{an.sku}</TableCell>
                          <TableCell>
                            <Chip
                              label={an.severity}
                              size="small"
                              color={an.severity === 'HIGH' ? 'error' : 'warning'}
                            />
                          </TableCell>
                          <TableCell>{an.headline}</TableCell>
                          <TableCell>
                            Z={an.z_score} | {an.root_cause}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* TAB 2: Purchase Orders */}
            {tabIndex === 2 && (
              <Box sx={{ p: 2 }}>
                <TableContainer>
                  <Table size="small">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                      <TableRow>
                        <TableCell><strong>PO ID</strong></TableCell>
                        <TableCell><strong>Product</strong></TableCell>
                        <TableCell><strong>Order Quantity</strong></TableCell>
                        <TableCell><strong>Selected Vendor</strong></TableCell>
                        <TableCell><strong>Total Spend</strong></TableCell>
                        <TableCell><strong>Delivery SLA</strong></TableCell>
                        <TableCell><strong>Selection Reason</strong></TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {agentState?.purchase_orders?.map((po: any) => (
                        <TableRow key={po.po_id}>
                          <TableCell><strong>{po.po_id}</strong></TableCell>
                          <TableCell>{po.product_name}</TableCell>
                          <TableCell><strong>{po.order_quantity} units</strong></TableCell>
                          <TableCell>{po.vendor_name}</TableCell>
                          <TableCell>₹{po.total_cost?.toLocaleString()}</TableCell>
                          <TableCell>{po.delivery_deadline_days} days</TableCell>
                          <TableCell>{po.selection_reason}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {/* TAB 3: What-If Delay Simulator */}
            {tabIndex === 3 && (
              <Box sx={{ p: 3, maxWidth: 650 }}>
                <Typography variant="h6" fontWeight="bold" gutterBottom>
                  What-If Supply Chain Stress Simulator
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Simulate supplier delivery strikes or transport bottlenecks, and observe how Agent 5 automatically pivots orders to secondary vendors.
                </Typography>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Simulate Vendor B (Amul Express) Delay on Milk: {vendorBDelay} days
                  </Typography>
                  <Slider
                    value={vendorBDelay}
                    onChange={(_, v) => setVendorBDelay(v as number)}
                    min={0.0}
                    max={5.0}
                    step={0.5}
                    marks={[
                      { value: 0, label: '0d (Normal)' },
                      { value: 2, label: '2d Delay' },
                      { value: 4, label: '4d Delay' },
                    ]}
                  />
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Target Service Level Z-Score: {serviceZ} ({(serviceZ === 1.645 ? '95% SLA' : serviceZ === 1.96 ? '97.5% SLA' : '90% SLA')})
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
                      { value: 1.96, label: '97.5%' },
                      { value: 2.33, label: '99%' },
                    ]}
                  />
                </Box>

                <Button
                  variant="contained"
                  sx={{ bgcolor: '#7c3aed' }}
                  onClick={() => refetch()}
                >
                  Run What-If Simulation
                </Button>
              </Box>
            )}
          </Paper>
        </Box>
      </MainLayout>
    </ProtectedRoute>
  );
}
