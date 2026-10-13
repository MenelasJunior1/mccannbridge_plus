import React, { useState, useRef } from 'react';

/**
 * Resizes and optimizes image files locally before converting to Data URL.
 * Ensures the image fits comfortably in state/Firestore without exceeding limits.
 */
export const processImageFile = (file, maxWidth = 1200, maxHeight = 1200, quality = 0.85) => {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject(new Error('Le fichier sélectionné n\'est pas une image valide.'));
      return;
    }

    if (file.type === 'image/svg+xml') {
      const reader = new FileReader();
      reader.onload = () => resolve({
        dataUrl: reader.result,
        size: file.size,
        name: file.name,
        width: 600,
        height: 400
      });
      reader.onerror = reject;
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width > height) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        const mimeType = file.type === 'image/png' && width * height < 400000 ? 'image/png' : 'image/jpeg';
        const dataUrl = canvas.toDataURL(mimeType, quality);
        resolve({
          dataUrl,
          width,
          height,
          name: file.name,
          size: Math.round((dataUrl.length * 3) / 4),
        });
      };
      img.onerror = () => reject(new Error('Erreur lors du décodage de l\'image.'));
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

export const BRAND_IMAGE_PRESETS = [
  {
    label: 'Orange Telco',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%23ff7900"/><circle cx="520" cy="80" r="180" fill="%23ff9233" opacity="0.45"/><text x="40" y="145" font-family="system-ui,sans-serif" font-size="34" font-weight="900" fill="white">Orange Cameroun</text><text x="40" y="185" font-family="system-ui,sans-serif" font-size="18" fill="white" opacity="0.95">Réseau 4G+/5G %26 Offres Voix / Data</text><rect x="40" y="220" width="145" height="38" rx="19" fill="white"/><text x="112" y="244" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="bold" fill="%23ff7900">En savoir plus</text></svg>`,
    badge: 'Telco 4G/5G'
  },
  {
    label: 'Orange Money',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%231a1a2e"/><defs><linearGradient id="omG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%25" stop-color="%23ff7900"/><stop offset="100%25" stop-color="%238e44ad"/></linearGradient></defs><rect width="600" height="340" fill="url(%23omG)" opacity="0.92"/><circle cx="500" cy="85" r="150" fill="white" opacity="0.12"/><text x="40" y="145" font-family="system-ui,sans-serif" font-size="36" font-weight="900" fill="white">Orange Money</text><text x="40" y="185" font-family="system-ui,sans-serif" font-size="18" fill="white" opacity="0.95">Transferts %26 Paiements sécurisés 0 FCFA</text><rect x="40" y="220" width="165" height="38" rx="19" fill="%23ff7900"/><text x="122" y="244" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="bold" fill="white">#IciOnEstEnFamille</text></svg>`,
    badge: 'Fintech / OM'
  },
  {
    label: 'Max It Promo',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%230b132b"/><circle cx="300" cy="170" r="140" fill="%230284c7" opacity="0.3"/><text x="300" y="145" text-anchor="middle" font-family="system-ui,sans-serif" font-size="40" font-weight="900" fill="%2338bdf8">Max it App</text><text x="300" y="185" text-anchor="middle" font-family="system-ui,sans-serif" font-size="18" fill="white" opacity="0.95">Super-App Télécoms, OM %26 Bons plans</text><rect x="220" y="220" width="160" height="38" rx="19" fill="%23ff7900"/><text x="300" y="244" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="bold" fill="white">Télécharger Max it</text></svg>`,
    badge: 'Super-App'
  },
  {
    label: 'Orange Pulse',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%2318181b"/><defs><linearGradient id="pG" x1="0" y1="0" x2="1" y2="1"><stop offset="0%25" stop-color="%23e11d48"/><stop offset="100%25" stop-color="%23ff7900"/></linearGradient></defs><rect width="600" height="340" fill="url(%23pG)" opacity="0.88"/><circle cx="480" cy="90" r="130" fill="white" opacity="0.15"/><text x="40" y="145" font-family="system-ui,sans-serif" font-size="36" font-weight="900" fill="white">Pulse Community</text><text x="40" y="185" font-family="system-ui,sans-serif" font-size="18" fill="white" opacity="0.95">Gaming, Musique %26 Pass Data Jeunes</text><rect x="40" y="220" width="145" height="38" rx="19" fill="white"/><text x="112" y="244" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="bold" fill="%23e11d48">Rejoins la team</text></svg>`,
    badge: 'Jeunes & Gaming'
  },
  {
    label: 'ODC Tech & RSE',
    url: `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="340" viewBox="0 0 600 340"><rect width="600" height="340" fill="%230f172a"/><circle cx="500" cy="80" r="140" fill="%2310b981" opacity="0.3"/><text x="40" y="145" font-family="system-ui,sans-serif" font-size="32" font-weight="bold" fill="%23ff7900">Orange Digital Center</text><text x="40" y="185" font-family="system-ui,sans-serif" font-size="18" fill="white" opacity="0.9">Formations gratuites aux métiers d'avenir</text><rect x="40" y="220" width="150" height="38" rx="19" fill="%2310b981"/><text x="115" y="244" text-anchor="middle" font-family="system-ui,sans-serif" font-size="13" font-weight="bold" fill="white">Inscriptions ouvertes</text></svg>`,
    badge: 'Formation ODC'
  }
];

export default function PublicationImageManager({
  value = '',
  onChange,
  label = 'Image / Visuel de la publication',
  compact = false
}) {
  const isDataUrl = Boolean(value && (value.startsWith('data:') || value.startsWith('blob:')));
  const [activeTab, setActiveTab] = useState(isDataUrl ? 'upload' : 'url');
  const [urlInput, setUrlInput] = useState(isDataUrl ? '' : (value || ''));
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);
  const fileInputRef = useRef(null);

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    setIsLoading(true);
    setPreviewError(false);
    try {
      const res = await processImageFile(file);
      onChange(res.dataUrl);
      setActiveTab('upload');
      setUrlInput('');
    } catch (err) {
      alert(err.message || 'Impossible de traiter cette image.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUrlSubmit = (url) => {
    setUrlInput(url);
    setPreviewError(false);
    onChange(url.trim());
  };

  const handleClearImage = () => {
    onChange('');
    setUrlInput('');
    setPreviewError(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="pub-form-group adv-image-manager-root">
      <div className="flex justify-between items-center mb-6">
        <label className="pub-form-label mb-0">{label}</label>
        {value && (
          <button
            type="button"
            className="text-xs text-rose-400 hover:text-rose-300 font-medium flex items-center gap-1 transition-colors"
            onClick={handleClearImage}
          >
            🗑️ Supprimer l'image
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="adv-image-tabs">
        <button
          type="button"
          className={`adv-image-tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <span>📁 Téléverser un fichier</span>
          {isDataUrl && <span className="adv-tab-badge">Actif</span>}
        </button>
        <button
          type="button"
          className={`adv-image-tab ${activeTab === 'url' ? 'active' : ''}`}
          onClick={() => setActiveTab('url')}
        >
          <span>🔗 Lien URL web</span>
          {!isDataUrl && value && <span className="adv-tab-badge">Actif</span>}
        </button>
      </div>

      {/* Tab Content: Upload */}
      {activeTab === 'upload' && (
        <div className="adv-tab-pane">
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg, image/webp, image/gif, image/svg+xml"
            className="hidden"
            onChange={(e) => handleFiles(e.target.files)}
          />

          <div
            className={`adv-dropzone ${isDragging ? 'dragging' : ''} ${isLoading ? 'loading' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setIsDragging(false);
              handleFiles(e.dataTransfer.files);
            }}
          >
            <div className="adv-dropzone-icon">
              {isLoading ? '⏳' : '📤'}
            </div>
            <div className="adv-dropzone-text">
              {isLoading ? (
                <span>Optimisation de l'image en cours...</span>
              ) : (
                <>
                  <strong className="text-white">Cliquez pour parcourir</strong> ou glissez-déposez une image ici
                </>
              )}
            </div>
            <div className="adv-dropzone-sub">
              Formats supportés : PNG, JPG, WEBP, SVG · Optimisation automatique
            </div>
          </div>
        </div>
      )}

      {/* Tab Content: URL */}
      {activeTab === 'url' && (
        <div className="adv-tab-pane space-y-8">
          <div className="flex gap-4">
            <input
              type="url"
              className="pub-form-input flex-1"
              placeholder="Collez l'URL de l'image (https://...)"
              value={urlInput}
              onChange={(e) => {
                setUrlInput(e.target.value);
                onChange(e.target.value.trim());
              }}
            />
            {urlInput && (
              <button
                type="button"
                className="btn-icon-sm px-8"
                onClick={() => handleUrlSubmit('')}
                title="Effacer le lien"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick presets */}
          <div>
            <div className="text-xs text-slate-400 mb-4 flex items-center justify-between">
              <span>Visuels prédéfinis de marque (100% garantis) :</span>
            </div>
            <div className="flex gap-4 flex-wrap">
              {BRAND_IMAGE_PRESETS.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="adv-preset-pill"
                  onClick={() => handleUrlSubmit(preset.url)}
                  title={preset.badge}
                >
                  <span className="adv-preset-dot" />
                  <span>{preset.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Live Preview Box if an image is provided */}
      {value && (
        <div className="adv-image-preview-box mt-10">
          <div className="adv-image-preview-header">
            <span className="text-xs font-semibold text-slate-300 flex items-center gap-4">
              <span>{isDataUrl ? '📁 Image téléversée (locale)' : '🌐 Lien distant'}</span>
            </span>
            <span className="text-xs text-emerald-400 font-medium">✓ Prête pour la publication</span>
          </div>

          <div className="adv-image-preview-media">
            {!previewError ? (
              <img
                src={value}
                alt="Aperçu publication"
                referrerPolicy="no-referrer"
                onError={() => setPreviewError(true)}
              />
            ) : (
              <div className="adv-image-error-state">
                <span className="text-2xl">⚠️</span>
                <span className="text-xs text-rose-300 font-medium">
                  Impossible d'afficher cette image distante (URL bloquée ou inexistante).
                </span>
                <button
                  type="button"
                  className="btn btn-blue btn-xs mt-4"
                  onClick={() => fileInputRef.current?.click()}
                >
                  📤 Téléverser une image locale à la place
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
