import { Pencil, Plus } from 'lucide-react';

export default function TasksPage() {
  const mockTasks = [
    { id: 'T1', title: 'Mettre à jour le guideline', type: 'Action liée à doc', assignee: 'Design Team', status: 'À faire', deadline: '20/04/2026' },
    { id: 'T2', title: 'Créer projet pour Ramadan', type: 'Automation', assignee: 'Steve B.', status: 'Terminé', deadline: '10/04/2026' }
  ];

  return (
    <div className="bridge-simple-page bridge-tasks-page">
      <header className="bridge-editorial-page-head bridge-simple-head">
        <div>
          <span className="bridge-page-index">11 / OPÉRATIONS</span>
          <h1>Tâches<br />transverses</h1>
          <p>Centralisez les actions partagées, les automatisations et les échéances des équipes.</p>
        </div>
        <button className="bridge-primary-action"><Plus size={17} /> Nouvelle tâche</button>
      </header>

      <div className="bridge-data-table">
        <table className="table">
          <thead>
            <tr>
              <th>Tâche</th>
              <th>Type</th>
              <th>Assigné à</th>
              <th>Statut</th>
              <th>Deadline</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {mockTasks.map(task => (
              <tr key={task.id}>
                <td className="font-bold">{task.title}</td>
                <td><span className="tag tag-muted">{task.type}</span></td>
                <td>{task.assignee}</td>
                <td>
                  <span className={`tag ${task.status === 'Terminé' ? 'tag-green' : 'tag-yellow'}`}>
                    {task.status}
                  </span>
                </td>
                <td className={task.status !== 'Terminé' ? 'text-red' : 'text-muted'}>{task.deadline}</td>
                <td>
                  <button className="btn btn-sm btn-ghost"><Pencil size={13} /> Éditer</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
