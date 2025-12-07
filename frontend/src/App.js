import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Users from './pages/Users';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
    return ( <Router>
        <AuthProvider>
        <Routes>
        <Route path = "/login"
        element = { <Login /> }
        /> <Route path = "/register"
        element = { <Register /> }
        /> <Route path = "/verify-email/:token"
        element = { <VerifyEmail /> }
        /> <Route path = "/forgot-password"
        element = { <ForgotPassword /> }
        /> <Route path = "/reset-password/:token"
        element = { <ResetPassword /> }
        /> <Route path = "/dashboard"
        element = { <ProtectedRoute>
            <Dashboard />
            </ProtectedRoute>
        }
        /> <Route path = "/profile"
        element = { <ProtectedRoute>
            <Profile />
            </ProtectedRoute>
        }
        /> <Route path = "/users"
        element = { <ProtectedRoute roles={['admin']}>
            <Users />
            </ProtectedRoute>
        }
        /> <Route path = "/"
        element = { <Navigate to = "/dashboard"
            replace /> }
        /> <Route path = "*"
        element = { <NotFound /> }
        /> </Routes> </AuthProvider> </Router>
    );
}

export default App;