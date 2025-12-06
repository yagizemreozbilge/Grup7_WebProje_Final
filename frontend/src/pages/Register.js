import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import './Register.css';

const Register = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    full_name: '',
    role: 'student',
    student_number: '',
    employee_number: '',
    title: '',
    department_id: ''
  });
  const [departments, setDepartments] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  React.useEffect(() => {
    // Fetch departments
    api.get('/departments').then(res => {
      setDepartments(res.data);
    }).catch(() => {
      // If endpoint doesn't exist, use mock data
      setDepartments([
        { id: '1', name: 'Computer Engineering', code: 'CENG' },
        { id: '2', name: 'Electrical Engineering', code: 'EE' },
        { id: '3', name: 'Mathematics', code: 'MATH' }
      ]);
    });
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.full_name) {
      setError('Please fill in all required fields');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return false;
    }

    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters long');
      return false;
    }

    if (formData.role === 'student' && !formData.student_number) {
      setError('Student number is required');
      return false;
    }

    if (formData.role === 'faculty' && (!formData.employee_number || !formData.title)) {
      setError('Employee number and title are required for faculty');
      return false;
    }

    if (!formData.department_id) {
      setError('Department is required');
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    const userData = {
      email: formData.email,
      password: formData.password,
      full_name: formData.full_name,
      role: formData.role,
      department_id: formData.department_id
    };

    if (formData.role === 'student') {
      userData.student_number = formData.student_number;
    } else if (formData.role === 'faculty') {
      userData.employee_number = formData.employee_number;
      userData.title = formData.title;
    }

    const result = await register(userData);
    
    if (result.success) {
      setSuccess(result.message || 'Registration successful! Please check your email for verification.');
      setTimeout(() => {
        navigate('/login');
      }, 3000);
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h2>Register</h2>
        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message">{success}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="full_name">Full Name *</label>
            <input
              type="text"
              id="full_name"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="email">Email *</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password *</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
            <small>Min 8 characters, uppercase, lowercase, and number</small>
          </div>
          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm Password *</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="role">User Type *</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="student">Student</option>
              <option value="faculty">Faculty</option>
            </select>
          </div>
          {formData.role === 'student' && (
            <div className="form-group">
              <label htmlFor="student_number">Student Number *</label>
              <input
                type="text"
                id="student_number"
                name="student_number"
                value={formData.student_number}
                onChange={handleChange}
                required
                disabled={loading}
              />
            </div>
          )}
          {formData.role === 'faculty' && (
            <>
              <div className="form-group">
                <label htmlFor="employee_number">Employee Number *</label>
                <input
                  type="text"
                  id="employee_number"
                  name="employee_number"
                  value={formData.employee_number}
                  onChange={handleChange}
                  required
                  disabled={loading}
                />
              </div>
              <div className="form-group">
                <label htmlFor="title">Title *</label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="e.g., Professor, Associate Professor"
                  required
                  disabled={loading}
                />
              </div>
            </>
          )}
          <div className="form-group">
            <label htmlFor="department_id">Department *</label>
            <select
              id="department_id"
              name="department_id"
              value={formData.department_id}
              onChange={handleChange}
              required
              disabled={loading}
            >
              <option value="">Select Department</option>
              {departments.map(dept => (
                <option key={dept.id} value={dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="submit-button" disabled={loading}>
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        <p className="login-link">
          Already have an account? <Link to="/login">Login here</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;

