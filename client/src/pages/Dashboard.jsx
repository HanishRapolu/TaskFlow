import { useEffect, useMemo, useState, useContext, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  LayoutGrid, Users, Settings, LogOut, ArrowLeft, Plus, Search, CheckCircle2,
  Hourglass, RefreshCw, ClipboardList, ListTodo, Crown, ShieldCheck, User,
  Send, Mail, Trash2, AlertTriangle, Sparkles, Info, Building2, Shield,
  UserPlus, Inbox, BadgeCheck, Zap, KeyRound, CalendarDays,
} from 'lucide-react';
import api from '../utils/api';
import { AuthContext } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import Spinner from '../components/Spinner';
import Modal from '../components/Modal';
import TaskCard from '../components/TaskCard';

const STATUS_VALUES = ['Pending', 'In Progress', 'Completed'];

const ROLE_META = {
  owner: { icon: Crown, className: 'role-owner', label: 'Owner' },
  admin: { icon: ShieldCheck, className: 'role-admin', label: 'Admin' },
  member: { icon: User, className: 'role-member', label: 'Member' },
};

export default function Dashboard() {
  const { workspaceId } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useContext(AuthContext);
  const toast = useToast();

  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [activeTab, setActiveTab] = useState('tasks');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [approvalFilter, setApprovalFilter] = useState('all');

  const [createOpen, setCreateOpen] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', assignedTo: '' });
  const [creating, setCreating] = useState(false);
  const [taskError, setTaskError] = useState('');

  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const [invite, setInvite] = useState({ email: '', role: 'member' });
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState('');

  const [addMember, setAddMember] = useState({ email: '', role: 'member' });
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');

  const [membersData, setMembersData] = useState({ members: [], invites: [] });
  const [loadingMembers, setLoadingMembers] = useState(false);

  const canManage = project?.role === 'admin' || project?.role === 'owner';
  const isOwner = project?.role === 'owner';

  const loadData = useCallback(async () => {
    const wsRes = await api.get(`/workspaces/${workspaceId}`);
    const tasksRes = await api.get(`/workspaces/${workspaceId}/tasks`);
    return { project: wsRes.data.data, tasks: tasksRes.data || [] };
  }, [workspaceId]);

  const loadMembers = useCallback(async () => {
    setLoadingMembers(true);
    try {
      const res = await api.get(`/workspaces/${workspaceId}/members`);
      // Defensive: ensure data structure is correct
      const data = res.data?.data || { members: [], invites: [] };
      setMembersData({
        members: Array.isArray(data.members) ? data.members : [],
        invites: Array.isArray(data.invites) ? data.invites : [],
      });
    } catch (err) {
      console.error('Failed to load members:', err);
      // Reset to empty arrays on error
      setMembersData({ members: [], invites: [] });
    } finally {
      setLoadingMembers(false);
    }
  }, [workspaceId]);

  useEffect(() => {
    let active = true;
    loadData()
      .then(({ project: p, tasks: t }) => {
        if (!active) return;
        setProject(p);
        setTasks(t);
        setError('');
      })
      .catch((err) => {
        if (!active) return;
        setError(err.response?.data?.message || 'Failed to load project dashboard');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [loadData]);

  useEffect(() => {
    if (canManage) {
      loadMembers();
    }
  }, [canManage, loadMembers]);

  const handleRetry = async () => {
    setError('');
    setLoading(true);
    try {
      const { project: p, tasks: t } = await loadData();
      setProject(p);
      setTasks(t);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load project dashboard');
    } finally {
      setLoading(false);
    }
  };

  const canUpdateStatus = useCallback(
    (task) => {
      if (!project || !user) return false;
      if (canManage) return true;
      return task.assignedTo?._id === user._id;
    },
    [project, user, canManage]
  );

  const knownMembers = useMemo(() => {
    const map = new Map();
    if (user?._id) map.set(user._id, { _id: user._id, name: user.name, email: user.email });
    tasks.forEach((t) => {
      if (t.assignedTo?._id) map.set(t.assignedTo._id, t.assignedTo);
      if (t.createdBy?._id) map.set(t.createdBy._id, t.createdBy);
    });
    return Array.from(map.values());
  }, [tasks, user]);

  const stats = useMemo(() => {
    const pending = tasks.filter((t) => t.status === 'Pending').length;
    const inProgress = tasks.filter((t) => t.status === 'In Progress').length;
    const completed = tasks.filter((t) => t.status === 'Completed').length;
    const needsApproval = tasks.filter((t) => !t.isApproved).length;
    return { total: tasks.length, pending, inProgress, completed, needsApproval };
  }, [tasks]);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (t) =>
          t.title.toLowerCase().includes(q) ||
          (t.description || '').toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      list = list.filter((t) => t.status === statusFilter);
    }
    if (approvalFilter === 'approved') {
      list = list.filter((t) => t.isApproved);
    } else if (approvalFilter === 'pending') {
      list = list.filter((t) => !t.isApproved);
    }
    return list;
  }, [tasks, search, statusFilter, approvalFilter]);

  const replaceTask = useCallback(
    (updated) => setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t))),
    []
  );

  const handleCreateTask = async (e) => {
    e.preventDefault();
    setTaskError('');
    if (!newTask.title.trim()) {
      setTaskError('Task title is required.');
      return;
    }
    setCreating(true);
    try {
      const { data } = await api.post(`/workspaces/${workspaceId}/tasks`, {
        title: newTask.title.trim(),
        description: newTask.description.trim(),
        assignedTo: newTask.assignedTo || undefined,
      });
      setTasks((prev) => [data, ...prev]);
      setCreateOpen(false);
      setNewTask({ title: '', description: '', assignedTo: '' });
      if (!data.isApproved) {
        toast.info('Task created. An admin needs to approve it before it is active.');
      } else {
        toast.success('Task created successfully.');
      }
    } catch (err) {
      setTaskError(err.response?.data?.message || 'Could not create the task.');
    } finally {
      setCreating(false);
    }
  };

  const handleStatusChange = async (task, status) => {
    const prev = task.status;
    replaceTask({ ...task, status });
    try {
      const { data } = await api.put(`/workspaces/${workspaceId}/tasks/${task._id}/status`, { status });
      replaceTask(data);
      toast.success(`Task moved to "${status}".`);
    } catch (err) {
      replaceTask({ ...task, status: prev });
      toast.error(err.response?.data?.message || 'Could not update the task status.');
    }
  };

  const handleApprove = async (task) => {
    try {
      const { data } = await api.put(`/workspaces/${workspaceId}/tasks/${task._id}/approve`);
      replaceTask(data);
      toast.success('Task approved.');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not approve the task.');
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/workspaces/${workspaceId}/tasks/${deleteTarget._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== deleteTarget._id));
      toast.success('Task deleted.');
      setDeleteTarget(null);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete the task.');
    } finally {
      setDeleting(false);
    }
  };

  const handleInvite = async (e) => {
    e.preventDefault();
    setInviteError('');
    if (!isOwner && invite.role === 'admin') {
      setInviteError('Only the workspace Owner can invite Admins.');
      return;
    }
    setInviting(true);
    try {
      await api.post(`/workspaces/${workspaceId}/invite`, {
        email: invite.email.trim(),
        role: invite.role,
      });
      toast.success(`Invitation sent to ${invite.email.trim()}.`);
      setInvite({ email: '', role: 'member' });
    } catch (err) {
      setInviteError(err.response?.data?.message || 'Could not send the invitation.');
    } finally {
      setInviting(false);
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    setAddError('');
    if (!isOwner && addMember.role === 'admin') {
      setAddError('Only the workspace Owner can add Admins.');
      return;
    }
    setAdding(true);
    try {
      await api.post(`/workspaces/${workspaceId}/members`, {
        email: addMember.email.trim(),
        role: addMember.role,
      });
      toast.success(`${addMember.email.trim()} added to the project.`);
      setAddMember({ email: '', role: 'member' });
    } catch (err) {
      setAddError(err.response?.data?.message || 'Could not add the member.');
    } finally {
      setAdding(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (loading) return <Spinner label="Loading your project..." />;

  if (error) {
    return (
      <div className="auth-page">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="glass-card auth-card">
          <h2 className="auth-title" style={{ fontSize: '1.5rem' }}>Something went wrong</h2>
          <div className="auth-error" style={{ marginTop: '1rem' }}>
            <AlertTriangle size={18} />
            <span>{error}</span>
          </div>
          <div className="modal-footer" style={{ borderTop: 'none', padding: '1.25rem 0 0' }}>
            <button className="modern-btn secondary" onClick={() => navigate('/select-workspace')}>
              <ArrowLeft size={18} /> Back to projects
            </button>
            <button className="modern-btn primary" onClick={handleRetry}>
              <RefreshCw size={18} /> Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Guard: project not loaded yet
  if (!project) {
    return (
      <div className="auth-page">
        <div className="bg-shape shape-1"></div>
        <div className="bg-shape shape-2"></div>
        <div className="glass-card auth-card">
          <h2 className="auth-title" style={{ fontSize: '1.5rem' }}>Loading project...</h2>
          <Spinner label="Please wait" />
        </div>
      </div>
    );
  }

  const roleBadge = (() => {
    const meta = ROLE_META[project.role] || ROLE_META.member;
    const Icon = meta.icon;
    return (
      <span className={`badge ${meta.className}`}>
        <Icon size={12} />
        {meta.label}
      </span>
    );
  })();

  const navItems = [
    {
      key: 'tasks',
      label: 'Tasks',
      icon: ListTodo,
      count: tasks.length,
      show: true,
    },
    {
      key: 'members',
      label: 'Members & Invites',
      icon: Users,
      show: canManage,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: Settings,
      show: isOwner,
    },
  ].filter((n) => n.show);

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="sidebar-ws-name">
            <Building2 size={18} style={{ color: 'var(--accent-blue)' }} />
            {project.name}
          </div>
          {project.description && <p className="sidebar-desc">{project.description}</p>}
          {roleBadge}
        </div>

        <nav className="sidebar-nav">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.key}
                className={`nav-item ${activeTab === item.key ? 'active' : ''}`}
                onClick={() => setActiveTab(item.key)}
              >
                <Icon size={18} />
                {item.label}
                {typeof item.count === 'number' && <span className="nav-count">{item.count}</span>}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <button className="modern-btn secondary" onClick={() => navigate('/select-workspace')}>
            <ArrowLeft size={16} /> Switch project
          </button>
          <button className="modern-btn ghost" onClick={handleLogout}>
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>

      <main className="dashboard-main">
        {activeTab === 'tasks' && (
          <div>
            <div className="view-header">
              <div>
                <h2><ClipboardList size={24} /> Project Tasks</h2>
                <p className="view-subtitle">
                  {stats.needsApproval > 0
                    ? `${stats.needsApproval} task${stats.needsApproval > 1 ? 's' : ''} waiting for approval`
                    : 'All tasks approved and on track'}
                </p>
              </div>
              <button className="modern-btn primary" onClick={() => setCreateOpen(true)}>
                <Plus size={18} /> New Task
              </button>
            </div>

            <div className="stats-grid">
              <div className="glass-card stat-card">
                <div className="stat-icon purple"><LayoutGrid size={22} /></div>
                <div>
                  <div className="stat-label">Total tasks</div>
                  <div className="stat-value">{stats.total}</div>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon amber"><Hourglass size={22} /></div>
                <div>
                  <div className="stat-label">Pending</div>
                  <div className="stat-value">{stats.pending}</div>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon blue"><RefreshCw size={22} /></div>
                <div>
                  <div className="stat-label">In progress</div>
                  <div className="stat-value">{stats.inProgress}</div>
                </div>
              </div>
              <div className="glass-card stat-card">
                <div className="stat-icon green"><CheckCircle2 size={22} /></div>
                <div>
                  <div className="stat-label">Completed</div>
                  <div className="stat-value">{stats.completed}</div>
                </div>
              </div>
            </div>

            <div className="toolbar">
              <div className="search-wrap">
                <span className="input-icon"><Search size={17} /></span>
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="modern-input"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="select-wrap">
                <select
                  className="modern-select"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  aria-label="Filter by status"
                >
                  <option value="all">All statuses</option>
                  {STATUS_VALUES.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>
              <div className="select-wrap">
                <select
                  className="modern-select"
                  value={approvalFilter}
                  onChange={(e) => setApprovalFilter(e.target.value)}
                  aria-label="Filter by approval"
                >
                  <option value="all">Approval: all</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Needs approval</option>
                </select>
              </div>
            </div>

            {filteredTasks.length === 0 ? (
              <div className="glass-card empty-state">
                <div className="empty-state-icon"><Inbox size={40} /></div>
                <h3>{tasks.length === 0 ? 'No tasks yet' : 'No matching tasks'}</h3>
                <p>
                  {tasks.length === 0
                    ? 'Create your first task to get the team moving. Tasks created by Members need admin approval.'
                    : 'Try adjusting the search or filters above.'}
                </p>
                {tasks.length === 0 && (
                  <button className="modern-btn primary" onClick={() => setCreateOpen(true)}>
                    <Plus size={18} /> Create your first task
                  </button>
                )}
              </div>
            ) : (
              <div className="tasks-grid">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    canManage={canManage}
                    canUpdateStatus={canUpdateStatus(task)}
                    isAssignee={user?._id === task.assignedTo?._id}
                    onStatusChange={handleStatusChange}
                    onApprove={handleApprove}
                    onDelete={setDeleteTarget}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === 'members' && canManage && (
          <div>
            <div className="view-header">
              <div>
                <h2><Users size={24} /> Members & Invites</h2>
                <p className="view-subtitle">
                  Invite teammates by email or add people who already have a TaskFlow account
                </p>
              </div>
            </div>

            <div className="glass-card panel">
              <div className="panel-title"><Users size={20} /> Current members</div>
              {loadingMembers ? (
                <div className="loading-members">Loading members...</div>
              ) : membersData.members.length === 0 ? (
                <p className="panel-sub">No members yet. Invite someone to get started!</p>
              ) : (
                <div className="table-wrap">
                  <table className="members-table">
                    <thead>
                      <tr>
                        <th>Member</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersData.members.map((member) => (
                        <tr key={member._id}>
                          <td>
                            <div className="member-cell">
                              <div className="member-avatar">{member.name?.charAt(0)?.toUpperCase() || 'U'}</div>
                              <span>{member.name}</span>
                            </div>
                          </td>
                          <td>{member.email}</td>
                          <td>
                            <span className={`badge role-${member.role}`}>
                              <span className="role-icon">
                                {member.role === 'owner' && <Crown size={10} />}
                                {member.role === 'admin' && <ShieldCheck size={10} />}
                                {member.role === 'member' && <User size={10} />}
                              </span>
                              {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                            </span>
                          </td>
                          <td>{member.joinedAt ? new Date(member.joinedAt).toLocaleDateString() : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {membersData.invites.length > 0 && (
              <div className="glass-card panel">
                <div className="panel-title"><Mail size={20} /> Pending invites</div>
                <div className="table-wrap">
                  <table className="members-table">
                    <thead>
                      <tr>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Invited by</th>
                        <th>Expires</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {membersData.invites.map((invite) => (
                        <tr key={invite._id}>
                          <td>{invite.email}</td>
                          <td>
                            <span className={`badge role-${invite.role}`}>
                              <span className="role-icon">
                                {invite.role === 'admin' && <ShieldCheck size={10} />}
                                {invite.role === 'member' && <User size={10} />}
                              </span>
                              {invite.role.charAt(0).toUpperCase() + invite.role.slice(1)}
                            </span>
                          </td>
                          <td>{invite.invitedBy?.name || invite.invitedBy?.email || 'Unknown'}</td>
                          <td>{new Date(invite.expiresAt).toLocaleDateString()}</td>
                          <td><span className="badge status-pending">Pending</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="glass-card panel">
              <div className="panel-title"><Send size={20} /> Invite by email</div>
              <p className="panel-sub">
                {isOwner
                  ? 'Send a secure invite link. The recipient gets an email with a 24-hour link to join.'
                  : 'You can invite Members. Only the Owner can invite Admins.'}
              </p>

              {inviteError && (
                <div className="auth-error" style={{ marginBottom: '0.9rem' }}>
                  <AlertTriangle size={18} />
                  <span>{inviteError}</span>
                </div>
              )}

              <form onSubmit={handleInvite} className="invite-form">
                <div className="invite-form-row">
                  <div className="field">
                    <label className="field-label"><Mail size={14} /> Email address</label>
                    <div className="input-wrap">
                      <span className="input-icon"><Mail size={17} /></span>
                      <input
                        type="email"
                        placeholder="teammate@company.com"
                        className="modern-input"
                        value={invite.email}
                        onChange={(e) => setInvite({ ...invite, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="field" style={{ maxWidth: 200 }}>
                    <label className="field-label"><Shield size={14} /> Role</label>
                    <div className="select-wrap">
                      <select
                        className="modern-select"
                        value={invite.role}
                        onChange={(e) => setInvite({ ...invite, role: e.target.value })}
                      >
                        <option value="member">Member</option>
                        <option value="admin" disabled={!isOwner}>Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="modern-btn primary" disabled={inviting}>
                    {inviting ? <span className="spinner sm"></span> : <Send size={17} />}
                    {inviting ? 'Sending...' : 'Send invitation'}
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-card panel">
              <div className="panel-title"><UserPlus size={20} /> Add existing member</div>
              <p className="panel-sub">
                Add someone who already has a TaskFlow account directly — no email needed.
              </p>

              {addError && (
                <div className="auth-error" style={{ marginBottom: '0.9rem' }}>
                  <AlertTriangle size={18} />
                  <span>{addError}</span>
                </div>
              )}

              <form onSubmit={handleAddMember} className="invite-form">
                <div className="invite-form-row">
                  <div className="field">
                    <label className="field-label"><Mail size={14} /> Account email</label>
                    <div className="input-wrap">
                      <span className="input-icon"><Mail size={17} /></span>
                      <input
                        type="email"
                        placeholder="existing@user.com"
                        className="modern-input"
                        value={addMember.email}
                        onChange={(e) => setAddMember({ ...addMember, email: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="field" style={{ maxWidth: 200 }}>
                    <label className="field-label"><Shield size={14} /> Role</label>
                    <div className="select-wrap">
                      <select
                        className="modern-select"
                        value={addMember.role}
                        onChange={(e) => setAddMember({ ...addMember, role: e.target.value })}
                      >
                        <option value="member">Member</option>
                        <option value="admin" disabled={!isOwner}>Admin</option>
                      </select>
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="modern-btn secondary" disabled={adding}>
                    {adding ? <span className="spinner sm"></span> : <UserPlus size={17} />}
                    {adding ? 'Adding...' : 'Add to project'}
                  </button>
                </div>
              </form>
            </div>

            <div className="glass-card panel">
              <div className="panel-title"><ShieldCheck size={20} /> Role permissions</div>
              <p className="panel-sub">What each role can do in this project</p>
              <div className="permission-list">
                <div className="permission-item"><Crown size={16} /> <span><strong>Owner</strong> — full control, can invite Admins, manage settings</span></div>
                <div className="permission-item"><ShieldCheck size={16} /> <span><strong>Admin</strong> — approve & delete tasks, invite Members, manage team</span></div>
                <div className="permission-item"><User size={16} /> <span><strong>Member</strong> — create & work on tasks, update status of assigned work</span></div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'settings' && isOwner && (
          <div>
            <div className="view-header">
              <div>
                <h2><Settings size={24} /> Project Settings</h2>
                <p className="view-subtitle">Overview of your workspace</p>
              </div>
            </div>

            <div className="info-banner" style={{ marginBottom: '1.6rem' }}>
              <Info size={18} />
              <span>
                Your project workspace was created automatically when your Owner account was registered.
                Use the Members & Invites tab to grow your team.
              </span>
            </div>

            <div className="glass-card panel">
              <div className="panel-title"><Sparkles size={20} /> Workspace details</div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Name</div>
                  <div className="settings-value">{project.name}</div>
                </div>
                <Building2 size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Description</div>
                  <div className="settings-value">{project.description || 'No description'}</div>
                </div>
                <ClipboardList size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Your role</div>
                  <div className="settings-value">{roleBadge}</div>
                </div>
                <Crown size={20} style={{ color: 'var(--accent-purple)' }} />
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Workspace ID</div>
                  <div className="settings-value mono">{project._id}</div>
                </div>
                <KeyRound size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
              <div className="settings-row">
                <div>
                  <div className="settings-label">Tasks</div>
                  <div className="settings-value">{stats.total} total · {stats.needsApproval} pending approval</div>
                </div>
                <CalendarDays size={20} style={{ color: 'var(--text-muted)' }} />
              </div>
            </div>

            <div className="glass-card panel">
              <div className="panel-title"><Zap size={20} /> Owner powers</div>
              <p className="panel-sub">As the Owner you can invite both Admins and Members, and every task you create is auto-approved.</p>
              <div className="permission-list">
                <div className="permission-item"><BadgeCheck size={16} /> <span>Invite teammates as Admins or Members by email</span></div>
                <div className="permission-item"><BadgeCheck size={16} /> <span>Approve and delete any task in the project</span></div>
                <div className="permission-item"><BadgeCheck size={16} /> <span>Tasks you create are approved instantly</span></div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create task modal */}
      <Modal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a new task"
        icon={<Plus size={20} />}
        footer={
          <>
            <button className="modern-btn secondary" onClick={() => setCreateOpen(false)}>Cancel</button>
            <button className="modern-btn primary" type="submit" form="create-task-form" disabled={creating}>
              {creating ? <span className="spinner sm"></span> : <Plus size={17} />}
              {creating ? 'Creating...' : 'Create task'}
            </button>
          </>
        }
      >
        {taskError && (
          <div className="auth-error">
            <AlertTriangle size={18} />
            <span>{taskError}</span>
          </div>
        )}
        <form id="create-task-form" onSubmit={handleCreateTask} className="invite-form">
          <div className="field">
            <label className="field-label"><ClipboardList size={14} /> Title</label>
            <input
              type="text"
              placeholder="e.g. Design the landing page"
              className="modern-input"
              value={newTask.title}
              onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
              required
            />
          </div>
          <div className="field">
            <label className="field-label"><Info size={14} /> Description</label>
            <textarea
              placeholder="Add details, context or acceptance criteria..."
              className="modern-textarea"
              value={newTask.description}
              onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
            />
          </div>
          <div className="field">
            <label className="field-label"><User size={14} /> Assign to</label>
            <div className="select-wrap">
              <select
                className="modern-select"
                value={newTask.assignedTo}
                onChange={(e) => setNewTask({ ...newTask, assignedTo: e.target.value })}
              >
                <option value="">Unassigned</option>
                {knownMembers.map((m) => (
                  <option key={m._id} value={m._id}>
                    {m._id === user?._id ? 'You' : m.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {!canManage && (
            <p className="panel-sub" style={{ marginBottom: 0, fontSize: '0.8rem' }}>
              As a Member, your new task will need approval from an Admin or Owner.
            </p>
          )}
        </form>
      </Modal>

      {/* Delete confirm modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete task"
        icon={<Trash2 size={20} style={{ color: 'var(--danger)' }} />}
        footer={
          <>
            <button className="modern-btn secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
            <button className="modern-btn danger" onClick={handleDelete} disabled={deleting}>
              {deleting ? <span className="spinner sm"></span> : <Trash2 size={16} />}
              {deleting ? 'Deleting...' : 'Delete task'}
            </button>
          </>
        }
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
          <div className="auth-error" style={{ marginBottom: 0 }}>
            <AlertTriangle size={18} />
            <span>This action cannot be undone.</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Are you sure you want to permanently delete{' '}
            <strong style={{ color: 'var(--text-primary)' }}>“{deleteTarget?.title}”</strong>?
          </p>
        </div>
      </Modal>
    </div>
  );
}
