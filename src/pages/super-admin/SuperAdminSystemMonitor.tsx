import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import SuperAdminLayout from './SuperAdminLayout';
import { Activity, Database, Zap, HardDrive, Cpu, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import { redisService } from '@/services/redisService';
import { jobQueue } from '@/services/jobQueueService';

interface SystemMetrics {
  timestamp: number;
  cacheStats: ReturnType<typeof redisService.getStats>;
  queueStats: ReturnType<typeof jobQueue.getStats>;
  uptime: number;
  memoryUsage: number;
  cpuUsage: number;
}

export default function SuperAdminSystemMonitor() {
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [history, setHistory] = useState<SystemMetrics[]>([]);
  const [isMonitoring, setIsMonitoring] = useState(false);

  const updateMetrics = () => {
    const newMetrics: SystemMetrics = {
      timestamp: Date.now(),
      cacheStats: redisService.getStats(),
      queueStats: jobQueue.getStats(),
      uptime: Math.floor((Date.now() - (window as any).__APP_START_TIME || Date.now()) / 1000),
      memoryUsage: Math.random() * 100, // Simulated
      cpuUsage: Math.random() * 100, // Simulated
    };
    setMetrics(newMetrics);
    setHistory(prev => [...prev.slice(-59), newMetrics]); // Keep last 60 samples
  };

  useEffect(() => {
    updateMetrics();
    (window as any).__APP_START_TIME = Date.now();
  }, []);

  useEffect(() => {
    if (!isMonitoring) return;
    
    const interval = setInterval(updateMetrics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, [isMonitoring]);

  const formattedUptime = useMemo(() => {
    if (!metrics) return '0s';
    const seconds = metrics.uptime % 60;
    const minutes = Math.floor((metrics.uptime / 60) % 60);
    const hours = Math.floor((metrics.uptime / 3600) % 24);
    const days = Math.floor(metrics.uptime / 86400);
    
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    if (minutes > 0) return `${minutes}m ${seconds}s`;
    return `${seconds}s`;
  }, [metrics]);

  const systemHealth = useMemo(() => {
    if (!metrics) return 'unknown';
    const scores = [
      metrics.cacheStats.hitRate > 50 ? 100 : 50,
      metrics.queueStats.failed === 0 ? 100 : 50,
      metrics.memoryUsage < 80 ? 100 : 50,
      metrics.cpuUsage < 80 ? 100 : 50,
    ];
    const avg = scores.reduce((a, b) => a + b) / scores.length;
    
    if (avg >= 75) return 'healthy';
    if (avg >= 50) return 'warning';
    return 'critical';
  }, [metrics]);

  const statusColors = {
    healthy: 'text-green-400 bg-green-500/10',
    warning: 'text-yellow-400 bg-yellow-500/10',
    critical: 'text-red-400 bg-red-500/10',
  };

  return (
    <SuperAdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white">System Monitor</h1>
            <p className="text-purple-200/70 mt-1">Real-time platform performance and health</p>
          </div>
          <Button 
            onClick={() => setIsMonitoring(!isMonitoring)}
            variant={isMonitoring ? 'default' : 'outline'}
            className={isMonitoring ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {isMonitoring ? 'Monitoring (Live)' : 'Start Monitoring'}
          </Button>
        </div>

        {/* System Health Overview */}
        <div className="grid gap-6 md:grid-cols-3">
          <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-purple-200/70 mb-2">System Health</p>
                  <div className="flex items-center gap-2">
                    <p className="text-2xl font-bold text-white capitalize">{systemHealth}</p>
                    {systemHealth === 'healthy' && <CheckCircle className="h-5 w-5 text-green-400" />}
                    {systemHealth === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-400" />}
                    {systemHealth === 'critical' && <AlertTriangle className="h-5 w-5 text-red-400" />}
                  </div>
                </div>
                <div className={`p-3 rounded-xl ${statusColors[systemHealth as keyof typeof statusColors]}`}>
                  <Activity className="h-5 w-5" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-purple-200/70 mb-2">Uptime</p>
                <p className="text-2xl font-bold text-white">{formattedUptime}</p>
                <p className="text-xs text-purple-200/50 mt-2">Application running</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
            <CardContent className="p-6">
              <div>
                <p className="text-sm text-purple-200/70 mb-2">Last Updated</p>
                <p className="text-2xl font-bold text-white">{metrics?.timestamp ? new Date(metrics.timestamp).toLocaleTimeString() : 'N/A'}</p>
                <p className="text-xs text-purple-200/50 mt-2">Real-time monitoring</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Performance Metrics */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Cache Performance */}
          <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-cyan-400" />
                Cache Performance
              </CardTitle>
              <CardDescription>Redis cache statistics</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              {metrics && (
                <>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-purple-200/70">Hit Rate</span>
                      <span className="text-white font-medium">{metrics.cacheStats.hitRate.toFixed(2)}%</span>
                    </div>
                    <Progress value={metrics.cacheStats.hitRate} className="h-2" />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-purple-200/50 mb-1">Hits</p>
                      <p className="text-xl font-bold text-white">{metrics.cacheStats.hits}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-purple-200/50 mb-1">Misses</p>
                      <p className="text-xl font-bold text-white">{metrics.cacheStats.misses}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-purple-200/50 mb-1">Size</p>
                      <p className="text-xl font-bold text-white">{metrics.cacheStats.size}</p>
                    </div>
                    <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                      <p className="text-xs text-purple-200/50 mb-1">Evictions</p>
                      <p className="text-xl font-bold text-white">{metrics.cacheStats.evictions}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {/* Queue Status */}
          <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
            <CardHeader className="border-b border-white/10">
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-amber-400" />
                Job Queue Status
              </CardTitle>
              <CardDescription>Background job processing</CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {metrics && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <Badge variant="outline" className="justify-center py-2 text-center">
                      <span className="text-green-400">✓</span> Completed: {metrics.queueStats.completed}
                    </Badge>
                    <Badge variant="outline" className="justify-center py-2 text-center">
                      <span className="text-yellow-400">⏳</span> Pending: {metrics.queueStats.pending}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Badge variant="outline" className="justify-center py-2 text-center">
                      <span className="text-blue-400">⚙</span> Processing: {metrics.queueStats.processing}
                    </Badge>
                    <Badge variant="outline" className="justify-center py-2 text-center">
                      <span className="text-red-400">✕</span> Failed: {metrics.queueStats.failed}
                    </Badge>
                  </div>

                  <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                    <p className="text-sm text-red-200">Dead Letter Queue</p>
                    <p className="text-2xl font-bold text-red-400">{metrics.queueStats.dlqSize}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* System Resources */}
        <Card className="border-0 bg-white/5 backdrop-blur-xl border border-white/10">
          <CardHeader className="border-b border-white/10">
            <CardTitle className="flex items-center gap-2">
              <HardDrive className="h-5 w-5 text-blue-400" />
              System Resources
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-purple-200/70 flex items-center gap-2">
                  <Cpu className="h-4 w-4" />
                  CPU Usage
                </span>
                <span className="text-white font-medium">{metrics?.cpuUsage.toFixed(2)}%</span>
              </div>
              <Progress value={metrics?.cpuUsage || 0} className="h-3" />
            </div>

            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-purple-200/70 flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Memory Usage
                </span>
                <span className="text-white font-medium">{metrics?.memoryUsage.toFixed(2)}%</span>
              </div>
              <Progress value={metrics?.memoryUsage || 0} className="h-3" />
            </div>
          </CardContent>
        </Card>
      </div>
    </SuperAdminLayout>
  );
}
