import React, { useState, useEffect } from 'react';
import { ArrowRight, Sparkles, X } from 'lucide-react';

export default function PromptVariableModal({ isOpen, onClose, prompt, onApply, activeContext }) {
  const [variables, setVariables] = useState({});
  const [detectedKeys, setDetectedKeys] = useState([]);

  useEffect(() => {
    if (!prompt?.content) return;

    // Detect all {{key}} in prompt.content
    const matches = prompt.content.match(/\{\{([^}]+)\}\}/g) || [];
    const keys = Array.from(new Set(matches.map(m => m.replace(/[{}]/g, '').trim())));
    setDetectedKeys(keys);

    // Provide smart defaults based on activeContext or key name
    const initialVars = {};
    keys.forEach(k => {
      const lower = k.toLowerCase();
      if (lower.includes('brand') || lower.includes('marque')) {
        initialVars[k] = activeContext?.brand || 'Orange Cameroun';
      } else if (lower.includes('campaign') || lower.includes('projet') || lower.includes('campagne')) {
        initialVars[k] = activeContext?.project || 'Campagne Ramadan 2026';
      } else if (lower.includes('audience') || lower.includes('cible')) {
        initialVars[k] = 'Jeunes actifs urbains (18-35 ans), Douala & Yaoundé';
      } else if (lower.includes('objective') || lower.includes('objectif')) {
        initialVars[k] = 'Augmenter l\'adoption des forfaits Data et l\'usage d\'Orange Money';
      } else if (lower.includes('tone') || lower.includes('ton')) {
        initialVars[k] = 'Chaleureux, dynamique, moderne et proche des réalités locales';
      } else {
        initialVars[k] = '';
      }
    });

    setVariables(initialVars);
  }, [prompt, activeContext]);

  if (!isOpen || !prompt) return null;

  const handleInputChange = (key, value) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  const getComputedPrompt = () => {
    let result = prompt.content;
    Object.keys(variables).forEach(k => {
      const regex = new RegExp(`\\{\\{${k}\\}\\}`, 'g');
      result = result.replace(regex, variables[k] || `[${k}]`);
    });
    return result;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalPrompt = getComputedPrompt();
    onApply(finalPrompt, prompt);
    onClose();
  };

  return (
    <div className="bridge-ai-modal-overlay animate-in fade-in">
      <div className="bridge-ai-modal">
        {/* Header */}
        <div className="bridge-ai-modal-head">
          <div>
            <div>
              <Sparkles size={18} />
              <h3>
                Personnaliser le Prompt : {prompt.title}
              </h3>
            </div>
            <p>{prompt.description}</p>
          </div>
          <button
            onClick={onClose}
            className="bridge-ai-icon-button"
            aria-label="Fermer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="bridge-ai-modal-form">
          {detectedKeys.length > 0 ? (
            <div className="bridge-ai-variable-list">
              <div className="bridge-ai-variable-title">
                Variables du Template ({detectedKeys.length}) :
              </div>
              {detectedKeys.map(key => (
                <div key={key} className="bridge-ai-variable-field">
                  <label>
                    <span />
                    {key.replace(/_/g, ' ')} :
                  </label>
                  <input
                    type="text"
                    required
                    value={variables[key] || ''}
                    onChange={(e) => handleInputChange(key, e.target.value)}
                    placeholder={`Entrez la valeur pour ${key}...`}
                    className="bridge-ai-variable-input"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="bridge-ai-modal-note">
              Ce template ne contient pas de variables dynamiques. Vous pouvez l'envoyer directement à l'Assistant IA.
            </div>
          )}

          {/* Live Preview of resulting prompt */}
          <div className="bridge-ai-prompt-preview">
            <div>
              Aperçu du prompt prêt à l'emploi :
            </div>
            <div>
              {getComputedPrompt()}
            </div>
          </div>

          {/* Footer Actions */}
          <div className="bridge-ai-modal-actions">
            <button
              type="button"
              onClick={onClose}
              className="bridge-ai-tool-button"
            >
              Annuler
            </button>
            <button
              type="submit"
              className="bridge-ai-tool-button bridge-ai-new-chat"
            >
              <span>Injecter dans l’Assistant IA</span><ArrowRight size={14} />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
