import { NavLink, useLocation } from 'react-router-dom';
import {
  BarChart3, Bot, CalendarDays, CheckSquare2, ChevronLeft, ChevronRight,
  FileBarChart, FileStack, Gauge, Library, ListChecks, LogOut, Megaphone,
  PanelLeftClose, Settings2, ShieldCheck, Sparkles, TrendingUp, Users
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AGENCE_SECTIONS, CLIENT_SECTIONS } from '../../utils/constants';
import { calcScore } from '../../utils/helpers';

const NAV_ICONS = {
  'assistant-ia': Bot,
  documents: FileStack,
  prompts: Library,
  briefs: ListChecks,
  'traffic-manager': Gauge,
  calendar: CalendarDays,
  validation: CheckSquare2,
  influence: Megaphone,
  reports: FileBarChart,
  dashboard: BarChart3,
  finance: TrendingUp,
  growth: Sparkles,
  'admin-ia': Settings2,
  tasks: CheckSquare2,
  users: Users,
  monitoring: ShieldCheck,
};

const groupSections = (sections) => [
  { label: 'Espace de travail', ids: ['assistant-ia', 'documents', 'briefs', 'traffic-manager', 'calendar', 'validation', 'tasks'] },
  { label: 'Performance', ids: ['influence', 'reports', 'dashboard', 'finance', 'growth'] },
  { label: 'Configuration', ids: ['prompts', 'admin-ia', 'users', 'monitoring'] },
].map((group) => ({ ...group, sections: group.ids.map((id) => sections.find((section) => section.id === id)).filter(Boolean) }))
  .filter((group) => group.sections.length > 0);

export default function Sidebar({ isOpen, collapsed, onToggle, onClose }) {
  const { user, logout, isAgency, isClient } = useAuth();
  const { tickets, calendar } = useApp();
  const location = useLocation();

  const isClientRole = isClient || user?.role === 'client' || !isAgency;
  const rawSections = isAgency && !isClientRole ? AGENCE_SECTIONS : CLIENT_SECTIONS;
  const sections = rawSections.filter(s => {
    if (s.id === 'monitoring' && user?.systemRole !== 'super_admin') return false;
    if (isClientRole) {
      return s.id !== 'dashboard' && s.id !== 'users';
    }
    return true;
  });

  const getBadge = (id) => {
    if (id === 'traffic-manager' || id === 'traffic-ia') {
      return tickets.filter(t => t.priority === 'p0_urgent' || t.status === 'backlog' || t.blockage?.isBlocked || calcScore(t) >= 80).length;
    }
    if (id === 'validation') return calendar.filter(c => c.status === 'pending').length;
    return 0;
  };

  const handleNavClick = () => {
    if (onClose) {
      onClose();
    }
  };

  return (
    <aside 
      id="appSidebar"
      className={`sidebar bridge-sidebar ${isOpen ? 'sidebar-open' : ''} ${collapsed ? 'is-collapsed' : ''}`}
      aria-label="Navigation principale"
    >
      <div className="sidebar-header">
        <div className="sidebar-header-top">
          <div className="bridge-sidebar-brand">
            <span className="bridge-sidebar-mark">M</span>
            <div>
              <div className="sidebar-logo">BRIDGE</div>
              <div className="sidebar-subtitle">McCann OS</div>
            </div>
          </div>
          {/* Mobile & Tablet Close Button */}
          <button 
            className="sidebar-mobile-close" 
            onClick={onClose}
            aria-label="Fermer le menu de navigation"
          >
            <PanelLeftClose size={20} />
          </button>
        </div>
        <div className="sidebar-cloud-badge" title={user?.client || 'Orange Cameroun'}>
          <span className="sidebar-cloud-dot" aria-hidden="true"></span>
          <span>{user?.client || 'Orange Cameroun'}</span>
        </div>
      </div>

      <button className="bridge-sidebar-toggle" type="button" onClick={onToggle} aria-label={collapsed ? 'Déplier la navigation' : 'Replier la navigation'}>
        {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
      </button>

      <div className="sidebar-nav">
        {groupSections(sections).map((group) => (
          <div className="bridge-nav-group" key={group.label}>
            <div className="bridge-nav-group-label">{group.label}</div>
            {group.sections.map((section) => {
              const badge = getBadge(section.id);
              const isActive = location.pathname === section.path || location.pathname.startsWith(section.path + '/');
              const Icon = NAV_ICONS[section.id] || ShieldCheck;
              return (
                <NavLink key={section.id} to={section.path} onClick={handleNavClick} className={`sidebar-item ${isActive ? 'active' : ''}`} title={collapsed ? section.label : undefined}>
                  <span className="icon"><Icon size={18} /></span>
                  <span className="label">{section.label}</span>
                  {badge > 0 && <span className="sidebar-badge">{badge}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        <div className="bridge-sidebar-account">
          <div className="avatar avatar-md">
            {user?.photoURL ? (
              <img src={user.photoURL} alt={user?.user || ''} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              user?.user?.split(' ').map(w => w[0]).join('').slice(0, 2) || 'BR'
            )}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="text-sm font-semibold truncate" style={{ color: 'var(--white)' }}>{user?.user || 'Utilisateur'}</div>
            <div className="text-xs text-muted truncate">{user?.poste || (isAgency ? 'Admin Agence' : 'Client')}</div>
          </div>
        </div>
        <button onClick={logout} className="bridge-sidebar-logout" title="Déconnexion">
          <LogOut size={17} /><span>Déconnexion</span>
        </button>
      </div>
    </aside>
  );
}
