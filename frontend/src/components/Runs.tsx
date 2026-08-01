import React, { useState, useEffect } from 'react';
import { Play, AlertTriangle, RefreshCw, Info, Loader2, Sparkles, X } from 'lucide-react';

interface RunsProps {
  runs: any[];
  optModels: any[];
  simModels: any[];
  datasets: any[];
  apiUrl: string;
  token: string;
  user: any;
  onCreateRun: (runType: string, modelId: string, datasetId: string) => Promise<void>;
  onPollRuns: () => Promise<void>;
}

export const Runs: React.FC<RunsProps> = ({
  runs,
  optModels,
  simModels,
  datasets,
  apiUrl,
  token,
  user,
  onCreateRun,
  onPollRuns
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [runType, setRunType] = useState('OPTIMIZATION');
  const [selectedModelId, setSelectedModelId] = useState('');
  const [selectedDatasetId, setSelectedDatasetId] = useState('');
  
  // Modal states for details and AI explanations
  const [selectedRun, setSelectedRun] = useState<any | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);

  // Auto-refresh active runs (PENDING/RUNNING) every 2.5 seconds
  useEffect(() => {
    const hasActiveRuns = runs.some(r => r.status === 'PENDING' || r.status === 'RUNNING');
    if (!hasActiveRuns) return;

    const interval = setInterval(() => {
      onPollRuns();
    }, 2500);

    return () => clearInterval(interval);
  }, [runs, onPollRuns]);

  // Set default model on type switch
  useEffect(() => {
    if (runType === 'OPTIMIZATION') {
      setSelectedModelId(optModels[0]?.id || '');
    } else {
      setSelectedModelId(simModels[0]?.id || '');
    }
  }, [runType, optModels, simModels]);

  // Set default dataset
  useEffect(() => {
    setSelectedDatasetId(datasets[0]?.id || '');
  }, [datasets]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedModelId || !selectedDatasetId) {
      alert('Please configure models and datasets first.');
      return;
    }
    await onCreateRun(runType, selectedModelId, selectedDatasetId);
    setShowAddForm(false);
  };

  const handleFetchExplanation = async (run: any) => {
    setLoadingExplanation(true);
    setExplanation(null);
    try {
      // First check if explanation exists
      const checkResponse = await fetch(`${apiUrl}/api/v1/explanations/run/${run.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (checkResponse.ok) {
        const data = await checkResponse.json();
        setExplanation(data.explanation);
      } else {
        // Generate new explanation
        const response = await fetch(`${apiUrl}/api/v1/explanations/generate`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            run_id: run.id,
            run_type: run.run_type
          })
        });
        
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.detail || 'Could not generate explanation.');
        }
        setExplanation(data.explanation);
      }
    } catch (err: any) {
      setExplanation(`Failed to retrieve explanation: ${err.message}`);
    } finally {
      setLoadingExplanation(false);
    }
  };

  const handleOpenDetails = (run: any) => {
    setSelectedRun(run);
    if (run.status === 'SUCCESS') {
      handleFetchExplanation(run);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Model Run Executions</h2>
          <p style={styles.subtitle}>Trigger solvers, analyze runs, and generate AI explanations of outcomes</p>
        </div>
        {user.role !== 'Viewer' && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Play size={16} />
            <span>{showAddForm ? 'Cancel Execution' : 'Trigger Solver Run'}</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="glass-card" style={styles.formCard}>
          <h3 style={styles.formTitle}>Initialize Solver Execution</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Execution Strategy</label>
              <select value={runType} onChange={(e) => setRunType(e.target.value)}>
                <option value="OPTIMIZATION">Optimization Engine (OR-Tools)</option>
                <option value="SIMULATION">Monte Carlo Simulation</option>
              </select>
            </div>

            <div style={styles.row}>
              <div style={styles.inputGroup} className="flex-1">
                <label style={styles.label}>Select Model Configuration</label>
                <select value={selectedModelId} onChange={(e) => setSelectedModelId(e.target.value)}>
                  {runType === 'OPTIMIZATION' 
                    ? optModels.map(m => <option key={m.id} value={m.id}>{m.name} ({m.model_type})</option>)
                    : simModels.map(m => <option key={m.id} value={m.id}>{m.name}</option>)
                  }
                  {((runType === 'OPTIMIZATION' ? optModels.length : simModels.length) === 0) && (
                    <option value="">-- No models available --</option>
                  )}
                </select>
              </div>

              <div style={styles.inputGroup} className="flex-1">
                <label style={styles.label}>Select Reference Dataset</label>
                <select value={selectedDatasetId} onChange={(e) => setSelectedDatasetId(e.target.value)}>
                  {datasets.map(d => <option key={d.id} value={d.id}>{d.name} ({d.data_type})</option>)}
                  {datasets.length === 0 && <option value="">-- No datasets available --</option>}
                </select>
              </div>
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }} disabled={!selectedModelId || !selectedDatasetId}>
              <Play size={16} />
              <span>Launch Engine Solver</span>
            </button>
          </form>
        </div>
      )}

      {/* Runs Table */}
      <div className="glass-card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Execution History</h3>
          <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={onPollRuns}>
            <RefreshCw size={12} />
            <span>Refresh</span>
          </button>
        </div>

        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>Run ID</th>
                <th>Strategy</th>
                <th>Status</th>
                <th>Objective Value</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {runs.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-secondary)', padding: '40px' }}>
                    No run executions found. Create a run using the button above.
                  </td>
                </tr>
              ) : (
                runs.map((r) => (
                  <tr key={r.id}>
                    <td style={{ fontFamily: 'monospace', fontWeight: '600' }}>Run-{r.id.substring(0, 8)}</td>
                    <td>
                      <span className="badge badge-completed" style={r.run_type === 'OPTIMIZATION' ? { background: 'rgba(139, 92, 246, 0.15)', color: 'var(--accent-purple)', border: '1px solid rgba(139, 92, 246, 0.3)' } : { background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)', border: '1px solid rgba(6, 182, 212, 0.3)' }}>
                        {r.run_type}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${r.status.toLowerCase()}`}>
                        {r.status === 'PENDING' || r.status === 'RUNNING' ? (
                          <Loader2 size={10} className="spinner" style={{ marginRight: '4px' }} />
                        ) : null}
                        {r.status}
                      </span>
                    </td>
                    <td>
                      {r.status === 'SUCCESS' 
                        ? (r.results?.objective_value !== undefined ? `$${r.results.objective_value.toFixed(2)}` : 'N/A')
                        : (r.status === 'FAILED' ? 'N/A' : 'Calculating...')
                      }
                    </td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td>
                      <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }} onClick={() => handleOpenDetails(r)}>
                        <Info size={13} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & AI Explanation Modal */}
      {selectedRun && (
        <div style={styles.modalOverlay}>
          <div className="glass-card" style={styles.modal}>
            <div style={styles.modalHeader}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Sparkles size={20} color="var(--accent-purple)" />
                <h3 style={styles.modalTitle}>Run Analytics & AI Analysis</h3>
              </div>
              <button style={styles.closeBtn} onClick={() => { setSelectedRun(null); setExplanation(null); }}>
                <X size={18} />
              </button>
            </div>

            <div style={styles.modalBody}>
              <div style={styles.runMetaGrid}>
                <div>
                  <span style={styles.metaLabel}>Run ID</span>
                  <div style={styles.metaVal}>{selectedRun.id}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>Status</span>
                  <div>
                    <span className={`badge badge-${selectedRun.status.toLowerCase()}`}>
                      {selectedRun.status}
                    </span>
                  </div>
                </div>
                <div>
                  <span style={styles.metaLabel}>Type</span>
                  <div style={styles.metaVal}>{selectedRun.run_type}</div>
                </div>
                <div>
                  <span style={styles.metaLabel}>Objective Value</span>
                  <div style={styles.metaVal}>
                    {selectedRun.status === 'SUCCESS' 
                      ? (selectedRun.results?.objective_value !== undefined ? `$${selectedRun.results.objective_value.toFixed(2)}` : 'N/A')
                      : 'N/A'
                    }
                  </div>
                </div>
              </div>

              {selectedRun.status === 'FAILED' && (
                <div style={styles.errorBox}>
                  <AlertTriangle size={16} />
                  <span>{selectedRun.error_message || 'Solver error occurred.'}</span>
                </div>
              )}

              {/* AI Explanation Area */}
              <div style={styles.explanationSection}>
                <h4 style={styles.explanationTitle}>
                  <Sparkles size={14} color="var(--accent-purple)" style={{ marginRight: '6px' }} />
                  AI Decision Explanation (OpenAI GPT-4o)
                </h4>
                
                {loadingExplanation ? (
                  <div style={styles.loaderArea}>
                    <Loader2 size={32} className="spinner" color="var(--accent-purple)" />
                    <p style={{ marginTop: '12px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                      Synthesizing mathematical metrics and translating constraints...
                    </p>
                  </div>
                ) : explanation ? (
                  <div style={styles.markdownContent}>
                    <pre style={styles.markdownPre}>{explanation}</pre>
                  </div>
                ) : (
                  <div style={styles.explanationPlaceholder}>
                    No explanation generated. Explanation is automatically loaded for successful solver completions.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '24px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: '24px',
  },
  subtitle: {
    color: 'var(--text-secondary)',
    fontSize: '13px',
    marginTop: '4px',
  },
  formCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  formTitle: {
    fontSize: '18px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  row: {
    display: 'flex',
    gap: '16px',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
  },
  label: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
  tableHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    background: 'rgba(255, 255, 255, 0.01)',
    borderBottom: '1px solid var(--border-color)',
  },
  tableTitle: {
    fontSize: '16px',
    fontWeight: '600',
  },
  modalOverlay: {
    position: 'fixed' as const,
    top: 0,
    left: 0,
    width: '100vw',
    height: '100vh',
    background: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    width: '90%',
    maxWidth: '780px',
    maxHeight: '85vh',
    display: 'flex',
    flexDirection: 'column' as const,
    padding: '30px',
    overflowY: 'auto' as const,
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&:hover': {
      backgroundColor: 'var(--bg-active)',
      color: '#ffffff',
    }
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '20px',
  },
  runMetaGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '16px',
    background: 'rgba(255, 255, 255, 0.02)',
    border: '1px solid var(--border-color)',
    padding: '16px',
    borderRadius: 'var(--radius)',
  },
  metaLabel: {
    fontSize: '10px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
    marginBottom: '4px',
    display: 'block',
  },
  metaVal: {
    fontSize: '13px',
    fontWeight: '600',
    wordBreak: 'break-all' as const,
  },
  errorBox: {
    background: 'rgba(244, 63, 94, 0.1)',
    border: '1px solid rgba(244, 63, 94, 0.3)',
    color: '#f43f5e',
    padding: '12px 16px',
    borderRadius: '8px',
    fontSize: '13px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  explanationSection: {
    borderTop: '1px solid var(--border-color)',
    paddingTop: '20px',
  },
  explanationTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: '12px',
    display: 'flex',
    alignItems: 'center',
  },
  loaderArea: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 0',
  },
  markdownContent: {
    background: '#040406',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '16px',
    maxHeight: '350px',
    overflowY: 'auto' as const,
  },
  markdownPre: {
    fontFamily: 'monospace',
    fontSize: '13px',
    color: '#cbd5e1',
    whiteSpace: 'pre-wrap' as const,
    lineHeight: '1.6',
  },
  explanationPlaceholder: {
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: '13px',
    padding: '24px',
    border: '1px dashed var(--border-color)',
    borderRadius: '8px',
  },
};
