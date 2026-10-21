import { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import AppHeader from './AppHeader';
import { useAuth } from '../../context/AuthContext';
import { useApp } from '../../context/AppContext';
import { AGENCE_SECTIONS, CLIENT_SECTIONS } from '../../utils/constants';

export default function DashboardLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => localStorage.getItem('bridge_sidebar_collapsed') === 'true');
  const location = useLocation();
  const { isAgency, isClient, user } = useAuth();
  const { notifications } = useApp();

  const isClientRole = isClient || user?.role === 'client' || !isAgency;
  const rawSections = isAgency && !isClientRole ? AGENCE_SECTIONS : CLIENT_SECTIONS;
  const sections = rawSections.filter(s => {
    if (isClientRole) {
      return s.id !== 'dashboard' && s.id !== 'users';
    }
    return true;
  });
  const currentSection = sections.find(
    s => location.pathname === s.path || location.pathname.startsWith(s.path + '/')
  );

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Legacy modules still contain decorative emoji in data labels. Keep the
  // authenticated workspace typographically neutral while those modules are
  // progressively moved to the shared SVG icon system.
  useEffect(() => {
    const root = document.getElementById('mainContent');
    if (!root) return undefined;
    const emojiPattern = /(?:\p{Extended_Pictographic}|\p{Regional_Indicator}|\uFE0F|\u200D|\u20E3)/gu;
    const cleanTextNodes = (target) => {
      if (!target) return;
      const walker = document.createTreeWalker(target, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode();
      while (node) {
        const cleaned = node.nodeValue.replace(emojiPattern, '').replace(/\s{2,}/g, ' ');
        if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
        node = walker.nextNode();
      }
    };
    cleanTextNodes(root);
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'characterData') cleanTextNodes(mutation.target.parentNode);
        mutation.addedNodes.forEach((node) => {
          if (node.nodeType === Node.TEXT_NODE) {
            const cleaned = node.nodeValue.replace(emojiPattern, '').replace(/\s{2,}/g, ' ');
            if (cleaned !== node.nodeValue) node.nodeValue = cleaned;
          } else if (node.nodeType === Node.ELEMENT_NODE) cleanTextNodes(node);
        });
      });
    });
    observer.observe(root, { childList: true, subtree: true, characterData: true });
    return () => observer.disconnect();
  }, [location.pathname]);

  // Handle ESC key to close mobile drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileOpen]);

  const toggleSidebar = () => {
    setSidebarCollapsed((collapsed) => {
      localStorage.setItem('bridge_sidebar_collapsed', String(!collapsed));
      return !collapsed;
    });
  };

  return (
    <div className={`app-layout bridge-app-shell ${mobileOpen ? 'drawer-active' : ''} ${sidebarCollapsed ? 'sidebar-is-collapsed' : ''}`}>
      <div 
        className={`mobile-backdrop ${mobileOpen ? 'open' : ''}`}
        onClick={() => setMobileOpen(false)} 
        aria-hidden="true"
      />

      {/* Sidebar with overlay drawer support on < 1024px */}
      <Sidebar
        isOpen={mobileOpen}
        collapsed={sidebarCollapsed}
        onToggle={toggleSidebar}
        onClose={() => setMobileOpen(false)}
      />

      <main className="main-content" id="mainContent" role="main">
        <AppHeader
          currentSection={currentSection}
          notifications={notifications}
          onOpenMenu={() => setMobileOpen(true)}
        />
        <div className="content-area bridge-route-stage" key={location.pathname}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}

