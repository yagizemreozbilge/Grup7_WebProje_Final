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
        .min(8, 'Password must be at least 8 characters')
        .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
        .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
        .matches(/[0-9]/, 'Password must contain at least one number')
        .required('Password is required'),
    confirmPassword: yup
        .string()
        .oneOf([yup.ref('password')], 'Passwords must match')
        .required('Please confirm your password')
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
            await api.post(`/auth/reset-password/${token}`, { password: data.password });
            setSuccess('Password reset successfully! Redirecting to login...');
            setTimeout(() => {
                navigate('/login');
            }, 2000);
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to reset password');
        }

        setLoading(false);
    };

    return (
        <div className="reset-password-container">
            <div className="reset-password-card">
                <h2>Reset Password</h2>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextInput
                        label="New Password"
                        type="password"
                        id="password"
                        {...register('password')}
                        error={errors.password?.message}
                        disabled={loading}
                    />
                    <small style={{ display: 'block', marginTop: '-0.75rem', marginBottom: '1rem', color: '#666', fontSize: '0.875rem' }}>
                        Min 8 characters, uppercase, lowercase, and number
                    </small>
                    <TextInput
                        label="Confirm Password"
                        type="password"
                        id="confirmPassword"
                        {...register('confirmPassword')}
                        error={errors.confirmPassword?.message}
                        disabled={loading}
                    />
                    <button 
                        type="submit" 
                        className="submit-button" 
                        disabled={loading}
                    >
                        {loading ? 'Resetting...' : 'Reset Password'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
