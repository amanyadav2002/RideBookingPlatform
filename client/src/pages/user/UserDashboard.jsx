import { useState } from 'react';
import { Link } from 'react-router-dom';
import { User, MapPin, Navigation, Search, Clock, CreditCard, LogOut, ChevronRight } from 'lucide-react';

function UserDashboard() {
  const [pickup, setPickup] = useState('');
  const [dropoff, setDropoff] = useState('');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col">
      {/* Header */}
      <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-6 lg:px-12 z-20 sticky top-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-purple-500 to-fuchsia-500 flex items-center justify-center">
            <Navigation className="w-5 h-5 text-white transform -rotate-45" />
          </div>
          <span className="font-bold text-xl tracking-tight text-white hidden sm:block">HumSafar</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-400">
          <a href="#" className="text-purple-400 hover:text-purple-300 transition-colors">Book a Ride</a>
          <a href="#" className="hover:text-white transition-colors">My Rides</a>
          <a href="#" className="hover:text-white transition-colors">Wallet</a>
          <a href="#" className="hover:text-white transition-colors">Support</a>
        </nav>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 px-3 py-2 bg-slate-800 rounded-full border border-slate-700">
            <div className="w-7 h-7 rounded-full bg-purple-500/20 flex items-center justify-center">
              <User className="w-4 h-4 text-purple-400" />
            </div>
            <span className="text-sm font-medium pr-2">Profile</span>
          </div>
          <Link to="/" className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors">
            <LogOut className="w-5 h-5" />
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row relative">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-3xl pointer-events-none"></div>

        {/* Booking Panel */}
        <div className="w-full lg:w-[450px] p-6 lg:p-12 z-10 flex flex-col">
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-purple-500/10">
            <h2 className="text-3xl font-bold mb-8">Where can we take you?</h2>
            
            <div className="relative space-y-4">
              {/* Connection Line */}
              <div className="absolute left-6 top-10 bottom-10 w-0.5 bg-slate-700 z-0"></div>

              {/* Pickup Input */}
              <div className="relative z-10 flex items-center">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-900">
                  <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                </div>
                <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 ml-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-purple-500 focus-within:border-transparent transition-all">
                  <MapPin className="w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Pickup location" 
                    className="bg-transparent border-none outline-none w-full text-white placeholder-slate-500"
                    value={pickup}
                    onChange={(e) => setPickup(e.target.value)}
                  />
                </div>
              </div>

              {/* Dropoff Input */}
              <div className="relative z-10 flex items-center">
                <div className="w-12 h-12 flex items-center justify-center bg-slate-900">
                  <div className="w-3 h-3 rounded-sm bg-fuchsia-500"></div>
                </div>
                <div className="flex-1 bg-slate-800/50 border border-slate-700 rounded-xl px-4 py-3 ml-2 flex items-center gap-3 focus-within:ring-2 focus-within:ring-fuchsia-500 focus-within:border-transparent transition-all">
                  <Search className="w-5 h-5 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Destination" 
                    className="bg-transparent border-none outline-none w-full text-white placeholder-slate-500"
                    value={dropoff}
                    onChange={(e) => setDropoff(e.target.value)}
                  />
                </div>
              </div>
            </div>

            <button className="w-full mt-8 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-purple-500/25 transition-all flex justify-center items-center gap-2 group">
              Find Ride <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-slate-800 transition-colors">
              <Clock className="w-6 h-6 text-purple-400" />
              <span className="text-sm font-medium">Recent Places</span>
            </button>
            <button className="bg-slate-900/60 backdrop-blur border border-slate-800 rounded-2xl p-4 flex flex-col items-center gap-2 hover:bg-slate-800 transition-colors">
              <CreditCard className="w-6 h-6 text-fuchsia-400" />
              <span className="text-sm font-medium">Payment</span>
            </button>
          </div>
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-slate-800 relative overflow-hidden hidden lg:block border-l border-slate-800">
          {/* Fake Map Grid */}
          <div className="absolute inset-0 opacity-10 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 z-10">
             <div className="w-24 h-24 bg-slate-900/80 backdrop-blur border border-slate-700 rounded-full flex items-center justify-center shadow-2xl mb-6">
                <MapPin className="w-10 h-10 text-purple-400" />
             </div>
             <p className="text-xl font-medium">Interactive Map View</p>
             <p className="text-sm mt-2">Your location and route will appear here</p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;
