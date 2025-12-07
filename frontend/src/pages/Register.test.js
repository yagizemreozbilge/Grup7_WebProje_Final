import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import Register from './Register';
import api from '../services/api';

// Mock the useNavigate hook
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useNavigate: () => mockNavigate,
    Link: ({ children, to }) => < a href = { to } > { children } < /a>
}));

// Mock the API
jest.mock('../services/api', () => ({
    __esModule: true,
    default: {
        get: jest.fn(),
        post: jest.fn(),
        interceptors: {
            request: { use: jest.fn() },
            response: { use: jest.fn() }
        }
    }
}));

const renderWithProviders = (component) => {
    return render( <
        BrowserRouter >
        <
        AuthProvider > { component } <
        /AuthProvider> <
        /BrowserRouter>
    );
};

describe('Register Component', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        api.get.mockResolvedValue({
            data: [
                { id: '1', name: 'Computer Engineering', code: 'CENG' },
                { id: '2', name: 'Electrical Engineering', code: 'EE' }
            ]
        });
    });

    it('renders register form', async() => {
        renderWithProviders( < Register / > );

        await waitFor(() => {
            expect(screen.getByText('Register')).toBeInTheDocument();
            expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
            expect(screen.getByRole('button', { name: /register/i })).toBeInTheDocument();
        });
    });

    it('shows validation errors for empty required fields', async() => {
        renderWithProviders( < Register / > );

        await waitFor(() => {
            const submitButton = screen.getByRole('button', { name: /register/i });
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(screen.getByText(/full name is required/i)).toBeInTheDocument();
            expect(screen.getByText(/email is required/i)).toBeInTheDocument();
            expect(screen.getByText(/password is required/i)).toBeInTheDocument();
        });
    });

    it('shows validation error for invalid email', async() => {
        renderWithProviders( < Register / > );

        await waitFor(() => {
            const emailInput = screen.getByLabelText(/email/i);
            fireEvent.change(emailInput, { target: { value: 'invalid-email' } });

            const submitButton = screen.getByRole('button', { name: /register/i });
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(screen.getByText(/invalid email format/i)).toBeInTheDocument();
        });
    });

    it('shows validation error for weak password', async() => {
        renderWithProviders( < Register / > );

        await waitFor(() => {
            const passwordInput = screen.getByLabelText(/password/i);
            fireEvent.change(passwordInput, { target: { value: 'weak' } });

            const submitButton = screen.getByRole('button', { name: /register/i });
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            expect(screen.getByText(/password must be at least 8 characters/i)).toBeInTheDocument();
        });
    });

    it('shows student number field when student role is selected', async() => {
        renderWithProviders( < Register / > );

        await waitFor(() => {
            const roleSelect = screen.getByLabelText(/user type/i);
            fireEvent.change(roleSelect, { target: { value: 'student' } });
        });

        await waitFor(() => {
            expect(screen.getByLabelText(/student number/i)).toBeInTheDocument();
        });
    });

    it('shows faculty fields when faculty role is selected', async() => {
        renderWithProviders( < Register / > );

        await waitFor(() => {
            const roleSelect = screen.getByLabelText(/user type/i);
            fireEvent.change(roleSelect, { target: { value: 'faculty' } });
        });

        await waitFor(() => {
            expect(screen.getByLabelText(/employee number/i)).toBeInTheDocument();
            expect(screen.getByLabelText(/title/i)).toBeInTheDocument();
        });
    });

    it('renders terms and conditions checkbox', async() => {
        renderWithProviders( < Register / > );

        await waitFor(() => {
            expect(screen.getByLabelText(/terms and conditions/i)).toBeInTheDocument();
        });
    });
});