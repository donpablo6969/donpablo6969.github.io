import { useEffect, useState } from 'react';
import { CheckCircle2 } from 'lucide-react';
import { AdminVsGarudaView } from './components/AdminVsGarudaView';
import { CariSelisihView } from './components/CariSelisihView';
import { DashboardHome } from './components/DashboardHome';
import { LoginGate } from './components/LoginGate';
import { ToolsCsViews } from './components/ToolsCsViews';
import { ToolsKasirViews } from './components/ToolsKasirViews';
import { TopNavbar } from './components/TopNavbar';
import { WdAutoFlopView } from './components/WdAutoFlopView';
import {
  INITIAL_BANK_CHANNELS,
  INITIAL_CASHIER_MUTATIONS,
  INITIAL_WD_QUEUE,
  MEMBER_DIRECTORY,
} from './data/initialData';
import {
  BankChannel,
  CashierMutationItem,
  MutationStatus,
  NavRoute,
  WdQueueItem,
} from './types';

export default function App() {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('hs711-theme');
      if (saved === 'dark') return true;
      if (saved === 'light') return false;
    } catch {
      // ignore storage read errors
    }
    return false;
  });

  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem('donpablo-auth') === '1';
    } catch {
      return false;
    }
  });
  const [activeRoute, setActiveRoute] = useState<NavRoute>('dashboard');
  const [wdQueue, setWdQueue] = useState<WdQueueItem[]>(INITIAL_WD_QUEUE);
  const [bankChannels, setBankChannels] = useState<BankChannel[]>(INITIAL_BANK_CHANNELS);
  const [cashierQueue, setCashierQueue] = useState<CashierMutationItem[]>(
    INITIAL_CASHIER_MUTATIONS
  );
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem('hs711-theme', isDark ? 'dark' : 'light');
    } catch {
      // ignore storage write errors
    }
  }, [isDark]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2600);
  };

  const handleCopyText = (text: string, label: string, customToast?: string) => {
    const fallbackCopy = () => {
      try {
        const el = document.createElement('textarea');
        el.value = text;
        el.setAttribute('readonly', '');
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
      } catch {
        // ignore copy errors
      }
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy());
    } else {
      fallbackCopy();
    }
    showToast(customToast || `${label} berhasil disalin ke clipboard`);
  };

  const handleFlopNow = (id: string) => {
    setWdQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, status: 'FLOP SUKSES' } : item))
    );
    showToast(`WD ${id} berhasil dieksekusi (FLOP SUKSES)`);
  };

  const handleUpdateBankChannel = (updated: BankChannel) => {
    setBankChannels((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    showToast(`Saluran ${updated.bankName} diperbarui (${updated.status})`);
  };

  const handleUpdateMutationStatus = (id: string, status: MutationStatus) => {
    setCashierQueue((prev) =>
      prev.map((m) => (m.id === id ? { ...m, status } : m))
    );
    showToast(`Mutasi ${id} diubah menjadi ${status}`);
  };

  const handleLoginSuccess = () => {
    try {
      sessionStorage.setItem('donpablo-auth', '1');
    } catch {
      // ignore storage write errors
    }
    setIsAuthenticated(true);
    setActiveRoute('dashboard');
  };

  const handleLogout = () => {
    try {
      sessionStorage.removeItem('donpablo-auth');
    } catch {
      // ignore storage write errors
    }
    setIsAuthenticated(false);
  };

  if (!isAuthenticated) {
    return (
      <LoginGate
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EFE7DC] dark:bg-[#140D09] text-black dark:text-white transition-colors duration-200">
      <TopNavbar
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onLogout={handleLogout}
      />

      <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeRoute === 'dashboard' && (
          <DashboardHome
            wdQueue={wdQueue}
            bankChannels={bankChannels}
            cashierQueue={cashierQueue}
            memberDirectory={MEMBER_DIRECTORY}
            onNavigate={setActiveRoute}
            onFlopNow={handleFlopNow}
            onCopyText={handleCopyText}
          />
        )}

        {activeRoute === 'wd-auto-flop' && (
          <WdAutoFlopView onCopyText={handleCopyText} />
        )}

        {activeRoute === 'admin-vs-garuda' && (
          <AdminVsGarudaView onCopyText={handleCopyText} />
        )}

        {activeRoute === 'admin-vs-docs' && (
          <CariSelisihView
            key={activeRoute}
            mode="admin-vs-docs"
            onCopyText={handleCopyText}
          />
        )}

        {(activeRoute === 'bagi-bonus' ||
          activeRoute === 'edit-pembayaran' ||
          activeRoute === 'rekapan-toto' ||
          activeRoute === 'rekapan-wl-sportbooks' ||
          activeRoute === 'laporan-cs') && (
          <ToolsCsViews
            route={activeRoute}
            bankChannels={bankChannels}
            onUpdateBankChannel={handleUpdateBankChannel}
            onCopyText={handleCopyText}
          />
        )}

        {(activeRoute === 'info-dp-wd' || activeRoute === 'info-spasi') && (
          <ToolsKasirViews
            route={activeRoute}
            cashierQueue={cashierQueue}
            onUpdateMutationStatus={handleUpdateMutationStatus}
            onCopyText={handleCopyText}
          />
        )}
      </main>

      <footer className="border-t border-[#D4C4AE] dark:border-[#3A281D] bg-white/80 dark:bg-[#1A110C]/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#3D322B] dark:text-[#D6C7B5]">
          <span className="font-bold text-black dark:text-white">
            DON PABLO · Portal Kerja Operasional
          </span>
        </div>
      </footer>

      {/* Non-intrusive Operational Feedback Toast */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl bg-[#3B2214] dark:bg-[#E5B874] text-white dark:text-[#140D09] shadow-lg border border-[#C59656] dark:border-[#4A2B18] text-xs font-extrabold"
        >
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
