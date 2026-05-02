import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginDriver from './pages/driver/LoginDriver';
import RegisterDriver from './pages/driver/RegisterDriver';
import DriverDashboard from './pages/driver/DriverDashboard';
import LoginUser from './pages/user/LoginUser';
import RegisterUser from './pages/user/RegisterUser';
import UserDashboard from './pages/user/UserDashboard';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Driver Routes */}
        <Route path="/driver/login" element={<LoginDriver />} />
        <Route path="/driver/register" element={<RegisterDriver />} />
        <Route path="/driver/dashboard" element={<DriverDashboard />} />
        
        {/* User Routes */}
        <Route path="/user/login" element={<LoginUser />} />
        <Route path="/user/register" element={<RegisterUser />} />
        <Route path="/user/dashboard" element={<UserDashboard />} />
      </Routes>
    </Router>
  );
}

export default App;
