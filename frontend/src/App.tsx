import { useState, useEffect, useCallback } from 'react';
import { Auth } from './components/Auth';
import { Dashboard } from './components/Dashboard';
import { Datasets } from './components/Datasets';
import { Models } from './components/Models';
import { Runs } from './components/Runs';
import { Database, Cpu, Play, LayoutDashboard, LogOut } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export default function App() {
  const [token, setToken] = useState<string | null>(localStorage.getItem('df_token'));
  const [user, setUser] = useState<any | null>(null);
  const [currentView, setCurrentView] = useState('dashboard');
  const [loading, setLoading] = useState(false);

  // Workspace Data states
  const [activeProject, setActiveProject] = useState<any | null>(null);
  const [datasets, setDatasets] = useState<any[]>([]);
  const [optModels, setOptModels] = useState<any[]>([]);
  const [simModels, setSimModels] = useState<any[]>([]);
  const [runs, setRuns] = useState<any[]>([]);

  // Fetch all workspace details (datasets, models, runs)
  const fetchWorkspaceData = useCallback(async (projectId: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // Fetch Datasets
      const dsRes = await fetch(`${API_URL}/api/v1/datasets/project/${projectId}`, { headers });
      if (dsRes.ok) setDatasets(await dsRes.json());

      // Fetch Optimization Models
      const optRes = await fetch(`${API_URL}/api/v1/optimization/models/project/${projectId}`, { headers });
      if (optRes.ok) setOptModels(await optRes.json());

      // Fetch Simulation Models
      const simRes = await fetch(`${API_URL}/api/v1/simulation/models/project/${projectId}`, { headers });
      if (simRes.ok) setSimModels(await simRes.json());

      // Fetch Runs
      const runsRes = await fetch(`${API_URL}/api/v1/explanations/project/${projectId}/runs`, { headers });
      if (runsRes.ok) {
        const runsData = await runsRes.json();
        // Sort runs by created_at desc
        runsData.sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        setRuns(runsData);
      }
    } catch (err) {
      console.error('Error loading workspace data:', err);
    }
  }, [token]);

  // Load projects and select or create the active project
  const loadProjectContext = useCallback(async (authToken: string) => {
    try {
      const headers = { 'Authorization': `Bearer ${authToken}` };
      const projRes = await fetch(`${API_URL}/api/v1/projects`, { headers });
      
      if (!projRes.ok) throw new Error('Failed to load projects');
      const projData = await projRes.json();
      
      let selectedProj = null;
      if (projData.length === 0) {
        // Create default project if none exist
        const createRes = await fetch(`${API_URL}/api/v1/projects`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: 'Operations Optimization',
            description: 'Workspace for OR-Tools vehicle routing and simulation runs'
          })
        });
        if (createRes.ok) {
          selectedProj = await createRes.json();
        }
      } else {
        selectedProj = projData[0];
      }
      
      if (selectedProj) {
        setActiveProject(selectedProj);
        fetchWorkspaceData(selectedProj.id);
      }
    } catch (err) {
      console.error('Error setting project context:', err);
    }
  }, [fetchWorkspaceData]);

  // Handle Login Success
  const handleLoginSuccess = (userToken: string, userData: any) => {
    localStorage.setItem('df_token', userToken);
    setToken(userToken);
    setUser(userData);
    loadProjectContext(userToken);
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('df_token');
    setToken(null);
    setUser(null);
    setDatasets([]);
    setOptModels([]);
    setSimModels([]);
    setRuns([]);
  };

  // Hydrate user session on mount
  useEffect(() => {
    if (!token) return;
    
    const hydrateUser = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_URL}/api/v1/auth/me`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error('Session expired');
        const data = await response.json();
        setUser(data);
        loadProjectContext(token);
      } catch (err) {
        handleLogout();
      } finally {
        setLoading(false);
      }
    };

    hydrateUser();
  }, [token, loadProjectContext]);

  // Dataset Actions
  const handleCreateDataset = async (name: string, dataType: string, content: any) => {
    if (!activeProject) return;
    const response = await fetch(`${API_URL}/api/v1/datasets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        project_id: activeProject.id,
        name,
        data_type: dataType,
        content
      })
    });
    if (response.ok) {
      fetchWorkspaceData(activeProject.id);
    } else {
      const data = await response.json();
      alert(`Error creating dataset: ${data.detail}`);
    }
  };

  const handleDeleteDataset = async (id: string) => {
    if (!activeProject) return;
    const response = await fetch(`${API_URL}/api/v1/datasets/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      fetchWorkspaceData(activeProject.id);
    }
  };

  // Model Actions
  const handleCreateOptModel = async (name: string, modelType: string, config: any, params: any) => {
    if (!activeProject) return;
    const response = await fetch(`${API_URL}/api/v1/optimization/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        project_id: activeProject.id,
        name,
        model_type: modelType,
        configuration: config,
        parameters: params
      })
    });
    if (response.ok) {
      fetchWorkspaceData(activeProject.id);
    }
  };

  const handleCreateSimModel = async (name: string, config: any, params: any) => {
    if (!activeProject) return;
    const response = await fetch(`${API_URL}/api/v1/simulation/models`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        project_id: activeProject.id,
        name,
        configuration: config,
        parameters: params
      })
    });
    if (response.ok) {
      fetchWorkspaceData(activeProject.id);
    }
  };

  const handleDeleteOptModel = async (id: string) => {
    if (!activeProject) return;
    const response = await fetch(`${API_URL}/api/v1/optimization/models/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      fetchWorkspaceData(activeProject.id);
    }
  };

  const handleDeleteSimModel = async (id: string) => {
    if (!activeProject) return;
    const response = await fetch(`${API_URL}/api/v1/simulation/models/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (response.ok) {
      fetchWorkspaceData(activeProject.id);
    }
  };

  // Run Actions
  const handleCreateRun = async (runType: string, modelId: string, datasetId: string) => {
    if (!activeProject) return;
    const endpoint = runType === 'OPTIMIZATION' 
      ? `${API_URL}/api/v1/optimization/run` 
      : `${API_URL}/api/v1/simulation/run`;
    
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        model_id: modelId,
        dataset_id: datasetId
      })
    });

    if (response.ok) {
      // Trigger instant workspace data reload to show pending/running status
      fetchWorkspaceData(activeProject.id);
    } else {
      const data = await response.json();
      alert(`Error starting execution: ${data.detail}`);
    }
  };

  const handlePollRuns = async () => {
    if (activeProject) {
      fetchWorkspaceData(activeProject.id);
    }
  };

  // Calculate statistics
  const successRuns = runs.filter(r => r.status === 'SUCCESS').length;
  const totalCompletedRuns = runs.filter(r => r.status === 'SUCCESS' || r.status === 'FAILED').length;
  const successRate = totalCompletedRuns > 0 ? Math.round((successRuns / totalCompletedRuns) * 100) : 100;

  const stats = {
    datasetsCount: datasets.length,
    modelsCount: optModels.length + simModels.length,
    runsCount: runs.length,
    successRate
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div className="spinner" style={styles.loadingSpinner}></div>
        <p style={{ marginTop: '16px', fontWeight: '500', color: 'var(--text-secondary)' }}>
          Establishing connection to solver control tower...
        </p>
      </div>
    );
  }

  if (!token || !user) {
    return <Auth onLoginSuccess={handleLoginSuccess} apiUrl={API_URL} />;
  }

  return (
    <div style={styles.layout}>
      {/* Sidebar Navigation */}
      <aside style={styles.sidebar}>
        <div style={styles.sidebarBrand}>
          <div style={styles.logoBadge}>DF</div>
          <div>
            <div style={styles.logoText}>DecisionForge</div>
            <div style={styles.logoSubtext}>Control Center</div>
          </div>
        </div>

        <nav style={styles.nav}>
          <button 
            style={styles.navLink(currentView === 'dashboard')} 
            onClick={() => setCurrentView('dashboard')}
          >
            <LayoutDashboard size={18} />
            <span>Dashboard</span>
          </button>

          <button 
            style={styles.navLink(currentView === 'datasets')} 
            onClick={() => setCurrentView('datasets')}
          >
            <Database size={18} />
            <span>Datasets</span>
          </button>

          <button 
            style={styles.navLink(currentView === 'models')} 
            onClick={() => setCurrentView('models')}
          >
            <Cpu size={18} />
            <span>Solver Models</span>
          </button>

          <button 
            style={styles.navLink(currentView === 'runs')} 
            onClick={() => setCurrentView('runs')}
          >
            <Play size={18} />
            <span>Executions</span>
          </button>
        </nav>

        <div style={styles.sidebarFooter}>
          <div style={styles.userInfo}>
            <div style={styles.userInitial}>
              {user.first_name[0]}{user.last_name[0]}
            </div>
            <div style={{ flex: 1, overflow: 'hidden' }}>
              <div style={styles.userName}>{user.first_name} {user.last_name}</div>
              <div style={styles.userRole}>Workspace Owner</div>
            </div>
          </div>
          <button style={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={styles.main}>
        {currentView === 'dashboard' && (
          <Dashboard 
            user={user} 
            stats={stats} 
            recentRuns={runs} 
            onViewChange={setCurrentView} 
          />
        )}
        {currentView === 'datasets' && (
          <Datasets 
            datasets={datasets} 
            user={user}
            onUpload={handleCreateDataset} 
            onDelete={handleDeleteDataset} 
          />
        )}
        {currentView === 'models' && (
          <Models 
            optModels={optModels} 
            simModels={simModels} 
            user={user}
            onCreateOptModel={handleCreateOptModel} 
            onCreateSimModel={handleCreateSimModel} 
            onDeleteOptModel={handleDeleteOptModel} 
            onDeleteSimModel={handleDeleteSimModel} 
          />
        )}
        {currentView === 'runs' && (
          <Runs 
            runs={runs} 
            optModels={optModels} 
            simModels={simModels} 
            datasets={datasets} 
            apiUrl={API_URL} 
            token={token} 
            user={user}
            onCreateRun={handleCreateRun} 
            onPollRuns={handlePollRuns} 
          />
        )}
      </main>
    </div>
  );
}

const styles = {
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-main)',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(139, 92, 246, 0.1)',
    borderTop: '3px solid var(--accent-purple)',
    borderRadius: '50%',
  },
  layout: {
    display: 'flex',
    minHeight: '100vh',
    width: '100vw',
    backgroundColor: 'var(--bg-main)',
  },
  sidebar: {
    width: '260px',
    background: 'var(--bg-surface)',
    borderRight: '1px solid var(--border-color)',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '24px',
    position: 'fixed' as const,
    top: 0,
    bottom: 0,
    left: 0,
    zIndex: 100,
  },
  sidebarBrand: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    marginBottom: '32px',
  },
  logoBadge: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'var(--gradient-neon)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: 'bold',
    color: '#ffffff',
    boxShadow: '0 0 15px rgba(139, 92, 246, 0.25)',
  },
  logoText: {
    fontFamily: 'var(--font-display)',
    fontWeight: '700',
    fontSize: '16px',
    color: '#ffffff',
  },
  logoSubtext: {
    fontSize: '11px',
    color: 'var(--text-secondary)',
    fontWeight: '500',
  },
  nav: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
    flex: 1,
  },
  navLink: (isActive: boolean) => ({
    background: isActive ? 'var(--bg-active)' : 'none',
    border: 'none',
    color: isActive ? '#ffffff' : 'var(--text-secondary)',
    padding: '12px 16px',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    width: '100%',
    textAlign: 'left' as const,
    fontWeight: isActive ? '600' : '500',
    fontSize: '14px',
    transition: 'var(--transition)',
    borderLeft: isActive ? '3px solid var(--accent-purple)' : '3px solid transparent',
    paddingLeft: isActive ? '13px' : '16px',
    '&:hover': {
      color: '#ffffff',
      background: 'rgba(255, 255, 255, 0.02)',
    }
  }),
  sidebarFooter: {
    marginTop: 'auto',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
    paddingTop: '20px',
    borderTop: '1px solid var(--border-color)',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  userInitial: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    background: 'rgba(139, 92, 246, 0.2)',
    border: '1px solid rgba(139, 92, 246, 0.3)',
    color: 'var(--accent-purple)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '12px',
    fontWeight: '600',
  },
  userName: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#ffffff',
    whiteSpace: 'nowrap' as const,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  userRole: {
    fontSize: '10px',
    color: 'var(--text-secondary)',
  },
  logoutBtn: {
    width: '100%',
    background: 'none',
    border: '1px solid var(--border-color)',
    color: 'var(--text-secondary)',
    padding: '10px 14px',
    borderRadius: 'var(--radius)',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'var(--transition)',
    '&:hover': {
      color: 'var(--accent-rose)',
      borderColor: 'rgba(244, 63, 94, 0.3)',
      backgroundColor: 'rgba(244, 63, 94, 0.05)',
    }
  },
  main: {
    flex: 1,
    padding: '40px',
    marginLeft: '260px',
    minHeight: '100vh',
    overflowY: 'auto' as const,
  },
};
