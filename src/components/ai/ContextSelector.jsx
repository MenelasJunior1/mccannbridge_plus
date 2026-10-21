import React, { useState } from 'react';
import { ChevronDown, Database, FileSpreadsheet, FileText, Target } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export default function ContextSelector({ activeContext, onChange, availableDocuments = [] }) {
  const { clientsHierarchy } = useApp();
  const [showDocPicker, setShowDocPicker] = useState(false);

  const selectedClient = clientsHierarchy.find(c => c.name === activeContext.client) || clientsHierarchy[0];
  const availableBrands = selectedClient?.brands || [];
  const selectedBrand = availableBrands.find(b => b.name === activeContext.brand) || availableBrands[0];
  const availableProjects = selectedBrand?.projects || [];

  const handleClientChange = (clientName) => {
    const clientObj = clientsHierarchy.find(c => c.name === clientName);
    const firstBrand = clientObj?.brands?.[0]?.name || '';
    const firstProj = clientObj?.brands?.[0]?.projects?.[0]?.name || '';
    onChange({
      client: clientName,
      brand: firstBrand,
      project: firstProj,
    });
  };

  const handleBrandChange = (brandName) => {
    const brandObj = availableBrands.find(b => b.name === brandName);
    const firstProj = brandObj?.projects?.[0]?.name || '';
    onChange({
      brand: brandName,
      project: firstProj,
    });
  };

  const handleProjectChange = (projectName) => {
    onChange({ project: projectName });
  };

  const toggleDocument = (docId) => {
    const currentDocs = activeContext.documents || [];
    const isSelected = currentDocs.includes(docId);
    const newDocs = isSelected 
      ? currentDocs.filter(id => id !== docId)
      : [...currentDocs, docId];
    onChange({ documents: newDocs });
  };

  const attachedDocsCount = (activeContext.documents || []).length;

  return (
    <div className="bridge-ai-context-selector">
      <div className="bridge-ai-context-row">
        {/* Hierarchy Selectors */}
        <div className="bridge-ai-context-fields">
          <div className="bridge-ai-context-label">
            <Target size={14} /> Contexte
          </div>

          {/* Client Selector */}
          <label className="bridge-ai-select-wrap">
            <span>Client</span>
            <select
              value={activeContext.client}
              onChange={(e) => handleClientChange(e.target.value)}
              className="bridge-ai-context-select"
            >
              {clientsHierarchy.map(client => (
                <option key={client.id} value={client.name}>{client.name}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>

          {/* Brand Selector */}
          <label className="bridge-ai-select-wrap">
            <span>Marque</span>
            <select
              value={activeContext.brand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="bridge-ai-context-select bridge-ai-context-select-accent"
            >
              {availableBrands.map(brand => (
                <option key={brand.id} value={brand.name}>{brand.name}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>

          {/* Project Selector */}
          <label className="bridge-ai-select-wrap bridge-ai-project-select">
            <span>Projet</span>
            <select
              value={activeContext.project}
              onChange={(e) => handleProjectChange(e.target.value)}
              className="bridge-ai-context-select"
            >
              {availableProjects.map(proj => (
                <option key={proj.id} value={proj.name}>{proj.name}</option>
              ))}
            </select>
            <ChevronDown size={13} />
          </label>
        </div>

        {/* Attached Knowledge Documents Button */}
        <div className="bridge-ai-context-docs">
          <button
            type="button"
            onClick={() => setShowDocPicker(!showDocPicker)}
            className={`bridge-ai-doc-trigger ${attachedDocsCount > 0 ? 'active' : ''}`}
            aria-expanded={showDocPicker}
          >
            <Database size={14} />
            <span>Documents RAG</span>
            <span className="bridge-ai-doc-count">
              {attachedDocsCount}
            </span>
          </button>
        </div>
      </div>

      {/* Document Picker Drawer / Tray */}
      {showDocPicker && (
        <div className="bridge-ai-doc-picker animate-in fade-in">
          <div className="bridge-ai-doc-picker-head">
            <span>
              Documents disponibles pour l'analyse & RAG :
            </span>
            <small>
              Cochez les fichiers que l'IA doit analyser pour cette session
            </small>
          </div>

          <div className="bridge-ai-doc-grid">
            {availableDocuments.map(doc => {
              const isChecked = (activeContext.documents || []).includes(doc.id);
              return (
                <div
                  key={doc.id}
                  onClick={() => toggleDocument(doc.id)}
                  className={`bridge-ai-doc-option ${isChecked ? 'active' : ''}`}
                >
                  <div>
                    {doc.fileType === 'xlsx' ? <FileSpreadsheet size={15} /> : <FileText size={15} />}
                    <span>{doc.title || doc.name}</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => {}}
                    className="bridge-ai-doc-checkbox"
                  />
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
