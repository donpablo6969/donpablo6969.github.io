import React, { useEffect, useRef, useState } from 'react';
import {
  CheckSquare,
  ChevronDown,
  ClipboardCheck,
  Clock,
  Coins,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Gift,
  Globe,
  Hash,
  Home,
  LayoutList,
  LogOut,
  Menu,
  Moon,
  Scale,
  Sun,
  Trash2,
  Trophy,
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
  onClearCache: () => void;
  onLogout: () => void;
}

type DropdownId = 'cari-selisih' | 'isi-rekapan' | null;

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
    description: 'Audit Upload/Paste Admin vs Rekap Docs',
    icon: <FileSpreadsheet className="w-4 h-4" />,
  },
];

const ISI_REKAPAN_ITEMS: SubMenuItem[] = [
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
];

export const TopNavbar: React.FC<TopNavbarProps> = ({
  activeRoute,
  onNavigate,
  isDark,
  onToggleTheme,
  onClearCache,
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
  const isIsiRekapanActive = ISI_REKAPAN_ITEMS.some((i) => i.route === activeRoute);

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
      className="sticky top-0 z-40 bg-white/95 dark:bg-[#1A110C]/95 backdrop-blur-md border-b border-[#D4C4AE] dark:border-[#C59656]/60 transition-colors duration-200"
    >
      {/* Top Row: Brand (Left), Graffiti Motivation (Center), Utilities (Right) */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3 grid grid-cols-[1fr_auto] md:grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-4 border-b border-[#E8DDD0] dark:border-[#C59656]/35">
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
          <div className="hidden xl:flex flex-col items-end pr-3 border-r border-[#D4C4AE] dark:border-[#C59656]/60">
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
            className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2D1F17] dark:hover:bg-[#3B291E] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
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

          {/* Clear Cache Button */}
          <button
            type="button"
            onClick={onClearCache}
            aria-label="Bersihkan Cache Aplikasi"
            title="Bersihkan cache & segarkan memori agar tidak berat"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2D1F17] dark:hover:bg-[#3B291E] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5 text-[#6E3E20] dark:text-[#E5B874]" />
            <span className="hidden sm:inline">Clear Cache</span>
          </button>

          {/* Logout Button */}
          <button
            type="button"
            onClick={onLogout}
            aria-label="Keluar dari Dashboard"
            title="Keluar ke halaman login"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white hover:bg-[#F5EFE6] dark:bg-[#221710] dark:hover:bg-[#322218] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#6E3E20] dark:text-[#E5B874]" />
            <span>Keluar</span>
          </button>

          {/* Mobile Menu Trigger */}
          <button
            type="button"
            onClick={() => setMobileMenuOpen((prev) => !prev)}
            aria-label="Buka Menu Navigasi"
            className="lg:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg bg-[#EAE0D2] dark:bg-[#2D1F17] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile / Small-screen Centered Graffiti Strip */}
      <div className="md:hidden flex items-center justify-center py-1 px-4 border-b border-[#E8DDD0] dark:border-[#C59656]/35">
        <GraffitiMotif isDark={isDark} size="sm" />
      </div>

      {/* Desktop Top Navigation Menu Row (Exact User Structure) */}
      <nav
        aria-label="Menu Utama CS & Kasir"
        className="hidden lg:block max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5"
      >
        <div className="flex items-center gap-2 flex-wrap">
          {/* 1. DASHBOARD */}
          <button
            type="button"
            onClick={() => handleSelectRoute('dashboard')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-2 ${
              activeRoute === 'dashboard'
                ? 'bg-[#FFF3E0] dark:bg-[#4A2B18] text-black dark:text-white border-[#B45309] dark:border-[#F59E0B] shadow-xs'
                : 'bg-white dark:bg-[#221710] text-black dark:text-white border-[#D97706]/55 dark:border-[#F59E0B]/45 hover:bg-[#FEF6E7] dark:hover:bg-[#2C1E15]'
            }`}
          >
            <Home className="w-4 h-4 text-[#B45309] dark:text-[#FBBF24]" />
            <span>DASHBOARD</span>
          </button>

          {/* 2. BAGI BONUS */}
          <button
            type="button"
            onClick={() => handleSelectRoute('bagi-bonus')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-2 ${
              activeRoute === 'bagi-bonus'
                ? 'bg-emerald-50 dark:bg-emerald-950/70 text-black dark:text-white border-emerald-600 dark:border-emerald-400 shadow-xs'
                : 'bg-white dark:bg-[#221710] text-black dark:text-white border-emerald-600/50 dark:border-emerald-400/45 hover:bg-emerald-50/70 dark:hover:bg-emerald-950/35'
            }`}
          >
            <Gift className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>BAGI BONUS</span>
          </button>

          {/* 3. LAPORAN CS */}
          <button
            type="button"
            onClick={() => handleSelectRoute('laporan-cs')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-2 ${
              activeRoute === 'laporan-cs'
                ? 'bg-sky-50 dark:bg-sky-950/70 text-black dark:text-white border-sky-600 dark:border-sky-400 shadow-xs'
                : 'bg-white dark:bg-[#221710] text-black dark:text-white border-sky-600/50 dark:border-sky-400/45 hover:bg-sky-50/70 dark:hover:bg-sky-950/35'
            }`}
          >
            <FileText className="w-4 h-4 text-sky-600 dark:text-sky-400" />
            <span>LAPORAN CS</span>
          </button>

          {/* 4. WD AUTO FLOP */}
          <button
            type="button"
            onClick={() => handleSelectRoute('wd-auto-flop')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-2 ${
              activeRoute === 'wd-auto-flop'
                ? 'bg-orange-50 dark:bg-orange-950/70 text-black dark:text-white border-orange-600 dark:border-orange-400 shadow-xs'
                : 'bg-white dark:bg-[#221710] text-black dark:text-white border-orange-600/50 dark:border-orange-400/45 hover:bg-orange-50/70 dark:hover:bg-orange-950/35'
            }`}
          >
            <LayoutList className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>WD AUTO FLOP</span>
          </button>

          {/* 5. ISI REKAPAN (Dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('isi-rekapan')}
              aria-expanded={openDropdown === 'isi-rekapan'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-2 ${
                isIsiRekapanActive || openDropdown === 'isi-rekapan'
                  ? 'bg-violet-50 dark:bg-violet-950/70 text-black dark:text-white border-violet-600 dark:border-violet-400 shadow-xs'
                  : 'bg-white dark:bg-[#221710] text-black dark:text-white border-violet-600/50 dark:border-violet-400/45 hover:bg-violet-50/70 dark:hover:bg-violet-950/35'
              }`}
            >
              <ClipboardCheck className="w-4 h-4 text-violet-600 dark:text-violet-400" />
              <span>ISI REKAPAN</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'isi-rekapan' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'isi-rekapan' && (
              <div className="absolute left-0 mt-2 w-84 rounded-2xl bg-white dark:bg-[#211711] border border-[#CBB9A0] dark:border-[#D4A373]/75 shadow-xl p-2 z-50">
                <div className="px-3 py-2 border-b border-[#EAE0D2] dark:border-[#C59656]/35 mb-1">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-violet-700 dark:text-violet-300">
                    SUBMENU ISI REKAPAN
                  </span>
                </div>
                <div className="space-y-1">
                  {ISI_REKAPAN_ITEMS.map((item) => {
                    const active = activeRoute === item.route;
                    return (
                      <button
                        key={item.route}
                        type="button"
                        onClick={() => handleSelectRoute(item.route)}
                        className={`w-full flex items-start gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                          active
                            ? 'bg-violet-50 dark:bg-violet-950/60'
                            : 'hover:bg-[#F6F0E8] dark:hover:bg-[#2B1D14]'
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-violet-100/80 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 shrink-0">
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

          {/* 6. CARI SELISIH (Dropdown) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => toggleDropdown('cari-selisih')}
              aria-expanded={openDropdown === 'cari-selisih'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-2 ${
                isCariSelisihActive || openDropdown === 'cari-selisih'
                  ? 'bg-rose-50 dark:bg-rose-950/70 text-black dark:text-white border-rose-600 dark:border-rose-400 shadow-xs'
                  : 'bg-white dark:bg-[#221710] text-black dark:text-white border-rose-600/50 dark:border-rose-400/45 hover:bg-rose-50/70 dark:hover:bg-rose-950/35'
              }`}
            >
              <Scale className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <span>CARI SELISIH</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-150 ${
                  openDropdown === 'cari-selisih' ? 'rotate-180' : ''
                }`}
              />
            </button>

            {openDropdown === 'cari-selisih' && (
              <div className="absolute left-0 mt-2 w-80 rounded-2xl bg-white dark:bg-[#211711] border border-[#CBB9A0] dark:border-[#D4A373]/75 shadow-xl p-2 z-50">
                <div className="px-3 py-2 border-b border-[#EAE0D2] dark:border-[#C59656]/35 mb-1">
                  <span className="text-[11px] font-extrabold tracking-wider uppercase text-rose-700 dark:text-rose-300">
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
                            ? 'bg-rose-50 dark:bg-rose-950/60'
                            : 'hover:bg-[#F6F0E8] dark:hover:bg-[#2B1D14]'
                        }`}
                      >
                        <div className="mt-0.5 p-1.5 rounded-lg bg-rose-100/80 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300 shrink-0">
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

          {/* 7. EDITING */}
          <button
            type="button"
            onClick={() => handleSelectRoute('edit-pembayaran')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-2 ${
              activeRoute === 'edit-pembayaran'
                ? 'bg-teal-50 dark:bg-teal-950/70 text-black dark:text-white border-teal-600 dark:border-teal-400 shadow-xs'
                : 'bg-white dark:bg-[#221710] text-black dark:text-white border-teal-600/50 dark:border-teal-400/45 hover:bg-teal-50/70 dark:hover:bg-teal-950/35'
            }`}
          >
            <CreditCard className="w-4 h-4 text-teal-600 dark:text-teal-400" />
            <span>EDITING</span>
          </button>

          {/* 8. VALIDASI REKENING */}
          <button
            type="button"
            onClick={() => handleSelectRoute('validasi')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-2 border-dashed ${
              activeRoute === 'validasi'
                ? 'bg-indigo-50 dark:bg-indigo-950/70 text-black dark:text-white border-indigo-600 dark:border-indigo-400 shadow-xs'
                : 'bg-white dark:bg-[#221710] text-black dark:text-white border-indigo-600/55 dark:border-indigo-400/50 hover:bg-indigo-50/70 dark:hover:bg-indigo-950/35'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span>VALIDASI REKENING</span>
          </button>

          {/* 9. CEK NAWALA */}
          <button
            type="button"
            onClick={() => handleSelectRoute('cek-nawala')}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-extrabold tracking-wide transition-all duration-150 whitespace-nowrap shrink-0 cursor-pointer border-2 border-dashed ${
              activeRoute === 'cek-nawala'
                ? 'bg-fuchsia-50 dark:bg-fuchsia-950/70 text-black dark:text-white border-fuchsia-600 dark:border-fuchsia-400 shadow-xs'
                : 'bg-white dark:bg-[#221710] text-black dark:text-white border-fuchsia-600/55 dark:border-fuchsia-400/50 hover:bg-fuchsia-50/70 dark:hover:bg-fuchsia-950/35'
            }`}
          >
            <Globe className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
            <span>CEK NAWALA</span>
          </button>
        </div>
      </nav>

      {/* Mobile / Tablet Responsive Navigation Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-[#D4C4AE] dark:border-[#C59656]/60 bg-[#F7F2EA] dark:bg-[#19100B] px-4 py-4 max-h-[75vh] overflow-y-auto space-y-3">
          {/* Mobile quick status row */}
          <div className="flex items-center justify-between gap-2 pb-3 border-b border-[#DFD1BE] dark:border-[#C59656]/35">
            <div className="text-xs font-mono-tabular font-semibold text-black dark:text-white">
              {formattedDate} · {formattedTime}
            </div>
            <button
              type="button"
              onClick={onLogout}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-bold border bg-white dark:bg-[#2A1D15] text-black dark:text-white border-[#CBB9A0] dark:border-[#D4A373]/70 cursor-pointer"
            >
              <LogOut className="w-3 h-3" />
              <span>Keluar</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleSelectRoute('dashboard')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border-2 text-left ${
                activeRoute === 'dashboard'
                  ? 'bg-[#FFF3E0] dark:bg-[#4A2B18] text-black dark:text-white border-[#B45309] dark:border-[#F59E0B]'
                  : 'bg-white dark:bg-[#231811] text-black dark:text-white border-[#D97706]/50 dark:border-[#F59E0B]/40'
              }`}
            >
              <Home className="w-4 h-4 shrink-0 text-[#B45309] dark:text-[#FBBF24]" />
              <span>DASHBOARD</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRoute('bagi-bonus')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border-2 text-left ${
                activeRoute === 'bagi-bonus'
                  ? 'bg-emerald-50 dark:bg-emerald-950/70 text-black dark:text-white border-emerald-600 dark:border-emerald-400'
                  : 'bg-white dark:bg-[#231811] text-black dark:text-white border-emerald-600/50 dark:border-emerald-400/40'
              }`}
            >
              <Gift className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>BAGI BONUS</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRoute('laporan-cs')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border-2 text-left ${
                activeRoute === 'laporan-cs'
                  ? 'bg-sky-50 dark:bg-sky-950/70 text-black dark:text-white border-sky-600 dark:border-sky-400'
                  : 'bg-white dark:bg-[#231811] text-black dark:text-white border-sky-600/50 dark:border-sky-400/40'
              }`}
            >
              <FileText className="w-4 h-4 shrink-0 text-sky-600 dark:text-sky-400" />
              <span>LAPORAN CS</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRoute('wd-auto-flop')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border-2 text-left ${
                activeRoute === 'wd-auto-flop'
                  ? 'bg-orange-50 dark:bg-orange-950/70 text-black dark:text-white border-orange-600 dark:border-orange-400'
                  : 'bg-white dark:bg-[#231811] text-black dark:text-white border-orange-600/50 dark:border-orange-400/40'
              }`}
            >
              <LayoutList className="w-4 h-4 shrink-0 text-orange-600 dark:text-orange-400" />
              <span>WD AUTO FLOP</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRoute('edit-pembayaran')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border-2 text-left ${
                activeRoute === 'edit-pembayaran'
                  ? 'bg-teal-50 dark:bg-teal-950/70 text-black dark:text-white border-teal-600 dark:border-teal-400'
                  : 'bg-white dark:bg-[#231811] text-black dark:text-white border-teal-600/50 dark:border-teal-400/40'
              }`}
            >
              <CreditCard className="w-4 h-4 shrink-0 text-teal-600 dark:text-teal-400" />
              <span>EDITING</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRoute('validasi')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border-2 border-dashed text-left ${
                activeRoute === 'validasi'
                  ? 'bg-indigo-50 dark:bg-indigo-950/70 text-black dark:text-white border-indigo-600 dark:border-indigo-400'
                  : 'bg-white dark:bg-[#231811] text-black dark:text-white border-indigo-600/50 dark:border-indigo-400/45'
              }`}
            >
              <CheckSquare className="w-4 h-4 shrink-0 text-indigo-600 dark:text-indigo-400" />
              <span>VALIDASI REKENING</span>
            </button>

            <button
              type="button"
              onClick={() => handleSelectRoute('cek-nawala')}
              className={`flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-xs font-extrabold border-2 border-dashed text-left sm:col-span-2 ${
                activeRoute === 'cek-nawala'
                  ? 'bg-fuchsia-50 dark:bg-fuchsia-950/70 text-black dark:text-white border-fuchsia-600 dark:border-fuchsia-400'
                  : 'bg-white dark:bg-[#231811] text-black dark:text-white border-fuchsia-600/50 dark:border-fuchsia-400/45'
              }`}
            >
              <Globe className="w-4 h-4 shrink-0 text-fuchsia-600 dark:text-fuchsia-400" />
              <span>CEK NAWALA</span>
            </button>
          </div>

          {/* Mobile Section: CARI SELISIH */}
          <div className="rounded-xl bg-white dark:bg-[#211711] border border-[#D4C4AE] dark:border-[#C59656]/55 p-2.5">
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

          {/* Mobile Section: ISI REKAPAN */}
          <div className="rounded-xl bg-white dark:bg-[#211711] border border-[#D4C4AE] dark:border-[#C59656]/55 p-2.5">
            <div className="px-2 pb-1.5 text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
              ISI REKAPAN
            </div>
            <div className="space-y-1">
              {ISI_REKAPAN_ITEMS.map((item) => (
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
