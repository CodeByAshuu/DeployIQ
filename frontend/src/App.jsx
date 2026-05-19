import React from 'react';
import DashboardLayout from './layouts/DashboardLayout';
import Dashboard from './pages/Dashboard';

export default function App() {
  return (
    <DashboardLayout>
      <Dashboard />
    </DashboardLayout>
  );
}
