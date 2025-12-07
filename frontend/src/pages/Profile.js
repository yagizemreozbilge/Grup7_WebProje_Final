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
    full_name: yup.string().required('Full name is required'),
    phone: yup.string().matches(/^\+?[1-9]\d{1,14}$/, 'Invalid phone number format')
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
            setSuccess('Profile updated successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to update profile');
        }

        setLoading(false);
    };

    const handleFileUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            setError('File size must be less than 5MB');
            return;
        }

        if (!file.type.match('image/jpeg|image/jpg|image/png')) {
            setError('Only JPEG, JPG, and PNG images are allowed');
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
            setSuccess('Profile picture uploaded successfully!');
        } catch (err) {
            setError(err.response?.data?.error || 'Failed to upload profile picture');
        }

        setUploading(false);
    };

    return (
        <div className="profile-container">
            <Navbar />
            <div className="profile-content">
                <Sidebar />
                <main className="profile-main">
                    <h1>Profile</h1>
                    {error && <div className="error-message">{error}</div>}
                    {success && <div className="success-message">{success}</div>}

                    <div className="profile-section">
                        <h2>Profile Picture</h2>
                        <div className="profile-picture-section">
                            {profilePicture ? (
                                <img 
                                    src={`http://localhost:5000${profilePicture}`} 
                                    alt="Profile" 
                                    className="profile-picture" 
                                />
                            ) : (
                                <div className="profile-picture-placeholder">
                                    {user?.full_name?.charAt(0) || user?.email?.charAt(0) || 'U'}
                                </div>
                            )}
                            <div className="upload-section">
                                <label htmlFor="profile-picture-upload" className="upload-button">
                                    {uploading ? 'Uploading...' : 'Upload Picture'}
                                </label>
                                <input
                                    type="file"
                                    id="profile-picture-upload"
                                    accept="image/jpeg,image/jpg,image/png"
                                    onChange={handleFileUpload}
                                    disabled={uploading}
                                    style={{ display: 'none' }}
                                />
                                <small>Max 5MB, JPG/PNG only</small>
                            </div>
                        </div>
                    </div>

                    <div className="profile-section">
                        <h2>Personal Information</h2>
                        <form onSubmit={handleSubmit(onSubmit)}>
                            <div className="form-group">
                                <label htmlFor="email">Email</label>
                                <input
                                    type="email"
                                    id="email"
                                    value={user?.email || ''}
                                    disabled
                                    className="disabled-input"
                                />
                                <small>Email cannot be changed</small>
                            </div>
                            <TextInput
                                label="Full Name"
                                type="text"
                                id="full_name"
                                {...register('full_name')}
                                error={errors.full_name?.message}
                                disabled={loading}
                            />
                            <TextInput
                                label="Phone"
                                type="tel"
                                id="phone"
                                {...register('phone')}
                                error={errors.phone?.message}
                                disabled={loading}
                            />
                            <div className="form-group">
                                <label>Role</label>
                                <input
                                    type="text"
                                    value={user?.role || ''}
                                    disabled
                                    className="disabled-input"
                                />
                            </div>
                            {user?.student && (
                                <div className="form-group">
                                    <label>Student Number</label>
                                    <input 
                                        type="text" 
                                        value={user.student.student_number || ''} 
                                        disabled 
                                        className="disabled-input" 
                                    />
                                </div>
                            )}
                            {user?.faculty && (
                                <div className="form-group">
                                    <label>Employee Number</label>
                                    <input 
                                        type="text" 
                                        value={user.faculty.employee_number || ''} 
                                        disabled 
                                        className="disabled-input" 
                                    />
                                </div>
                            )}
                            <button 
                                type="submit" 
                                className="submit-button" 
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </form>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Profile;
