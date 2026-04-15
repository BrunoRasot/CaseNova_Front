import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Eye, EyeOff, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import api from '../api/apiClient';
import useAuthStore from '../store/useAuthStore';
import logo from '../assets/C2logo.png';
import FeedbackToast from '../components/FeedbackToast';

export default function Login() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const navigate = useNavigate();
  const setLogin = useAuthStore((state) => state.setLogin);

  const validateEmail = (email) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email && !regex.test(email)) {
      setEmailError('Formato de correo no válido');
    } else {
      setEmailError('');
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (name === 'email') validateEmail(value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (emailError) return;

    setError('');
    setIsLoading(true);

    try {
      const { data } = await api.post('/auth/login', formData);
      setLogin(data.user, data.token);
      navigate('/', { replace: true });
    } catch (err) {
      if (err.response?.status === 423) {
        setError(err.response?.data?.message || 'Tu cuenta está bloqueada temporalmente.');
      } else {
        setError(err.response?.data?.message || 'Error de conexión con el servidor');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message, type = 'error') => setToast({ message, type });

  useEffect(() => {
    if (!toast) return;
    const timeout = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(timeout);
  }, [toast]);

  return (
    <div className="min-h-screen bg-[#FBFBFC] p-6 font-sans selection:bg-black selection:text-white">
      <FeedbackToast toast={toast} onClose={() => setToast(null)} />
      <div className="mx-auto flex min-h-screen w-full max-w-[560px] items-center justify-center">
        <div className="w-full max-w-[420px] animate-in fade-in duration-500">
          <div className="mb-10 flex flex-col items-center text-center lg:items-start lg:text-left">
            <img src={logo} alt="Logo" className="mb-6 h-28 w-auto object-contain" />
            <h1 className="text-2xl font-black uppercase tracking-tight text-zinc-900">Bienvenido al Panel</h1>
            <p className="mt-2 text-sm font-medium text-zinc-500">
              Ingresa tus credenciales para gestionar CaseNova.
            </p>
          </div>

          {error && (
            <div className="animate-in shake-1 mb-6 flex items-center gap-3 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm text-red-600">
              <AlertCircle size={18} />
              <span className="text-[11px] font-bold uppercase tracking-wider">{error}</span>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <div className="flex items-end justify-between px-1">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Correo Corporativo</label>
                {emailError && <span className="text-[9px] font-black uppercase text-red-500">{emailError}</span>}
              </div>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-600">
                  <Mail size={18} />
                </div>
                <input
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full rounded-2xl border-2 py-4 pl-12 pr-4 text-sm font-bold outline-none transition-all ${
                    emailError
                      ? 'border-red-100 bg-red-50'
                      : 'border-zinc-100 bg-zinc-50 focus:border-indigo-600 focus:bg-white'
                  }`}
                  placeholder="usuario@casenova.pe"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="px-1 text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">Clave de Seguridad</label>
              <div className="group relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors group-focus-within:text-indigo-600">
                  <Lock size={18} />
                </div>
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="w-full rounded-2xl border-2 border-zinc-100 bg-zinc-50 py-4 pl-12 pr-12 text-sm font-bold outline-none transition-all focus:border-indigo-600 focus:bg-white"
                  placeholder="********"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-400 transition-colors hover:text-indigo-600"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || !!emailError}
              className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-indigo-600 py-4 text-xs font-black uppercase tracking-[0.2em] text-white shadow-2xl shadow-indigo-200 transition-all hover:bg-indigo-700 hover:shadow-indigo-300 active:scale-[0.98] disabled:opacity-50"
            >
              {isLoading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <span>Autenticar Acceso</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-12 text-center lg:text-left">
              <button
              onClick={() => showToast('Contacta con TI para recuperar tus credenciales.')}
              className="text-[10px] font-black uppercase tracking-widest text-zinc-400 transition-colors hover:text-indigo-600"
            >
              ¿Olvidaste tus credenciales?
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

