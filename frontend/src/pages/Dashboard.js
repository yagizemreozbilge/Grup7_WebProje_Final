import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  return (
    <div className="dashboard-container">
      <Navbar />
      <div className="dashboard-content">
        <Sidebar />
        <main className="dashboard-main">
          <h1>Welcome, {user?.full_name || user?.email}!</h1>
          <div className="dashboard-cards">
            <div className="dashboard-card">
              <h3>Role</h3>
              <p className="role-badge">{user?.role}</p>
            </div>
            {user?.student && (
              <div className="dashboard-card">
                <h3>Student Information</h3>
                <p><strong>Student Number:</strong> {user.student.student_number}</p>
                <p><strong>Department:</strong> {user.student.department?.name}</p>
                <p><strong>GPA:</strong> {user.student.gpa}</p>
                <p><strong>CGPA:</strong> {user.student.cgpa}</p>
              </div>
            )}
            {user?.faculty && (
              <div className="dashboard-card">
                <h3>Faculty Information</h3>
                <p><strong>Employee Number:</strong> {user.faculty.employee_number}</p>
                <p><strong>Title:</strong> {user.faculty.title}</p>
                <p><strong>Department:</strong> {user.faculty.department?.name}</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;

