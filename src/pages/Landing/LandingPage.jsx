import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BarChart3,
  BrainCircuit,
  Check,
  Database,
  FileText,
  Menu,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  X,
} from 'lucide-react';

const clientLogos = [
  { name: 'Orange Cameroun', src: '/assets/logos/orange-cameroun.svg' },
  { name: 'Boissons du Cameroun', src: '/assets/logos/boissons-du-cameroun.svg' },
  { name: 'Chococam', src: '/assets/logos/chococam.svg' },
  { name: 'Orange Burkina Faso', src: '/assets/logos/orange-burkina.svg' },
];

const features = [
  {
    icon: Workflow,
    eyebrow: 'Opérations',
    title: 'Un trafic vraiment partagé',
    text: 'Centralisez briefs, tâches, validations et calendriers dans un même espace de pilotage.',
  },
  {
    icon: BrainCircuit,
    eyebrow: 'Assistant IA',
    title: 'Des réponses reliées aux sources',
    text: 'Interrogez vos documents métier et gardez une trace claire des sources utilisées par l’assistant.',
  },
  {
    icon: BarChart3,
    eyebrow: 'Décision',
    title: 'Des rapports prêts à relire',
    text: 'Transformez les données de campagne en synthèses structurées avant leur validation humaine.',
  },
];

const workflow = [
  ['01', 'Collecter', 'Briefs, documents et données de campagne entrent dans un référentiel commun.'],
  ['02', 'Collaborer', 'Les équipes agence et client travaillent avec les mêmes priorités et validations.'],
  ['03', 'Décider', 'Les tableaux de bord et rapports rendent les actions suivantes immédiatement lisibles.'],
];

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    document.body.classList.add('mb-public-body');
    const revealTargets = document.querySelectorAll(
      '.mb-trust .mb-container, .mb-section-heading, .mb-feature-card, .mb-workflow-copy, .mb-report-preview, .mb-security-grid, .mb-final-panel'
    );
    revealTargets.forEach((element) => element.classList.add('bridge-scroll-reveal'));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.14, rootMargin: '0px 0px -7% 0px' });
    revealTargets.forEach((element) => observer.observe(element));
    return () => {
      observer.disconnect();
      document.body.classList.remove('mb-public-body');
    };
  }, []);

  return (
    <div className="mb-landing">
      <header className="mb-public-header">
        <div className="mb-public-nav">
          <Link className="mb-public-brand" to="/" aria-label="Bridge — accueil">
            <span className="mb-brand-mark" aria-hidden="true">M</span>
            <span>
              <strong>BRIDGE</strong>
              <small>McCann operating system</small>
            </span>
          </Link>

          <nav className="mb-public-links" aria-label="Navigation principale">
            <a href="#plateforme">Plateforme</a>
            <a href="#fonctionnalites">Fonctionnalités</a>
            <a href="#securite">Sécurité</a>
          </nav>

          <Link className="mb-header-cta" to="/login">
            Se connecter <ArrowRight size={16} />
          </Link>

          <button
            className="mb-menu-button"
            type="button"
            aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {menuOpen && (
          <nav className="mb-mobile-menu" aria-label="Navigation mobile">
            <a href="#plateforme" onClick={() => setMenuOpen(false)}>Plateforme</a>
            <a href="#fonctionnalites" onClick={() => setMenuOpen(false)}>Fonctionnalités</a>
            <a href="#securite" onClick={() => setMenuOpen(false)}>Sécurité</a>
            <Link to="/login">Se connecter <ArrowRight size={16} /></Link>
          </nav>
        )}
      </header>

      <main>
        <section className="mb-hero" id="plateforme">
          <div className="mb-hero-glow" aria-hidden="true" />
          <div className="mb-container mb-hero-grid">
            <div className="mb-hero-copy">
              <div className="mb-kicker"><Sparkles size={15} /> Intelligence collective, augmentée</div>
              <h1>Le workspace qui relie vos équipes, vos données et vos décisions.</h1>
              <p>
                Bridge réunit l’agence et ses clients autour d’un pilotage commun : briefs, production,
                campagnes, documents, assistant IA et rapports dans une expérience cohérente.
              </p>
              <div className="mb-hero-actions">
                <Link className="mb-primary-button" to="/login">
                  Accéder à Bridge <ArrowRight size={18} />
                </Link>
                <a className="mb-secondary-button" href="#fonctionnalites">Explorer la plateforme</a>
              </div>
              <div className="mb-hero-proof">
                <span><Check size={15} /> Accès par profil</span>
                <span><Check size={15} /> Sources traçables</span>
                <span><Check size={15} /> Validation humaine</span>
              </div>
            </div>

            <div className="mb-product-stage" aria-label="Aperçu de la plateforme Bridge">
              <div className="mb-stage-topbar">
                <span className="mb-mini-brand"><span>M</span> BRIDGE</span>
                <span className="mb-live-pill"><i /> Workspace actif</span>
              </div>
              <div className="mb-stage-content">
                <aside className="mb-stage-sidebar" aria-hidden="true">
                  <span className="active" /><span /><span /><span /><span />
                </aside>
                <div className="mb-stage-main">
                  <div className="mb-stage-heading">
                    <div><small>Vue d’ensemble</small><strong>Bonjour, équipe McCann</strong></div>
                    <div className="mb-stage-avatar">MK</div>
                  </div>
                  <div className="mb-stage-cards">
                    <article><span>Briefs à traiter</span><strong>12</strong><em>3 prioritaires</em></article>
                    <article><span>Validations</span><strong>08</strong><em>Cette semaine</em></article>
                    <article><span>Rapports</span><strong>05</strong><em>Prêts à relire</em></article>
                  </div>
                  <div className="mb-stage-lower">
                    <article className="mb-chart-card">
                      <div className="mb-card-title"><span>Activité des campagnes</span><small>30 jours</small></div>
                      <div className="mb-chart" aria-hidden="true">
                        <i style={{ height: '31%' }} /><i style={{ height: '48%' }} /><i style={{ height: '42%' }} />
                        <i style={{ height: '68%' }} /><i style={{ height: '57%' }} /><i style={{ height: '86%' }} />
                        <i style={{ height: '73%' }} /><i style={{ height: '100%' }} />
                      </div>
                    </article>
                    <article className="mb-assistant-card">
                      <span className="mb-ai-icon"><Sparkles size={18} /></span>
                      <small>Assistant Bridge</small>
                      <strong>Synthèse générée</strong>
                      <p>3 sources métier vérifiées</p>
                      <div><span /><span /><span /></div>
                    </article>
                  </div>
                </div>
              </div>
              <div className="mb-floating-note mb-note-one"><Database size={16} /><span><b>Base documentaire</b>Sources synchronisées</span></div>
              <div className="mb-floating-note mb-note-two"><ShieldCheck size={16} /><span><b>Accès sécurisé</b>Droits vérifiés</span></div>
            </div>
          </div>
        </section>

        <section className="mb-trust" aria-label="Clients accompagnés">
          <div className="mb-container">
            <p>Une plateforme pensée pour les équipes et les marques que nous accompagnons</p>
            <div className="mb-logo-row">
              {clientLogos.map((logo) => (
                <div className="mb-client-logo" key={logo.name}>
                  <img src={logo.src} alt={logo.name} />
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-features" id="fonctionnalites">
          <div className="mb-container">
            <div className="mb-section-heading">
              <span>Une seule plateforme</span>
              <h2>Du brief à la décision, sans perdre le fil.</h2>
              <p>Chaque module partage le même contexte pour réduire les ruptures entre production, suivi et reporting.</p>
            </div>
            <div className="mb-feature-grid">
              {features.map(({ icon: Icon, eyebrow, title, text }, index) => (
                <article className={`mb-feature-card mb-feature-${index + 1}`} key={title}>
                  <div className="mb-feature-icon"><Icon size={24} /></div>
                  <small>{eyebrow}</small>
                  <h3>{title}</h3>
                  <p>{text}</p>
                  <Link to="/login">Ouvrir le workspace <ArrowRight size={15} /></Link>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="mb-workflow">
          <div className="mb-container mb-workflow-grid">
            <div className="mb-workflow-copy">
              <span className="mb-section-label">Le fil Bridge</span>
              <h2>Une continuité opérationnelle de bout en bout.</h2>
              <p>Les informations utiles restent disponibles à chaque étape, avec leur contexte et leur responsable.</p>
              <div className="mb-workflow-list">
                {workflow.map(([number, title, text]) => (
                  <article key={number}>
                    <span>{number}</span>
                    <div><h3>{title}</h3><p>{text}</p></div>
                  </article>
                ))}
              </div>
            </div>
            <div className="mb-report-preview">
              <div className="mb-report-head">
                <span><FileText size={19} /> Rapport de campagne</span><small>Prêt à valider</small>
              </div>
              <div className="mb-report-body">
                <span className="mb-report-label">Synthèse exécutive</span>
                <h3>Une lecture claire des résultats et des prochaines actions.</h3>
                <div className="mb-report-lines"><span /><span /><span /></div>
                <div className="mb-report-metrics">
                  <article><small>Sources</small><strong>Vérifiées</strong></article>
                  <article><small>Statut</small><strong>À relire</strong></article>
                </div>
                <div className="mb-report-insight">
                  <Sparkles size={18} />
                  <span><b>Insight suggéré</b>Concentrer le prochain cycle sur les formats les plus engageants.</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="mb-security" id="securite">
          <div className="mb-container mb-security-grid">
            <div>
              <span className="mb-section-label">Confiance par conception</span>
              <h2>Vos équipes voient ce qui leur est utile.</h2>
            </div>
            <div className="mb-security-points">
              <article><Users size={22} /><div><h3>Espaces par profil</h3><p>Les parcours agence et client donnent accès aux outils adaptés à chaque rôle.</p></div></article>
              <article><ShieldCheck size={22} /><div><h3>Accès maîtrisés</h3><p>Les droits restent appliqués à travers les modules et les documents métier.</p></div></article>
              <article><Database size={22} /><div><h3>Contexte conservé</h3><p>Les réponses de l’assistant s’appuient sur les sources autorisées et identifiables.</p></div></article>
            </div>
          </div>
        </section>

        <section className="mb-final-cta">
          <div className="mb-container">
            <div className="mb-final-panel">
              <div><span>Votre espace est prêt</span><h2>Faites circuler les idées. Gardez le contrôle.</h2></div>
              <Link className="mb-light-button" to="/login">Se connecter à Bridge <ArrowRight size={18} /></Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="mb-public-footer">
        <div className="mb-container">
          <Link className="mb-public-brand" to="/"><span className="mb-brand-mark">M</span><span><strong>BRIDGE</strong><small>McCann operating system</small></span></Link>
          <p>Plateforme collaborative agence × grands comptes.</p>
          <Link to="/login">Connexion</Link>
        </div>
      </footer>
    </div>
  );
}
