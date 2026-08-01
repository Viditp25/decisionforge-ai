import React from 'react';
import { BarChart3, Database, Cpu, Play, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardProps {
  user: any;
  stats: {
    datasetsCount: number;
    modelsCount: number;
    runsCount: number;
    successRate: number;
  };
  recentRuns: any[];
  onViewChange: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, stats, recentRuns, onViewChange }) => {
  // Mock chart data for premium aesthetics
  const chartData = [
    { name: 'Run 1', latency: 450, accuracy: 92 },
    { name: 'Run 2', latency: 320, accuracy: 95 },
    { name: 'Run 3', latency: 510, accuracy: 89 },
    { name: 'Run 4', latency: 280, accuracy: 97 },
    { name: 'Run 5', latency: 390, accuracy: 94 },
    { name: 'Run 6', latency: 310, accuracy: 96 },
    { name: 'Run 7', latency: 250, accuracy: 98 },
  ];

  return (
    <div style={styles.container}>
      {/* Welcome Hero */}
      <div className="glass-card" style={styles.welcomeHero}>
        <div style={styles.welcomeLeft}>
          <span className="badge badge-running" style={{ marginBottom: '12px' }}>Operational Control Room</span>
          <h1 style={styles.welcomeTitle}>Welcome back, {user.first_name}</h1>
          <p style={styles.welcomeSubtitle}>
            Workspace context initialized for **{user.organization_id ? 'Apex Logistics Workspace' : 'Personal Org'}**. Solver engines are ready.
          </p>
        </div>
        <div style={styles.quickActions}>
          <button className="btn btn-primary" onClick={() => onViewChange('runs')}>
            <Play size={16} />
            <span>Launch New Run</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div style={styles.statsGrid}>
        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statIconContainer(user.organization_id ? '#8b5cf6' : '#6366f1')}>
            <Database size={20} color="#ffffff" />
          </div>
          <div>
            <div style={styles.statLabel}>Registered Datasets</div>
            <div style={styles.statValue}>{stats.datasetsCount}</div>
          </div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statIconContainer('#06b6d4')}>
            <Cpu size={20} color="#ffffff" />
          </div>
          <div>
            <div style={styles.statLabel}>Active Solver Models</div>
            <div style={styles.statValue}>{stats.modelsCount}</div>
          </div>
        </div>

        <div className="glass-card" style={styles.statCard}>
          <div style={styles.statIconContainer('#10b981')}>
            <BarChart3 size={20} color="#ffffff" />
          </div>
          <div>
            <div style={styles.statLabel}>Total Executions</div>
            <div style={styles.statValue}>{stats.runsCount}</div>
          </div>
        </div>

        <div className="glass-card" style={statCardGlowStyle}>
          <div style={styles.statIconContainer('#f59e0b')}>
            <CheckCircle2 size={20} color="#ffffff" />
          </div>
          <div>
            <div style={styles.statLabel}>Avg Success Rate</div>
            <div style={styles.statValue}>{stats.successRate}%</div>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={styles.mainGrid}>
        {/* Analytics Chart */}
        <div className="glass-card" style={styles.chartPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Solver Latency Performance</h3>
            <span style={styles.panelHeaderSub}>Recent 7 optimization cycles (ms)</span>
          </div>
          <div style={styles.chartContainer}>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <YAxis stroke="var(--text-muted)" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--bg-surface)', borderColor: 'var(--border-color)', borderRadius: '8px' }}
                  labelStyle={{ color: '#ffffff' }}
                />
                <Area type="monotone" dataKey="latency" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#colorLatency)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Runs */}
        <div className="glass-card" style={styles.runsPanel}>
          <div style={styles.panelHeader}>
            <h3 style={styles.panelTitle}>Recent Run Executions</h3>
            <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => onViewChange('runs')}>
              View All
            </button>
          </div>
          <div style={styles.runsList}>
            {recentRuns.length === 0 ? (
              <div style={styles.emptyRuns}>
                <RefreshCw size={24} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                <p>No recent executions triggered yet.</p>
              </div>
            ) : (
              recentRuns.slice(0, 4).map((run) => (
                <div key={run.id} style={styles.runRow}>
                  <div style={styles.runRowLeft}>
                    {run.status === 'SUCCESS' ? (
                      <CheckCircle2 size={16} color="var(--accent-emerald)" />
                    ) : run.status === 'FAILED' ? (
                      <AlertTriangle size={16} color="var(--accent-rose)" />
                    ) : (
                      <RefreshCw size={16} className="spinner" color="var(--accent-cyan)" />
                    )}
                    <div>
                      <div style={styles.runName}>Run-{run.id.substring(0, 8)}</div>
                      <div style={styles.runMeta}>{run.run_type} • {new Date(run.created_at).toLocaleTimeString()}</div>
                    </div>
                  </div>
                  <span className={`badge badge-${run.status.toLowerCase()}`}>
                    {run.status}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const statCardGlowStyle = {
  background: 'var(--bg-surface-glass)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(16, 185, 129, 0.25)',
  borderRadius: 'var(--radius-lg)',
  padding: '24px',
  boxShadow: '0 0 15px rgba(16, 185, 129, 0.05)',
  display: 'flex',
  alignItems: 'center',
  gap: '16px',
  transition: 'var(--transition)',
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  welcomeHero: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.1) 0%, rgba(9, 9, 11, 0.7) 100%)',
    borderLeft: '4px solid var(--accent-purple)',
  },
  welcomeLeft: {},
  welcomeTitle: {
    fontSize: '28px',
    fontWeight: '700',
    marginBottom: '6px',
  },
  welcomeSubtitle: {
    color: 'var(--text-secondary)',
    fontSize: '14px',
  },
  quickActions: {},
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
    gap: '20px',
  },
  statCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
  },
  statIconContainer: (color: string) => ({
    width: '40px',
    height: '40px',
    borderRadius: '10px',
    backgroundColor: color,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: `0 4px 10px ${color}30`,
  }),
  statLabel: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  statValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#ffffff',
  },
  mainGrid: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '20px',
  },
  chartPanel: {
    minHeight: '340px',
  },
  panelHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  panelTitle: {
    fontSize: '16px',
    fontWeight: '600',
  },
  panelHeaderSub: {
    fontSize: '12px',
    color: 'var(--text-secondary)',
  },
  chartContainer: {
    marginTop: '10px',
  },
  runsPanel: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  runsList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '12px',
    flex: 1,
    justifyContent: 'center',
  },
  emptyRuns: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: '13px',
    padding: '20px 0',
  },
  runRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px',
    borderRadius: 'var(--radius)',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
  },
  runRowLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  runName: {
    fontSize: '13px',
    fontWeight: '600',
  },
  runMeta: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
};
