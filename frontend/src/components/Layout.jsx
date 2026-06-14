import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Activity, Users, FileText, Settings, LogOut, Upload } from 'lucide-react';
import styles from './Layout.module.css';

export default function Layout() {
  const getNavClass = ({ isActive }) => 
    isActive ? `${styles.navLink} ${styles.activeLink}` : styles.navLink;
  const navigate = useNavigate();
const handleLogout = () => {
  localStorage.removeItem('access_token');
  localStorage.removeItem('refresh_token');
  navigate('/login');
};

  return (
    <div className={styles.container}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>Splitwise MVP</div>
        
        <nav className={styles.nav}>
          <NavLink to="/dashboard" className={getNavClass}>
            <LayoutDashboard size={20} />
            Dashboard
          </NavLink>
          
          {/* Add the Import Link here */}
          <NavLink to="/import" className={getNavClass}>
            <Upload size={20} />
            Import CSV
          </NavLink>

          <NavLink to="/activity" className={getNavClass}>
            <Activity size={20} />
            Recent Activity
          </NavLink>
          <NavLink to="/activity" className={getNavClass}>
            <Activity size={20} />
            Recent Activity
          </NavLink>
          <NavLink to="/groups" className={getNavClass}>
            <Users size={20} />
            Groups & Friends
          </NavLink>
          <NavLink to="/expenses" className={getNavClass}>
            <FileText size={20} />
            All Expenses
          </NavLink>
        </nav>

        <div className={styles.bottomNav}>
          <NavLink to="/account" className={getNavClass}>
            <Settings size={20} />
            Settings
          </NavLink>
          <button 
  onClick={handleLogout} 
  className={styles.navLink} 
  style={{width: '100%', background: 'transparent', border: 'none', cursor: 'pointer'}}
>
  <LogOut size={20} />
  Log out
</button>
        </div>
      </aside>

      <main className={styles.mainContent}>
        <Outlet /> {/* This is where the page content injects */}
      </main>
    </div>
  );
}