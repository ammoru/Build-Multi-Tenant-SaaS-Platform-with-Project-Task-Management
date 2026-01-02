import { useState, useEffect } from 'react';
import { userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import UserModal from '../components/UserModal';
import './Users.css';

const Users = () => {
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [filters, setFilters] = useState({
    role: '',
    search: '',
  });

  // Separate effect for initial load
  useEffect(() => {
    if (user?.tenantId ) {
      fetchUsers();
    }
  }, [user?.tenantId]); // Only depend on tenantId, not filters

  // Separate effect for filter changes
  useEffect(() => {
    if (user?.tenantId && !loading) {
      // Only fetch if not in initial loading state
      const timer = setTimeout(() => {
        fetchUsers();
      }, 300); // Debounce filter changes
      return () => clearTimeout(timer);
    }
  }, [filters]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {};
      if (filters.role) params.role = filters.role;
      if (filters.search) params.search = filters.search;

      const response = await userAPI.listUsers(user.tenantId, params);
      setUsers(response.data.data.users || []);
    } catch (error) {
      console.error('Fetch users error:', error);
      setError('Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddUser = () => {
    setEditingUser(null);
    setShowModal(true);
  };

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit);
    setShowModal(true);
  };

  const handleDeleteUser = async (userId) => {
    if (userId === user?.id) {
      alert('You cannot delete yourself');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this user?')) {
      return;
    }

    try {
      await userAPI.deleteUser(userId);
      fetchUsers();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete user');
    }
  };

  const handleModalClose = (refresh) => {
    setShowModal(false);
    setEditingUser(null);
    if (refresh) {
      fetchUsers();
    }
  };

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'tenant_admin':
        return 'badge-primary';
      case 'user':
        return 'badge-secondary';
      default:
        return 'badge-default';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Only tenant_admin can access this page
  if (user?.role !== 'tenant_admin') {
    return (
      <div className="error-container">
        <h2>Access Denied</h2>
        <p>Only tenant administrators can access user management.</p>
        <a href="/dashboard" className="btn btn-primary">
          Back to Dashboard
        </a>
      </div>
    );
  }

  return (
    <div className="users-page">
      <div className="page-header">
        <div>
          <h1>Users</h1>
          <p>Manage your organization's users</p>
        </div>
        <button onClick={handleAddUser} className="btn btn-primary">
          + Add User
        </button>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Role</label>
          <select value={filters.role} onChange={(e) => setFilters({ ...filters, role: e.target.value })}>
            <option value="">All</option>
            <option value="tenant_admin">Tenant Admin</option>
            <option value="user">User</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Search</label>
          <input
            type="text"
            placeholder="Search by name or email..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
          />
        </div>
      </div>

      {/* Users Table */}
      {loading ? (
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <h3>No users found</h3>
          <p>Add your first user to get started</p>
          <button onClick={handleAddUser} className="btn btn-primary">
            Add User
          </button>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Full Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div className="user-name">{u.fullName}</div>
                  </td>
                  <td>{u.email}</td>
                  <td>
                    <span className={`badge ${getRoleBadgeClass(u.role)}`}>
                      {u.role === 'tenant_admin' ? 'Admin' : 'User'}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${u.isActive ? 'badge-success' : 'badge-danger'}`}>
                      {u.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>{formatDate(u.createdAt)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEditUser(u)}
                        className="btn btn-sm btn-secondary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="btn btn-sm btn-danger"
                        disabled={u.id === user?.id}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* User Modal */}
      {showModal && (
        <UserModal user={editingUser} tenantId={user.tenantId} onClose={handleModalClose} />
      )}
    </div>
  );
};

export default Users;