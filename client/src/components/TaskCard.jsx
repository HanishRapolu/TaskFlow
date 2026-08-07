import { Hourglass, RefreshCw, CheckCircle2, User, Trash2, BadgeCheck, AlertTriangle, UserPlus } from 'lucide-react';

const STATUS_ICONS = {
  'Pending': Hourglass,
  'In Progress': RefreshCw,
  'Completed': CheckCircle2,
};

export default function TaskCard({ task, canManage, canUpdateStatus, isAssignee, members, currentUserId, onStatusChange, onAssign, onApprove, onDelete }) {
  const StatusIcon = STATUS_ICONS[task.status] || Hourglass;

  const assigneeInList = task.assignedTo?._id && members?.some((m) => m._id === task.assignedTo._id);

  return (
    <div className="glass-card task-card" data-status={task.status}>
      <div className="task-card-top">
        <div>
          <h3 className="task-title">{task.title}</h3>
          {task.description ? (
            <p className="task-description">{task.description}</p>
          ) : (
            <p className="task-description" style={{ fontStyle: 'italic', color: 'var(--text-muted)' }}>
              No description provided
            </p>
          )}
        </div>
      </div>

      <div className="task-card-badges">
        <span className={`badge status-${task.status}`}>
          <StatusIcon size={13} />
          {task.status}
        </span>
        {task.isApproved ? (
          <span className="badge approved">
            <BadgeCheck size={13} />
            Approved
          </span>
        ) : (
          <span className="badge pending-approval">
            <AlertTriangle size={13} />
            Needs approval
          </span>
        )}
      </div>

      <div className="task-card-footer">
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
          {task.assignedTo ? (
            <span className={`chip ${isAssignee ? 'self' : ''}`} title={task.assignedTo.email}>
              <User size={13} />
              <span>{isAssignee ? 'You' : task.assignedTo.name}</span>
            </span>
          ) : (
            <span className="chip unassigned">
              <User size={13} />
              <span>Unassigned</span>
            </span>
          )}
        </div>

        <div className="task-actions">
          {members && onAssign && (
            <div className="select-wrap" style={{ minWidth: 140 }}>
              <select
                className="modern-select"
                value={task.assignedTo?._id || ''}
                onChange={(e) => onAssign(task, e.target.value)}
                aria-label={`Assign ${task.title}`}
              >
                <option value="">Unassigned</option>
                {task.assignedTo && !assigneeInList && (
                  <option value={task.assignedTo._id} disabled>
                    {task.assignedTo.name}
                  </option>
                )}
                {members.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m._id === currentUserId ? 'You' : m.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {!task.isApproved && canManage && (
            <button className="modern-btn success sm" onClick={() => onApprove(task)} title="Approve task">
              <BadgeCheck size={14} />
              Approve
            </button>
          )}

          {canUpdateStatus && (
            <div className="select-wrap">
              <select
                className={`modern-select status-select-${task.status}`}
                value={task.status}
                onChange={(e) => onStatusChange(task, e.target.value)}
                aria-label={`Update status for ${task.title}`}
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}

          {canManage && (
            <button className="icon-btn danger" onClick={() => onDelete(task)} title="Delete task">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="task-meta">
        <span className="task-meta-row">
          <UserPlus size={13} />
          Created by {task.createdBy?.name || 'Unknown'} · {new Date(task.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
}
