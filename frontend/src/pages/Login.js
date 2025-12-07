import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import TextInput from '../components/TextInput';
import Checkbox from '../components/Checkbox';
import './Login.css';

const loginSchema = yup.object().shape({
    email: yup.string().email('Geçersiz e-posta formatı').required('E-posta gereklidir'),
    password: yup.string().required('Şifre gereklidir'),
    rememberMe: yup.boolean()
});

const Login = () => {
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: yupResolver(loginSchema),
        defaultValues: {
            rememberMe: false
        }
    });

    const onSubmit = async (data) => {
        setError('');
        setLoading(true);

        const result = await login(data.email, data.password);

        if (result.success) {
            if (data.rememberMe) {
                localStorage.setItem('rememberMe', 'true');
            }
            navigate('/dashboard');
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    return (
        <div className='login-container'>
            <div className='login-card'>
                <h2>Giriş Yap</h2>
                {error && <div className='error-message'>{error}</div>}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextInput
                        label='E-posta'
                        type='email'
                        id='email'
                        {...register('email')}
                        error={errors.email?.message}
                        disabled={loading}
                        spellCheck='false'
                        autoComplete='email'
                    />
                    <TextInput
                        label='Şifre'
                        type='password'
                        id='password'
                        {...register('password')}
                        error={errors.password?.message}
                        disabled={loading}
                    />
                    <div className='form-group'>
                        <Checkbox
                            label='Beni hatırla'
                            id='rememberMe'
                            {...register('rememberMe')}
                            disabled={loading}
                        />
                    </div>
                    <div className='form-group'>
                        <Link to='/forgot-password' className='forgot-password-link'>
                            Şifremi unuttum?
                        </Link>
                    </div>
                    <button 
                        type='submit' 
                        className='submit-button' 
                        disabled={loading}
                    >
                        {loading ? 'Giriş yapılıyor...' : 'Giriş Yap'}
                    </button>
                </form>
                <p className='register-link'>
                    Hesabınız yok mu? <Link to='/register'>Kayıt ol</Link>
                </p>
            </div>
        </div>
    );
};

export default Login;
