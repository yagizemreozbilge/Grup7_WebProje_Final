import React, { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import api from '../services/api';
import './Users.css';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await api.get('/users');
        // Backend returns { users: [...], pagination: {...} }
        if (response.data && response.data.users) {
            setUsers(response.data.users);
        } else if (Array.isArray(response.data)) {
            setUsers(response.data);
        } else {
            setUsers([]);
            console.error('Unexpected API response format:', response.data);
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching users:', err);
        setError('Kullanıcı listesi alınırken bir hata oluştu.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const formatName = (name) => {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('tr-TR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="users-container">
      <Navbar />
      <div className="users-content">
        <Sidebar />
        <main className="users-main">
          <div className="users-header">
            <h1>Kullanıcı Yönetimi</h1>
          </div>

          {loading ? (
            <div className="loading-container">Yükleniyor...</div>
          ) : error ? (
            <div className="error-container">{error}</div>
          ) : (
            <div className="users-table-container">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Ad Soyad</th>
                    <th>E-posta</th>
                    <th>Rol</th>
                    <th>Durum</th>
                    <th>Kayıt Tarihi</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td>{formatName(user.full_name)}</td>
                      <td>{user.email}</td>
                      <td>
                        <span className={`role-badge ${user.role}`}>
                          {user.role === 'admin' ? 'Yönetici' : 
                           user.role === 'faculty' ? 'Akademisyen' : 'Öğrenci'}
                        </span>
                      </td>
                      <td>
                        <span className={`status-badge ${user.is_verified ? 'status-verified' : 'status-pending'}`}>
                          <span className="status-dot"></span>
                          {user.is_verified ? 'Doğrulanmış' : 'Bekliyor'}
                        </span>
                      </td>
                      <td>{formatDate(user.created_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Users;