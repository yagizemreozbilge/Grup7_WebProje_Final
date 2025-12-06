import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './Profile.css';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone: user?.phone || ''
  });
  const [profilePicture, setProfilePicture] = useState(user?.profile_picture_url || '');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await api.put('/users/me', formData);
      updateUser(response.data.user);
      setSuccess('Profile updated successfully!');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update profile');
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
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to upload profile picture');
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
            <form onSubmit={handleProfileUpdate}>
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
              <div className="form-group">
                <label htmlFor="full_name">Full Name</label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="phone">Phone</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  disabled={loading}
                />
              </div>
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
              <button type="submit" className="submit-button" disabled={loading}>
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

