import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, MapPin, Navigation, Search, Clock, CreditCard, LogOut, ChevronRight, Loader2, ArrowRight } from 'lucide-react';
import Map from '../../components/Map';

function UserDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  
  // Locations
  const [pickup, setPickup] = useState({ name: '', lat: null, lng: null });
  const [destination, setDestination] = useState({ name: '', lat: null, lng: null });
  const [activeInput, setActiveInput] = useState('pickup'); // 'pickup' | 'destination'
  
  // Search Text Inputs
  const [pickupText, setPickupText] = useState('');
  const [destText, setDestText] = useState('');
  const [searching, setSearching] = useState(null); // 'pickup' | 'destination' | null
  
  // Booking details
  const [selectedVehicle, setSelectedVehicle] = useState('Economy');
  const [activeRide, setActiveRide] = useState(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  // Load user details
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/user/login');
      return;
    }
    setCurrentUser(JSON.parse(storedUser));
  }, [navigate]);

  // Polling for active ride
  useEffect(() => {
    if (!currentUser) return;

    const fetchActiveRide = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/rides/active-user/${currentUser._id}`);
        if (res.ok) {
          const data = await res.json();
          setActiveRide(data.ride);
        }
      } catch (err) {
        console.error('Error fetching active ride:', err);
      }
    };

    fetchActiveRide(); // Initial check
    const interval = setInterval(fetchActiveRide, 3000); // Poll every 3 seconds

    return () => clearInterval(interval);
  }, [currentUser]);

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

  const distance =
    pickup.lat && destination.lat
      ? getDistance(pickup.lat, pickup.lng, destination.lat, destination.lng)
      : 0;

  const VEHICLES = {
    Economy: { name: 'HumSafar Go', rate: 1.5, min: 5.0, icon: '🚗' },
    Comfort: { name: 'HumSafar Prime', rate: 2.5, min: 8.0, icon: '🚘' },
    Elite: { name: 'HumSafar Luxe', rate: 4.5, min: 15.0, icon: '🏎️' }
  };

  const calculateFare = (type) => {
    if (distance === 0) return 0;
    const v = VEHICLES[type];
    return Math.max(v.min, Math.round(distance * v.rate));
  };

  // Search address using Nominatim
  const handleSearch = async (type) => {
    const query = type === 'pickup' ? pickupText : destText;
    if (!query) return;

    setSearching(type);
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const shortName = display_name.split(',')[0];
        const coords = { name: shortName, lat: parseFloat(lat), lng: parseFloat(lon) };
        
        if (type === 'pickup') {
          setPickup(coords);
          setPickupText(shortName);
          setActiveInput('destination');
        } else {
          setDestination(coords);
          setDestText(shortName);
        }
      } else {
        alert('Location not found. Please try another term or click on the map.');
      }
    } catch (error) {
      console.error('Search failed:', error);
      alert('Failed to contact search service.');
    } finally {
      setSearching(null);
    }
  };

  // Handle map coordinates selection
  const handleMapSelect = async (latlng) => {
    const { lat, lng } = latlng;
    const placeholder = `📍 Position (${lat.toFixed(4)}, ${lng.toFixed(4)})`;

    if (activeInput === 'pickup') {
      setPickup({ name: placeholder, lat, lng });
      setPickupText(placeholder);
    } else {
      setDestination({ name: placeholder, lat, lng });
      setDestText(placeholder);
    }

    try {
      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.display_name) {
          const parts = data.display_name.split(',');
          // Retrieve first 3 parts of address for readable names
          const name = parts.slice(0, 3).join(',').trim();
          
          if (activeInput === 'pickup') {
            setPickup({ name, lat, lng });
            setPickupText(name);
            setActiveInput('destination');
          } else {
            setDestination({ name, lat, lng });
            setDestText(name);
          }
        }
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
  };

  // Submit Ride Request
  const handleRequestRide = async () => {
    if (!pickup.lat || !destination.lat) {
      alert('Please set both pickup and destination locations.');
      return;
    }

    setBookingLoading(true);
    try {
      const res = await fetch('http://localhost:5000/api/rides/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: currentUser._id,
          pickup,
          destination,
          fare: calculateFare(selectedVehicle),
          vehicleType: selectedVehicle
        })
      });
      const data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Failed to request ride.');
      }
    } catch (err) {
      console.error(err);
      alert('Error requesting ride.');
    } finally {
      setBookingLoading(false);
    }
  };

  // Cancel ride request
  const handleCancelRide = async () => {
    if (!activeRide) return;
    try {
      await fetch('http://localhost:5000/api/rides/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rideId: activeRide._id })
      });
      setActiveRide(null);
    } catch (err) {
      console.error('Error cancelling ride:', err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/user/login');
  };

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

        <div className="flex items-center gap-4">
          {currentUser && (
            <div className="flex items-center gap-3 px-4 py-2 bg-slate-900 border border-slate-800 rounded-full">
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center">
                <UserIcon className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-sm font-medium pr-1 text-slate-300">{currentUser.name}</span>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-full transition-colors"
            title="Log Out"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col lg:flex-row relative">
        <div className="absolute top-[20%] left-[10%] w-[500px] h-[500px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none"></div>
        
        {/* Sidebar Panel */}
        <div className="w-full lg:w-[480px] p-6 lg:p-8 z-10 flex flex-col justify-start">
          {activeRide ? (
            /* Ride Status View */
            <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl shadow-purple-500/5">
              <div className="text-center mb-6">
                {activeRide.status === 'requested' ? (
                  <>
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
                    <h3 className="text-xl font-bold">Finding a Driver</h3>
                    <p className="text-slate-400 text-sm mt-2">Connecting with riders in your area...</p>
                  </>
                ) : (
                  <>
                    <div className="w-16 h-16 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <span className="text-3xl">🚗</span>
                    </div>
                    <h3 className="text-xl font-bold text-green-400">Driver Accepted</h3>
                    <p className="text-slate-300 text-sm mt-1">Your driver is en route.</p>
                  </>
                )}
              </div>

              <div className="border-t border-slate-800 pt-6 space-y-4">
                <div className="flex justify-between items-start text-sm">
                  <div className="text-slate-400">Route</div>
                  <div className="text-right font-medium max-w-[250px]">
                    <p className="text-purple-400 truncate">{activeRide.pickup.name}</p>
                    <p className="text-xs text-slate-500 my-1">to</p>
                    <p className="text-fuchsia-400 truncate">{activeRide.destination.name}</p>
                  </div>
                </div>

                <div className="flex justify-between items-center text-sm border-t border-slate-800/50 pt-4">
                  <span className="text-slate-400">Vehicle Type</span>
                  <span className="font-semibold text-slate-200">{VEHICLES[activeRide.vehicleType].name}</span>
                </div>

                <div className="flex justify-between items-center text-sm border-t border-slate-800/50 pt-4">
                  <span className="text-slate-400">Fare</span>
                  <span className="font-bold text-lg text-white">${activeRide.fare.toFixed(2)}</span>
                </div>

                {activeRide.driver && (
                  <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 mt-6">
                    <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3">Your Driver</h4>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-bold text-slate-100">{activeRide.driver.name}</p>
                        <p className="text-xs text-slate-400 mt-1">{activeRide.driver.vehicleModel}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs rounded-full">
                          📞 {activeRide.driver.phone}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleCancelRide}
                className="w-full mt-8 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-semibold py-4 rounded-xl transition-all"
              >
                Cancel Ride
              </button>
            </div>
          ) : (
            /* Booking Entry View */
            <div className="bg-slate-900/85 backdrop-blur-xl border border-slate-800 rounded-3xl p-6 lg:p-8 shadow-2xl shadow-purple-500/5">
              <h2 className="text-2xl font-bold mb-6">Where can we take you?</h2>

              <div className="relative space-y-4">
                <div className="absolute left-6 top-8 bottom-8 w-0.5 bg-slate-800 z-0"></div>

                {/* Pickup */}
                <div className={`relative z-10 flex flex-col p-3 rounded-2xl border transition-all ${
                  activeInput === 'pickup' ? 'bg-slate-800/40 border-purple-500/40' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-purple-500"></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">PICKUP LOCATION</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter address or select on map"
                      className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-slate-500"
                      value={pickupText}
                      onChange={(e) => setPickupText(e.target.value)}
                      onFocus={() => setActiveInput('pickup')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch('pickup')}
                    />
                    <button
                      onClick={() => handleSearch('pickup')}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center"
                      disabled={searching === 'pickup'}
                    >
                      {searching === 'pickup' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Destination */}
                <div className={`relative z-10 flex flex-col p-3 rounded-2xl border transition-all ${
                  activeInput === 'destination' ? 'bg-slate-800/40 border-fuchsia-500/40' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 flex items-center justify-center">
                      <div className="w-2.5 h-2.5 rounded-sm bg-fuchsia-500"></div>
                    </div>
                    <span className="text-xs font-semibold text-slate-400">DESTINATION</span>
                  </div>
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      placeholder="Enter destination or select on map"
                      className="bg-transparent border-none outline-none w-full text-sm text-white placeholder-slate-500"
                      value={destText}
                      onChange={(e) => setDestText(e.target.value)}
                      onFocus={() => setActiveInput('destination')}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch('destination')}
                    />
                    <button
                      onClick={() => handleSearch('destination')}
                      className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg transition-colors flex items-center"
                      disabled={searching === 'destination'}
                    >
                      {searching === 'destination' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Ride Options */}
              {pickup.lat && destination.lat ? (
                <div className="mt-6 space-y-3">
                  <div className="flex justify-between items-center text-sm font-semibold bg-slate-950/60 border border-slate-800 rounded-xl px-4 py-3 shadow-inner">
                    <span className="text-slate-400">Total Distance</span>
                    <span className="text-purple-400 font-bold">{distance.toFixed(2)} km</span>
                  </div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Select Ride Option</label>
                  {Object.keys(VEHICLES).map((type) => {
                    const vehicle = VEHICLES[type];
                    const active = selectedVehicle === type;
                    return (
                      <button
                        key={type}
                        onClick={() => setSelectedVehicle(type)}
                        className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                          active ? 'bg-purple-500/10 border-purple-500' : 'bg-slate-950/40 border-slate-800 hover:bg-slate-800/35'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{vehicle.icon}</span>
                          <div>
                            <p className="font-semibold text-slate-200">{vehicle.name}</p>
                            <p className="text-xs text-slate-500 mt-0.5">{type} • {distance.toFixed(1)} km</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-white text-lg">${calculateFare(type).toFixed(2)}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="mt-8 text-center border border-dashed border-slate-800 p-6 rounded-2xl text-slate-500 text-sm">
                  Choose locations by searching or clicking the map to calculate ride fare and get started.
                </div>
              )}

              {pickup.lat && destination.lat && (
                <button
                  onClick={handleRequestRide}
                  disabled={bookingLoading}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold py-4 rounded-xl shadow-lg shadow-purple-500/20 transition-all flex justify-center items-center gap-2 group disabled:opacity-55"
                >
                  {bookingLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      Book {VEHICLES[selectedVehicle].name} <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-slate-900 border-l border-slate-800 relative h-[450px] lg:h-auto min-h-[450px]">
          <Map
            pickup={pickup.lat ? pickup : null}
            destination={destination.lat ? destination : null}
            driverLocation={activeRide && activeRide.driverLocation ? activeRide.driverLocation : null}
            onSelectCoords={handleMapSelect}
          />
        </div>
      </main>
    </div>
  );
}

export default UserDashboard;
