import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Car, MapPin, Navigation, DollarSign, Clock, Settings, LogOut, Loader2, CheckCircle2, User, X, ChevronRight } from 'lucide-react';
import Map from '../../components/Map';

const BENGALURU_BBOX = {
  minLat: 12.75,
  maxLat: 13.22,
  minLng: 77.35,
  maxLng: 77.85
};

const isWithinBengaluru = (lat, lng) => {
  return (
    lat >= BENGALURU_BBOX.minLat &&
    lat <= BENGALURU_BBOX.maxLat &&
    lng >= BENGALURU_BBOX.minLng &&
    lng <= BENGALURU_BBOX.maxLng
  );
};

function DriverDashboard() {
  const navigate = useNavigate();
  const [currentDriver, setCurrentDriver] = useState(null);

  // Helper: Calculate distance
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  // States
  const [isOnline, setIsOnline] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [activeRide, setActiveRide] = useState(null);
  const [driverServiceType, setDriverServiceType] = useState(null);
  const [showOnlinePreferences, setShowOnlinePreferences] = useState(false);
  
  // Driver current simulated location (Defaulting to Bengaluru center)
  const [driverLocation, setDriverLocation] = useState({ lat: 12.9716, lng: 77.5946 });
  const [isSimulating, setIsSimulating] = useState(false);
  const simulationIntervalRef = useRef(null);

  // Database stats
  const [stats, setStats] = useState({ earnings: 0, completedCount: 0, hoursOnline: '0.0' });
  const [statsLoading, setStatsLoading] = useState(true);

  // Load driver details
  useEffect(() => {
    const storedDriver = localStorage.getItem('driver');
    if (!storedDriver) {
      navigate('/driver/login');
      return;
    }
    setCurrentDriver(JSON.parse(storedDriver));
  }, [navigate]);

  // Fetch driver stats
  const fetchStats = async () => {
    if (!currentDriver) return;
    try {
      const res = await fetch(`http://localhost:5000/api/rides/driver-stats/${currentDriver._id}`);
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error('Error fetching driver stats:', err);
    } finally {
      setStatsLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [currentDriver]);

  // Polling for active ride and pending requests
  useEffect(() => {
    if (!currentDriver) return;

    const checkActiveRide = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/rides/active-driver/${currentDriver._id}`);
        if (res.ok) {
          const data = await res.json();
          setActiveRide(data.ride);
        }
      } catch (err) {
        console.error('Error checking active ride:', err);
      }
    };

    const checkPendingRequests = async () => {
      if (!isOnline || activeRide) {
        setPendingRequests([]);
        return;
      }
      try {
        const res = await fetch(`http://localhost:5000/api/rides/pending?serviceType=${driverServiceType}`);
        if (res.ok) {
          const data = await res.json();
          setPendingRequests(data.rides);
        }
      } catch (err) {
        console.error('Error fetching pending rides:', err);
      }
    };

    checkActiveRide();
    checkPendingRequests();

    const rideInterval = setInterval(checkActiveRide, 3000);
    const requestInterval = setInterval(checkPendingRequests, 3000);

    return () => {
      clearInterval(rideInterval);
      clearInterval(requestInterval);
    };
  }, [currentDriver, isOnline, activeRide, driverServiceType]);

  // Accept a ride request
  const handleAcceptRide = async (rideId) => {
    if (!currentDriver) return;
    try {
      const res = await fetch('http://localhost:5000/api/rides/accept', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rideId,
          driverId: currentDriver._id,
          lat: driverLocation.lat,
          lng: driverLocation.lng
        })
      });
      const data = await res.json();
      if (res.ok) {
        setActiveRide(data.ride);
        setPendingRequests([]);
      } else {
        alert(data.message || 'Error accepting ride.');
      }
    } catch (err) {
      console.error(err);
      alert('Failed to accept ride.');
    }
  };

  const handleOpenPreferences = () => {
    if (!!activeRide) return;
    setShowOnlinePreferences(true);
  };

  const handleToggleOffline = async () => {
    if (!!activeRide) return;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/driver-status/${currentDriver._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: false })
      });
      if (res.ok) {
        setIsOnline(false);
        setDriverServiceType(null);
        setPendingRequests([]);
      }
    } catch (err) {
      console.error('Error going offline:', err);
    }
  };

  const handleToggleOnline = async (serviceType) => {
    try {
      const res = await fetch(`http://localhost:5000/api/auth/driver-status/${currentDriver._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: true, serviceType })
      });
      if (res.ok) {
        setIsOnline(true);
        setDriverServiceType(serviceType);
        setShowOnlinePreferences(false);
      }
    } catch (err) {
      console.error('Error going online:', err);
    }
  };

  // Simulate vehicle navigation movement
  const handleSimulateNavigation = async () => {
    if (!activeRide) return;
    setIsSimulating(true);

    try {
      // 1. Fetch route points from current driver location to pickup, then to dropoff
      const start = driverLocation;
      const pickup = activeRide.pickup;
      const dest = activeRide.destination;

      const res = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${pickup.lng},${pickup.lat};${dest.lng},${dest.lat}?overview=full&geometries=geojson`
      );
      if (!res.ok) throw new Error('OSRM route fetch failed');
      
      const data = await res.json();
      if (!data.routes || data.routes.length === 0) throw new Error('No routes found');

      const fullRouteCoords = data.routes[0].geometry.coordinates.map(([lng, lat]) => ({ lat, lng }));
      
      // Select 15 coordinates along the route to keep simulation smooth but fast
      const steps = [];
      const totalPoints = fullRouteCoords.length;
      const stepSize = Math.max(1, Math.floor(totalPoints / 15));
      for (let i = 0; i < totalPoints; i += stepSize) {
        steps.push(fullRouteCoords[i]);
      }
      if (steps[steps.length - 1] !== fullRouteCoords[totalPoints - 1]) {
        steps.push(fullRouteCoords[totalPoints - 1]);
      }

      let currentStep = 0;
      simulationIntervalRef.current = setInterval(async () => {
        if (currentStep >= steps.length) {
          clearInterval(simulationIntervalRef.current);
          setIsSimulating(false);
          // Set driver location to final destination
          setDriverLocation(dest);
          return;
        }

        const nextLoc = steps[currentStep];
        setDriverLocation(nextLoc);

        // Update database with driver's current position
        try {
          await fetch('http://localhost:5000/api/rides/update-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              rideId: activeRide._id,
              lat: nextLoc.lat,
              lng: nextLoc.lng
            })
          });
        } catch (err) {
          console.error('Error syncing simulated position:', err);
        }

        currentStep++;
      }, 1500);

    } catch (err) {
      console.warn('Simulation failed to fetch OSRM road route. Fallback to simple jump simulation:', err);
      // Fallback: move from current position to pickup, then to dropoff directly
      setTimeout(async () => {
        setDriverLocation(activeRide.pickup);
        await fetch('http://localhost:5000/api/rides/update-location', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rideId: activeRide._id, lat: activeRide.pickup.lat, lng: activeRide.pickup.lng })
        });

        setTimeout(async () => {
          setDriverLocation(activeRide.destination);
          await fetch('http://localhost:5000/api/rides/update-location', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ rideId: activeRide._id, lat: activeRide.destination.lat, lng: activeRide.destination.lng })
          });
          setIsSimulating(false);
        }, 3000);
      }, 3000);
    }
  };

  // Complete active ride
  const handleCompleteRide = async () => {
    if (!activeRide) return;
    try {
      const res = await fetch('http://localhost:5000/api/rides/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id })
      });
      if (res.ok) {
        setActiveRide(null);
        fetchStats(); // Update earnings
      }
    } catch (err) {
      console.error('Error completing ride:', err);
    }
  };

  // Set driver position by clicking map (while offline/idle)
  const handleMapClick = (latlng) => {
    if (activeRide || isSimulating) return;
    if (!isWithinBengaluru(latlng.lat, latlng.lng)) {
      alert('Please set your location within Bengaluru.');
      return;
    }
    setDriverLocation(latlng);
  };

  const handleLogout = () => {
    localStorage.removeItem('driver');
    navigate('/driver/login');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 border-b md:border-r border-slate-800 flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
              <Car className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-xl tracking-tight text-white">HumSafar</span>
          </div>
          <button
            onClick={handleLogout}
            className="md:hidden p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-x-visible">
          <a href="#" className="flex items-center space-x-3 px-4 py-3 bg-indigo-500/10 text-indigo-400 rounded-xl whitespace-nowrap">
            <Navigation className="w-5 h-5" />
            <span className="font-medium">Dashboard</span>
          </a>
          <div className="px-4 py-3 text-xs text-slate-500 font-semibold uppercase tracking-wider hidden md:block mt-4">
            Driver Profile
          </div>
          {currentDriver && (
            <div className="px-4 py-2 hidden md:block">
              <p className="font-bold text-slate-200">{currentDriver.name}</p>
              <p className="text-xs text-slate-400 mt-1">{currentDriver.vehicleModel}</p>
              <p className="text-[10px] text-indigo-400 mt-1 uppercase tracking-wider font-semibold">Verified Partner</p>
            </div>
          )}
        </nav>

        <div className="p-4 border-t border-slate-800 hidden md:block">
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 text-red-400 hover:bg-red-500/10 rounded-xl transition-colors w-full"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Log out</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        {/* Header */}
        <header className="h-20 border-b border-slate-800 bg-slate-900/50 backdrop-blur flex items-center justify-between px-8 z-10 shrink-0">
          <h1 className="text-xl md:text-2xl font-bold">Driver Portal</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-slate-400">Status:</span>
            <button
              onClick={isOnline ? handleToggleOffline : handleOpenPreferences}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors duration-300 focus:outline-none ${
                isOnline ? 'bg-indigo-500' : 'bg-slate-700'
              }`}
              disabled={!!activeRide}
            >
              <span
                className={`inline-block h-6 w-6 transform rounded-full bg-white transition-transform duration-300 ${
                  isOnline ? 'translate-x-7' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`text-sm font-medium ${isOnline ? 'text-indigo-400' : 'text-slate-400'}`}>
              {isOnline ? `Online (${driverServiceType})` : 'Offline'}
            </span>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 md:p-8 relative flex flex-col gap-6">
          <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-indigo-600/5 rounded-full blur-3xl -z-10"></div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 shrink-0">
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-indigo-500/10 text-indigo-400 rounded-xl flex items-center justify-center shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Earnings</h3>
                {statsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-indigo-400 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-0.5">${stats.earnings.toFixed(2)}</p>
                )}
              </div>
            </div>
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/10 text-purple-400 rounded-xl flex items-center justify-center shrink-0">
                <Navigation className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Completed Rides</h3>
                {statsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-purple-400 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-0.5">{stats.completedCount}</p>
                )}
              </div>
            </div>
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl p-5 shadow-xl flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-slate-400 text-xs font-semibold uppercase tracking-wider">Hours Online</h3>
                {statsLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-400 mt-1" />
                ) : (
                  <p className="text-2xl font-bold mt-0.5">{stats.hoursOnline} hrs</p>
                )}
              </div>
            </div>
          </div>

          <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[400px]">
            {/* Map Area */}
            <div className="lg:col-span-2 bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-xl overflow-hidden flex flex-col min-h-[350px]">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900/40">
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-indigo-400" /> Map Coordinates View
                </h2>
                {!activeRide && !isSimulating && (
                  <span className="text-xs text-slate-400 bg-slate-850 px-2.5 py-1 rounded-full border border-slate-800">
                    💡 Click on map to set your location
                  </span>
                )}
              </div>
              <div className="flex-1 relative">
                <Map
                  pickup={activeRide ? activeRide.pickup : null}
                  destination={activeRide ? activeRide.destination : null}
                  driverLocation={driverLocation}
                  onSelectCoords={handleMapClick}
                />
              </div>
            </div>

            {/* Active Requests / Current Trip */}
            <div className="bg-slate-900/80 backdrop-blur border border-slate-800 rounded-2xl shadow-xl flex flex-col overflow-hidden">
              <div className="p-4 border-b border-slate-800 bg-slate-900/40 flex items-center justify-between">
                <h2 className="font-semibold text-base flex items-center gap-2">
                  <Car className="w-4 h-4 text-indigo-400" /> Active Console
                </h2>
              </div>
              
              <div className="flex-1 p-5 overflow-y-auto">
                {activeRide ? (
                  /* Trip In-Progress details */
                  <div className="space-y-6 h-full flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="flex items-center gap-2 text-indigo-400 font-semibold text-sm">
                        <CheckCircle2 className="w-4 h-4" /> Ride in Progress
                      </div>
                      
                      <div className="bg-slate-950/60 border border-slate-800 p-4 rounded-xl space-y-3">
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-slate-500" />
                          <span className="text-sm font-semibold">{activeRide.user.name}</span>
                          <span className="text-xs text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full ml-auto">
                            📞 {activeRide.user.phone}
                          </span>
                        </div>
                        <div className="text-xs space-y-2 border-t border-slate-800/80 pt-3">
                          <p><span className="text-indigo-400 font-semibold">PICKUP:</span> <span className="text-slate-300">{activeRide.pickup.name}</span></p>
                          <p><span className="text-fuchsia-400 font-semibold">DEST:</span> <span className="text-slate-300">{activeRide.destination.name}</span></p>
                          <p className="border-t border-slate-800/50 pt-2 flex justify-between"><span className="text-slate-500 font-medium">DISTANCE:</span> <span className="text-indigo-400 font-semibold">{getDistance(activeRide.pickup.lat, activeRide.pickup.lng, activeRide.destination.lat, activeRide.destination.lng).toFixed(2)} km</span></p>
                        </div>
                        <div className="border-t border-slate-800/80 pt-3 flex justify-between items-center text-sm">
                          <span className="text-slate-400">Total Fare:</span>
                          <span className="font-bold text-white text-base">${activeRide.fare.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-3 mt-4">
                      {isSimulating ? (
                        <div className="w-full bg-slate-900 border border-slate-850 p-4 rounded-xl flex flex-col items-center justify-center text-center gap-2">
                          <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                          <p className="text-sm font-medium text-slate-300">Simulating Navigation...</p>
                          <p className="text-xs text-slate-500">Updating live coordinates in database</p>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={handleSimulateNavigation}
                            className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3.5 rounded-xl transition-all shadow-lg shadow-indigo-500/20"
                          >
                            Simulate Navigation
                          </button>
                          <button
                            onClick={handleCompleteRide}
                            className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold py-3.5 rounded-xl transition-all"
                          >
                            Complete Ride
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ) : isOnline ? (
                  /* Pending Request lists */
                  <div className="space-y-4">
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">Nearby Ride Requests</p>
                    {pendingRequests.length === 0 ? (
                      <div className="flex flex-col gap-3 text-center justify-center py-12 text-slate-400">
                        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mx-auto"></div>
                        <p className="text-sm">Looking for riders nearby...</p>
                      </div>
                    ) : (
                      pendingRequests.map((req) => (
                        <div key={req._id} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-3 hover:border-slate-700 transition-colors">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-semibold text-sm text-slate-200">{req.user.name}</p>
                              <p className="text-xs text-slate-400 mt-0.5">{req.vehicleType}</p>
                            </div>
                            <span className="font-bold text-white text-base">${req.fare.toFixed(2)}</span>
                          </div>
                          <div className="text-xs space-y-1 text-slate-400 border-t border-slate-900 pt-2.5">
                            <p className="truncate"><span className="text-purple-400 font-semibold">A:</span> {req.pickup.name}</p>
                            <p className="truncate"><span className="text-fuchsia-400 font-semibold">B:</span> {req.destination.name}</p>
                          </div>
                          <button
                            onClick={() => handleAcceptRide(req._id)}
                            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold py-2.5 rounded-lg transition-colors mt-2"
                          >
                            Accept Ride
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                ) : (
                  /* Offline Console */
                  <div className="flex flex-col items-center justify-center py-12 text-center h-full">
                    <div className="w-16 h-16 bg-slate-800 text-slate-500 rounded-full flex items-center justify-center mb-4">
                      <Settings className="w-8 h-8" />
                    </div>
                    <p className="text-slate-300 font-medium">You are offline</p>
                    <p className="text-xs text-slate-500 mt-1 max-w-[200px] mx-auto">
                      Go online to start receiving live booking requests from users.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* VEHICLE AVAILABILITY PREFERENCES MODAL */}
      {showOnlinePreferences && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 max-w-md w-full shadow-2xl relative mx-4">
            <div className="absolute top-[10%] right-[-10%] w-[150px] h-[150px] bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Car className="w-5 h-5 text-indigo-400" /> Service Availability
              </h3>
              <button
                onClick={() => setShowOnlinePreferences(false)}
                className="p-1 text-slate-400 hover:text-white bg-slate-800/40 rounded-full transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-slate-400 text-sm mb-6 leading-relaxed">
              Select which vehicle category you are currently available with to receive ride requests. You will only receive bookings matching this tier.
            </p>

            <div className="space-y-3">
              {[
                { type: 'Economy', name: 'HumSafar Go', desc: 'Economy & compact rides', icon: '🚗' },
                { type: 'Comfort', name: 'HumSafar Prime', desc: 'Comfortable sedans', icon: '🚘' },
                { type: 'Elite', name: 'HumSafar Luxe', desc: 'Premium luxury vehicles', icon: '🏎️' }
              ].map((vehicle) => (
                <button
                  key={vehicle.type}
                  onClick={() => handleToggleOnline(vehicle.type)}
                  className="w-full flex items-center justify-between p-4 bg-slate-950/40 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 rounded-2xl text-left transition-all group animate-in slide-in-from-bottom-2 duration-150"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{vehicle.icon}</span>
                    <div>
                      <p className="font-semibold text-slate-200 group-hover:text-white">{vehicle.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{vehicle.desc}</p>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-600 group-hover:text-indigo-400 group-hover:translate-x-0.5 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverDashboard;
