import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { projectAPI, taskAPI, userAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import TaskModal from '../components/TaskModal';
import './ProjectDetails.css';

const ProjectDetails = () => {
  const { projectId } = useParams();
  const { user } = useAuth();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [filters, setFilters] = useState({
    status: '',
    priority: '',
    assignedTo: '',
  });

  useEffect(() => {
    fetchProjectDetails();
    fetchUsers();
  }, [projectId]);

  useEffect(() => {
    if (project) {
      fetchTasks();
    }
  }, [filters, project]);

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError('');
      // Note: Backend might not have single project endpoint, so we get from list
      const response = await projectAPI.listProjects({});
      const projectsList = response.data.data.projects || [];
      const currentProject = projectsList.find((p) => p.id === projectId);
      if (currentProject) {
        setProject(currentProject);
      } else {
        setError('Project not found');
      }
    } catch (error) {
      console.error('Fetch project error:', error);
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const params = {};
      if (filters.status) params.status = filters.status;
      if (filters.priority) params.priority = filters.priority;
      if (filters.assignedTo) params.assignedTo = filters.assignedTo;

      const response = await taskAPI.listTasks(projectId, params);
      setTasks(response.data.data.tasks || []);
    } catch (error) {
      console.error('Fetch tasks error:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      if (!user?.tenantId) return;
      const response = await userAPI.listUsers(user.tenantId, {});
      setUsers(response.data.data.users || []);
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  };

  const handleCreateTask = () => {
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task) => {
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) {
      return;
    }

    try {
      await taskAPI.deleteTask(taskId);
      fetchTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to delete task');
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      await taskAPI.updateTaskStatus(taskId, { status: newStatus });
      fetchTasks();
    } catch (error) {
      alert(error.response?.data?.message || 'Failed to update status');
    }
  };

  const handleModalClose = (refresh) => {
    setShowTaskModal(false);
    setEditingTask(null);
    if (refresh) {
      fetchTasks();
      fetchProjectDetails();
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'completed':
        return 'badge-success';
      case 'in_progress':
        return 'badge-warning';
      case 'todo':
        return 'badge-info';
      default:
        return 'badge-default';
    }
  };

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case 'high':
        return 'badge-danger';
      case 'medium':
        return 'badge-warning';
      case 'low':
        return 'badge-info';
      default:
        return 'badge-default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No due date';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading project...</p>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error || 'Project not found'}</p>
        <a href="/projects" className="btn btn-primary">
          Back to Projects
        </a>
      </div>
    );
  }

  return (
    <div className="project-details">
      {/* Project Header */}
      <div className="project-header">
        <div className="project-header-content">
          <div className="breadcrumb">
            <a href="/projects">Projects</a> / {project.name}
          </div>
          <h1>{project.name}</h1>
          <p>{project.description || 'No description'}</p>
          <div className="project-meta">
            <span className={`badge ${getStatusBadgeClass(project.status)}`}>
              {project.status}
            </span>
            <span className="meta-text">
              Created by: {project.createdBy?.fullName || 'Unknown'}
            </span>
            <span className="meta-text">
              Tasks: {project.completedTaskCount || 0}/{project.taskCount || 0}
            </span>
          </div>
        </div>
        <div className="project-header-actions">
          <button onClick={handleCreateTask} className="btn btn-primary">
            + Add Task
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="filter-group">
          <label>Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
          >
            <option value="">All</option>
            <option value="todo">To Do</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Priority</label>
          <select
            value={filters.priority}
            onChange={(e) => setFilters({ ...filters, priority: e.target.value })}
          >
            <option value="">All</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>
        </div>

        <div className="filter-group">
          <label>Assigned To</label>
          <select
            value={filters.assignedTo}
            onChange={(e) => setFilters({ ...filters, assignedTo: e.target.value })}
          >
            <option value="">All</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.fullName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tasks List */}
      <div className="tasks-section">
        {tasks.length === 0 ? (
          <div className="empty-state">
            <h3>No tasks yet</h3>
            <p>Create your first task to get started</p>
            <button onClick={handleCreateTask} className="btn btn-primary">
              Add Task
            </button>
          </div>
        ) : (
          <div className="tasks-table">
            <table>
              <thead>
                <tr>
                  <th>Task</th>
                  <th>Status</th>
                  <th>Priority</th>
                  <th>Assigned To</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td>
                      <div className="task-title">{task.title}</div>
                      {task.description && (
                        <div className="task-description">{task.description}</div>
                      )}
                    </td>
                    <td>
                      <select
                        value={task.status}
                        onChange={(e) => handleStatusChange(task.id, e.target.value)}
                        className={`status-select ${getStatusBadgeClass(task.status)}`}
                      >
                        <option value="todo">To Do</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                      </select>
                    </td>
                    <td>
                      <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                        {task.priority}
                      </span>
                    </td>
                    <td>{task.assignedTo?.fullName || 'Unassigned'}</td>
                    <td>{formatDate(task.dueDate)}</td>
                    <td>
                      <div className="action-buttons">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="btn-icon"
                          title="Edit"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task.id)}
                          className="btn-icon"
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          task={editingTask}
          projectId={projectId}
          users={users}
          onClose={handleModalClose}
        />
      )}
    </div>
  );
};

export default ProjectDetails;
