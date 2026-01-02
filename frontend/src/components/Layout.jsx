import Navbar from './Navbar';
import './Layout.css';

const Layout = ({ children }) => {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">{children}</main>
      <footer className="footer">
        <div className="footer-content">
          <p>&copy; 2026 Multi-Tenant SaaS Platform. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
