import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import LoginDriver from './pages/driver/LoginDriver';
import RegisterDriver from './pages/driver/RegisterDriver';
import LoginUser from './pages/user/LoginUser';
import RegisterUser from './pages/user/RegisterUser';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        
        {/* Driver Routes */}
        <Route path="/driver/login" element={<LoginDriver />} />
        <Route path="/driver/register" element={<RegisterDriver />} />
        
        {/* User Routes */}
        <Route path="/user/login" element={<LoginUser />} />
        <Route path="/user/register" element={<RegisterUser />} />
      </Routes>
    </Router>
  );
}

export default App;
