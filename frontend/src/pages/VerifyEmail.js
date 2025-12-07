import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../services/api';
import './VerifyEmail.css';

const VerifyEmail = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState('verifying');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      try {
        await api.post(`/auth/verify-email/${token}`);
        setStatus('success');
        setMessage('E-posta başarıyla doğrulandı! Giriş sayfasına yönlendiriliyorsunuz...');
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } catch (error) {
        setStatus('error');
        setMessage(error.response?.data?.error || 'Doğrulama başarısız. Bağlantı geçersiz veya süresi dolmuş olabilir.');
      }
    };

    if (token) {
      verifyEmail();
    }
  }, [token, navigate]);

  return (
    <div className="verify-email-container">
      <div className="verify-email-card">
        {status === 'verifying' && (
          <>
            <div className="spinner"></div>
            <h2>E-postanız doğrulanıyor...</h2>
          </>
        )}
        {status === 'success' && (
          <>
            <div className="success-icon">✓</div>
            <h2>E-posta Doğrulandı!</h2>
            <p>{message}</p>
          </>
        )}
        {status === 'error' && (
          <>
            <div className="error-icon">✗</div>
            <h2>Doğrulama Başarısız</h2>
            <p>{message}</p>
            <button onClick={() => navigate('/login')} className="back-button">
              Giriş Sayfasına Git
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;

