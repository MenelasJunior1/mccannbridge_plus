import { useEffect, useRef, useState } from 'react';
import { Bell, ChevronDown, LogOut, Menu, Search, Wifi } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function AppHeader({ currentSection, notifications = [], onOpenMenu }) {
  const { user, logout } = useAuth();
  const [openPanel, setOpenPanel] = useState(null);
  const headerRef = useRef(null);
  const visibleNotifications = notifications.slice(0, 5);
  const initials = user?.user?.split(' ').map((word) => word[0]).join('').slice(0, 2).toUpperCase() || 'BR';

  useEffect(() => {
    const close = (event) => {
      if (headerRef.current && !headerRef.current.contains(event.target)) setOpenPanel(null);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, []);

  return (
    <header className="bridge-app-header" ref={headerRef}>
      <div className="bridge-app-header-left">
        <button className="bridge-mobile-menu" type="button" onClick={onOpenMenu} aria-label="Ouvrir la navigation">
          <Menu size={21} />
        </button>
        <div className="bridge-page-context">
          <span>Espace de travail</span>
          <h1>{currentSection?.label || 'Bridge'}</h1>
        </div>
      </div>

      <div className="bridge-app-header-right">
        <label className="bridge-global-search">
          <Search size={16} />
          <span className="sr-only">Rechercher dans Bridge</span>
          <input type="search" placeholder="Rechercher" />
          <kbd>⌘ K</kbd>
        </label>

        <div className="bridge-connection-state" title="État de la plateforme">
          <Wifi size={15} /><span>Opérationnel</span>
        </div>

        <div className="bridge-header-menu">
          <button
            type="button"
            className={`bridge-header-icon ${openPanel === 'notifications' ? 'active' : ''}`}
            onClick={() => setOpenPanel(openPanel === 'notifications' ? null : 'notifications')}
            aria-label="Notifications"
            aria-expanded={openPanel === 'notifications'}
          >
            <Bell size={19} />
            {notifications.length > 0 && <span>{Math.min(notifications.length, 9)}</span>}
          </button>
          {openPanel === 'notifications' && (
            <div className="bridge-header-panel bridge-notifications-panel">
              <div className="bridge-panel-heading"><strong>Notifications</strong><small>{notifications.length} nouvelle{notifications.length > 1 ? 's' : ''}</small></div>
              {visibleNotifications.length ? visibleNotifications.map((notification) => (
                <article key={notification.id}>
                  <i className={`type-${notification.type || 'info'}`} />
                  <div><strong>{notification.text}</strong><span>{notification.time}</span></div>
                </article>
              )) : <p className="bridge-panel-empty">Vous êtes à jour.</p>}
            </div>
          )}
        </div>

        <div className="bridge-header-menu">
          <button
            type="button"
            className="bridge-account-trigger"
            onClick={() => setOpenPanel(openPanel === 'account' ? null : 'account')}
            aria-expanded={openPanel === 'account'}
          >
            <span className="bridge-account-avatar">
              {user?.photoURL ? <img src={user.photoURL} alt="" /> : initials}
            </span>
            <span className="bridge-account-copy"><strong>{user?.user || 'Utilisateur'}</strong><small>{user?.poste || 'Membre'}</small></span>
            <ChevronDown size={15} />
          </button>
          {openPanel === 'account' && (
            <div className="bridge-header-panel bridge-account-panel">
              <div><strong>{user?.user || 'Utilisateur'}</strong><span>{user?.email || ''}</span></div>
              <button type="button" onClick={logout}><LogOut size={16} /> Se déconnecter</button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
