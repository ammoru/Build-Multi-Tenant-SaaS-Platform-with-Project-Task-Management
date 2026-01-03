import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/dashboard" className="navbar-brand">
          {/* <span className="brand-icon">🚀</span> */}
          <span className="brand-text">SaaS Platform</span>
        </Link>

        {/* Mobile Menu Toggle */}
        <button
          className="mobile-menu-toggle"
          onClick={() => setShowMobileMenu(!showMobileMenu)}
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        {/* Navigation Links */}
        <div className={`navbar-menu ${showMobileMenu ? 'active' : ''}`}>
          <Link
            to="/dashboard"
            className={`nav-link ${isActive('/dashboard') ? 'active' : ''}`}
            onClick={() => setShowMobileMenu(false)}
          >
            Dashboard
          </Link>

          <Link
            to="/projects"
            className={`nav-link ${isActive('/projects') ? 'active' : ''}`}
            onClick={() => setShowMobileMenu(false)}
          >
            Projects
          </Link>

          {user?.role === 'tenant_admin' && (
            <Link
              to="/users"
              className={`nav-link ${isActive('/users') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Users
            </Link>
          )}

          {user?.role === 'super_admin' && (
            <Link
              to="/tenants"
              className={`nav-link ${isActive('/tenants') ? 'active' : ''}`}
              onClick={() => setShowMobileMenu(false)}
            >
              Tenants
            </Link>
          )}
        </div>

        {/* User Menu */}
        <div className="navbar-user">
          <div className="user-info" onClick={() => setShowUserMenu(!showUserMenu)}>
            <div className="user-avatar">
              {user?.fullName?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div className="user-details">
              <div className="user-name">{user?.fullName}</div>
              <div className="user-role">
                {user?.role === 'tenant_admin' ? 'Admin' : 
                 user?.role === 'super_admin' ? 'Super Admin' : 'User'}
              </div>
            </div>
            <span className="dropdown-arrow">▼</span>
          </div>

          {showUserMenu && (
            <div className="user-dropdown">
              <div className="dropdown-item user-dropdown-info">
                <div className="dropdown-label">Email</div>
                <div className="dropdown-value">{user?.email}</div>
              </div>
              {user?.tenant && (
                <div className="dropdown-item user-dropdown-info">
                  <div className="dropdown-label">Organization</div>
                  <div className="dropdown-value">{user.tenant.name}</div>
                </div>
              )}
              <div className="dropdown-divider"></div>
              <button onClick={handleLogout} className="dropdown-item logout-button">
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
