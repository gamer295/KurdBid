import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Home from './pages/Home';
import ItemPage from './pages/ItemPage';
import Login from './pages/Login';
import MySales from './pages/MySales';
import MyPurchases from './pages/MyPurchases';
import Messages from './pages/Messages';
import ConversationPage from './pages/ConversationPage';
import AdminDashboard from './pages/AdminDashboard';
import Profile from './pages/Profile';
import Sidebar from './components/Sidebar';
import TopHeader from './components/TopHeader';
import Notifications from './components/Notifications';
import BottomNav from './components/BottomNav';

import { useLanguage } from './context/LanguageContext';

const ProtectedRoute: React.FC<{ children: React.ReactNode; adminOnly?: boolean }> = ({ children, adminOnly }) => {
  const { user, profile, loading, isAdmin } = useAuth();
  const { isRTL } = useLanguage();
  
  if (loading) return <div className="min-h-screen flex items-center justify-center font-bold text-primary">{isRTL ? 'چاوەڕێبە...' : 'Loading...'}</div>;
  if (!user) return <Navigate to="/login" />;
  if (profile?.isBanned) return <div className="min-h-screen flex items-center justify-center flex-col gap-4 p-10 text-center">
    <h1 className="text-2xl font-bold text-danger">{isRTL ? 'تۆ بلۆک کرایت' : 'You have been banned'}</h1>
    <p className="text-text-light">{isRTL ? 'تکایە پەیوەندی بە تیمی پشتیوانییەوە بکە بۆ زانیاری زیاتر.' : 'Please contact support for more information.'}</p>
  </div>;

  if (adminOnly && !isAdmin) {
    console.warn("Unauthorized admin access attempt", { email: user.email, profile });
    return <Navigate to="/" />;
  }
  
  return <>{children}</>;
};

function AppRoutes() {
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false);

  return (
    <div className="min-h-screen flex bg-bg-polish overflow-hidden relative">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <TopHeader onMenuClick={() => setIsSidebarOpen(true)} />
        <Notifications />
        <div className="flex flex-1 overflow-hidden">
          <main className="flex-1 overflow-y-auto">
            <div className="p-4 md:p-[30px] max-w-7xl mx-auto pb-24 lg:pb-[30px]">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/item/:id" element={<ItemPage />} />
                <Route path="/login" element={<Login />} />
                
                <Route path="/my-sales" element={
                  <ProtectedRoute>
                    <MySales />
                  </ProtectedRoute>
                } />
                
                <Route path="/my-purchases" element={
                  <ProtectedRoute>
                    <MyPurchases />
                  </ProtectedRoute>
                } />
                
                <Route path="/messages" element={
                  <ProtectedRoute>
                    <Messages />
                  </ProtectedRoute>
                } />

                <Route path="/messages/:id" element={
                  <ProtectedRoute>
                    <ConversationPage />
                  </ProtectedRoute>
                } />
                
                <Route path="/admin" element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />

                <Route path="/profile" element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                } />

                {/* Catch-all redirect to Home */}
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </div>
          </main>
        </div>
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
