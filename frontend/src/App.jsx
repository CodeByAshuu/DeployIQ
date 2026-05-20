import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Projects from './pages/Projects.jsx';
import CreateProject from './pages/CreateProject.jsx';
import EditProject from './pages/EditProject.jsx';
import ProjectDetails from './pages/ProjectDetails.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Deployments from './pages/Deployments.jsx';
import DeploymentDetails from './pages/DeploymentDetails.jsx';
import Monitoring from './pages/Monitoring.jsx';
import Logs from './pages/Logs.jsx';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Dashboard />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/projects" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Projects />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/projects/new" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <CreateProject />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/projects/:id" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <ProjectDetails />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/projects/:id/edit" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <EditProject />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/deployments" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Deployments />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/deployments/:id" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <DeploymentDetails />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/monitoring" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Monitoring />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/logs" 
            element={
              <ProtectedRoute>
                <DashboardLayout>
                  <Logs />
                </DashboardLayout>
              </ProtectedRoute>
            } 
          />

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
