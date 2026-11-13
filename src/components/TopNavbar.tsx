import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowUpDown,
  ChevronDown,
  Clock,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Gift,
  Hash,
  Headphones,
  Home,
  LayoutList,
  LogOut,
  Menu,
  Moon,
  Scale,
  Coins,
  Space,
  Sun,
  Trophy,
  Wallet,
  X,
} from 'lucide-react';
import { NavRoute } from '../types';
import { GraffitiMotif } from './GraffitiMotif';
import { LogoMark } from './LogoMark';

interface TopNavbarProps {
  activeRoute: NavRoute;
  onNavigate: (route: NavRoute) => void;
  isDark: boolean;
  onToggleTheme: () => void;
  onLogout: () => void;
}

type DropdownId = 'cari-selisih' | 'tools-cs' | 'tools-kasir' | null;

interface SubMenuItem {
  route: NavRoute;
  label: string;
  description: string;
  icon: React.ReactNode;
}

const CARI_SELISIH_ITEMS: SubMenuItem[] = [
  {
    route: 'admin-vs-garuda',
    label: 'ADMIN vs GARUDA',
    description: 'Audit Transaksi vs Gateway Garuda',
    icon: <Coins className="w-4 h-4" />,
  },
  {
    route: 'admin-vs-docs',
    label: 'ADMIN vs DOCS',
    description: 'Audit Transaksi vs Rekap Docs/Sheet',
    icon: <FileSpreadsheet className="w-4 h-4" />,
  },
];

const TOOLS_CS_ITEMS: SubMenuItem[] = [
  {
    route: 'bagi-bonus',
    label: 'BAGI BONUS',
    description: 'Rollingan, Cashback & Freebet',
    icon: <Gift className="w-4 h-4" />,
  },
  {
    route: 'edit-pembayaran',
    label: 'EDIT PEMBAYARAN',
    description: 'Kelola Rek Bank & Saluran Depo',
    icon: <CreditCard className="w-4 h-4" />,
  },
  {
    route: 'rekapan-toto',
    label: 'REKAPAN TOTO',
    description: 'Pasaran Togel, Diskon & Hadiah',
    icon: <Hash className="w-4 h-4" />,
  },
  {
    route: 'rekapan-wl-sportbooks',
    label: 'REKAPAN WL / SPORTBOOKS',
    description: 'Win/Lose Player & Odds Parlay',
    icon: <Trophy className="w-4 h-4" />,
  },
  {
    route: 'laporan-cs',
    label: 'LAPORAN CS',
    description: 'Rekapan Shift & Handover Harian',
    icon: <FileText className="w-4 h-4" />,
  },
];

const TOOLS_KASIR_ITEMS: SubMenuItem[] = [
  {
    route: 'info-dp-wd',
    label: 'INFO DP / WD',
    description: 'Antrian Mutasi Deposit & WD',
    icon: <ArrowUpDown className="w-4 h-4" />,
  },
  {
    route: 'info-spasi',
    label: 'INFO SPASI',
    description: 'Pembersih No Rekening Kasir',
    icon: <Space className="w-4 h-4" />,
  },
];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeRoute,
  onNavigate,
  isDark,
  onToggleTheme,
  onLogout,
}) => {
  const [openDropdown, setOpenDropdown] = useState<DropdownId>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [now, setNow] = useState<Date>(() => new Date());
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpenDropdown(null);
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const formattedDate = now.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
  const formattedTime = now.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const isCariSelisihActive =
    activeRoute === 'admin-vs-garuda' || activeRoute === 'admin-vs-docs';
  const isToolsCsActive = TOOLS_CS_ITEMS.some((i) => i.route === activeRoute);
  const isToolsKasirActive = TOOLS_KASIR_ITEMS.some((i) => i.route === activeRoute);

  const handleSelectRoute = (route: NavRoute) => {
    onNavigate(route);
    setOpenDropdown(null);
    setMobileMenuOpen(false);
  };

  const toggleDropdown = (id: DropdownId) => {
    setOpenDropdown((prev) => (prev === id ? null : id));
  };

  return (
    <header
      ref={navRef}
      className="sticky top-0 z-40 bg-white/95 dark:bg-[#1A110C]/95 backdrop-blur-md border-b border-[#D4C4AE] dark:border-[#3A281D] transition-colors duration-200"
    >
      {/* Top Row: Brand (Left), Graffiti Motivation (Center), Utilities (Right) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 border-b border-[#E8DDD0] dark:border-[#2E1F16]">
        <button
          type="button"
          onClick={() => handleSelectRoute('dashboard')}
          className="flex items-center gap-3 text-left group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4A2B18] dark:focus-visible:ring-[#D4A373] rounded-xl pr-2 justify-self-start min-w-0"
        >
          <LogoMark size={42} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-base sm:text-lg font-extrabold tracking-tight text-black dark:text-white whitespace-nowrap">
                DON <span className="text-[#6E3E20] dark:text-[#D9A76A]">PABLO</span>
              </span>
            </div>
            <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5] truncate">
              Sistem Terpadu Layanan Operasional
            </p>
          </div>
        </button>

        {/* Center Motivational Graffiti: NO PAIN | NO GAIN */}
        <div className="hidden md:flex items-center justify-center px-2">
          <GraffitiMotif isDark={isDark} size="md" />
        </div>

        {/* Right Controls */}
        <div className="flex items-center justify-end gap-2 sm:gap-3 shrink-0">
          {/* Live System Clock (desktop & tablet) */}
          <div className="hidden xl:flex flex-col items-end pr-3 border-r border-[#D4C4AE] dark:border-[#3A281D]">
            <span className="text-[10px] font-bold tracking-wider uppercase text-[#4A2B18] dark:text-[#D4A373]">
              WAKTU SISTEM
            </span>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-black dark:text-white font-mono-tabular">
              <Clock className="w-3.5 h-3.5 text-[#6E3E20] dark:text-[#D9A76A]" />
              <span>
                {formattedDate} {formattedTime}
              </span>
            </div>
          </div>

          {/* Dark / Light Theme Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label={isDark ? 'Aktifkan Tema Terang' : 'Aktifkan Tema Gelap'}
            title={isDark ? 'Ganti ke Tema Terang' : 'Ganti ke Tema Gelap'}
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2D1F17] dark:hover:bg-[#3B291E] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {isDark ? (
              <>
                <Sun className="w-4 h-4 text-[#E5B874]" />
                <span className="hidden sm:inline">Tema Terang</span>
              </>
            ) : (
              <>
                <Moon className="w-4 h-4 text-[#4A2B18]" />
                <span className="hidden sm:inline">Tema Gelap</span>
              </>
            )}
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            aria-label="Keluar dari Dashboard"
            title="Keluar ke halaman login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#F5EFE6] dark:bg-[#221710] dark:hover:bg-[#322218] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#6E3E20] dark:text-[#E5B874]" />
            <span>Keluar</span>
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Buka Menu Navigasi"
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#EAE0D2] dark:bg-[#2D1F17] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Small-screen Centered Graffiti Strip */}
      <div className="md:hidden flex items-center justify-center py-1 px-4 border-b border-[#E8DDD0] dark:border-[#2E1F16]">
        <GraffitiMotif isDark={isDark} size="sm" />
      </div>

      {/* Desktop Top Navigation Menu Row (Exact User Structure) */}
      <nav
        aria-label="Menu Utama CS & Kasir"
        className="hidden lg:block max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5"
      >
        <div className="flex items-center gap-2.5 flex-wrap">
          {/* 0. DASHBOARD */}
          <button
            type="button"
            onClick={() => handleSelectRoute('dashboard')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border ${
              activeRoute === 'dashboard'
                ? 'bg-[#EAE0D2] dark:bg-[#4A2B18] text-black dark:text-white border-[#4A2B18] dark:border-[#D4A373] shadow-xs'
                : 'bg-white dark:bg-[#221710] text-black dark:text-white border-[#D4C4AE] dark:border-[#3D2B20] hover:bg-[#F4EDE3] dark:hover:bg-[#2C1E15]'
            }`}
          >
            <Home className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
            <span>DASHBOARD</span>
          </button>

          {/* 1. WD AUTO FLOP */}
          <button
            type="button"
            onClick={() => handleSelectRoute('wd-auto-flop')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border ${
              activeRoute === 'wd-auto-flop'
                ? 'bg-[#EAE0D2] dark:bg-[#4A2B18] text-black dark:text-white border-[#4A2B18] dark:border-[#D4A373] shadow-xs'
                : 'bg-white dark:bg-[#221710] text-black dark:text-white border-[#D4C4AE] dark:border-[#3D2B20] hover:bg-[#F4EDE3] dark:hover:bg-[#2C1E15]'
            }`}
          >
            <LayoutList className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
            <span>WD AUTO FLOP</span>
            <span className="px-1.5 py-0.5 text-[10px] font-extrabold rounded bg-[#147D4E] text-white dark:bg-[#1C9B62] dark:text-white tracking-wider">
              INSTANT
            </span>
          </button>

          {/* 2. CARI SELISIH (Dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('cari-selisih')}
              aria-expanded={openDropdown === 'cari-selisih'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border ${
                isCariSelisihActive || openDropdown === 'cari-selisih'
                  ? 'bg-[#EAE0D2] dark:bg-[#4A2B18] text-black dark:text-white border-[#4A2B18] dark:border-[#D4A373] shadow-xs'
                  : 'bg-white dark:bg-[#221710] text-black dark:text-white border-[#D4C4AE] dark:border-[#3D2B20] hover:bg-[#F4EDE3] dark:hover:bg-[#2C1E15]'
              }`}
            >
              <Scale className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <span>CARI SELISIH</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'cari-selisih' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'cari-selisih' && (
              <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#211711] border border-[#CBB9A0] dark:border-[#4D3627] shadow-xl p-2 z-50">
                <div className="px-3 py-2 border-b border-[#EAE0D2] dark:border-[#36251B] mb-1">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#4A2B18] dark:text-[#E5B874]">
                    SUBMENU AUDIT CARI SELISIH
                  </span>
                </div>
                <div className="space-y-1">
                  {CARI_SELISIH_ITEMS.map((item) => {
                    const active = activeRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => handleSelectRoute(item.route)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#EAE0D2] dark:bg-[#3B2619]'
                            : 'hover:bg-[#F6F0E8] dark:hover:bg-[#2B1D14]'
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-[#F4EDE3] dark:bg-[#2E1F16] text-[#4A2B18] dark:text-[#E5B874] shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-black dark:text-white">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5]">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. TOOLS CS (Dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('tools-cs')}
              aria-expanded={openDropdown === 'tools-cs'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border ${
                isToolsCsActive || openDropdown === 'tools-cs'
                  ? 'bg-[#EAE0D2] dark:bg-[#4A2B18] text-black dark:text-white border-[#4A2B18] dark:border-[#D4A373] shadow-xs'
                  : 'bg-white dark:bg-[#221710] text-black dark:text-white border-[#D4C4AE] dark:border-[#3D2B20] hover:bg-[#F4EDE3] dark:hover:bg-[#2C1E15]'
              }`}
            >
              <Headphones className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <span>TOOLS CS</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'tools-cs' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'tools-cs' && (
              <div className="absolute left-0 mt-2 w-84 rounded-2xl bg-white dark:bg-[#211711] border border-[#CBB9A0] dark:border-[#4D3627] shadow-xl p-2 z-50">
                <div className="px-3 py-2 border-b border-[#EAE0D2] dark:border-[#36251B] mb-1">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#4A2B18] dark:text-[#E5B874]">
                    SUBMENU PILIHAN TOOLS CS
                  </span>
                </div>
                <div className="space-y-1">
                  {TOOLS_CS_ITEMS.map((item) => {
                    const active = activeRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => handleSelectRoute(item.route)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#EAE0D2] dark:bg-[#3B2619]'
                            : 'hover:bg-[#F6F0E8] dark:hover:bg-[#2B1D14]'
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-[#F4EDE3] dark:bg-[#2E1F16] text-[#4A2B18] dark:text-[#E5B874] shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-black dark:text-white">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5]">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 4. TOOLS KASIR (Dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('tools-kasir')}
              aria-expanded={openDropdown === 'tools-kasir'}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border ${
                isToolsKasirActive || openDropdown === 'tools-kasir'
                  ? 'bg-[#EAE0D2] dark:bg-[#4A2B18] text-black dark:text-white border-[#4A2B18] dark:border-[#D4A373] shadow-xs'
                  : 'bg-white dark:bg-[#221710] text-black dark:text-white border-[#D4C4AE] dark:border-[#3D2B20] hover:bg-[#F4EDE3] dark:hover:bg-[#2C1E15]'
              }`}
            >
              <Wallet className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
              <span>TOOLS KASIR</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'tools-kasir' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'tools-kasir' && (
              <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#211711] border border-[#CBB9A0] dark:border-[#4D3627] shadow-xl p-2 z-50">
                <div className="px-3 py-2 border-b border-[#EAE0D2] dark:border-[#36251B] mb-1">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-[#4A2B18] dark:text-[#E5B874]">
                    SUBMENU PILIHAN TOOLS KASIR
                  </span>
                </div>
                <div className="space-y-1">
                  {TOOLS_KASIR_ITEMS.map((item) => {
                    const active = activeRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => handleSelectRoute(item.route)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-[#EAE0D2] dark:bg-[#3B2619]'
                            : 'hover:bg-[#F6F0E8] dark:hover:bg-[#2B1D14]'
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-[#F4EDE3] dark:bg-[#2E1F16] text-[#4A2B18] dark:text-[#E5B874] shrink-0">
                          {item.icon}
                        </div>
                        <div className="min-w-0">
                          <div className="text-xs font-extrabold text-black dark:text-white">
                            {item.label}
                          </div>
                          <div className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5]">
                            {item.description}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile / Tablet Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D4C4AE] dark:border-[#3A281D] bg-[#F7F2EA] dark:bg-[#19100B] px-4 py-4 max-h-[75vh] overflow-y-auto space-y-3">
          {/* Mobile quick status row */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#DFD1BE] dark:border-[#342319]">
            <div className="text-xs font-mono-tabular font-semibold text-black dark:text-white">
              {formattedDate} · {formattedTime}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold border bg-white dark:bg-[#2A1D15] text-black dark:text-white border-[#CBB9A0] dark:border-[#4A3426] cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Keluar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectRoute('dashboard')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border text-left ${
                activeRoute === 'dashboard'
                  ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#D4A373] dark:text-[#140D09]'
                  : 'bg-white dark:bg-[#231811] text-black dark:text-white border-[#D4C4AE] dark:border-[#3D2B20]'
              }`}
            >
              <Home className="w-4 h-4 shrink-0" />
              <span>DASHBOARD</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRoute('wd-auto-flop')}
              className={`flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border text-left ${
                activeRoute === 'wd-auto-flop'
                  ? 'bg-[#4A2B18] text-white border-[#4A2B18] dark:bg-[#D4A373] dark:text-[#140D09]'
                  : 'bg-white dark:bg-[#231811] text-black dark:text-white border-[#D4C4AE] dark:border-[#3D2B20]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <LayoutList className="w-4 h-4 shrink-0" />
                <span>WD AUTO FLOP</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] rounded bg-[#147D4E] text-white">
                INSTANT
              </span>
            </button>
          </div>

          {/* Mobile Section: CARI SELISIH */}
          <div className="rounded-xl bg-white dark:bg-[#211711] border border-[#D4C4AE] dark:border-[#3D2B20] p-2.5">
            <div className="px-2 pb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
              CARI SELISIH
            </div>
            <div className="space-y-1">
              {CARI_SELISIH_ITEMS.map((item) => (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleSelectRoute(item.route)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-bold ${
                    activeRoute === item.route
                      ? 'bg-[#EAE0D2] dark:bg-[#3B2619] text-black dark:text-white'
                      : 'text-black dark:text-white hover:bg-[#F5EFE6] dark:hover:bg-[#2C1E15]'
                  }`}
                >
                  <span className="text-[#4A2B18] dark:text-[#E5B874]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Section: TOOLS CS */}
          <div className="rounded-xl bg-white dark:bg-[#211711] border border-[#D4C4AE] dark:border-[#3D2B20] p-2.5">
            <div className="px-2 pb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
              TOOLS CS
            </div>
            <div className="space-y-1">
              {TOOLS_CS_ITEMS.map((item) => (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleSelectRoute(item.route)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-bold ${
                    activeRoute === item.route
                      ? 'bg-[#EAE0D2] dark:bg-[#3B2619] text-black dark:text-white'
                      : 'text-black dark:text-white hover:bg-[#F5EFE6] dark:hover:bg-[#2C1E15]'
                  }`}
                >
                  <span className="text-[#4A2B18] dark:text-[#E5B874]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mobile Section: TOOLS KASIR */}
          <div className="rounded-xl bg-white dark:bg-[#211711] border border-[#D4C4AE] dark:border-[#3D2B20] p-2.5">
            <div className="px-2 pb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
              TOOLS KASIR
            </div>
            <div className="space-y-1">
              {TOOLS_KASIR_ITEMS.map((item) => (
                <button
                  key={item.route}
                  type="button"
                  onClick={() => handleSelectRoute(item.route)}
                  className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-left text-xs font-bold ${
                    activeRoute === item.route
                      ? 'bg-[#EAE0D2] dark:bg-[#3B2619] text-black dark:text-white'
                      : 'text-black dark:text-white hover:bg-[#F5EFE6] dark:hover:bg-[#2C1E15]'
                  }`}
                >
                  <span className="text-[#4A2B18] dark:text-[#E5B874]">{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
