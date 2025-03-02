import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Home from './pages/Home';
import Sponsorships from './pages/Sponsorships';
import SubmitSponsorship from './pages/SubmitSponsorship';
import About from './pages/About';
import Partner from './pages/Partner';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import AdminSignIn from './pages/AdminSignIn';
import ResetPassword from './pages/ResetPassword';
import WaitlistForm from './pages/WaitlistForm';
import Admin from './pages/Admin';
import Privacy from './pages/PrivacyPolicy';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './hooks/useAuth';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen flex flex-col">
          <Navbar />
          <main className="flex-grow pt-32">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/sponsorships" element={
                <ProtectedRoute>
                  <Sponsorships />
                </ProtectedRoute>
              } />
              <Route path="/submit-sponsorship" element={
                <ProtectedRoute>
                  <SubmitSponsorship />
                </ProtectedRoute>
              } />
              <Route path="/about" element={<About />} />
              <Route path="/partner" element={<Partner />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/adminsignin" element={<AdminSignIn />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/waitlist" element={<WaitlistForm />} />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <Admin />
                </ProtectedRoute>
              } />
              <Route path="/PrivacyPolicy" element={<Privacy />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;