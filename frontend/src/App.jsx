import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import AddExpense from './pages/AddExpense';
import ImportWizard from './pages/ImportWizard';
import ReviewAnomalies from './pages/ReviewAnomalies';
import Balances from './pages/Balances';
import Login from './pages/Login'; // Import the new component

// Optional: A simple wrapper to protect routes if no token exists
const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('access_token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Route - No Sidebar */}
        <Route path="/login" element={<Login />} />

        {/* Protected Routes - Wrapped in the Sidebar Layout */}
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Balances />} />
          <Route path="expenses/add" element={<AddExpense />} />
          <Route path="import" element={<ImportWizard />} />
          <Route path="import/review" element={<ReviewAnomalies />} />
          
          {/* Placeholders for scaling later */}
          <Route path="activity" element={<div style={{padding: '2rem'}}>Activity Feed Coming Soon</div>} />
          <Route path="groups" element={<div style={{padding: '2rem'}}>Groups Coming Soon</div>} />
          <Route path="expenses" element={<div style={{padding: '2rem'}}>Expenses Coming Soon</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;