import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { MapProvider } from './context/MapContext';
import { AppProvider } from './context/AppContext';
import { LanguageProvider } from './context/LanguageContext';

// Composants de layout
import Header from './components/Layout/Header';

// Pages
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import MapTest from './components/MapTest';
import Profile from './pages/Profile';
import Journal from './pages/Journal';
import Community from './pages/Community';
import Admin from './pages/Admin';
import Login from './pages/Login';
import Register from './pages/Register';
import PaymentSuccess from './pages/PaymentSuccess';
import PaymentCancel from './pages/PaymentCancel';

// Styles
import './styles/globals.css';

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppProvider>
          <MapProvider>
            <Router>
              <div className="App">
                <Header />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/map" element={<Map />} />
                    <Route path="/map-test" element={<MapTest />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/journal" element={<Journal />} />
                    <Route path="/community" element={<Community />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />
                  </Routes>
                </main>
            
                {/* Notifications toast */}
                <Toaster
                  position="top-right"
                  toastOptions={{
                    duration: 4000,
                    style: {
                      background: '#363636',
                      color: '#fff',
                    },
                    success: {
                      duration: 3000,
                      iconTheme: {
                        primary: '#10B981',
                        secondary: '#fff',
                      },
                    },
                    error: {
                      duration: 5000,
                      iconTheme: {
                        primary: '#EF4444',
                        secondary: '#fff',
                      },
                    },
                  }}
                />
              </div>
            </Router>
          </MapProvider>
        </AppProvider>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App; 