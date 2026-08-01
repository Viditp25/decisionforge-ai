import React, { useState } from 'react';
import { Database, Plus, Upload, Trash2, Eye, EyeOff, FileJson } from 'lucide-react';

interface DatasetsProps {
  datasets: any[];
  user: any;
  onUpload: (name: string, dataType: string, content: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const Datasets: React.FC<DatasetsProps> = ({ datasets, user, onUpload, onDelete }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [dataType, setDataType] = useState('VRP');
  const [selectedDatasetJson, setSelectedDatasetJson] = useState<any | null>(null);
  
  // Sample templates for VRP and Knapsack to make user interaction extremely smooth
  const vrpTemplate = {
    depot: 0,
    locations: [
      { id: 0, name: "Central Depot", lat: 37.7749, lng: -122.4194 },
      { id: 1, name: "Mission District Store", lat: 37.7599, lng: -122.4148, demand: 5 },
      { id: 2, name: "Marina District Store", lat: 37.8037, lng: -122.4368, demand: 8 },
      { id: 3, name: "Financial District Store", lat: 37.7946, lng: -122.3999, demand: 6 },
      { id: 4, name: "Sunset District Store", lat: 37.7489, lng: -122.4845, demand: 10 }
    ],
    distances: [
      [0, 2.5, 4.1, 2.2, 7.8],
      [2.5, 0, 5.8, 3.1, 7.2],
      [4.1, 5.8, 0, 3.8, 8.4],
      [2.2, 3.1, 3.8, 0, 9.1],
      [7.8, 7.2, 8.4, 9.1, 0]
    ]
  };

  const knapsackTemplate = {
    capacity: 50,
    items: [
      { id: 1, name: "Gold bar", weight: 10, value: 500 },
      { id: 2, name: "Rare painting", weight: 25, value: 1200 },
      { id: 3, name: "Vintage wine", weight: 15, value: 300 },
      { id: 4, name: "Diamond ring", weight: 2, value: 900 },
      { id: 5, name: "Laptop", weight: 8, value: 450 }
    ]
  };

  const [rawJson, setRawJson] = useState(JSON.stringify(vrpTemplate, null, 2));

  const handleDataTypeChange = (type: string) => {
    setDataType(type);
    if (type === 'VRP') {
      setRawJson(JSON.stringify(vrpTemplate, null, 2));
    } else {
      setRawJson(JSON.stringify(knapsackTemplate, null, 2));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const parsedContent = JSON.parse(rawJson);
      await onUpload(name, dataType, parsedContent);
      setName('');
      setShowAddForm(false);
    } catch (err: any) {
      alert('Invalid JSON content. Please check format structure.');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div>
          <h2 style={styles.title}>Registered Datasets</h2>
          <p style={styles.subtitle}>Upload and manage variable parameters for optimization routing and knapsack models</p>
        </div>
        {user.role !== 'Viewer' && (
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)}>
            <Plus size={16} />
            <span>{showAddForm ? 'Cancel Creation' : 'Create Dataset'}</span>
          </button>
        )}
      </div>

      {showAddForm && (
        <div className="glass-card" style={styles.formCard}>
          <h3 style={styles.formTitle}>Initialize New Dataset</h3>
          <form onSubmit={handleSubmit} style={styles.form}>
            <div style={styles.inputGroup}>
              <label style={styles.label}>Dataset Name</label>
              <input 
                type="text" 
                required 
                placeholder="E.g., Q3 SF Retail Stores" 
                value={name} 
                onChange={(e) => setName(e.target.value)} 
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Optimization Problem Type</label>
              <select value={dataType} onChange={(e) => handleDataTypeChange(e.target.value)}>
                <option value="VRP">Vehicle Routing Problem (VRP)</option>
                <option value="KNAPSACK">Knapsack Optimization</option>
              </select>
            </div>

            <div style={styles.inputGroup}>
              <div style={styles.jsonLabelRow}>
                <label style={styles.label}>JSON Payload Content</label>
                <span style={styles.templateBadge}>Prepopulated Template Loaded</span>
              </div>
              <textarea 
                rows={10} 
                required 
                style={styles.textarea} 
                value={rawJson} 
                onChange={(e) => setRawJson(e.target.value)} 
              />
            </div>

            <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-start' }}>
              <Upload size={16} />
              <span>Register Dataset</span>
            </button>
          </form>
        </div>
      )}

      {/* Dataset Grid */}
      <div style={styles.grid}>
        {datasets.length === 0 ? (
          <div className="glass-card" style={styles.emptyCard}>
            <Database size={48} color="var(--text-muted)" style={{ marginBottom: '16px' }} />
            <h3>No Datasets Available</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '4px', maxWidth: '300px' }}>
              Create a new dataset configuration using VRP or Knapsack models to begin execution.
            </p>
          </div>
        ) : (
          datasets.map((ds) => (
            <div key={ds.id} className="glass-card" style={styles.datasetCard}>
              <div style={styles.cardHeader}>
                <div style={styles.cardHeaderLeft}>
                  <div style={styles.iconBox}>
                    <FileJson size={18} color="var(--accent-purple)" />
                  </div>
                  <div>
                    <h4 style={styles.datasetName}>{ds.name}</h4>
                    <span className="badge badge-running" style={{ fontSize: '10px', marginTop: '4px' }}>
                      {ds.data_type}
                    </span>
                  </div>
                </div>
                <div style={styles.actions}>
                  <button 
                    style={styles.iconBtn} 
                    onClick={() => setSelectedDatasetJson(selectedDatasetJson?.id === ds.id ? null : ds)}
                  >
                    {selectedDatasetJson?.id === ds.id ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                  {(user.role === 'Owner' || user.role === 'Admin') && (
                    <button style={styles.deleteBtn} onClick={() => onDelete(ds.id)}>
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
              </div>
              <div style={styles.cardBody}>
                <div style={styles.metaRow}>
                  <span>ID: {ds.id.substring(0, 8)}...</span>
                  <span>Created: {new Date(ds.created_at).toLocaleDateString()}</span>
                </div>
                
                {selectedDatasetJson?.id === ds.id && (
                  <div style={styles.jsonViewer}>
                    <pre style={styles.pre}>
                      {JSON.stringify(ds.content, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
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
  jsonLabelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateBadge: {
    fontSize: '11px',
    color: 'var(--accent-emerald)',
    fontWeight: '500',
  },
  textarea: {
    fontFamily: 'monospace',
    fontSize: '13px',
    background: 'rgba(0, 0, 0, 0.3)',
    border: '1px solid var(--border-color)',
    borderRadius: 'var(--radius)',
    padding: '12px',
    color: '#ffffff',
    resize: 'vertical' as const,
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '20px',
  },
  emptyCard: {
    gridColumn: '1 / -1',
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center' as const,
  },
  datasetCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '16px',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  iconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    background: 'rgba(139, 92, 246, 0.1)',
    border: '1px solid rgba(139, 92, 246, 0.2)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  datasetName: {
    fontSize: '15px',
    fontWeight: '600',
  },
  actions: {
    display: 'flex',
    gap: '8px',
  },
  iconBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'var(--transition)',
    '&:hover': {
      backgroundColor: 'var(--bg-active)',
      color: '#ffffff',
    }
  },
  deleteBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--text-secondary)',
    cursor: 'pointer',
    padding: '6px',
    borderRadius: '6px',
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
    gap: '12px',
  },
  metaRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '11px',
    color: 'var(--text-secondary)',
  },
  jsonViewer: {
    background: '#040406',
    border: '1px solid var(--border-color)',
    borderRadius: '8px',
    padding: '12px',
    maxHeight: '200px',
    overflowY: 'auto' as const,
  },
  pre: {
    fontFamily: 'monospace',
    fontSize: '12px',
    color: '#a5b4fc',
    whiteSpace: 'pre-wrap' as const,
  },
};
