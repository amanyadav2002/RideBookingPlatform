import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, ArrowRight, ArrowLeft } from 'lucide-react';

function RegisterDriver() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    vehicleModel: '',
    password: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/auth/register-driver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        navigate('/driver/dashboard');
      } else {
        alert(`Error: ${data.message}`);
      }
    } catch (error) {
      console.error('Registration failed', error);
      alert('Server error, please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 text-slate-50 selection:bg-indigo-500 selection:text-white relative overflow-hidden">
      {/* Background gradients */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-indigo-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-purple-600/20 rounded-full blur-3xl"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        <Link to="/" className="inline-flex items-center text-sm font-medium text-slate-400 hover:text-white transition-colors mb-6 group">
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          Back to Home
        </Link>
        <div className="flex justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Car className="w-6 h-6 text-white" />
          </div>
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white">
          Become a Driver
        </h2>
        <p className="mt-2 text-center text-sm text-slate-400">
          Join HumSafar and start earning today
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl relative z-10">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-4 shadow-2xl shadow-indigo-500/10 sm:rounded-2xl sm:px-10 border border-slate-800">
          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="name" className="block text-sm font-medium text-slate-300">
                  Full Name
                </label>
                <div className="mt-1">
                  <input
                    id="name"
                    name="name"
                    type="text"
                    required
                    value={formData.name}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 border border-slate-700 rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="John Doe"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                  Email address
                </label>
                <div className="mt-1">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={formData.email}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 border border-slate-700 rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="driver@example.com"
                  />
                </div>
              </div>

              <div className="sm:col-span-1">
                <label htmlFor="phone" className="block text-sm font-medium text-slate-300">
                  Phone Number
                </label>
                <div className="mt-1">
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 border border-slate-700 rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="vehicleModel" className="block text-sm font-medium text-slate-300">
                  Vehicle Model & Year
                </label>
                <div className="mt-1">
                  <input
                    id="vehicleModel"
                    name="vehicleModel"
                    type="text"
                    required
                    value={formData.vehicleModel}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 border border-slate-700 rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="e.g. Toyota Camry 2022"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                  Password
                </label>
                <div className="mt-1">
                  <input
                    id="password"
                    name="password"
                    type="password"
                    required
                    value={formData.password}
                    onChange={handleChange}
                    className="appearance-none block w-full px-3 py-3 border border-slate-700 rounded-xl shadow-sm bg-slate-800/50 text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all sm:text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all focus:ring-offset-slate-900 group"
              >
                Create Driver Account <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-700" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-slate-900 text-slate-400">
                  Already have an account?
                </span>
              </div>
            </div>

            <div className="mt-6 text-center">
              <Link
                to="/driver/login"
                className="font-medium text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Sign in here
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RegisterDriver;
