import { useEffect, useState } from "react";
import { addCSRFHeaders } from "../utils/csrf.js";

export default function AdminPanel() {
  const [users, setUsers] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTickets: 0,
    pendingTickets: 0,
    completedTickets: 0
  });
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({ role: "", skills: "" });
  const [activeTab, setActiveTab] = useState("dashboard");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchUsers();
    fetchTickets();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/users`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        setUsers(data);
        setStats(prev => ({ ...prev, totalUsers: data.length }));
      }
    } catch (err) {
      console.error("Error fetching users", err);
    }
  };

  const fetchTickets = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) {
        const ticketArray = Array.isArray(data) ? data : data.tickets || [];
        setTickets(ticketArray);
        setStats(prev => ({
          ...prev,
          totalTickets: ticketArray.length,
          pendingTickets: ticketArray.filter(t => t.status === 'TODO' || t.status === 'IN_PROGRESS').length,
          completedTickets: ticketArray.filter(t => t.status === 'DONE').length
        }));
      }
    } catch (err) {
      console.error("Error fetching tickets", err);
    }
  };

  const handleEditClick = (user) => {
    setEditingUser(user.email);
    setFormData({
      role: user.role,
      skills: user.skills?.join(", ") || "",
    });
  };

  const handleUpdate = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/update-user`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: editingUser,
          role: formData.role,
          skills: formData.skills.split(",").map((skill) => skill.trim()).filter(Boolean),
        }),
      });

      if (res.ok) {
        setEditingUser(null);
        setFormData({ role: "", skills: "" });
        fetchUsers();
      }
    } catch (err) {
      console.error("Update failed", err);
    }
  };

  const StatCard = ({ title, value, icon, color = "primary" }) => (
    <div className={`stat bg-base-100 shadow rounded-lg`}>
      <div className="stat-figure text-primary">
        <div className={`text-3xl text-${color}`}>{icon}</div>
      </div>
      <div className="stat-title">{title}</div>
      <div className={`stat-value text-${color}`}>{value}</div>
    </div>
  );

  const TabButton = ({ id, label, active, onClick }) => (
    <button
      className={`tab tab-bordered ${active ? 'tab-active' : ''}`}
      onClick={() => onClick(id)}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-base-200 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-base-content">Admin Dashboard</h1>
          <p className="text-base-content/70 mt-2">Manage users, tickets, and system overview</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard title="Total Users" value={stats.totalUsers} icon="👥" color="primary" />
          <StatCard title="Total Tickets" value={stats.totalTickets} icon="🎫" color="secondary" />
          <StatCard title="Pending Tickets" value={stats.pendingTickets} icon="⏳" color="warning" />
          <StatCard title="Completed" value={stats.completedTickets} icon="✅" color="success" />
        </div>

        {/* Tabs */}
        <div className="tabs tabs-bordered mb-6">
          <TabButton id="dashboard" label="📊 Overview" active={activeTab === "dashboard"} onClick={setActiveTab} />
          <TabButton id="users" label="👥 Users" active={activeTab === "users"} onClick={setActiveTab} />
          <TabButton id="tickets" label="🎫 Tickets" active={activeTab === "tickets"} onClick={setActiveTab} />
        </div>

        {/* Tab Content */}
        {activeTab === "dashboard" && (
          <div>
            <div className="flex justify-end mb-4">
              <button 
                className="btn btn-sm btn-outline"
                onClick={async () => {
                  try {
                    const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/refresh-tickets`, {
                      method: 'POST',
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = await res.json();
                    alert(data.message || 'Refresh completed');
                    if (res.ok) fetchTickets();
                  } catch (err) {
                    alert('Refresh failed');
                  }
                }}
              >
                🔄 Refresh Old Tickets
              </button>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Users */}
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h2 className="card-title">Recent Users</h2>
                  <div className="space-y-2">
                    {users.slice(0, 5).map(user => (
                      <div key={user._id} className="flex justify-between items-center p-2 hover:bg-base-200 rounded">
                        <span>{user.email}</span>
                        <span className={`badge ${user.role === 'admin' ? 'badge-error' : user.role === 'moderator' ? 'badge-warning' : 'badge-info'}`}>
                          {user.role}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Recent Tickets */}
              <div className="card bg-base-100 shadow">
                <div className="card-body">
                  <h2 className="card-title">Recent Tickets</h2>
                  <div className="space-y-2">
                    {tickets.slice(0, 5).map(ticket => (
                      <div key={ticket._id} className="flex justify-between items-center p-2 hover:bg-base-200 rounded">
                        <div>
                          <div className="font-medium truncate">{ticket.title}</div>
                          <div className="text-sm text-base-content/70">{ticket.priority || 'medium'}</div>
                        </div>
                        <span className={`badge ${
                          ticket.status === 'DONE' ? 'badge-success' : 
                          ticket.status === 'IN_PROGRESS' ? 'badge-warning' : 'badge-info'
                        }`}>
                          {ticket.status || 'TODO'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "users" && (
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <div className="flex justify-between items-center mb-4">
                <h2 className="card-title">User Management</h2>
                <button 
                  className="btn btn-primary btn-sm"
                  onClick={() => document.getElementById('create-user-modal').showModal()}
                >
                  + Create User
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Skills</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user._id}>
                        <td>{user.email}</td>
                        <td>
                          <span className={`badge ${
                            user.role === 'admin' ? 'badge-error' : 
                            user.role === 'moderator' ? 'badge-warning' : 'badge-info'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td>
                          <div className="flex flex-wrap gap-1">
                            {user.skills?.slice(0, 3).map((skill, idx) => (
                              <span key={idx} className="badge badge-outline badge-sm">{skill}</span>
                            ))}
                            {user.skills?.length > 3 && <span className="text-xs">+{user.skills.length - 3}</span>}
                          </div>
                        </td>
                        <td>
                          {editingUser === user.email ? (
                            <div className="flex gap-2">
                              <button className="btn btn-success btn-sm" onClick={handleUpdate}>Save</button>
                              <button className="btn btn-ghost btn-sm" onClick={() => setEditingUser(null)}>Cancel</button>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button className="btn btn-primary btn-sm" onClick={() => handleEditClick(user)}>Edit</button>
                              <button 
                                className="btn btn-error btn-sm" 
                                onClick={async () => {
                                  if (confirm(`Delete user ${user.email}?`)) {
                                    try {
                                      const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/delete-user`, {
                                        method: 'DELETE',
                                        headers: {
                                          'Content-Type': 'application/json',
                                          Authorization: `Bearer ${token}`
                                        },
                                        body: JSON.stringify({ email: user.email })
                                      });
                                      const data = await res.json();
                                      if (res.ok) {
                                        alert('User deleted successfully');
                                        fetchUsers();
                                      } else {
                                        alert(data.error || 'Delete failed');
                                      }
                                    } catch (err) {
                                      alert('Delete failed');
                                    }
                                  }
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Edit Form Modal */}
              {editingUser && (
                <div className="mt-6 p-4 bg-base-200 rounded-lg">
                  <h3 className="font-bold mb-4">Edit User: {editingUser}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="label">Role</label>
                      <select
                        className="select select-bordered w-full"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                      >
                        <option value="user">User</option>
                        <option value="moderator">Moderator</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="label">Skills</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                        {[
                          "React", "Node.js", "JavaScript", "Python", "MongoDB", "PostgreSQL",
                          "AWS", "Docker", "UI/UX", "Mobile", "DevOps", "Security", "Java",
                          "PHP", "Vue.js", "Angular", "TypeScript", "Redis", "Kubernetes"
                        ].map(skill => {
                          const currentSkills = formData.skills.split(',').map(s => s.trim()).filter(Boolean);
                          return (
                            <label key={skill} className="cursor-pointer flex items-center">
                              <input
                                type="checkbox"
                                className="checkbox checkbox-xs mr-1"
                                checked={currentSkills.includes(skill)}
                                onChange={(e) => {
                                  const checked = e.target.checked;
                                  const skills = currentSkills.filter(s => s !== skill);
                                  if (checked) skills.push(skill);
                                  setFormData({ ...formData, skills: skills.join(', ') });
                                }}
                              />
                              <span className="text-xs">{skill}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "tickets" && (
          <div className="card bg-base-100 shadow">
            <div className="card-body">
              <h2 className="card-title mb-4">Ticket Management</h2>
              <div className="overflow-x-auto">
                <table className="table table-zebra w-full">
                  <thead>
                    <tr>
                      <th>Title</th>
                      <th>Status</th>
                      <th>Priority</th>
                      <th>Created By</th>
                      <th>Assigned To</th>
                      <th>Created</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tickets.map((ticket) => (
                      <tr key={ticket._id}>
                        <td>
                          <div className="font-medium">{ticket.title}</div>
                          <div className="text-sm text-base-content/70 truncate max-w-xs">
                            {ticket.description}
                          </div>
                        </td>
                        <td>
                          <select 
                            className="select select-bordered select-xs"
                            value={ticket.status || 'TODO'}
                            onChange={async (e) => {
                              try {
                                const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/tickets/${ticket._id}/status`, {
                                  method: 'PATCH',
                                  headers: {
                                    'Content-Type': 'application/json',
                                    Authorization: `Bearer ${token}`
                                  },
                                  body: JSON.stringify({ status: e.target.value })
                                });
                                if (res.ok) fetchTickets();
                              } catch (err) {
                                console.error('Status update failed', err);
                              }
                            }}
                          >
                            <option value="TODO">TODO</option>
                            <option value="IN_PROGRESS">IN PROGRESS</option>
                            <option value="DONE">DONE</option>
                            <option value="CANCELLED">CANCELLED</option>
                          </select>
                        </td>
                        <td>
                          <span className={`badge ${
                            ticket.priority === 'high' ? 'badge-error' : 
                            ticket.priority === 'medium' ? 'badge-warning' : 'badge-success'
                          }`}>
                            {ticket.priority || 'medium'}
                          </span>
                        </td>
                        <td>
                          <div className="flex items-center gap-2">
                            <div className="avatar placeholder">
                              <div className="bg-neutral text-neutral-content rounded-full w-6 h-6">
                                <span className="text-xs">{ticket.createdBy?.email?.charAt(0).toUpperCase() || 'U'}</span>
                              </div>
                            </div>
                            <span className="text-sm">{ticket.createdBy?.email || 'Unknown'}</span>
                          </div>
                        </td>
                        <td>{ticket.assignedTo?.email || 'Unassigned'}</td>
                        <td className="text-sm">
                          {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'N/A'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Create User Modal */}
        <dialog id="create-user-modal" className="modal">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Create New User</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const userData = {
                email: formData.get('email'),
                password: formData.get('password'),
                role: formData.get('role'),
                skills: Array.from(formData.getAll('skills'))
              };
              
              try {
                let endpoint;
                if (userData.role === 'moderator') {
                  endpoint = 'create-moderator';
                } else if (userData.role === 'admin') {
                  endpoint = 'create-admin';
                } else {
                  endpoint = 'create-user';
                }
                
                const res = await fetch(`${import.meta.env.VITE_SERVER_URL}/auth/${endpoint}`, {
                  method: 'POST',
                  headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                  },
                  body: JSON.stringify(userData)
                });
                const data = await res.json();
                if (res.ok) {
                  alert('User created successfully');
                  document.getElementById('create-user-modal').close();
                  e.target.reset();
                  fetchUsers();
                } else {
                  alert(data.error || 'Creation failed');
                }
              } catch (err) {
                alert('Creation failed');
              }
            }}>
              <div className="form-control mb-4">
                <label className="label">Email</label>
                <input name="email" type="email" className="input input-bordered" required />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">Password</label>
                <input name="password" type="password" className="input input-bordered" required />
              </div>
              
              <div className="form-control mb-4">
                <label className="label">Role</label>
                <select name="role" className="select select-bordered" required>
                  <option value="user">User</option>
                  <option value="moderator">Moderator</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              
              <div className="form-control mb-4">
                <label className="label">Skills (for moderators)</label>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto border rounded p-2">
                  {[
                    "React", "Node.js", "JavaScript", "Python", "MongoDB", "PostgreSQL",
                    "AWS", "Docker", "UI/UX", "Mobile", "DevOps", "Security", "Java",
                    "PHP", "Vue.js", "Angular", "TypeScript", "Redis", "Kubernetes"
                  ].map(skill => (
                    <label key={skill} className="cursor-pointer flex items-center">
                      <input name="skills" type="checkbox" value={skill} className="checkbox checkbox-xs mr-1" />
                      <span className="text-xs">{skill}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="modal-action">
                <button type="submit" className="btn btn-primary">Create User</button>
                <button type="button" className="btn" onClick={() => document.getElementById('create-user-modal').close()}>Cancel</button>
              </div>
            </form>
          </div>
        </dialog>
      </div>
    </div>
  );
}