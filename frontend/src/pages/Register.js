import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import TextInput from '../components/TextInput';
import Select from '../components/Select';
import Checkbox from '../components/Checkbox';
import './Register.css';

const registerSchema = yup.object().shape({
    email: yup.string()
        .email('Geçersiz e-posta formatı')
        .matches(/@.*\.edu$/i, 'E-posta adresi .edu uzantılı olmalıdır')
        .required('E-posta gereklidir'),
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
        .required('Lütfen şifrenizi onaylayın'),
    full_name: yup.string().required('Ad soyad gereklidir'),
    role: yup.string().oneOf(['student', 'faculty'], 'Geçersiz rol').required('Rol gereklidir'),
    student_number: yup.string().when('role', {
        is: 'student',
        then: (schema) => schema.required('Öğrenci numarası gereklidir'),
        otherwise: (schema) => schema.notRequired()
    }),
    employee_number: yup.string().when('role', {
        is: 'faculty',
        then: (schema) => schema.required('Personel numarası gereklidir'),
        otherwise: (schema) => schema.notRequired()
    }),
    title: yup.string().when('role', {
        is: 'faculty',
        then: (schema) => schema.required('Ünvan gereklidir'),
        otherwise: (schema) => schema.notRequired()
    }),
    department_id: yup.string().required('Bölüm gereklidir'),
    terms: yup.boolean().oneOf([true], 'Şartlar ve koşulları kabul etmelisiniz')
});

const Register = () => {
    const [departments, setDepartments] = useState([]);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const { register: registerUser } = useAuth();
    const navigate = useNavigate();

    const { register, handleSubmit, watch, formState: { errors } } = useForm({
        resolver: yupResolver(registerSchema),
        defaultValues: {
            role: 'student',
            terms: false
        }
    });

    const role = watch('role');

    useEffect(() => {
        api.get('/departments').then(res => {
            setDepartments(res.data);
        }).catch(() => {
            setDepartments([
                { id: '1', name: 'Bilgisayar Mühendisliği', code: 'CENG' },
                { id: '2', name: 'Elektrik-Elektronik Mühendisliği', code: 'EEE' },
                { id: '3', name: 'Matematik', code: 'MATH' },
                { id: '4', name: 'Makine Mühendisliği', code: 'ME' },
                { id: '5', name: 'İnşaat Mühendisliği', code: 'CE' },
                { id: '6', name: 'Endüstri Mühendisliği', code: 'IE' },
                { id: '7', name: 'Mimarlık', code: 'ARCH' },
                { id: '8', name: 'Tıp', code: 'MED' },
                { id: '9', name: 'Hukuk', code: 'LAW' },
                { id: '10', name: 'Psikoloji', code: 'PSY' },
                { id: '11', name: 'İşletme', code: 'BUS' }
            ]);
        });
    }, []);

    const onSubmit = async (data) => {
        setError('');
        setSuccess('');
        setLoading(true);

        const userData = {
            email: data.email,
            password: data.password,
            full_name: data.full_name,
            role: data.role,
            department_id: data.department_id
        };

        if (data.role === 'student') {
            userData.student_number = data.student_number;
        } else if (data.role === 'faculty') {
            userData.employee_number = data.employee_number;
            userData.title = data.title;
        }

        const result = await registerUser(userData);

        if (result.success) {
            setSuccess(result.message || 'Kayıt başarılı! Lütfen doğrulama için e-postanızı kontrol edin.');
            setTimeout(() => {
                navigate('/login');
            }, 3000);
        } else {
            setError(result.error);
        }

        setLoading(false);
    };

    const departmentOptions = [
        { value: '', label: 'Bölüm Seçin' },
        ...departments.map(dept => ({
            value: dept.id,
            label: `${dept.name} (${dept.code})`
        }))
    ];

    return (
        <div className='register-container'>
            <div className='register-card'>
                <h2>Kayıt Ol</h2>
                {error && <div className='error-message'>{error}</div>}
                {success && <div className='success-message'>{success}</div>}
                <form onSubmit={handleSubmit(onSubmit)}>
                    <TextInput
                        label='Ad Soyad *'
                        type='text'
                        id='full_name'
                        {...register('full_name')}
                        error={errors.full_name?.message}
                        disabled={loading}
                    />
                    <TextInput
                        label='E-posta *'
                        type='email'
                        id='email'
                        {...register('email')}
                        error={errors.email?.message}
                        disabled={loading}
                        spellCheck='false'
                        autoComplete='email'
                    />
                    <TextInput
                        label='Şifre *'
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
                        label='Şifreyi Onayla *'
                        type='password'
                        id='confirmPassword'
                        {...register('confirmPassword')}
                        error={errors.confirmPassword?.message}
                        disabled={loading}
                    />
                    <Select
                        label='Kullanıcı Tipi *'
                        id='role'
                        {...register('role')}
                        error={errors.role?.message}
                        disabled={loading}
                        options={[
                            { value: 'student', label: 'Öğrenci' },
                            { value: 'faculty', label: 'Akademisyen' }
                        ]}
                    />
                    {role === 'student' && (
                        <TextInput
                            label='Öğrenci Numarası *'
                            type='text'
                            id='student_number'
                            {...register('student_number')}
                            error={errors.student_number?.message}
                            disabled={loading}
                        />
                    )}
                    {role === 'faculty' && (
                        <>
                            <TextInput
                                label='Personel Numarası *'
                                type='text'
                                id='employee_number'
                                {...register('employee_number')}
                                error={errors.employee_number?.message}
                                disabled={loading}
                            />
                            <TextInput
                                label='Ünvan *'
                                type='text'
                                id='title'
                                placeholder='örn. Profesör, Doçent'
                                {...register('title')}
                                error={errors.title?.message}
                                disabled={loading}
                            />
                        </>
                    )}
                    <Select
                        label='Bölüm *'
                        id='department_id'
                        {...register('department_id')}
                        error={errors.department_id?.message}
                        disabled={loading}
                        options={departmentOptions}
                    />
                    <div className='form-group'>
                        <Checkbox
                            label='Şartlar ve koşulları kabul ediyorum *'
                            id='terms'
                            {...register('terms')}
                            error={errors.terms?.message}
                            disabled={loading}
                        />
                    </div>
                    <button 
                        type='submit' 
                        className='submit-button' 
                        disabled={loading}
                    >
                        {loading ? 'Kaydediliyor...' : 'Kayıt Ol'}
                    </button>
                </form>
                <p className='login-link'>
                    Zaten hesabınız var mı? <Link to='/login'>Giriş yap</Link>
                </p>
            </div>
        </div>
    );
};

export default Register;
