import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    ShoppingCart,
    Package,
    UserCircle,
    TrendingUp,
    Settings,
    LogOut,
    ChevronDown,
    PlusCircle,
    History,
    AlertCircle,
    ShieldCheck,
    Users,
    Layers,
    X,
} from 'lucide-react';
import useAuthStore from '../store/useAuthStore';
import logo from '../assets/C3logo.png';
import ConfirmDialog from './ConfirmDialog';
import api from '../api/apiClient';

export default function Sidebar({ isMobileOpen = false, onCloseMobile }) {
    const { user, setLogout } = useAuthStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [openSubmenu, setOpenSubmenu] = useState(null);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const toggleSubmenu = (name) => setOpenSubmenu(openSubmenu === name ? null : name);
    const closeMobileSidebar = () => {
        if (onCloseMobile) onCloseMobile();
    };

    const displayName = user?.nombre || 'Cargando...';
    const displayRole = user?.rol || 'Operador';
    const initial = displayName.charAt(0).toUpperCase();
    const isAdmin = String(displayRole).toUpperCase() === 'ADMINISTRADOR';

    const handleLogout = () => {
        setShowLogoutConfirm(true);
    };

    const handleNavigation = () => {
        closeMobileSidebar();
    };

    const sections = [
        {
            label: 'Principal',
            items: [{ name: 'Dashboard', icon: LayoutDashboard, path: '/' }],
        },
        {
            label: 'Operaciones',
            items: [
                {
                    name: 'Ventas',
                    icon: ShoppingCart,
                    subItems: [
                        { name: 'Nueva Venta', path: '/ventas/nueva', icon: PlusCircle },
                        { name: 'Historial', path: '/ventas/historial', icon: History },
                    ],
                },
                {
                    name: 'Inventario',
                    icon: Package,
                    subItems: [
                        { name: 'Productos', path: '/inventario/productos', icon: Layers },
                        { name: 'Stock Crítico', path: '/inventario/alerta', icon: AlertCircle },
                    ],
                },
            ],
        },
        {
            label: 'Administración',
            items: [
                { name: 'Clientes', icon: UserCircle, path: '/clientes' },
                { name: 'Reportes', icon: TrendingUp, path: '/reportes' },
                {
                    name: 'Configuración',
                    icon: Settings,
                    subItems: [
                        ...(isAdmin ? [{ name: 'Usuarios', path: '/usuarios', icon: Users }] : []),
                        ...(isAdmin ? [{ name: 'Auditoría', path: '/auditoria', icon: ShieldCheck }] : []),
                    ],
                },
            ],
        },
    ];

    return (
        <aside
            className={`fixed inset-y-0 left-0 z-40 flex h-dvh w-[88vw] max-w-72 shrink-0 flex-col border-r border-[#1e293b] bg-gradient-to-b from-[#020b1a] via-[#0b1f3a] to-[#020b1a] text-white shadow-2xl transition-transform duration-300 lg:static lg:z-auto lg:h-screen lg:w-72 lg:translate-x-0 ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:shadow-none`}
        >
            <div className="relative border-b border-[#1e293b]/80 px-5 py-6">
                <button
                    type="button"
                    onClick={closeMobileSidebar}
                    className="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-xl border border-[#334155] bg-[#0f172a]/70 text-slate-200 transition hover:bg-[#1e293b] hover:text-white lg:hidden"
                    aria-label="Cerrar sidebar"
                >
                    <X size={16} />
                </button>

                <div className="flex items-center justify-center">
                    <img src={logo} alt="CaseNova" className="h-14 w-auto object-contain" />
                </div>
            </div>

            <nav className="flex-1 overflow-y-auto px-4 py-5 scrollbar-hide space-y-7">
                {sections.map((section) => (
                    <div key={section.label} className="space-y-2">
                        <h2 className="px-4 text-[10px] font-black uppercase tracking-[0.25em] text-slate-400">{section.label}</h2>

                        <div className="space-y-1">
                            {section.items.map((item) => {
                                const hasSubItems = item.subItems && item.subItems.length > 0;
                                const isOpen = openSubmenu === item.name;
                                const isActive =
                                    location.pathname === item.path ||
                                    (hasSubItems && item.subItems.some((sub) => location.pathname === sub.path));

                                const itemState = isActive
                                    ? 'bg-[#e2e8f0] text-[#0f172a] shadow-[0_6px_20px_rgba(0,0,0,0.25)]'
                                    : 'text-slate-200 hover:bg-[#132946]/70 hover:text-white';

                                return (
                                    <div key={item.name}>
                                        {hasSubItems ? (
                                            <button
                                                onClick={() => toggleSubmenu(item.name)}
                                                title={item.name}
                                                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all ${itemState}`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <item.icon size={18} />
                                                    <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
                                                </div>
                                                <ChevronDown size={14} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                                            </button>
                                        ) : (
                                            <Link
                                                to={item.path}
                                                title={item.name}
                                                onClick={handleNavigation}
                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${itemState}`}
                                            >
                                                <item.icon size={18} />
                                                <span className="text-[11px] font-bold uppercase tracking-widest">{item.name}</span>
                                            </Link>
                                        )}

                                        {hasSubItems && isOpen && (
                                            <div className="ml-4 mt-1 pl-4 space-y-1 border-l border-[#334155]/80">
                                                {item.subItems.map((sub) => (
                                                    <Link
                                                        key={sub.path}
                                                        to={sub.path}
                                                        onClick={handleNavigation}
                                                        className={`flex items-center gap-3 rounded-lg px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${
                                                            location.pathname === sub.path
                                                                ? 'bg-[#1e293b] text-white'
                                                                : 'text-slate-300 hover:bg-[#132946]/40 hover:text-white'
                                                        }`}
                                                    >
                                                        <sub.icon size={14} /> {sub.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </nav>

            <div className="mt-auto border-t border-[#1e293b]/80 bg-black/20 p-4">
                <div className="rounded-2xl border border-[#334155]/80 bg-[#0f172a]/50 p-4">
                    <div className="mb-4 flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-[#475569] bg-[#1e293b] text-sm font-black text-white">
                            {initial}
                        </div>
                        <div className="min-w-0">
                            <p className="truncate text-[11px] font-black uppercase tracking-wider text-slate-100">{displayName}</p>
                            <p className="truncate text-[9px] font-bold uppercase tracking-widest text-slate-300">{displayRole}</p>
                        </div>
                    </div>

                    <div className="mb-3 flex items-center gap-2 px-0.5">
                        <span className="h-2 w-2 rounded-full bg-emerald-400" />
                        <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-emerald-300">En linea</p>
                    </div>

                    <button
                        onClick={handleLogout}
                        title="Salir"
                        className="group flex w-full items-center justify-center gap-2 rounded-xl border border-[#334155] bg-white/5 py-3 text-[10px] font-black uppercase text-slate-100 transition-all hover:bg-white hover:text-slate-900"
                    >
                        <LogOut size={14} /> <span>SALIR DEL ERP</span>
                    </button>
                </div>
            </div>

            <ConfirmDialog
                open={showLogoutConfirm}
                title="Cerrar sesión"
                message="¿Deseas cerrar sesión en CaseNova ERP?"
                confirmLabel="Salir"
                cancelLabel="Cancelar"
                variant="danger"
                onClose={() => setShowLogoutConfirm(false)}
                onConfirm={async () => {
                        try {
                            await api.post('/auth/logout');
                        } catch (_) {
                            // ignore logout errors and continue client-side cleanup
                        }
                        setShowLogoutConfirm(false);
                        setLogout();
                        navigate('/login', { replace: true });
                    }}
            />
        </aside>
    );
}
