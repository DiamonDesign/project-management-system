/**
 * Monitoring Dashboard Component
 * Real-time monitoring dashboard for application health and performance
 */

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Server,
  Users,
  Zap,
  TrendingUp,
  TrendingDown,
  Wifi,
  Database,
  Globe,
  Shield,
  RefreshCw
} from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'unhealthy';
  message: string;
  timestamp: number;
  responseTime: number;
}

interface SystemHealth {
  api: HealthStatus;
  database: HealthStatus;
  cache: HealthStatus;
  cdn: HealthStatus;
  monitoring: HealthStatus;
  overall: HealthStatus;
}

interface PerformanceMetric {
  timestamp: number;
  value: number;
  label: string;
}

interface CoreWebVitals {
  lcp: number;
  fid: number;
  cls: number;
  fcp: number;
  ttfb: number;
  rating: 'good' | 'needs-improvement' | 'poor';
}

interface ErrorData {
  message: string;
  count: number;
  lastOccurred: number;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

const MonitoringDashboard: React.FC = () => {
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceMetric[]>([]);
  const [coreWebVitals, setCoreWebVitals] = useState<CoreWebVitals | null>(null);
  const [recentErrors, setRecentErrors] = useState<ErrorData[]>([]);
  const [activeUsers, setActiveUsers] = useState<number>(0);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // Fetch monitoring data
  useEffect(() => {
    fetchMonitoringData();
    const interval = setInterval(fetchMonitoringData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchMonitoringData = async () => {
    setIsRefreshing(true);
    try {
      // In a real application, these would be separate API calls
      const [healthData, perfData, vitalsData, errorsData, usersData] = await Promise.all([
        fetchSystemHealth(),
        fetchPerformanceData(),
        fetchCoreWebVitals(),
        fetchRecentErrors(),
        fetchActiveUsers()
      ]);

      setSystemHealth(healthData);
      setPerformanceData(perfData);
      setCoreWebVitals(vitalsData);
      setRecentErrors(errorsData);
      setActiveUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch monitoring data:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'healthy': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'unhealthy': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'degraded': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'unhealthy': return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default: return <Activity className="h-4 w-4 text-gray-600" />;
    }
  };

  const getRatingColor = (rating: string): string => {
    switch (rating) {
      case 'good': return 'bg-green-500';
      case 'needs-improvement': return 'bg-yellow-500';
      case 'poor': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (!systemHealth) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span>Loading monitoring data...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Monitoring</h2>
          <p className="text-muted-foreground">Real-time application health and performance</p>
        </div>
        <Button
          onClick={fetchMonitoringData}
          disabled={isRefreshing}
          size="sm"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* System Health Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Object.entries(systemHealth).map(([service, health]) => (
          <Card key={service} className="relative">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium capitalize">
                {service === 'api' ? 'API' : service}
              </CardTitle>
              {getStatusIcon(health.status)}
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${getStatusColor(health.status)}`}>
                {formatDuration(health.responseTime)}
              </div>
              <p className="text-xs text-muted-foreground capitalize">
                {health.status}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {systemHealth.overall.status !== 'healthy' && (
        <Alert variant={systemHealth.overall.status === 'unhealthy' ? 'destructive' : 'default'}>
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>System Status: {systemHealth.overall.status}</AlertTitle>
          <AlertDescription>{systemHealth.overall.message}</AlertDescription>
        </Alert>
      )}

      {/* Tabs for different monitoring views */}
      <Tabs defaultValue="performance" className="space-y-6">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="vitals">Core Web Vitals</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
          <TabsTrigger value="infrastructure">Infrastructure</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Response Time Trend</CardTitle>
                <CardDescription>Last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="timestamp" tickFormatter={(ts) => new Date(ts).toLocaleTimeString()} />
                    <YAxis />
                    <Tooltip labelFormatter={(ts) => new Date(ts as number).toLocaleString()} />
                    <Line type="monotone" dataKey="value" stroke="#8884d8" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-4 w-4 mr-2" />
                    Active Users
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">{activeUsers.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">Currently online</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-4 w-4 mr-2" />
                    Avg Response Time
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    {performanceData.length > 0
                      ? formatDuration(performanceData.reduce((acc, curr) => acc + curr.value, 0) / performanceData.length)
                      : '0ms'
                    }
                  </div>
                  <p className="text-xs text-muted-foreground">Last 24 hours</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* Core Web Vitals Tab */}
        <TabsContent value="vitals" className="space-y-6">
          {coreWebVitals && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Largest Contentful Paint</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(coreWebVitals.lcp)}</div>
                  <Progress value={Math.min((coreWebVitals.lcp / 2500) * 100, 100)} className="mt-2" />
                  <Badge className={getRatingColor(coreWebVitals.rating)} variant="secondary">
                    {coreWebVitals.rating}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">First Input Delay</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(coreWebVitals.fid)}</div>
                  <Progress value={Math.min((coreWebVitals.fid / 100) * 100, 100)} className="mt-2" />
                  <Badge className={getRatingColor(coreWebVitals.rating)} variant="secondary">
                    {coreWebVitals.rating}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Cumulative Layout Shift</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{coreWebVitals.cls.toFixed(3)}</div>
                  <Progress value={Math.min((coreWebVitals.cls / 0.1) * 100, 100)} className="mt-2" />
                  <Badge className={getRatingColor(coreWebVitals.rating)} variant="secondary">
                    {coreWebVitals.rating}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">First Contentful Paint</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(coreWebVitals.fcp)}</div>
                  <Progress value={Math.min((coreWebVitals.fcp / 1800) * 100, 100)} className="mt-2" />
                  <Badge className={getRatingColor(coreWebVitals.rating)} variant="secondary">
                    {coreWebVitals.rating}
                  </Badge>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm">Time to First Byte</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{formatDuration(coreWebVitals.ttfb)}</div>
                  <Progress value={Math.min((coreWebVitals.ttfb / 800) * 100, 100)} className="mt-2" />
                  <Badge className={getRatingColor(coreWebVitals.rating)} variant="secondary">
                    {coreWebVitals.rating}
                  </Badge>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Errors Tab */}
        <TabsContent value="errors" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Recent Errors</CardTitle>
                <CardDescription>Last 24 hours</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {recentErrors.map((error, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={error.severity === 'critical' ? 'destructive' : 'secondary'}
                        >
                          {error.severity}
                        </Badge>
                        <div>
                          <p className="font-medium text-sm">{error.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(error.lastOccurred).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline">{error.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={recentErrors}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                    >
                      {recentErrors.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Analytics</CardTitle>
              <CardDescription>Real-time user behavior and engagement</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">User analytics dashboard coming soon</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Infrastructure Tab */}
        <TabsContent value="infrastructure">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Server</CardTitle>
                <Server className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Online</div>
                <p className="text-xs text-muted-foreground">99.9% uptime</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Database</CardTitle>
                <Database className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Healthy</div>
                <p className="text-xs text-muted-foreground">15ms avg query</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">CDN</CardTitle>
                <Globe className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Active</div>
                <p className="text-xs text-muted-foreground">Global distribution</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Security</CardTitle>
                <Shield className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">Secure</div>
                <p className="text-xs text-muted-foreground">No threats detected</p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Mock API functions (replace with real API calls)
async function fetchSystemHealth(): Promise<SystemHealth> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    api: { status: 'healthy', message: 'All endpoints responding', timestamp: Date.now(), responseTime: 45 },
    database: { status: 'healthy', message: 'Connection pool healthy', timestamp: Date.now(), responseTime: 12 },
    cache: { status: 'healthy', message: 'Redis responding', timestamp: Date.now(), responseTime: 8 },
    cdn: { status: 'healthy', message: 'Global distribution active', timestamp: Date.now(), responseTime: 23 },
    monitoring: { status: 'healthy', message: 'All systems monitored', timestamp: Date.now(), responseTime: 15 },
    overall: { status: 'healthy', message: 'All systems operational', timestamp: Date.now(), responseTime: 45 }
  };
}

async function fetchPerformanceData(): Promise<PerformanceMetric[]> {
  await new Promise(resolve => setTimeout(resolve, 100));

  const data = [];
  const now = Date.now();
  for (let i = 23; i >= 0; i--) {
    data.push({
      timestamp: now - (i * 60 * 60 * 1000),
      value: Math.random() * 100 + 20,
      label: `${i}h ago`
    });
  }
  return data;
}

async function fetchCoreWebVitals(): Promise<CoreWebVitals> {
  await new Promise(resolve => setTimeout(resolve, 100));

  return {
    lcp: 1200 + Math.random() * 800,
    fid: 50 + Math.random() * 30,
    cls: Math.random() * 0.15,
    fcp: 800 + Math.random() * 400,
    ttfb: 200 + Math.random() * 300,
    rating: 'good'
  };
}

async function fetchRecentErrors(): Promise<ErrorData[]> {
  await new Promise(resolve => setTimeout(resolve, 100));

  return [
    { message: 'Network timeout error', count: 12, lastOccurred: Date.now() - 1000 * 60 * 30, severity: 'medium' },
    { message: 'Form validation failed', count: 8, lastOccurred: Date.now() - 1000 * 60 * 45, severity: 'low' },
    { message: 'Database connection lost', count: 3, lastOccurred: Date.now() - 1000 * 60 * 60 * 2, severity: 'high' },
  ];
}

async function fetchActiveUsers(): Promise<number> {
  await new Promise(resolve => setTimeout(resolve, 100));
  return Math.floor(Math.random() * 1000) + 250;
}

export default MonitoringDashboard;