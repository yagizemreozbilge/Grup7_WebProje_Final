import React from 'react';
import { Link } from 'react-router-dom';
import './NotFound.css';

const NotFound = () => {
  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <h1>404</h1>
        <h2>Sayfa Bulunamadı</h2>
        <p>Aradığınız sayfa mevcut değil.</p>
        <Link to="/dashboard" className="home-button">
          Panele Dön
        </Link>
      </div>
    </div>
  );
};

export default NotFound;