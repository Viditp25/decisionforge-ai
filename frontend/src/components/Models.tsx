import React, { useState } from 'react';
import { Cpu, Plus, Sliders, Trash2, Layers } from 'lucide-react';

interface ModelsProps {
  optModels: any[];
  simModels: any[];
  user: any;
  onCreateOptModel: (name: string, modelType: string, config: any, params: any) => Promise<void>;
  onCreateSimModel: (name: string, config: any, params: any) => Promise<void>;
  onDeleteOptModel: (id: string) => Promise<void>;
  onDeleteSimModel: (id: string) => Promise<void>;
}

export const Models: React.FC<ModelsProps> = ({
  optModels,
  simModels,
  user,
  onCreateOptModel,
  onCreateSimModel,
  onDeleteOptModel,
  onDeleteSimModel
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [modelClass, setModelClass] = useState<'OPTIMIZATION' | 'SIMULATION'>('OPTIMIZATION');
  const [name, setName] = useState('');
  
  // Optimization Model states
  const [optType, setOptType] = useState('VRP');
  const [numVehicles, setNumVehicles] = useState(3);
  const [capacityLimit, setCapacityLimit] = useState(15);
  const [timeLimit, setTimeLimit] = useState(30);

  // Simulation Model states
  const [numTrials, setNumTrials] = useState(1000);
  const [randomSeed, setRandomSeed] = useState(42);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (modelClass === 'OPTIMIZATION') {
      const config = optType === 'VRP' 
        ? { num_vehicles: Number(numVehicles), capacity_limit: Number(capacityLimit) }
        : { capacity: Number(capacityLimit) };
      const params = { time_limit_seconds: Number(timeLimit) };
      await onCreateOptModel(name, optType, config, params);
    } else {
      const config = { num_trials: Number(numTrials) };
      const params = { random_seed: Number(randomSeed) };
      await onCreateSimModel(name, config, params);
    }
    setName('');
    setShowAddForm(false);
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Solver Models</h2>
          <p style={styles.subtitle}>Configure operational constraints, parameters, and simulation trial sets</p>
        </div>
        {user.role !== 'Viewer' && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={16} />
            <span>{showAddForm ? 'Cancel Creation' : 'New Model'}</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="glass-card" style={styles.formCard}>
          <h3 style={styles.formTitle}>Initialize Solver Model</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Model Name</label>
              <input 
                type="text" 
                required 
                placeholder="E.g., West Coast VRP Routing" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>

            <div style={styles.inputGroup}>
              <label style={styles.label}>Model Class</label>
              <select value={modelClass} onChange={(e) => setModelClass(e.target.value as any)}>
                <option value="OPTIMIZATION">Optimization Engine Model</option>
                <option value="SIMULATION">Monte Carlo Simulation Model</option>
              </select>
            </div>

            {modelClass === 'OPTIMIZATION' ? (
              <>
                <div style={styles.inputGroup}>
                  <label style={styles.label}>Solver Type</label>
                  <select value={optType} onChange={(e) => setOptType(e.target.value)}>
                    <option value="VRP">Vehicle Routing Problem (VRP)</option>
                    <option value="KNAPSACK">Knapsack Optimization</option>
                  </select>
                </div>

                <div style={styles.row}>
                  {optType === 'VRP' && (
                    <div style={styles.inputGroup} className="flex-1">
                      <label style={styles.label}>Number of Vehicles</label>
                      <input 
                        type="number" 
                        min={1} 
                        value={numVehicles} 
                        onChange={(e) => setNumVehicles(Number(e.target.value))} 
                      />
                    </div>
                  )}
                  <div style={styles.inputGroup} className="flex-1">
                    <label style={styles.label}>
                      {optType === 'VRP' ? 'Vehicle Capacity' : 'Max Weight Capacity'}
                    </label>
                    <input 
                      type="number" 
                      min={1} 
                      value={capacityLimit} 
                      onChange={(e) => setCapacityLimit(Number(e.target.value))} 
                    />
                  </div>
                </div>

                <div style={styles.inputGroup}>
                  <label style={styles.label}>Execution Time Limit (sec)</label>
                  <input 
                    type="number" 
                    min={1} 
                    value={timeLimit} 
                    onChange={(e) => setTimeLimit(Number(e.target.value))} 
                  />
                </div>
              </>
            ) : (
              <>
                <div style={styles.row}>
                  <div style={styles.inputGroup} className="flex-1">
                    <label style={styles.label}>Number of Trials</label>
                    <input 
                      type="number" 
                      min={10} 
                      max={100000} 
                      value={numTrials} 
                      onChange={(e) => setNumTrials(Number(e.target.value))} 
                    />
                  </div>
                  <div style={styles.inputGroup} className="flex-1">
                    <label style={styles.label}>Random Seed (deterministic)</label>
                    <input 
                      type="number" 
                      value={randomSeed} 
                      onChange={(e) => setRandomSeed(Number(e.target.value))} 
                    />
                  </div>
                </div>
              </>
            )}

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Cpu size={16} />
              <span>Compile Model Configuration</span>
            </button>
          </form>
        </div>
      )}

      {/* Models Grid split by Optimization / Simulation */}
      <div style={styles.gridContainer}>
        {/* Optimization Models */}
        <div style={styles.sectionColumn}>
          <h3 style={styles.sectionHeader}>
            <Sliders size={18} color="var(--accent-purple)" />
            <span>Optimization Models ({optModels.length})</span>
          </h3>

          <div style={styles.cardList}>
            {optModels.length === 0 ? (
              <div className="glass-card" style={styles.emptyCard}>
                <p>No optimization models created yet.</p>
              </div>
            ) : (
              optModels.map((m) => (
                <div key={m.id} className="glass-card" style={styles.modelCard}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h4 style={styles.modelName}>{m.name}</h4>
                      <span className="badge badge-running" style={{ fontSize: '10px', marginTop: '4px' }}>
                        {m.model_type}
                      </span>
                    </div>
                    {(user.role === 'Owner' || user.role === 'Admin') && (
                      <button style={styles.deleteBtn} onClick={() => onDeleteOptModel(m.id)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.paramItem}>
                      <span style={styles.paramLabel}>Config:</span>
                      <pre style={styles.paramCode}>{JSON.stringify(m.configuration)}</pre>
                    </div>
                    <div style={styles.paramItem}>
                      <span style={styles.paramLabel}>Params:</span>
                      <pre style={styles.paramCode}>{JSON.stringify(m.parameters)}</pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Simulation Models */}
        <div style={styles.sectionColumn}>
          <h3 style={styles.sectionHeader}>
            <Layers size={18} color="var(--accent-cyan)" />
            <span>Monte Carlo Simulation Models ({simModels.length})</span>
          </h3>

          <div style={styles.cardList}>
            {simModels.length === 0 ? (
              <div className="glass-card" style={styles.emptyCard}>
                <p>No simulation models created yet.</p>
              </div>
            ) : (
              simModels.map((m) => (
                <div key={m.id} className="glass-card" style={styles.modelCard}>
                  <div style={styles.cardHeader}>
                    <div>
                      <h4 style={styles.modelName}>{m.name}</h4>
                      <span className="badge badge-completed" style={{ fontSize: '10px', marginTop: '4px' }}>
                        Simulation
                      </span>
                    </div>
                    {(user.role === 'Owner' || user.role === 'Admin') && (
                      <button style={styles.deleteBtn} onClick={() => onDeleteSimModel(m.id)}>
                        <Trash2 size={15} />
                      </button>
                    )}
                  </div>
                  <div style={styles.cardBody}>
                    <div style={styles.paramItem}>
                      <span style={styles.paramLabel}>Config:</span>
                      <pre style={styles.paramCode}>{JSON.stringify(m.configuration)}</pre>
                    </div>
                    <div style={styles.paramItem}>
                      <span style={styles.paramLabel}>Params:</span>
                      <pre style={styles.paramCode}>{JSON.stringify(m.parameters)}</pre>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
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
  gridContainer: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  sectionColumn: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  sectionHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    fontSize: '16px',
    fontWeight: '600',
    color: '#ffffff',
  },
  cardList: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  emptyCard: {
    padding: '24px',
    textAlign: 'center' as const,
    color: 'var(--text-secondary)',
    fontSize: '13px',
  },
  modelCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '14px',
    padding: '20px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  modelName: {
    fontSize: '15px',
    fontWeight: '600',
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '4px',
    borderRadius: '4px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
    '&:hover': {
      color: 'var(--accent-rose)',
      backgroundColor: 'rgba(244, 63, 94, 0.1)',
    }
  },
  cardBody: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    paddingTop: '8px',
    borderTop: '1px solid var(--border-color)',
  },
  paramItem: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '4px',
  },
  paramLabel: {
    fontSize: '11px',
    fontWeight: '600',
    color: 'var(--text-secondary)',
    textTransform: 'uppercase' as const,
  },
  paramCode: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#a5b4fc',
    background: 'rgba(0, 0, 0, 0.25)',
    padding: '6px 10px',
    borderRadius: '6px',
    overflowX: 'auto' as const,
  },
};
