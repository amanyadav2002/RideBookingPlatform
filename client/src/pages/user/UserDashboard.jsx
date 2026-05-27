import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User as UserIcon, MapPin, Navigation, Search, Clock, CreditCard, LogOut, ChevronRight, Loader2, ArrowRight, Plus, Check, X, Wallet } from 'lucide-react';
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

  // Profile & Wallet Modal States
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('details'); // 'details' | 'wallet'
  const [profileData, setProfileData] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [updateLoading, setUpdateLoading] = useState(false);
  const [rechargeLoading, setRechargeLoading] = useState(false);
  
  // Edit Form Fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');
  
  // Recharge Fields
  const [rechargeAmount, setRechargeAmount] = useState('');
  const [rechargeSuccess, setRechargeSuccess] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch user profile details
  const fetchUserProfile = async (userId) => {
    if (!userId) return;
    setProfileLoading(true);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/user/${userId}`);
      if (res.ok) {
        const data = await res.json();
        setProfileData(data);
        setEditName(data.user.name);
        setEditEmail(data.user.email);
        setEditPhone(data.user.phone);
        
        // Sync state & localStorage
        setCurrentUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
      }
    } catch (err) {
      console.error('Error fetching user profile:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Load user details
  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) {
      navigate('/user/login');
      return;
    }
    const parsedUser = JSON.parse(storedUser);
    setCurrentUser(parsedUser);
    fetchUserProfile(parsedUser._id);
  }, [navigate]);

  // Update profile handler
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!editName.trim() || !editEmail.trim() || !editPhone.trim()) {
      setErrorMsg('All fields are required.');
      return;
    }
    setUpdateLoading(true);
    setErrorMsg('');
    setUpdateSuccess(false);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/user/${currentUser._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editName, email: editEmail, phone: editPhone })
      });
      const data = await res.json();
      if (res.ok) {
        setUpdateSuccess(true);
        setCurrentUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        await fetchUserProfile(currentUser._id);
        setTimeout(() => setUpdateSuccess(false), 3000);
      } else {
        setErrorMsg(data.message || 'Failed to update profile.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error updating profile.');
    } finally {
      setUpdateLoading(false);
    }
  };

  // Recharge wallet handler
  const handleRechargeWallet = async (e) => {
    e.preventDefault();
    const amount = parseFloat(rechargeAmount);
    if (isNaN(amount) || amount <= 0) {
      setErrorMsg('Please enter a valid positive amount.');
      return;
    }
    setRechargeLoading(true);
    setErrorMsg('');
    setRechargeSuccess(false);
    try {
      const res = await fetch(`http://localhost:5000/api/auth/user/${currentUser._id}/wallet/recharge`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount })
      });
      const data = await res.json();
      if (res.ok) {
        setRechargeSuccess(true);
        setRechargeAmount('');
        await fetchUserProfile(currentUser._id);
        setTimeout(() => setRechargeSuccess(false), 3000);
      } else {
        setErrorMsg(data.message || 'Failed to recharge wallet.');
      }
    } catch (err) {
      console.error(err);
      setErrorMsg('Error recharging wallet.');
    } finally {
      setRechargeLoading(false);
    }
  };

  // Polling for active ride
  useEffect(() => {
    if (!currentUser) return;

    const fetchActiveRide = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/rides/active-user/${currentUser._id}`);
        if (res.ok) {
          const data = await res.json();
          setActiveRide(prev => {
            if (prev && !data.ride) {
              // Ride status went from active to completed/cancelled. Refresh user wallet & stats!
              fetchUserProfile(currentUser._id);
            }
            return data.ride;
          });
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
      // Prioritize/Bias search query to Bengaluru by appending ", Bengaluru" if not present
      let formattedQuery = query;
      const lowerQuery = query.toLowerCase();
      if (!lowerQuery.includes('bengaluru') && !lowerQuery.includes('bangalore')) {
        formattedQuery = `${query}, Bengaluru`;
      }

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formattedQuery)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        const { lat, lon, display_name } = data[0];
        const latitude = parseFloat(lat);
        const longitude = parseFloat(lon);

        if (!isWithinBengaluru(latitude, longitude)) {
          alert('Our services are currently only available in Bengaluru. Please choose a location within Bengaluru city limits.');
          return;
        }

        const shortName = display_name.split(',')[0];
        const coords = { name: shortName, lat: latitude, lng: longitude };
        
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
    
    if (!isWithinBengaluru(lat, lng)) {
      alert('Our services are currently only available in Bengaluru. Please choose a location within Bengaluru city limits.');
      return;
    }

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
            <button
              onClick={() => {
                setIsProfileOpen(true);
                fetchUserProfile(currentUser._id);
              }}
              className="flex items-center gap-3 px-4 py-2 bg-slate-900 hover:bg-slate-850 active:scale-95 border border-slate-800 hover:border-purple-500/30 rounded-full cursor-pointer transition-all duration-200 group"
            >
              <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition-colors">
                <UserIcon className="w-3.5 h-3.5 text-purple-400" />
              </div>
              <span className="text-sm font-medium pr-1 text-slate-300 group-hover:text-white transition-colors">{currentUser.name}</span>
            </button>
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
        <div className="flex-1 p-6 lg:p-8 relative min-h-[450px] flex flex-col">
          <div className="flex-1 bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl overflow-hidden relative">
            <Map
              pickup={pickup.lat ? pickup : null}
              destination={destination.lat ? destination : null}
              driverLocation={activeRide && activeRide.driverLocation ? activeRide.driverLocation : null}
              onSelectCoords={handleMapSelect}
            />
          </div>
        </div>
      </main>

      {/* Profile Modal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
          {/* Glass Overlay */}
          <div 
            className="absolute inset-0 bg-slate-950/70 backdrop-blur-md"
            onClick={() => {
              setIsProfileOpen(false);
              setErrorMsg('');
              setRechargeAmount('');
            }}
          ></div>

          {/* Modal Container */}
          <div className="relative w-full max-w-md bg-slate-900/95 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-10 animate-in fade-in zoom-in-95 duration-200">
            {/* Visual gradient accent blob in background */}
            <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/10 rounded-full blur-3xl pointer-events-none"></div>

            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800/80 flex items-center justify-between relative z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-purple-400" />
                </div>
                <h3 className="font-bold text-lg text-white">Your Profile</h3>
              </div>
              <button 
                onClick={() => {
                  setIsProfileOpen(false);
                  setErrorMsg('');
                  setRechargeAmount('');
                }}
                className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tab Selector */}
            <div className="flex border-b border-slate-800/80 px-6 relative z-10">
              <button 
                onClick={() => { setProfileTab('details'); setErrorMsg(''); }}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  profileTab === 'details' 
                    ? 'border-purple-500 text-purple-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                Edit Info
              </button>
              <button 
                onClick={() => { setProfileTab('wallet'); setErrorMsg(''); }}
                className={`py-3 px-4 text-sm font-semibold border-b-2 transition-all ${
                  profileTab === 'wallet' 
                    ? 'border-purple-500 text-purple-400' 
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                E-Wallet & Stats
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 max-h-[70vh] overflow-y-auto relative z-10">
              {profileLoading && !profileData ? (
                <div className="py-12 flex flex-col items-center justify-center gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                  <p className="text-sm text-slate-400">Loading profile data...</p>
                </div>
              ) : (
                <>
                  {errorMsg && (
                    <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-xl flex items-center gap-2 animate-in slide-in-from-top-1 duration-200">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                      <span>{errorMsg}</span>
                    </div>
                  )}

                  {/* Tab Content: Details */}
                  {profileTab === 'details' && (
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                      {updateSuccess && (
                        <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl flex items-center gap-2">
                          <Check className="w-4 h-4 text-green-400 shrink-0" />
                          <span>Profile details updated successfully!</span>
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Full Name</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                            placeholder="John Doe"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email Address</label>
                        <div className="relative">
                          <input 
                            type="email" 
                            value={editEmail}
                            onChange={(e) => setEditEmail(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                            placeholder="john@example.com"
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Phone Number</label>
                        <div className="relative">
                          <input 
                            type="text" 
                            value={editPhone}
                            onChange={(e) => setEditPhone(e.target.value)}
                            className="w-full bg-slate-950/60 border border-slate-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition-all"
                            placeholder="+91 XXXXX XXXXX"
                          />
                        </div>
                      </div>

                      <button 
                        type="submit"
                        disabled={updateLoading}
                        className="w-full mt-2 bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-500 hover:to-fuchsia-500 text-white font-semibold py-3 rounded-xl transition-all shadow-md shadow-purple-500/10 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {updateLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>Save Changes</>
                        )}
                      </button>
                    </form>
                  )}

                  {/* Tab Content: Wallet & Stats */}
                  {profileTab === 'wallet' && (
                    <div className="space-y-6">
                      {/* Premium Digital Credit Card */}
                      <div className="relative h-44 rounded-2xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-indigo-700 p-6 flex flex-col justify-between overflow-hidden shadow-xl shadow-purple-500/15 border border-white/10">
                        {/* Decorative background details */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
                        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl pointer-events-none"></div>
                        
                        <div className="flex justify-between items-start z-10">
                          <div>
                            <span className="text-[10px] uppercase tracking-widest text-purple-200 font-semibold">HumSafar E-Wallet</span>
                            <h4 className="text-white font-bold text-lg mt-0.5">{profileData?.user.name}</h4>
                          </div>
                          <span className="text-2xl font-bold italic text-white/40 font-serif">HS</span>
                        </div>

                        {/* Card Chip & Balance */}
                        <div className="flex justify-between items-end z-10">
                          <div className="space-y-1">
                            <span className="text-[10px] text-purple-200 uppercase tracking-wider block">Available Balance</span>
                            <span className="text-3xl font-extrabold text-white tracking-tight">
                              ${(profileData?.user.walletBalance ?? 0).toFixed(2)}
                            </span>
                          </div>
                          
                          {/* Decorative Chip Icon */}
                          <div className="w-10 h-7 rounded-md bg-yellow-400/80 border border-yellow-500/50 relative overflow-hidden flex flex-col gap-1 p-1 shadow">
                            <div className="flex gap-1 h-[2px]">
                              <div className="flex-1 bg-black/20"></div>
                              <div className="flex-1 bg-black/20"></div>
                            </div>
                            <div className="flex gap-1 h-[2px] mt-1">
                              <div className="flex-1 bg-black/20"></div>
                              <div className="flex-1 bg-black/20"></div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Ride Statistics Grid */}
                      <div className="grid grid-cols-2 gap-4">
                        {/* Hours taken rides */}
                        <div className="bg-slate-950/50 border border-slate-800/85 p-4 rounded-xl flex items-center gap-3 shadow-inner">
                          <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400 shrink-0">
                            <Clock className="w-4 h-4 animate-pulse" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Ride Hours</p>
                            <p className="text-lg font-bold text-slate-100">{profileData?.totalHours ?? '0.0'} hrs</p>
                          </div>
                        </div>

                        {/* Completed rides */}
                        <div className="bg-slate-950/50 border border-slate-800/85 p-4 rounded-xl flex items-center gap-3 shadow-inner">
                          <div className="w-9 h-9 rounded-lg bg-fuchsia-500/10 flex items-center justify-center text-fuchsia-400 shrink-0">
                            <Navigation className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Total Trips</p>
                            <p className="text-lg font-bold text-slate-100">
                              {profileData?.completedCount ?? 0}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Top Up Section */}
                      <form onSubmit={handleRechargeWallet} className="space-y-3 pt-2 border-t border-slate-800/80">
                        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">Top Up Wallet</label>
                        
                        {rechargeSuccess && (
                          <div className="p-3 bg-green-500/10 border border-green-500/20 text-green-400 text-xs rounded-xl flex items-center gap-2">
                            <Check className="w-4 h-4 text-green-400 shrink-0" />
                            <span>Wallet recharged successfully!</span>
                          </div>
                        )}

                        <div className="flex gap-2">
                          <input 
                            type="number" 
                            value={rechargeAmount}
                            onChange={(e) => setRechargeAmount(e.target.value)}
                            placeholder="Enter amount ($)"
                            min="1"
                            className="flex-1 bg-slate-950/60 border border-slate-800 focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 rounded-xl px-4 py-2.5 text-sm text-white placeholder-slate-500 outline-none transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          />
                          <button 
                            type="submit"
                            disabled={rechargeLoading}
                            className="bg-purple-600 hover:bg-purple-500 text-white font-semibold px-5 rounded-xl transition-all shadow-md shadow-purple-500/10 disabled:opacity-50 flex items-center gap-1.5 text-sm shrink-0"
                          >
                            {rechargeLoading ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <>
                                <Plus className="w-4 h-4" /> Top Up
                              </>
                            )}
                          </button>
                        </div>

                        {/* Preset Recharge Amounts */}
                        <div className="flex gap-2 justify-between">
                          {['10', '20', '50', '100'].map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              onClick={() => setRechargeAmount(preset)}
                              className="flex-1 py-2 bg-slate-950/40 hover:bg-slate-850/50 border border-slate-800 hover:border-slate-700/80 rounded-xl text-xs text-slate-300 hover:text-white font-semibold transition-all"
                            >
                              +${preset}
                            </button>
                          ))}
                        </div>
                      </form>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default UserDashboard;
