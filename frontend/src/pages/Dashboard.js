import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const getInitials = (name) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  };

  const formatName = (name) => {
    if (!name) return '';
    return name.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()).join(' ');
  };

  const handleAction = (action) => {
    if (action === 'settings') {
      navigate('/profile');
    } else {
      alert('Bu özellik yapım aşamasındadır.');
    }
  };

  const currentDate = new Date().toLocaleDateString('tr-TR', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main">
          <header className="dashboard-header">
            <div className="header-text">
              <h1>Tekrar hoşgeldiniz, {formatName(user?.full_name) || 'Kullanıcı'}</h1>
              <p className="date-text">{currentDate}</p>
            </div>
            <div className="user-badge">
              <div className="avatar-circle">
                {getInitials(user?.full_name || user?.email)}
              </div>
              <div className="user-info-mini">
                <span className="user-name-mini">{formatName(user?.full_name)}</span>
                <span className="user-role-mini">{user?.role}</span>
              </div>
            </div>
          </header>

          <div className="dashboard-grid">
            {/* Profile Summary Card */}
            <div className="dashboard-card profile-card">
              <div className="card-header">
                <h3>Profil Özeti</h3>
              </div>
              <div className="card-body">
                <div className="info-row">
                  <span className="label">Ad Soyad:</span>
                  <span className="value">{formatName(user?.full_name)}</span>
                </div>
                <div className="info-row">
                  <span className="label">E-posta:</span>
                  <span className="value">{user?.email}</span>
                </div>
                <div className="info-row">
                  <span className="label">Telefon:</span>
                  <span className="value">{user?.phone || 'Belirlenmedi'}</span>
                </div>
                <div className="info-row">
                  <span className="label">Durum:</span>
                  <span className={`status-badge ${user?.is_verified ? 'verified' : 'pending'}`}>
                    {user?.is_verified ? 'Doğrulanmış' : 'Doğrulama Bekliyor'}
                  </span>
                </div>
              </div>
            </div>

            {/* Academic/Faculty Info Card */}
            {user?.student && (
              <div className="dashboard-card academic-card">
                <div className="card-header">
                  <h3>Akademik Bilgiler</h3>
                </div>
                <div className="card-body">
                  <div className="info-block">
                    <span className="label-block">Öğrenci Numarası</span>
                    <span className="value-block highlight">{user.student.student_number}</span>
                  </div>
                  <div className="info-block">
                    <span className="label-block">Bölüm</span>
                    <span className="value-block">{user.student.department?.name || 'Mevcut Değil'}</span>
                  </div>
                  <div className="stats-grid">
                    <div className="stat-item">
                      <span className="stat-label">GNO</span>
                      <span className="stat-value">{user.student.gpa || '0.00'}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">AGNO</span>
                      <span className="stat-value">{user.student.cgpa || '0.00'}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {user?.faculty && (
              <div className="dashboard-card faculty-card">
                <div className="card-header">
                  <h3>Fakülte Detayları</h3>
                </div>
                <div className="card-body">
                  <div className="info-block">
                    <span className="label-block">Personel No</span>
                    <span className="value-block highlight">{user.faculty.employee_number}</span>
                  </div>
                  <div className="info-block">
                    <span className="label-block">Ünvan</span>
                    <span className="value-block">{user.faculty.title}</span>
                  </div>
                  <div className="info-block">
                    <span className="label-block">Bölüm</span>
                    <span className="value-block">{user.faculty.department?.name || 'Mevcut Değil'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Actions Card */}
            <div className="dashboard-card actions-card">
              <div className="card-header">
                <h3>Hızlı İşlemler</h3>
              </div>
              <div className="card-body actions-grid">
                <button className="action-btn" onClick={() => handleAction('schedule')}>
                  <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                    <line x1="16" y1="2" x2="16" y2="6"></line>
                    <line x1="8" y1="2" x2="8" y2="6"></line>
                    <line x1="3" y1="10" x2="21" y2="10"></line>
                  </svg>
                  Ders Programı
                </button>
                <button className="action-btn" onClick={() => handleAction('courses')}>
                  <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"></path>
                    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"></path>
                  </svg>
                  Derslerim
                </button>
                <button className="action-btn" onClick={() => handleAction('grades')}>
                  <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                    <polyline points="14 2 14 8 20 8"></polyline>
                    <line x1="16" y1="13" x2="8" y2="13"></line>
                    <line x1="16" y1="17" x2="8" y2="17"></line>
                    <polyline points="10 9 9 9 8 9"></polyline>
                  </svg>
                  Notlar
                </button>
                <button className="action-btn" onClick={() => handleAction('settings')}>
                  <svg className="action-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="3"></circle>
                    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                  </svg>
                  Ayarlar
                </button>
              </div>
            </div>

            {/* University Announcements Card */}
            <div className="dashboard-card announcements-card">
              <div className="card-header">
                <h3>Üniversite Duyuruları</h3>
              </div>
              <div className="card-body">
                <div className="announcement-item">
                  <span className="announcement-date">10 Ara</span>
                  <p className="announcement-text">Final Sınav Programı Açıklandı</p>
                </div>
                <div className="announcement-item">
                  <span className="announcement-date">15 Ara</span>
                  <p className="announcement-text">Kampüs Kütüphanesi Tatil Saatleri</p>
                </div>
                <div className="announcement-item">
                  <span className="announcement-date">05 Oca</span>
                  <p className="announcement-text">Bahar Dönemi Kayıtları Başlıyor</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

