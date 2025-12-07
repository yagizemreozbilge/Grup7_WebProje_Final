import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import api from '../services/api';
import TextInput from '../components/TextInput';
import './ResetPassword.css';

const resetPasswordSchema = yup.object().shape({
    password: yup
        .string()
        .min(8, 'Şifre en az 8 karakter olmalıdır')
        .matches(/[A-Z]/, 'Şifre en az bir büyük harf içermelidir')
        .matches(/[a-z]/, 'Şifre en az bir küçük harf içermelidir')
        .matches(/[0-9]/, 'Şifre en az bir rakam içermelidir')
        .required('Şifre gereklidir'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Şifreler eşleşmelidir')
        .required('Lütfen şifrenizi onaylayın')
});

const ResetPassword = () => {
    const { token } = useParams();
    const navigate = useNavigate();
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(resetPasswordSchema)
    });

    const onSubmit = async (data) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            await api.post(/auth/reset-password/, { password: data.password });
            setSuccess('Şifre başarıyla sıfırlandı! Giriş sayfasına yönlendiriliyorsunuz...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Şifre sıfırlanamadı');
        }

        setLoading(false);
    };

    return (
        <div className='reset-password-container'>
            <div className='reset-password-card'>
                <h2>Şifreyi Sıfırla</h2>
                {error && <div className='error-message'>{error}</div>}
                {success && <div className='success-message'>{success}</div>}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextInput
                        label='Yeni Şifre'
                        type='password'
                        id='password'
                        {...register('password')}
                        error={errors.password?.message}
                        disabled={loading}
                    />
                    <small style={{ display: 'block', marginTop: '-0.75rem', marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
                        Min 8 karakter, büyük harf, küçük harf ve rakam
                    </small>
                    <TextInput
                        label='Şifreyi Onayla'
                        type='password'
                        id='confirmPassword'
                        {...register('confirmPassword')}
                        error={errors.confirmPassword?.message}
                        disabled={loading}
                    />
                    <button 
                        type='submit' 
                        className='submit-button' 
                        disabled={loading}
                    >
                        {loading ? 'Sıfırlanıyor...' : 'Şifreyi Sıfırla'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
