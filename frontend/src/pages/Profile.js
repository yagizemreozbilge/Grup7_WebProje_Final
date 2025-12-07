import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import TextInput from '../components/TextInput';
import './Profile.css';

const profileSchema = yup.object().shape({
    full_name: yup.string().required('Ad soyad gereklidir'),
    phone: yup.string().matches(/^\+?[0-9]\d{9,14}$/, 'Geçersiz telefon numarası formatı')
});

const Profile = () => {
    const { user, updateUser } = useAuth();
    const [profilePicture, setProfilePicture] = useState(user?.profile_picture_url || '');
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const { register, handleSubmit, formState: { errors }, reset } = useForm({
        resolver: yupResolver(profileSchema),
        defaultValues: {
            full_name: user?.full_name || '',
            phone: user?.phone || ''
        }
    });

    useEffect(() => {
        if (user) {
            reset({
                full_name: user.full_name || '',
                phone: user.phone || ''
            });
            setProfilePicture(user.profile_picture_url || '');
        }
    }, [user, reset]);

    const onSubmit = async (data) => {
        setError('');
        setSuccess('');
        setLoading(true);

        try {
            const response = await api.put('/users/me', data);
            updateUser(response.data.user);
            setSuccess('Profil başarıyla güncellendi!');
        } catch (err) {
            setError(err.response?.data?.error || 'Profil güncellenemedi');
        }

        setLoading(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('Dosya boyutu 5MB\'dan küçük olmalıdır');
            return;
        }

        if (!file.type.match('image/jpeg|image/jpg|image/png')) {
            setError('Sadece JPEG, JPG ve PNG resimlerine izin verilir');
            return;
        }

        setUploading(true);
        setError('');

        const formData = new FormData();
        formData.append('profilePicture', file);

        try {
            const response = await api.post('/users/me/profile-picture', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            setProfilePicture(response.data.profilePictureUrl);
            updateUser({ ...user, profile_picture_url: response.data.profilePictureUrl });
            setSuccess('Profil resmi başarıyla yüklendi!');
        } catch (error) {
            setError(error.response?.data?.error || 'Profil resmi yüklenemedi');
        }

        setUploading(false);
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
        return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
    };

    return (
        <div className='profile-container'>
            <Navbar />
            <div className='profile-content'>
                <Sidebar />
                <main className='profile-main'>
                    <h1>Profil</h1>
                    {error && <div className='error-message'>{error}</div>}
                    {success && <div className='success-message'>{success}</div>}

                    <div className='profile-section'>
                        <h2>Profil Resmi</h2>
                        <div className='profile-picture-section'>
                            {profilePicture ? (
                                <img 
                                    src={`http://localhost:5000${profilePicture}`} 
                                    alt='Profile' 
                                    className='profile-picture' 
                                />
                            ) : (
                                <div className='profile-picture-placeholder'>
                                    {getInitials(user?.full_name || user?.email)}
                                </div>
                            )}
                            <div className='upload-section'>
                                <label htmlFor='profile-picture-upload' className='upload-button'>
                                    {uploading ? 'Yükleniyor...' : 'Resim Yükle'}
                                </label>
                                <input
                                    type='file'
                                    id='profile-picture-upload'
                                    accept='image/jpeg,image/jpg,image/png'
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    style={{ display: 'none' }}
                                />
                                <small>Maks 5 MB, sadece JPG / PNG</small>
                            </div>
                        </div>
                    </div>

                    <div className='profile-section'>
                        <h2>Kişisel Bilgiler</h2>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className='form-group'>
                                <label htmlFor='email'>E-posta</label>
                                <input
                                    type='email'
                                    id='email'
                                    value={user?.email || ''}
                                    disabled
                                    className='disabled-input'
                                />
                                <small>E-posta değiştirilemez</small>
                            </div>
                            <TextInput
                                label='Ad Soyad'
                                type='text'
                                id='full_name'
                                {...register('full_name')}
                                error={errors.full_name?.message}
                                disabled={loading}
                            />
                            <TextInput
                                label='Telefon'
                                type='tel'
                                id='phone'
                                {...register('phone')}
                                error={errors.phone?.message}
                                disabled={loading}
                            />
                            <div className='form-group'>
                                <label>Rol</label>
                                <input
                                    type='text'
                                    value={user?.role || ''}
                                    disabled
                                    className='disabled-input'
                                />
                            </div>
                            {user?.student && (
                                <div className='form-group'>
                                    <label>Öğrenci Numarası</label>
                                    <input 
                                        type='text' 
                                        value={user.student.student_number || ''} 
                                        disabled 
                                        className='disabled-input' 
                                    />
                                </div>
                            )}
                            {user?.faculty && (
                                <div className='form-group'>
                                    <label>Personel Numarası</label>
                                    <input 
                                        type='text' 
                                        value={user.faculty.employee_number || ''} 
                                        disabled 
                                        className='disabled-input' 
                                    />
                                </div>
                            )}
                            <button 
                                type='submit' 
                                className='submit-button' 
                                disabled={loading}
                            >
                                {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Profile;
