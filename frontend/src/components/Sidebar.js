import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <Link to="/dashboard" className={`sidebar-link ${isActive('/dashboard')}`}>
          Ana Sayfa
        </Link>
        <Link to="/profile" className={`sidebar-link ${isActive('/profile')}`}>
          Profil
        </Link>
        {user?.role === 'admin' && (
          <Link to="/users" className={`sidebar-link ${isActive('/users')}`}>
            Kullanıcılar
          </Link>
        )}
      </nav>
    </aside>
  );
};

export default Sidebar;

