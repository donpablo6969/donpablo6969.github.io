import { useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import { CheckCircle2 } from 'lucide-react';
import { AdminVsGarudaView } from './components/AdminVsGarudaView';
import { CariSelisihView } from './components/CariSelisihView';
import { CekNawalaPanel } from './components/CekNawalaPanel';
import { DashboardHome } from './components/DashboardHome';
import { FirebaseVaultModal } from './components/FirebaseVaultModal';
import { HackerGuardOverlay } from './components/HackerGuardOverlay';
import { LoginGate } from './components/LoginGate';
import { ToolsCsViews } from './components/ToolsCsViews';
import { TopNavbar } from './components/TopNavbar';
import { WdAutoFlopView } from './components/WdAutoFlopView';
import { INITIAL_BANK_CHANNELS } from './data/initialData';
import { OperationType, auth, db, handleFirestoreError } from './firebase';
import { BankChannel, BankStatus, NavRoute } from './types';

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
  const [bankChannels, setBankChannels] = useState<BankChannel[]>(INITIAL_BANK_CHANNELS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [cacheResetKey, setCacheResetKey] = useState<number>(0);
  const [showHackerGuard, setShowHackerGuard] = useState<boolean>(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isVaultOpen, setIsVaultOpen] = useState<boolean>(false);
  const [syncedChannelIds, setSyncedChannelIds] = useState<Set<string>>(() => new Set());

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setFirebaseUser(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!firebaseUser || !firebaseUser.emailVerified) {
      setSyncedChannelIds(new Set());
      return;
    }

    const channelsPath = `users/${firebaseUser.uid}/bankChannels`;
    const q = query(
      collection(db, channelsPath),
      where('ownerId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        if (snap.empty) {
          setSyncedChannelIds(new Set());
          return;
        }
        const ids = new Set<string>();
        const loaded: BankChannel[] = snap.docs.map((d) => {
          ids.add(d.id);
          const data = d.data();
          const rawStatus = String(data.status || 'ONLINE');
          const status: BankStatus =
            rawStatus === 'GANGGUAN' || rawStatus === 'OFFLINE' ? rawStatus : 'ONLINE';
          return {
            id: String(data.id || d.id),
            bankName: String(data.bankName || ''),
            accountNumber: String(data.accountNumber || ''),
            holderName: String(data.holderName || ''),
            status,
            minDeposit: typeof data.minDeposit === 'number' ? data.minDeposit : 0,
            maxDeposit: typeof data.maxDeposit === 'number' ? data.maxDeposit : 0,
          };
        });
        setSyncedChannelIds(ids);
        setBankChannels(loaded);
      },
      (err) => {
        handleFirestoreError(err, OperationType.LIST, channelsPath);
      }
    );

    return () => unsubscribe();
  }, [firebaseUser]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault();
        e.stopPropagation();
        setShowHackerGuard(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, []);

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


  const syncSingleBankChannelToFirestore = async (uid: string, ch: BankChannel) => {
    const docPath = `users/${uid}/bankChannels/${ch.id}`;
    const docRef = doc(db, 'users', uid, 'bankChannels', ch.id);
    const updatePayload = {
      bankName: ch.bankName.slice(0, 60),
      accountNumber: ch.accountNumber.slice(0, 40),
      holderName: ch.holderName.slice(0, 100),
      status: ch.status,
      minDeposit: ch.minDeposit,
      maxDeposit: ch.maxDeposit,
      updatedAt: serverTimestamp(),
    };

    try {
      if (syncedChannelIds.has(ch.id)) {
        await updateDoc(docRef, updatePayload);
      } else {
        const snap = await getDoc(docRef);
        if (snap.exists()) {
          await updateDoc(docRef, updatePayload);
        } else {
          await setDoc(docRef, {
            id: ch.id,
            ownerId: uid,
            ...updatePayload,
            createdAt: serverTimestamp(),
          });
        }
      }
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, docPath);
    }
  };

  const syncAllBankChannelsToFirebase = async () => {
    if (!firebaseUser || !firebaseUser.emailVerified) return;
    for (const ch of bankChannels) {
      await syncSingleBankChannelToFirestore(firebaseUser.uid, ch);
    }
    showToast('Rekening CS berhasil disinkronkan ke Firebase');
  };

  const handleUpdateBankChannel = (updated: BankChannel) => {
    setBankChannels((prev) =>
      prev.map((b) => (b.id === updated.id ? updated : b))
    );
    showToast(`Saluran ${updated.bankName} diperbarui (${updated.status})`);
    if (firebaseUser && firebaseUser.emailVerified) {
      void syncSingleBankChannelToFirestore(firebaseUser.uid, updated);
    }
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
    if (auth.currentUser) {
      void signOut(auth);
    }
    setIsAuthenticated(false);
  };

  const handleClearCache = async () => {
    try {
      if (typeof window !== 'undefined' && 'caches' in window) {
        const keys = await window.caches.keys();
        await Promise.all(keys.map((k) => window.caches.delete(k)));
      }
      const themeVal = localStorage.getItem('hs711-theme');
      localStorage.clear();
      if (themeVal) localStorage.setItem('hs711-theme', themeVal);

      const authVal = sessionStorage.getItem('donpablo-auth');
      sessionStorage.clear();
      if (authVal) sessionStorage.setItem('donpablo-auth', authVal);
    } catch {
      // ignore browser storage restrictions
    }
    setCacheResetKey((prev) => prev + 1);
    showToast('Cache dibersihkan & memori aplikasi disegarkan');
  };

  if (!isAuthenticated) {
    return (
      <>
        <LoginGate
          isDark={isDark}
          onToggleTheme={() => setIsDark((prev) => !prev)}
          onLoginSuccess={handleLoginSuccess}
        />
        {showHackerGuard && (
          <HackerGuardOverlay onClose={() => setShowHackerGuard(false)} />
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#EFE7DC] dark:bg-[#140D09] text-black dark:text-white transition-colors duration-200">
      <TopNavbar
        activeRoute={activeRoute}
        onNavigate={setActiveRoute}
        isDark={isDark}
        onToggleTheme={() => setIsDark((prev) => !prev)}
        onClearCache={handleClearCache}
        onLogout={handleLogout}
        firebaseUserEmail={firebaseUser?.email ?? null}
        onOpenVault={() => setIsVaultOpen(true)}
      />

      <main key={cacheResetKey} className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeRoute === 'dashboard' && <DashboardHome />}

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

        {activeRoute === 'cek-nawala' && (
          <CekNawalaPanel onCopyText={handleCopyText} />
        )}
      </main>

      <footer className="border-t border-[#D4C4AE] dark:border-[#C59656]/60 bg-white/80 dark:bg-[#1A110C]/80 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-[1440px] mx-auto flex items-center justify-center text-center text-xs text-[#3D322B] dark:text-[#D6C7B5]">
          <span className="font-bold text-black dark:text-white tracking-wide">
            Created By : DON PABLO | PORTAL BANTUAN KERJA OPERASIONAL HS GROUP
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
      <FirebaseVaultModal
        isOpen={isVaultOpen}
        onClose={() => setIsVaultOpen(false)}
        firebaseUser={firebaseUser}
        onCopyText={handleCopyText}
        onSyncBankChannels={syncAllBankChannelsToFirebase}
      />

      {showHackerGuard && (
        <HackerGuardOverlay onClose={() => setShowHackerGuard(false)} />
      )}
    </div>
  );
}
