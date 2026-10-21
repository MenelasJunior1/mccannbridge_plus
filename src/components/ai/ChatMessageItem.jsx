import React, { useState } from 'react';
import { Bot, Check, ChevronDown, ChevronUp, Clipboard, FileText, ThumbsDown, ThumbsUp, UserRound } from 'lucide-react';

export default function ChatMessageItem({
  message,
  agent,
  onFeedback,
  onOpenDocPreview
}) {
  const [copied, setCopied] = useState(false);
  const [showSources, setShowSources] = useState(true);

  const isAssistant = message.role === 'assistant';

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple Markdown-like renderer for headlines, bullet points, bold and tables
  const renderFormattedContent = (content) => {
    if (!content) return null;

    const lines = content.split('\n');
    return lines.map((line, idx) => {
      // Heading 3 / 4
      if (line.startsWith('### ')) {
        return (
          <h3 key={idx} className="bridge-ai-message-h3">
            {line.replace('### ', '')}
          </h3>
        );
      }
      if (line.startsWith('#### ')) {
        return (
          <h4 key={idx} className="bridge-ai-message-h4">
            {line.replace('#### ', '')}
          </h4>
        );
      }
      if (line.startsWith('---')) {
        return <hr key={idx} className="bridge-ai-message-rule" />;
      }
      // List items
      if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
        const itemText = line.trim().replace(/^[-*]\s+/, '');
        return (
          <li key={idx} className="bridge-ai-message-list-item">
            {renderBoldAndItalics(itemText)}
          </li>
        );
      }
      // Numbered list
      if (/^\d+\.\s+/.test(line.trim())) {
        const numText = line.trim().replace(/^\d+\.\s+/, '');
        return (
          <div key={idx} className="bridge-ai-message-numbered">
            <span>{line.trim().match(/^\d+\./)[0]}</span>
            <span>{renderBoldAndItalics(numText)}</span>
          </div>
        );
      }
      // Empty line
      if (!line.trim()) {
        return <div key={idx} className="bridge-ai-message-space" />;
      }
      // Standard text line
      return (
        <p key={idx} className="bridge-ai-message-paragraph">
          {renderBoldAndItalics(line)}
        </p>
      );
    });
  };

  const renderBoldAndItalics = (text) => {
    // Replace **bold** and *italic*
    const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('*') && part.endsWith('*')) {
        return <em key={i}>{part.slice(1, -1)}</em>;
      }
      return part;
    });
  };

  return (
    <div className={`bridge-ai-message-row ${isAssistant ? 'assistant' : 'user'} animate-in fade-in`}>
      {/* Assistant Avatar */}
      {isAssistant && (
        <div 
          className="bridge-ai-message-avatar"
        >
          <Bot size={16} />
        </div>
      )}

      {/* Message Bubble Container */}
      <div className={`bridge-ai-message-bubble ${isAssistant ? 'assistant' : 'user'}`}>
        {/* Header with Agent Name / Role */}
        {isAssistant && (
          <div className="bridge-ai-message-head">
            <div>
              <span>
                {agent?.name || 'McCann Assistant IA'}
              </span>
              <small>
                {agent?.role || 'Expert'}
              </small>
            </div>
            {message.createdAt && (
              <time>
                {new Date(message.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </time>
            )}
          </div>
        )}

        {/* Message Content */}
        <div className="bridge-ai-message-content">
          {isAssistant ? (
            renderFormattedContent(message.content)
          ) : (
            <p className="bridge-ai-message-paragraph">{message.content}</p>
          )}
        </div>

        {/* Sources / Citations list for RAG */}
        {isAssistant && message.sources && message.sources.length > 0 && (
          <div className="bridge-ai-sources">
            <div 
              onClick={() => setShowSources(!showSources)}
              className="bridge-ai-sources-toggle"
            >
              <div>
                <FileText size={14} />
                <span>Sources documentaires citées ({message.sources.length})</span>
              </div>
              <span>{showSources ? <><ChevronUp size={13} /> Masquer</> : <><ChevronDown size={13} /> Afficher</>}</span>
            </div>

            {showSources && (
              <div className="bridge-ai-source-list">
                {message.sources.map((src, i) => (
                  <div 
                    key={i}
                    onClick={() => onOpenDocPreview && onOpenDocPreview(src.documentId)}
                    className="bridge-ai-source"
                  >
                    <div>
                      <div>
                        <FileText size={13} />
                        <span>{src.title}</span>
                        {src.page && <small>Page {src.page}</small>}
                      </div>
                      {src.excerpt && (
                        <p>
                          "{src.excerpt}"
                        </p>
                      )}
                    </div>
                    <span>Consulter</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Assistant Bottom Toolbar */}
        {isAssistant && (
          <div className="bridge-ai-message-actions">
            <div>
              <button
                type="button"
                onClick={handleCopy}
                className="bridge-ai-message-action"
                title="Copier la réponse"
              >
                {copied ? <Check size={13} /> : <Clipboard size={13} />}
                <span>{copied ? 'Copié !' : 'Copier'}</span>
              </button>
            </div>

            {/* Like / Dislike Feedback */}
            <div>
              <button
                type="button"
                onClick={() => onFeedback && onFeedback(message.id, 'positive')}
                className={`bridge-ai-feedback ${message.feedback === 'positive' ? 'active positive' : ''}`}
                title="Réponse utile"
              >
                <ThumbsUp size={13} />
              </button>
              <button
                type="button"
                onClick={() => onFeedback && onFeedback(message.id, 'negative')}
                className={`bridge-ai-feedback ${message.feedback === 'negative' ? 'active negative' : ''}`}
                title="À améliorer"
              >
                <ThumbsDown size={13} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* User Avatar */}
      {!isAssistant && (
        <div className="bridge-ai-message-avatar user">
          <UserRound size={15} />
        </div>
      )}
    </div>
  );
}
