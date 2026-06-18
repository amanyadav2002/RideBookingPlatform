import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  ShieldAlert, 
  Search, 
  Users, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  LogOut, 
  Car,
  RefreshCw,
  Phone,
  Mail,
  Calendar
} from 'lucide-react';

function AdminDashboard() {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const navigate = useNavigate();

  // Security Check
  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/auth/admin/applications');
      if (response.ok) {
        const data = await response.json();
        setApplications(data);
      } else {
        console.error('Failed to fetch applications');
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin/login');
      return;
    }
    fetchApplications();
  }, [isAdmin, navigate]);

  const handleStatusUpdate = async (id, action) => {
    try {
      const response = await fetch(`http://localhost:5000/api/auth/admin/applications/${id}/${action}`, {
        method: 'POST'
      });
      if (response.ok) {
        const updated = await response.json();
        setApplications(prev => prev.map(app => app._id === id ? updated.application : app));
      } else {
        const errData = await response.json();
        alert(`Failed to update application: ${errData.message}`);
      }
    } catch (error) {
      console.error(`Error performing action ${action}:`, error);
      alert('Server error, please try again.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  if (!isAdmin) {
    return null;
  }

  // Statistics Calculation
  const totalApps = applications.length;
  const pendingApps = applications.filter(app => app.status === 'pending').length;
  const approvedApps = applications.filter(app => app.status === 'approved').length;
  const rejectedApps = applications.filter(app => app.status === 'rejected').length;

  // Filtered Applications
  const filteredApps = applications.filter(app => {
    const matchesSearch = 
      app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.phone.includes(searchTerm) ||
      app.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.vehicleModel.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-rose-500 selection:text-white pb-12">
      {/* Navbar */}
      <nav className="border-b border-slate-800 bg-slate-900/50 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center">
                <ShieldAlert className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-rose-400 to-amber-400">
                HumSafar Admin Portal
              </span>
            </div>
            
            <button 
              onClick={handleLogout}
              className="inline-flex items-center gap-2 px-4 py-2 border border-slate-700 hover:border-rose-500/50 rounded-xl text-sm font-medium text-slate-300 hover:text-rose-400 bg-slate-800/50 hover:bg-rose-500/10 transition-all cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-white">Driver Verification Dashboard</h1>
            <p className="text-slate-400 text-sm mt-1">Review and approve driver registration applications to grant portal access.</p>
          </div>
          <button 
            onClick={fetchApplications}
            className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl hover:bg-slate-800 text-sm text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh List
          </button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Total Applications</p>
                <h3 className="text-3xl font-bold mt-2 text-white">{totalApps}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Pending */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Pending Approval</p>
                <h3 className="text-3xl font-bold mt-2 text-amber-400">{pendingApps}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 animate-pulse">
                <Clock className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Approved */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Approved Drivers</p>
                <h3 className="text-3xl font-bold mt-2 text-emerald-400">{approvedApps}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>
          </div>

          {/* Rejected */}
          <div className="bg-slate-900 border border-slate-800/80 rounded-2xl p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl"></div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Rejected Apps</p>
                <h3 className="text-3xl font-bold mt-2 text-rose-400">{rejectedApps}</h3>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <XCircle className="w-6 h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-slate-900/40 border border-slate-850 p-4 rounded-2xl flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search bar */}
          <div className="relative w-full md:max-w-md">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search by name, email, phone or vehicle..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 rounded-xl text-sm placeholder-slate-550 transition-colors"
            />
          </div>

          {/* Filter badges */}
          <div className="flex gap-2 self-start md:self-auto overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
            {['all', 'pending', 'approved', 'rejected'].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 text-xs font-semibold rounded-xl uppercase tracking-wider transition-all cursor-pointer whitespace-nowrap ${
                  statusFilter === status
                    ? 'bg-rose-550 text-white shadow-lg shadow-rose-500/20'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* List of Applications */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 space-y-4">
            <RefreshCw className="w-10 h-10 text-rose-500 animate-spin" />
            <p className="text-slate-450 text-sm">Loading applications...</p>
          </div>
        ) : filteredApps.length === 0 ? (
          <div className="bg-slate-900 border border-slate-850 text-center py-20 rounded-2xl">
            <Users className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-white">No applications found</h3>
            <p className="text-slate-450 text-sm mt-1 max-w-sm mx-auto">
              There are no registration applications that match the search criteria.
            </p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredApps.map((app) => (
              <div 
                key={app._id} 
                className={`bg-slate-900/60 border rounded-2xl p-6 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:shadow-indigo-500/5 ${
                  app.status === 'pending' ? 'border-slate-805 hover:border-amber-500/30' :
                  app.status === 'approved' ? 'border-slate-850 hover:border-emerald-500/20' :
                  'border-slate-850 hover:border-rose-500/20'
                }`}
              >
                <div className="space-y-4">
                  {/* Card Header */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-lg font-bold text-white">{app.name}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Applied: {new Date(app.createdAt).toLocaleDateString()}</p>
                    </div>
                    
                    {/* Status Badge */}
                    <span className={`px-2.5 py-1 rounded-full text-xxs font-extrabold uppercase tracking-wider ${
                      app.status === 'pending' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      app.status === 'approved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                    }`}>
                      {app.status}
                    </span>
                  </div>

                  <hr className="border-slate-800" />

                  {/* Card Details */}
                  <div className="space-y-2 text-sm text-slate-350">
                    <div className="flex items-center gap-3">
                      <Mail className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="truncate">{app.email}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Phone className="w-4 h-4 text-slate-500 shrink-0" />
                      <span>{app.phone}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Car className="w-4 h-4 text-slate-500 shrink-0" />
                      <span className="text-slate-200 font-medium truncate">{app.vehicleModel}</span>
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                {app.status === 'pending' && (
                  <div className="grid grid-cols-2 gap-3 mt-6 pt-4 border-t border-slate-800/60">
                    <button
                      onClick={() => handleStatusUpdate(app._id, 'reject')}
                      className="inline-flex justify-center items-center gap-2 py-2 px-3 bg-slate-800 hover:bg-rose-500/10 text-slate-400 hover:text-rose-400 border border-slate-700 hover:border-rose-500/30 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                    <button
                      onClick={() => handleStatusUpdate(app._id, 'approve')}
                      className="inline-flex justify-center items-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-650/15 hover:shadow-emerald-500/25 transition-all cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default AdminDashboard;
