import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import useAuthStore from './store/useAuthStore';
import api from './api/apiClient';

import Login from './pages/Login';
import DashboardLayout from './layouts/DashboardLayout';
import DashboardHome from './pages/Dashboard/DashboardHome';
import logo from './assets/C2logo.png';

import Venta from './pages/Ventas/Venta'; 
import Historial from './pages/Ventas/Historial';

import Productos from './pages/Inventario/Productos';
import Stock from './pages/Inventario/StockCritico';

import Usuarios from './pages/Configuracion/Usuarios';
import Auditoria from './pages/Configuracion/Auditoria';

import Clientes from './pages/Clientes';
import Reportes from './pages/Reportes';
import SinPermisos from './pages/SinPermisos';

const LoadingScreen = () => (
  <div className="fixed inset-0 flex items-center justify-center bg-white z-[9999]">
    <div className="flex flex-col items-center">
      <img src={logo} className="h-20 w-auto object-contain mb-8 opacity-80 animate-pulse" alt="Cargando..." />
      <div className="w-32 h-[2px] bg-zinc-100 rounded-full overflow-hidden relative">
        <div className="absolute inset-y-0 bg-black rounded-full animate-loading-bar"></div>
      </div>
      <p className="mt-4 text-[10px] font-black text-zinc-300 uppercase tracking-[0.4em]">Verificando Sesión</p>
    </div>
    <style>{`
      @keyframes loading-bar { 0% { left: -100%; width: 100%; } 100% { left: 100%; width: 100%; } }
      .animate-loading-bar { animation: loading-bar 1.5s ease-in-out infinite; }
    `}</style>
  </div>
);

const ProtectedRoute = ({ children }) => {
  const isAuth = useAuthStore(state => state.isAuthenticated);
  return isAuth ? children : <Navigate to="/login" replace />;
};

const RoleRoute = ({ children, roles = [] }) => {
  const userRole = useAuthStore((state) => String(state.user?.rol || '').toUpperCase());

  if (!roles.length) return children;
  return roles.includes(userRole) ? children : <Navigate to="/sin-permisos" replace />;
};

const PublicRoute = ({ children }) => {
  const isAuth = useAuthStore(state => state.isAuthenticated);
  return isAuth ? <Navigate to="/" replace /> : children;
};

export default function App() {
  const [checking, setChecking] = useState(true);
  const { token, setLogout, setSession } = useAuthStore();

  useEffect(() => {
    let isMounted = true;

    const verifySession = async () => {
      try {
        if (token) {
          await api.get('/auth/verify');
        } else {
          const { data } = await api.post('/auth/refresh');
          if (data?.token && data?.user) {
            setSession(data.user, data.token);
          } else {
            setLogout();
          }
        }
      } catch {
        setLogout();
      } finally {
        if (isMounted) {
          setChecking(false);
        }
      }
    };

    verifySession();
    return () => {
      isMounted = false;
    };
  }, [setLogout, setSession]);

  if (checking) return <LoadingScreen />;

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/sin-permisos" element={<ProtectedRoute><SinPermisos /></ProtectedRoute>} />
        
        {/* RUTAS PRIVADAS (DENTRO DEL ERP) */}
        <Route path="/" element={<ProtectedRoute><DashboardLayout /></ProtectedRoute>}>
          <Route index element={<DashboardHome />} />
          
          {/* Módulo Ventas */}
          <Route path="ventas/nueva" element={<Venta />} />
          <Route path="ventas/historial" element={<Historial />} />
          
          {/* Módulo Inventario */}
          <Route path="inventario/productos" element={<Productos />} />
          <Route path="inventario/alerta" element={<Stock />} />
          
          {/* Administración */}
          <Route path="clientes" element={<Clientes />} />
          <Route path="reportes" element={<Reportes />} />
          <Route path="usuarios" element={<RoleRoute roles={['ADMINISTRADOR']}><Usuarios /></RoleRoute>} />
          <Route path="auditoria" element={<RoleRoute roles={['ADMINISTRADOR']}><Auditoria /></RoleRoute>} />
          <Route path="logs" element={<Navigate to="/auditoria" replace />} />
        </Route>

        {/* REDIRECCIÓN POR DEFECTO */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
