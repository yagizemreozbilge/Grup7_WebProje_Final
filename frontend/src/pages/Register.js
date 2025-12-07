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
    email: yup.string().email('Invalid email format').required('Email is required'),
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
        .required('Please confirm your password'),
    full_name: yup.string().required('Full name is required'),
    role: yup.string().oneOf(['student', 'faculty'], 'Invalid role').required('Role is required'),
    student_number: yup.string().when('role', {
        is: 'student',
        then: (schema) => schema.required('Student number is required'),
        otherwise: (schema) => schema.notRequired()
    }),
    employee_number: yup.string().when('role', {
        is: 'faculty',
        then: (schema) => schema.required('Employee number is required'),
        otherwise: (schema) => schema.notRequired()
    }),
    title: yup.string().when('role', {
        is: 'faculty',
        then: (schema) => schema.required('Title is required'),
        otherwise: (schema) => schema.notRequired()
    }),
    department_id: yup.string().required('Department is required'),
    terms: yup.boolean().oneOf([true], 'You must accept the terms and conditions')
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

        const onSubmit = async(data) => {
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
                setSuccess(result.message || 'Registration successful! Please check your email for verification.');
                setTimeout(() => {
                    navigate('/login');
                }, 3000);
            } else {
                setError(result.error);
            }

            setLoading(false);
        };

        const departmentOptions = [
            { value: '', label: 'Select Department' },
            ...departments.map(dept => ({
                value: dept.id,
                label: `${dept.name} (${dept.code})`
            }))
        ];

        return ( <
                div className = "register-container" >
                <
                div className = "register-card" >
                <
                h2 > Register < /h2> {
                    error && < div className = "error-message" > { error } < /div>} {
                        success && < div className = "success-message" > { success } < /div>} <
                            form onSubmit = { handleSubmit(onSubmit) } >
                            <
                            TextInput
                        label = "Full Name *"
                        type = "text"
                        id = "full_name" {...register('full_name') }
                        error = { errors.full_name ? .message }
                        disabled = { loading }
                        /> <
                        TextInput
                        label = "Email *"
                        type = "email"
                        id = "email" {...register('email') }
                        error = { errors.email ? .message }
                        disabled = { loading }
                        /> <
                        TextInput
                        label = "Password *"
                        type = "password"
                        id = "password" {...register('password') }
                        error = { errors.password ? .message }
                        disabled = { loading }
                        /> <
                        small style = {
                                { display: 'block', marginTop: '-0.75rem', marginBottom: '1rem', color: '#666', fontSize: '0.875rem' } } >
                            Min 8 characters, uppercase, lowercase, and number <
                            /small> <
                            TextInput
                        label = "Confirm Password *"
                        type = "password"
                        id = "confirmPassword" {...register('confirmPassword') }
                        error = { errors.confirmPassword ? .message }
                        disabled = { loading }
                        /> <
                        Select
                        label = "User Type *"
                        id = "role" {...register('role') }
                        error = { errors.role ? .message }
                        disabled = { loading }
                        options = {
                            [
                                { value: 'student', label: 'Student' },
                                { value: 'faculty', label: 'Faculty' }
                            ]
                        }
                        /> {
                            role === 'student' && ( <
                                TextInput label = "Student Number *"
                                type = "text"
                                id = "student_number" {...register('student_number') }
                                error = { errors.student_number ? .message }
                                disabled = { loading }
                                />
                            )
                        } {
                            role === 'faculty' && ( <
                                >
                                <
                                TextInput label = "Employee Number *"
                                type = "text"
                                id = "employee_number" {...register('employee_number') }
                                error = { errors.employee_number ? .message }
                                disabled = { loading }
                                /> <
                                TextInput label = "Title *"
                                type = "text"
                                id = "title"
                                placeholder = "e.g., Professor, Associate Professor" {...register('title') }
                                error = { errors.title ? .message }
                                disabled = { loading }
                                /> <
                                />
                            )
                        } <
                        Select
                        label = "Department *"
                        id = "department_id" {...register('department_id') }
                        error = { errors.department_id ? .message }
                        disabled = { loading }
                        options = { departmentOptions }
                        /> <
                        div className = "form-group" >
                            <
                            Checkbox
                        label = "I accept the terms and conditions *"
                        id = "terms" {...register('terms') }
                        error = { errors.terms ? .message }
                        disabled = { loading }
                        /> <
                        /div> <
                        button type = "submit"
                        className = "submit-button"
                        disabled = { loading } > { loading ? 'Registering...' : 'Register' } <
                            /button> <
                            /form> <
                            p className = "login-link" >
                            Already have an account ? < Link to = "/login" > Login here < /Link> <
                            /p> <
                            /div> <
                            /div>
                    );
                };

                export default Register;