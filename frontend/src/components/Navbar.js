import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const formatName = (name) => {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <h2>Kampüs Yönetim Sistemi</h2>
      </div>
      <div className="navbar-menu">
        {user && (
          <>
            <span className="user-name">{formatName(user.full_name) || user.email}</span>
            <button onClick={handleLogout} className="logout-button">
              Çıkış Yap
            </button>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;

