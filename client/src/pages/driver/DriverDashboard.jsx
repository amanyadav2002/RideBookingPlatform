import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Car, MapPin, Navigation, DollarSign, Clock, Settings, LogOut } from 'lucide-react';

function DriverDashboard() {
  const [isOnline, setIsOnline] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-slate-900 border-r border-slate-800 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
            <Car className="w-5 h-5 text-white" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white">HumSafar</span>
        </div>
        
        <nav className="flex-1 p-4 flex flex-col gap-2">
          <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <Navigation className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
            <DollarSign className="w-5 h-5" />
            <span className="font-medium">Earnings</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
            <Clock className="w-5 h-5" />
            <span className="font-medium">History</span>
          </a>
          <a href="#" className="flex items-center space-x-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-xl transition-colors">
            <Settings className="w-5 h-5" />
            <span className="font-medium">Settings</span>
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <Link to="/" className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors w-full">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-8 z-10">
          <h1 className="text-2xl font-bold">Driver Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">Status:</span>
            <button 
              onClick={() => setIsOnline(!isOnline)}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${isOnline ? 'bg-indigo-500' : 'bg-slate-700'}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${isOnline ? 'translate-x-7' : 'translate-x-1'}`} />
            </button>
            <span className={`text-sm font-medium ${isOnline ? 'text-indigo-400' : 'text-slate-400'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8 relative">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -z-10"></div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Stats Cards */}
            <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl shadow-indigo-500/5 text-center">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <DollarSign className="w-6 h-6" />
                </div>
                <h3 className="text-slate-400 text-sm font-medium">Today's Earnings</h3>
                <p className="text-3xl font-bold mt-2">$124.50</p>
              </div>
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl shadow-purple-500/5 text-center">
                <div className="w-12 h-12 bg-purple-500/20 text-purple-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Navigation className="w-6 h-6" />
                </div>
                <h3 className="text-slate-400 text-sm font-medium">Completed Rides</h3>
                <p className="text-3xl font-bold mt-2">12</p>
              </div>
              <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-6 shadow-xl shadow-indigo-500/5 text-center">
                <div className="w-12 h-12 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="text-slate-400 text-sm font-medium">Hours Online</h3>
                <p className="text-3xl font-bold mt-2">5.2h</p>
              </div>
            </div>

            {/* Map Placeholder */}
            <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-xl shadow-indigo-500/5 overflow-hidden flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <MapPin className="w-5 h-5 text-indigo-400" /> Current Location
                </h2>
              </div>
              <div className="flex-1 bg-slate-800 flex items-center justify-center relative overflow-hidden">
                {/* Fake Map Background */}
                <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
                <div className="text-center z-10">
                  <div className="w-16 h-16 bg-indigo-500/20 text-indigo-400 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                    <Navigation className="w-8 h-8" />
                  </div>
                  <p className="text-slate-400">Map Interface will load here.</p>
                  {!isOnline && <p className="text-sm text-amber-400 mt-2">Go online to start receiving ride requests.</p>}
                </div>
              </div>
            </div>

            {/* Active Requests */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-xl shadow-indigo-500/5 flex flex-col h-[400px]">
              <div className="p-4 border-b border-slate-800">
                <h2 className="font-semibold text-lg flex items-center gap-2">
                  <Car className="w-5 h-5 text-indigo-400" /> Ride Requests
                </h2>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {isOnline ? (
                  <div className="flex flex-col gap-4 text-center justify-center h-full text-slate-400">
                    <div className="w-12 h-12 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                    <p>Looking for riders nearby...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center">
                    <div className="w-16 h-16 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mb-4">
                      <Settings className="w-8 h-8" />
                    </div>
                    <p className="text-slate-400 font-medium">You are offline</p>
                    <p className="text-sm text-slate-500 mt-1">Go online to receive requests.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

export default DriverDashboard;
