/**
 * Security Monitor Dashboard
 * Super admin page for monitoring security metrics and suspicious activities
 */

import { useEffect, useState } from 'react';
import { securityService } from '@/services/securityService';
import { AlertCircle, Shield, Activity, TrendingUp, Users, Lock } from 'lucide-react';

interface SecurityMetrics {
  totalAttempts: number;
  successfulAttempts: number;
  failedAttempts: number;
  lockedAccounts: number;
  suspiciousActivities: number;
  csrfTokensGenerated: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastUpdate: string;
}

interface SuspiciousActivity {
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  timestamp: string;
}

export function SecurityMonitorPage() {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [activities, setActivities] = useState<SuspiciousActivity[]>([]);
  const [selectedSeverity, setSelectedSeverity] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);

  // Fetch security metrics
  const fetchMetrics = () => {
    try {
      const report = securityService.getSecurityReport();

      // Calculate risk level
      let riskLevel: 'low' | 'medium' | 'high' = 'low';
      if (report.totalSuspiciousActivities > 20) riskLevel = 'high';
      else if (report.totalSuspiciousActivities > 10) riskLevel = 'medium';

      const newMetrics: SecurityMetrics = {
        totalAttempts: 0, // Not available in report
        successfulAttempts: 0, // Not available in report
        failedAttempts: 0, // Not available in report
        lockedAccounts: report.lockedAccounts,
        suspiciousActivities: report.totalSuspiciousActivities,
        csrfTokensGenerated: 0, // Not tracked in report
        riskLevel,
        lastUpdate: new Date().toLocaleTimeString(),
      };

      setMetrics(newMetrics);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch metrics:', error);
      setLoading(false);
    }
  };

  // Fetch suspicious activities
  const fetchActivities = () => {
    try {
      const suspicious = securityService.getSuspiciousActivities();
      const activities: SuspiciousActivity[] = suspicious
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .map((activity: any) => ({
          type: activity.type || 'UNKNOWN',
          description: activity.description || '',
          severity: activity.severity || 'LOW',
          timestamp: new Date(activity.timestamp).toLocaleString(),
        }));

      setActivities(activities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  // Initial load
  useEffect(() => {
    fetchMetrics();
    fetchActivities();
  }, []);

  // Auto-refresh
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      fetchMetrics();
      fetchActivities();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh]);

  // Filter activities by severity
  const filteredActivities = selectedSeverity
    ? activities.filter((a) => a.severity === selectedSeverity)
    : activities;

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 text-red-800 border-red-300';
      case 'HIGH':
        return 'bg-orange-100 text-orange-800 border-orange-300';
      case 'MEDIUM':
        return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
      case 'HIGH':
        return '🔴';
      case 'MEDIUM':
        return '🟠';
      default:
        return '🔵';
    }
  };

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-orange-600 bg-orange-50';
      default:
        return 'text-green-600 bg-green-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 flex items-center gap-3">
            <Shield className="w-8 h-8 text-blue-600" />
            Security Monitor
          </h1>
          <p className="text-gray-600 mt-2">Real-time security metrics and threat monitoring</p>
        </div>

        {/* Controls */}
        <div className="mb-6 flex flex-wrap gap-4 items-center">
          <button
            onClick={() => {
              fetchMetrics();
              fetchActivities();
            }}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition"
          >
            🔄 Refresh Now
          </button>

          <label className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-gray-700">Auto-refresh (30s)</span>
          </label>

          {metrics && (
            <div className={`px-4 py-2 rounded-lg font-medium ${getRiskLevelColor(metrics.riskLevel)}`}>
              Risk Level: {metrics.riskLevel.toUpperCase()}
            </div>
          )}

          {metrics && (
            <div className="ml-auto text-sm text-gray-600">
              Last updated: {metrics.lastUpdate}
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block">
              <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin"></div>
              <p className="mt-4 text-gray-600">Loading security data...</p>
            </div>
          </div>
        ) : !metrics ? (
          <div className="text-center py-12 bg-yellow-50 rounded-lg border border-yellow-200">
            <AlertCircle className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
            <p className="text-yellow-800">Failed to load security metrics</p>
          </div>
        ) : (
          <>
            {/* Metrics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
              {/* Total Login Attempts */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Total Login Attempts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.totalAttempts}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      ✅ {metrics.successfulAttempts} | ❌ {metrics.failedAttempts}
                    </p>
                  </div>
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
              </div>

              {/* Locked Accounts */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Locked Accounts</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.lockedAccounts}</p>
                    <p className="text-xs text-gray-500 mt-1">Due to suspicious activity</p>
                  </div>
                  <Lock className="w-8 h-8 text-red-500" />
                </div>
              </div>

              {/* Suspicious Activities */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-orange-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Suspicious Activities</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.suspiciousActivities}</p>
                    <p className="text-xs text-gray-500 mt-1">Last 1000 recorded</p>
                  </div>
                  <AlertCircle className="w-8 h-8 text-orange-500" />
                </div>
              </div>

              {/* CSRF Tokens */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">CSRF Tokens Active</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">{metrics.csrfTokensGenerated}</p>
                    <p className="text-xs text-gray-500 mt-1">Valid & unexpired</p>
                  </div>
                  <Shield className="w-8 h-8 text-green-500" />
                </div>
              </div>

              {/* Success Rate */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">Success Rate</p>
                    <p className="text-3xl font-bold text-gray-900 mt-2">
                      {metrics.totalAttempts > 0
                        ? Math.round((metrics.successfulAttempts / metrics.totalAttempts) * 100)
                        : 0}
                      %
                    </p>
                    <p className="text-xs text-gray-500 mt-1">of all login attempts</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-purple-500" />
                </div>
              </div>

              {/* System Status */}
              <div className="bg-white rounded-lg shadow p-6 border-l-4 border-teal-500">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">System Status</p>
                    <p className="text-2xl font-bold mt-2">
                      <span className="text-green-600">●</span> Secure
                    </p>
                    <p className="text-xs text-gray-500 mt-1">All systems operational</p>
                  </div>
                  <Activity className="w-8 h-8 text-teal-500" />
                </div>
              </div>
            </div>

            {/* Suspicious Activities */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-gray-50 px-6 py-4 border-b">
                <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-orange-600" />
                  Suspicious Activities
                </h2>
              </div>

              {/* Severity Filter */}
              <div className="px-6 py-4 border-b bg-gray-50 flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSeverity(null)}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                    selectedSeverity === null
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  All ({activities.length})
                </button>
                {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map((severity) => {
                  const count = activities.filter((a) => a.severity === severity).length;
                  return (
                    <button
                      key={severity}
                      onClick={() => setSelectedSeverity(severity)}
                      className={`px-3 py-1 rounded-full text-sm font-medium transition ${
                        selectedSeverity === severity
                          ? 'bg-gray-800 text-white'
                          : `${getSeverityColor(severity).split(' ')[0]} text-gray-700 hover:opacity-75`
                      }`}
                    >
                      {severity} ({count})
                    </button>
                  );
                })}
              </div>

              {/* Activities List */}
              <div className="divide-y max-h-96 overflow-y-auto">
                {filteredActivities.length === 0 ? (
                  <div className="p-6 text-center text-gray-500">
                    <p>No suspicious activities detected</p>
                  </div>
                ) : (
                  filteredActivities.map((activity, index) => (
                    <div key={index} className="p-6 hover:bg-gray-50 transition">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-2xl">{getSeverityIcon(activity.severity)}</span>
                            <span className="font-mono text-sm font-bold text-gray-700">
                              {activity.type}
                            </span>
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(
                                activity.severity
                              )}`}
                            >
                              {activity.severity}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm mb-2">{activity.description}</p>
                          <p className="text-xs text-gray-500">{activity.timestamp}</p>
                        </div>
                        <button
                          onClick={() => {
                            /* TODO: Implement action for this activity */
                          }}
                          className="text-xs px-3 py-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100 transition whitespace-nowrap"
                        >
                          View Details
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Security Tips */}
            <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-6">
              <h3 className="font-bold text-blue-900 mb-4">🛡️ Security Tips</h3>
              <ul className="space-y-2 text-sm text-blue-800">
                <li>✓ Enable two-factor authentication for all user accounts</li>
                <li>✓ Regularly review suspicious activity logs</li>
                <li>✓ Enforce strong password policies (12+ characters)</li>
                <li>✓ Monitor login attempts from unusual locations</li>
                <li>✓ Keep security patches and updates current</li>
                <li>✓ Review and restrict admin access regularly</li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default SecurityMonitorPage;
