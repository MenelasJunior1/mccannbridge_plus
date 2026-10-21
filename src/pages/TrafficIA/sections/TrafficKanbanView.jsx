import React from 'react';
import { Activity, AlertTriangle, Building2, CalendarDays, Clock3, Plus } from 'lucide-react';
import { TRAFFIC_STATUSES, PRIORITY_LEVELS } from '../../../data/tickets';
import { TEAM, POLES } from '../../../data/team';
import { calcScore, getScoreColor, getSlaCountdown } from '../../../utils/helpers';

export default function TrafficKanbanView({
  tickets = [],
  currentRole,
  activeExecutantId,
  selectedStatusFilter,
  selectedPoleFilter,
  searchQuery,
  onSelectTicket,
  onUpdateStatus,
  onOpenNewTicket,
}) {
  const allMembers = [
    ...(TEAM.creatives || []),
    ...(TEAM.cdp || []),
    ...(TEAM.cm || []),
    ...(TEAM.specialists || []),
    ...(TEAM.directors || []),
  ];

  // Filter tickets according to current perspective and active filters
  const filteredTickets = tickets.filter(ticket => {
    // Role specific visibility filtering
    if (currentRole === 'demandeur') {
      // Demandeur sees briefs from their entity/brand
    } else if (currentRole === 'executant') {
      // Executant only sees their assigned tasks or tasks where they are backup
      if (activeExecutantId && ticket.assignee !== activeExecutantId && ticket.backupId !== activeExecutantId) {
        return false;
      }
    }

    // Pole filter
    if (selectedPoleFilter && selectedPoleFilter !== 'all' && ticket.pole !== selectedPoleFilter) {
      return false;
    }

    // Status filter
    if (selectedStatusFilter && selectedStatusFilter !== 'all' && ticket.status !== selectedStatusFilter) {
      return false;
    }

    // Search query
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchTitle = ticket.title?.toLowerCase().includes(q);
      const matchId = ticket.id?.toLowerCase().includes(q);
      const matchBrand = ticket.brand?.toLowerCase().includes(q);
      if (!matchTitle && !matchId && !matchBrand) return false;
    }

    return true;
  });

  // Columns to show (if a specific status filter is active, only show that column or all)
  const columnsToShow = selectedStatusFilter && selectedStatusFilter !== 'all'
    ? TRAFFIC_STATUSES.filter(s => s.id === selectedStatusFilter)
    : TRAFFIC_STATUSES;

  return (
    <div 
      className="kanban-board animate-fade"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columnsToShow.length}, minmax(280px, 1fr))`,
        gap: 14,
        overflowX: 'auto',
        paddingBottom: 16,
        alignItems: 'start',
      }}
    >
      {columnsToShow.map(statusCol => {
        const colTickets = filteredTickets.filter(t => t.status === statusCol.id);
        const hasBlocked = colTickets.some(t => t.blockage?.isBlocked);

        return (
          <div
            key={statusCol.id}
            className="kanban-col card"
            style={{
              background: '#F8F9FA',
              borderRadius: 12,
              padding: 12,
              minHeight: 480,
              display: 'flex',
              flexDirection: 'column',
              borderTop: `4px solid ${statusCol.color}`,
              border: hasBlocked ? '1px solid #E74C3C' : '1px solid #E0E0E0',
            }}
          >
            {/* Column Header */}
            <div className="flex justify-between items-center mb-12">
              <div className="flex items-center gap-6">
                <span className="bridge-column-index">{String(TRAFFIC_STATUSES.findIndex((status) => status.id === statusCol.id) + 1).padStart(2, '0')}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--dark)' }}>
                    {statusCol.label}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--muted)' }}>
                    {statusCol.desc}
                  </div>
                </div>
              </div>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 12,
                  background: colTickets.length > 0 ? statusCol.color : '#DDD',
                  color: '#FFF',
                }}
              >
                {colTickets.length}
              </span>
            </div>

            {/* Special column hint */}
            {statusCol.id === 'backlog' && (
              <div style={{ fontSize: 11, background: '#FFF3E0', color: '#E65100', padding: '6px 8px', borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                <Clock3 size={13} /> SLA de qualification : <strong>&lt; 4 heures</strong>
              </div>
            )}
            {statusCol.id === 'client_review' && (
              <div style={{ fontSize: 11, background: '#E3F2FD', color: '#0D47A1', padding: '6px 8px', borderRadius: 6, marginBottom: 8, fontWeight: 600 }}>
                <Clock3 size={13} /> SLA de retour client : <strong>48 heures</strong>
              </div>
            )}

            {/* Column Ticket Cards List */}
            <div className="flex flex-col gap-10" style={{ flex: 1 }}>
              {colTickets.length === 0 ? (
                <div 
                  style={{
                    padding: 24,
                    textAlign: 'center',
                    color: 'var(--muted)',
                    fontSize: 12,
                    border: '1px dashed #DDD',
                    borderRadius: 8,
                    background: '#FFF',
                  }}
                >
                  Aucun flux à cette étape
                </div>
              ) : (
                colTickets.map(ticket => {
                  const priority = PRIORITY_LEVELS[ticket.priority] || PRIORITY_LEVELS.p1_strategic;
                  const pole = POLES.find(p => p.id === ticket.pole) || POLES[0];
                  const assignee = allMembers.find(m => m.id === ticket.assignee);
                  const isBlocked = ticket.blockage?.isBlocked;
                  const score = calcScore(ticket);
                  const scoreColor = getScoreColor(score);
                  const clientSla = ticket.status === 'client_review' ? getSlaCountdown(ticket.clientReviewDeadline) : null;
                  const qualifSla = ticket.status === 'backlog' ? getSlaCountdown(ticket.qualificationDeadline) : null;

                  return (
                    <div
                      key={ticket.id}
                      onClick={() => onSelectTicket(ticket)}
                      className="card kanban-card animate-fade"
                      style={{
                        background: '#FFFFFF',
                        borderRadius: 10,
                        padding: 12,
                        cursor: 'pointer',
                        boxShadow: isBlocked ? '0 0 0 2px #E74C3C' : '0 2px 6px rgba(0,0,0,0.04)',
                        border: isBlocked ? '1px solid #E74C3C' : '1px solid #EBEBEB',
                        position: 'relative',
                        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                      }}
                    >
                      {/* Priority and ID bar */}
                      <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-6">
                          <span 
                            style={{ 
                              fontSize: 10, 
                              fontWeight: 800, 
                              padding: '2px 6px', 
                              borderRadius: 4, 
                              background: priority.bg, 
                              color: priority.color 
                            }}
                          >
                            {priority.label.replace(/^[^\p{L}\p{N}]+/u, '').split(' ')[0]}
                          </span>
                          <span style={{ fontSize: 10, color: 'var(--muted)', fontWeight: 700 }}>
                            {ticket.id}
                          </span>
                        </div>

                        {/* Pole icon tag */}
                        <span 
                          style={{ 
                            fontSize: 10, 
                            fontWeight: 700, 
                            padding: '2px 6px', 
                            borderRadius: 4, 
                            background: '#F0F4F8', 
                            color: '#2C3E50' 
                          }}
                        >
                          {pole.label}
                        </span>
                      </div>

                      {/* Title */}
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--dark)', marginBottom: 6, lineHeight: 1.3 }}>
                        {ticket.title}
                      </div>

                      {/* Brand & Deadline */}
                      <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 8, display: 'flex', justifyContent: 'space-between' }}>
                        <span className="bridge-ticket-meta"><Building2 size={12} /> {ticket.brand || 'Orange Cameroun'}</span>
                        <span style={{ fontWeight: 600, color: ticket.daysLeft <= 1 ? '#E74C3C' : 'var(--dark)' }}>
                          <CalendarDays size={12} /> {ticket.deadline}
                        </span>
                      </div>

                      {/* Active Blockage Banner */}
                      {isBlocked && (
                        <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 10, fontWeight: 800, padding: '4px 6px', borderRadius: 4, marginBottom: 8 }}>
                          <AlertTriangle size={12} /> BLOCAGE : {ticket.blockage.reason}
                        </div>
                      )}

                      {/* SLA Warning */}
                      {clientSla && (
                        <div style={{ background: clientSla.isPassed ? '#FFEBEE' : '#E3F2FD', color: clientSla.isPassed ? '#C62828' : '#0D47A1', fontSize: 10, fontWeight: 700, padding: '4px 6px', borderRadius: 4, marginBottom: 8 }}>
                          <Clock3 size={12} /> {clientSla.text}
                        </div>
                      )}
                      {qualifSla && (
                        <div style={{ background: qualifSla.isPassed ? '#FFEBEE' : '#FFF3E0', color: qualifSla.isPassed ? '#C62828' : '#E65100', fontSize: 10, fontWeight: 700, padding: '4px 6px', borderRadius: 4, marginBottom: 8 }}>
                          <Clock3 size={12} /> Qualif : {qualifSla.text}
                        </div>
                      )}

                      {/* Progress Bar (if in production or beyond) */}
                      {ticket.progress > 0 && (
                        <div style={{ marginBottom: 8 }}>
                          <div className="flex justify-between items-center" style={{ fontSize: 10, color: 'var(--muted)', marginBottom: 2 }}>
                            <span>Avancement</span>
                            <span style={{ fontWeight: 700, color: 'var(--dark)' }}>{ticket.progress}%</span>
                          </div>
                          <div style={{ height: 4, background: '#E0E0E0', borderRadius: 2, overflow: 'hidden' }}>
                            <div 
                              style={{ 
                                height: '100%', 
                                width: `${ticket.progress}%`, 
                                background: ticket.progress === 100 ? '#27AE60' : statusCol.color,
                                borderRadius: 2,
                              }} 
                            />
                          </div>
                        </div>
                      )}

                      {/* Footer: Assignee & Score */}
                      <div className="flex justify-between items-center" style={{ borderTop: '1px solid #F0F0F0', paddingTop: 8, marginTop: 4 }}>
                        <div className="flex items-center gap-6">
                          {assignee ? (
                            <>
                              <div className="avatar avatar-xs" style={{ background: '#1A1A2E', color: '#FFF', fontSize: 9 }}>
                                {assignee.avatar}
                              </div>
                              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--dark)' }}>
                                {assignee.name.split(' ')[0]}
                              </span>
                            </>
                          ) : (
                            <span style={{ fontSize: 10, color: '#E74C3C', fontWeight: 700 }}>
                              Non assigné
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-6">
                          {ticket.loggedHours > 0 && (
                            <span style={{ fontSize: 10, color: 'var(--muted)' }}>
                              <Clock3 size={11} /> {ticket.loggedHours}h / {ticket.estimatedHours || 8}h
                            </span>
                          )}
                          <span 
                            style={{ 
                              fontSize: 10, 
                              fontWeight: 800, 
                              padding: '1px 6px', 
                              borderRadius: 8, 
                              background: 'rgba(0,0,0,0.06)', 
                              color: scoreColor 
                            }}
                            title="Score d'urgence algorithmique"
                          >
                            <Activity size={11} /> {score}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Quick add ticket button at bottom of Backlog column */}
            {statusCol.id === 'backlog' && (
              <button
                className="btn btn-ghost btn-sm mt-8"
                onClick={onOpenNewTicket}
                style={{ width: '100%', fontSize: 11, border: '1px dashed #CCC' }}
              >
                <Plus size={14} /> Ajouter une demande
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
