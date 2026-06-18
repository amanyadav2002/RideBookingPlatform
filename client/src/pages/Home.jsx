import { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Car, 
  User, 
  Zap, 
  DollarSign, 
  ShieldCheck, 
  ArrowRight,
  Menu,
  X
} from 'lucide-react';

function Home() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400">
                HumSafar
              </span>
            </div>
            
            <div className="hidden md:flex space-x-8 items-center">
              <a href="#home" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Home</a>
              <a href="#learn-more" className="text-sm font-medium text-slate-300 hover:text-white transition-colors">Learn More</a>
              <a href="#get-started" className="text-sm font-medium px-4 py-2 rounded-full bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 transition-colors">
                Get Started
              </a>
            </div>

            <div className="md:hidden flex items-center">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-slate-300 hover:text-white">
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-slate-900 border-b border-slate-800">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
              <a href="#home" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md">Home</a>
              <a href="#learn-more" className="block px-3 py-2 text-base font-medium text-slate-300 hover:text-white hover:bg-slate-800 rounded-md">Learn More</a>
              <a href="#get-started" className="block px-3 py-2 text-base font-medium text-indigo-400 hover:text-indigo-300 hover:bg-slate-800 rounded-md">Get Started</a>
            </div>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section id="home" className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-indigo-900/40 via-slate-950 to-slate-950 -z-10"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
              Your Journey, <br className="hidden sm:block" />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-500">
                Our Priority.
              </span>
            </h1>
            <p className="text-lg md:text-xl text-slate-400 mb-10 leading-relaxed">
              Experience the next generation of ride booking. HumSafar connects you with top-rated drivers for fast, affordable, and secure travel.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <a href="#get-started" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-500/25 group">
                Book a Ride Now
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </a>
              <a href="#learn-more" className="inline-flex items-center justify-center px-8 py-4 text-base font-medium rounded-full text-slate-300 bg-slate-800/50 hover:bg-slate-800 border border-slate-700 transition-all backdrop-blur-sm">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Get Started Section */}
      <section id="get-started" className="py-24 bg-slate-900/50 border-y border-slate-800/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Get Started</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Join the HumSafar network today. Choose how you want to use our platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {/* Driver Card */}
            <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-indigo-500/10 flex flex-col items-center text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center mb-6 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
                <Car className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Drive with Us</h3>
              <p className="text-slate-400 mb-8 flex-grow">
                Earn on your own schedule. Low commission rates and fast payouts for our dedicated partners.
              </p>
              <Link to="/driver/register" className="w-full py-3 px-6 rounded-xl bg-slate-800 text-white font-medium hover:bg-indigo-600 transition-colors relative z-10 flex items-center justify-center gap-2">
                Register as Driver <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* User Card */}
            <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl p-8 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/10 flex flex-col items-center text-center overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-16 h-16 bg-purple-500/10 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform duration-300">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-2xl font-semibold mb-3">Ride with Us</h3>
              <p className="text-slate-400 mb-8 flex-grow">
                Get where you need to go safely and affordably. Book a ride in seconds.
              </p>
              <Link to="/user/register" className="w-full py-3 px-6 rounded-xl bg-slate-800 text-white font-medium hover:bg-purple-600 transition-colors relative z-10 flex items-center justify-center gap-2">
                Register as User <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Learn More Section */}
      <section id="learn-more" className="py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose HumSafar?</h2>
            <p className="text-slate-400 max-w-2xl mx-auto">
              We are committed to revolutionizing urban mobility with a focus on speed, affordability, and unwavering security.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:bg-slate-900 transition-colors">
              <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center mb-6 text-blue-400">
                <Zap className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Fast Responses</h3>
              <p className="text-slate-400 leading-relaxed">
                Our advanced matching algorithm ensures you get a driver assigned in seconds. Less waiting, more moving.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:bg-slate-900 transition-colors">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-6 text-emerald-400">
                <DollarSign className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Low Fare Rides</h3>
              <p className="text-slate-400 leading-relaxed">
                Enjoy premium service without the premium price tag. Transparent pricing with no hidden surges.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-8 hover:bg-slate-900 transition-colors">
              <div className="w-12 h-12 bg-amber-500/10 rounded-xl flex items-center justify-center mb-6 text-amber-400">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Secured & Hassle-Free</h3>
              <p className="text-slate-400 leading-relaxed">
                All drivers are verified, and rides are tracked in real-time. Your safety is guaranteed from start to finish.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-slate-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <Car className="w-5 h-5 text-indigo-500" />
            <span className="text-lg font-bold text-white">HumSafar</span>
          </div>
          <div className="flex items-center gap-6">
            <Link to="/admin/login" className="text-sm text-slate-500 hover:text-slate-300 transition-colors">
              Admin Login
            </Link>
            <p className="text-slate-500 text-sm">
              © {new Date().getFullYear()} HumSafar Technologies. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default Home;
