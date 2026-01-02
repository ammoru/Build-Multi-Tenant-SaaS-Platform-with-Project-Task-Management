import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { projectAPI, taskAPI } from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalTasks: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });
  const [recentProjects, setRecentProjects] = useState([]);
  const [myTasks, setMyTasks] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      // Fetch projects
      const projectsResponse = await projectAPI.listProjects({ limit: 5 });
      const projects = projectsResponse.data.data.projects || [];
      setRecentProjects(projects);

      // Calculate stats from projects and their tasks
      let totalProjects = projects.length;
      let totalTasks = 0;
      let completedTasks = 0;

      // Fetch tasks for each project to calculate stats
      const taskPromises = projects.map((project) =>
        taskAPI.listTasks(project.id).catch(() => ({ data: { data: { tasks: [] } } }))
      );

      const taskResponses = await Promise.all(taskPromises);
      const allTasks = [];

      taskResponses.forEach((response) => {
        const tasks = response.data?.data?.tasks || [];
        allTasks.push(...tasks);
        totalTasks += tasks.length;
        completedTasks += tasks.filter((t) => t.status === 'completed').length;
      });

      // Get tasks assigned to current user
      const userTasks = allTasks.filter((task) => task.assignedTo?.id === user.id);

      setStats({
        totalProjects,
        totalTasks,
        completedTasks,
        pendingTasks: totalTasks - completedTasks,
      });

      setMyTasks(userTasks.slice(0, 5));
    } catch (error) {
      console.error('Dashboard fetch error:', error);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
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
      case 'active':
        return 'badge-success';
      case 'archived':
        return 'badge-secondary';
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
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Welcome back, {user?.fullName}!</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon bg-blue">
            <i className="icon-folder"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalProjects}</h3>
            <p>Total Projects</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-purple">
            <i className="icon-list"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.totalTasks}</h3>
            <p>Total Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-green">
            <i className="icon-check"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.completedTasks}</h3>
            <p>Completed Tasks</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon bg-orange">
            <i className="icon-clock"></i>
          </div>
          <div className="stat-content">
            <h3>{stats.pendingTasks}</h3>
            <p>Pending Tasks</p>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>Recent Projects</h2>
          <a href="/projects" className="btn btn-link">
            View All
          </a>
        </div>
        <div className="projects-grid">
          {recentProjects.length === 0 ? (
            <div className="empty-state">
              <p>No projects yet. Create your first project!</p>
              <a href="/projects" className="btn btn-primary">
                Create Project
              </a>
            </div>
          ) : (
            recentProjects.map((project) => (
              <div key={project.id} className="project-card">
                <div className="project-header">
                  <h3>{project.name}</h3>
                  <span className={`badge ${getStatusBadgeClass(project.status)}`}>
                    {project.status}
                  </span>
                </div>
                <p className="project-description">
                  {project.description || 'No description'}
                </p>
                <div className="project-footer">
                  <div className="project-stats">
                    <span>
                      {project.completedTaskCount || 0}/{project.taskCount || 0} Tasks
                    </span>
                  </div>
                  <a href={`/projects/${project.id}`} className="btn btn-sm btn-outline">
                    View Details
                  </a>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* My Tasks */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2>My Tasks</h2>
        </div>
        <div className="tasks-list">
          {myTasks.length === 0 ? (
            <div className="empty-state">
              <p>No tasks assigned to you yet.</p>
            </div>
          ) : (
            myTasks.map((task) => (
              <div key={task.id} className="task-item">
                <div className="task-content">
                  <h4>{task.title}</h4>
                  <div className="task-meta">
                    <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
                      {task.priority}
                    </span>
                    <span className={`badge ${getStatusBadgeClass(task.status)}`}>
                      {task.status.replace('_', ' ')}
                    </span>
                    <span className="task-date">Due: {formatDate(task.dueDate)}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
