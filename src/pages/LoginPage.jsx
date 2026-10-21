'use client';

import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ArrowRight, KeyRound, Mail, ShieldCheck } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { requestMagicLink, confirmMagicLink, loginWithPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [mode, setMode] = useState('magic');
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = new URLSearchParams(location.search).get('token');
    if (!token) return;

    setStatus('loading');
    confirmMagicLink(token)
      .then((user) => {
        window.history.replaceState({}, '', '/login');
        navigate(user?.role === 'agence' ? '/traffic' : '/briefs', { replace: true });
      })
      .catch(() => {
        setStatus('error');
        setMessage('Ce lien est invalide ou a expiré. Demandez un nouveau lien de connexion.');
      });
  }, [confirmMagicLink, location.search, navigate]);

  const submit = async (event) => {
    event.preventDefault();
    setStatus('loading');
    setMessage('');

    try {
      if (mode === 'magic') {
        await requestMagicLink(email);
        setStatus('sent');
        setMessage('Si ce compte existe, un lien de connexion vient d’être envoyé à cette adresse.');
      } else {
        const user = await loginWithPassword(email, password);
        navigate(user?.role === 'agence' ? '/traffic' : '/briefs', { replace: true });
      }
    } catch (error) {
      setStatus('error');
      setMessage(error.code === 'invalid_credentials'
        ? 'Adresse ou mot de passe incorrect.'
        : 'La connexion est momentanément indisponible.');
    }
  };

  return (
    <main className="next-auth-page">
      <section className="next-auth-story">
        <Link to="/" className="next-auth-brand"><span>M</span><strong>McCann Bridge</strong></Link>
        <div>
          <p className="eyebrow">Workspace sécurisé</p>
          <h1>Les décisions commencent par un accès maîtrisé.</h1>
          <p>Les identités, rôles et périmètres client sont validés par Phoenix avant tout accès aux données et à l’assistant.</p>
        </div>
        <ul>
          <li><ShieldCheck size={17} /> Rôles calculés côté serveur</li>
          <li><ShieldCheck size={17} /> Sessions signées et auditables</li>
          <li><ShieldCheck size={17} /> Sources RAG revalidées</li>
        </ul>
      </section>

      <section className="next-auth-form-panel">
        <form className="next-auth-card" onSubmit={submit}>
          <p className="eyebrow">Connexion</p>
          <h2>Accéder à Bridge</h2>
          <p>Utilisez votre adresse professionnelle. Le lien magique est recommandé.</p>

          <div className="next-auth-tabs" role="tablist" aria-label="Mode de connexion">
            <button type="button" className={mode === 'magic' ? 'is-active' : ''} onClick={() => setMode('magic')}>
              <Mail size={15} /> Lien magique
            </button>
            <button type="button" className={mode === 'password' ? 'is-active' : ''} onClick={() => setMode('password')}>
              <KeyRound size={15} /> Mot de passe
            </button>
          </div>

          <label htmlFor="login-email">Adresse e-mail</label>
          <input id="login-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required />

          {mode === 'password' && (
            <>
              <label htmlFor="login-password">Mot de passe</label>
              <input id="login-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" minLength={12} required />
            </>
          )}

          <button className="next-auth-submit" type="submit" disabled={status === 'loading'}>
            {status === 'loading' ? 'Vérification…' : mode === 'magic' ? 'Recevoir le lien' : 'Se connecter'}
            {status !== 'loading' && <ArrowRight size={17} />}
          </button>

          {message && <p className={`next-auth-message is-${status}`} role="status">{message}</p>}
          <Link to="/" className="next-auth-back">Retour à l’accueil</Link>
        </form>
      </section>
    </main>
  );
}
