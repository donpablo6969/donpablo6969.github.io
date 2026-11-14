import React, { useEffect, useState } from 'react';
import {
  User,
  signInWithPopup,
  signOut,
} from 'firebase/auth';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  onSnapshot,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from 'firebase/firestore';
import {
  CheckCircle2,
  Copy,
  Edit3,
  Lock,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Unlock,
  X,
} from 'lucide-react';
import {
  OperationType,
  auth,
  db,
  googleProvider,
  handleFirestoreError,
} from '../firebase';

export type ScriptCategory =
  | 'WD FLOP'
  | 'BONUS'
  | 'REKAPAN'
  | 'EDIT FOTO'
  | 'NAWALA'
  | 'UMUM';

interface ProtectedScriptItem {
  id: string;
  ownerId: string;
  title: string;
  category: ScriptCategory;
  content: string;
  isLocked: boolean;
}

interface FirebaseVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  firebaseUser: User | null;
  onCopyText: (text: string, label: string, customToast?: string) => void;
  onSyncBankChannels: () => Promise<void>;
}

const CATEGORIES: ScriptCategory[] = [
  'WD FLOP',
  'BONUS',
  'REKAPAN',
  'EDIT FOTO',
  'NAWALA',
  'UMUM',
];

export const FirebaseVaultModal: React.FC<FirebaseVaultModalProps> = ({
  isOpen,
  onClose,
  firebaseUser,
  onCopyText,
  onSyncBankChannels,
}) => {
  const [scripts, setScripts] = useState<ProtectedScriptItem[]>([]);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<ScriptCategory>('UMUM');
  const [content, setContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !firebaseUser) {
      setScripts([]);
      return;
    }

    const scriptsPath = `users/${firebaseUser.uid}/protectedScripts`;
    const q = query(
      collection(db, scriptsPath),
      where('ownerId', '==', firebaseUser.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snap) => {
        const items: ProtectedScriptItem[] = snap.docs.map((d) => {
          const data = d.data();
          return {
            id: String(data.id || d.id),
            ownerId: String(data.ownerId || firebaseUser.uid),
            title: String(data.title || ''),
            category: (CATEGORIES.includes(data.category)
              ? data.category
              : 'UMUM') as ScriptCategory,
            content: String(data.content || ''),
            isLocked: Boolean(data.isLocked),
          };
        });
        setScripts(items);
        setErrorMsg(null);
      },
      (err) => {
        setErrorMsg('Gagal memuat brankas Firebase. Pastikan akun terverifikasi.');
        handleFirestoreError(err, OperationType.LIST, scriptsPath);
      }
    );

    return () => unsubscribe();
  }, [isOpen, firebaseUser]);

  if (!isOpen) return null;

  const handleGoogleConnect = async () => {
    setBusy(true);
    setErrorMsg(null);
    try {
      const res = await signInWithPopup(auth, googleProvider);
      const user = res.user;
      const profilePath = `users/${user.uid}`;
      const userRef = doc(db, 'users', user.uid);
      const displayName = (user.displayName || user.email || 'Operator').slice(0, 100);
      const email = (user.email || 'unknown@example.com').slice(0, 200);
      try {
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            uid: user.uid,
            displayName,
            email,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        } else {
          await updateDoc(userRef, {
            displayName,
            updatedAt: serverTimestamp(),
          });
        }
      } catch (writeErr) {
        handleFirestoreError(writeErr, OperationType.WRITE, profilePath);
      }
    } catch (err) {
      setErrorMsg(
        err instanceof Error
          ? `Gagal login Google Firebase: ${err.message}`
          : 'Gagal menghubungkan akun Google.'
      );
    } finally {
      setBusy(false);
    }
  };

  const handleSaveScript = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firebaseUser) return;
    const cleanTitle = title.trim().slice(0, 120);
    const cleanContent = content.trim().slice(0, 50000);
    if (!cleanTitle || !cleanContent) {
      setErrorMsg('Judul dan isi script wajib diisi.');
      return;
    }

    setBusy(true);
    setErrorMsg(null);
    const scriptId = editingId || `scr_${Date.now()}`;
    const docPath = `users/${firebaseUser.uid}/protectedScripts/${scriptId}`;

    try {
      if (editingId) {
        await updateDoc(doc(db, 'users', firebaseUser.uid, 'protectedScripts', scriptId), {
          title: cleanTitle,
          category,
          content: cleanContent,
          isLocked: false,
          updatedAt: serverTimestamp(),
        });
      } else {
        await setDoc(doc(db, 'users', firebaseUser.uid, 'protectedScripts', scriptId), {
          id: scriptId,
          ownerId: firebaseUser.uid,
          title: cleanTitle,
          category,
          content: cleanContent,
          isLocked: true,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setTitle('');
      setContent('');
      setCategory('UMUM');
      setEditingId(null);
    } catch (err) {
      setErrorMsg('Gagal menyimpan script ke Firebase.');
      handleFirestoreError(
        err,
        editingId ? OperationType.UPDATE : OperationType.CREATE,
        docPath
      );
    } finally {
      setBusy(false);
    }
  };

  const handleToggleLock = async (item: ProtectedScriptItem) => {
    if (!firebaseUser) return;
    const docPath = `users/${firebaseUser.uid}/protectedScripts/${item.id}`;
    try {
      await updateDoc(doc(db, 'users', firebaseUser.uid, 'protectedScripts', item.id), {
        isLocked: !item.isLocked,
        updatedAt: serverTimestamp(),
      });
    } catch (err) {
      setErrorMsg('Gagal mengubah status kunci script.');
      handleFirestoreError(err, OperationType.UPDATE, docPath);
    }
  };

  const handleDeleteScript = async (item: ProtectedScriptItem) => {
    if (!firebaseUser || item.isLocked) return;
    const docPath = `users/${firebaseUser.uid}/protectedScripts/${item.id}`;
    try {
      await deleteDoc(doc(db, 'users', firebaseUser.uid, 'protectedScripts', item.id));
    } catch (err) {
      setErrorMsg('Gagal menghapus script dari Firebase.');
      handleFirestoreError(err, OperationType.DELETE, docPath);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Brankas Script Firebase"
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4"
    >
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#E5DACB] dark:border-[#C59656]/35 flex items-center justify-between gap-3 bg-[#F4EDE3] dark:bg-[#261A12]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-[#4A2B18] text-white dark:bg-[#C59656] dark:text-[#140D09]">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold text-black dark:text-white">
                BRANKAS SCRIPT &amp; DATA TERPROTEKSI (FIREBASE)
              </h2>
              <p className="text-[11px] text-[#3D322B] dark:text-[#D6C7B5]">
                Script tersimpan privat di Cloud Firestore &amp; dikunci hanya untuk akun pemilik.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Tutup Brankas Firebase"
            className="p-2 rounded-lg bg-white dark:bg-[#1F150F] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 hover:bg-[#EAE0D2] dark:hover:bg-[#2C1E16] cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {!firebaseUser ? (
            <div className="rounded-2xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#C59656]/60 p-6 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-[#4A2B18] dark:bg-[#C59656] text-white dark:text-[#140D09] flex items-center justify-center mx-auto">
                <Lock className="w-6 h-6" />
              </div>
              <div className="space-y-1 max-w-lg mx-auto">
                <h3 className="text-base font-extrabold text-black dark:text-white">
                  Hubungkan Akun Google Pemilik
                </h3>
                <p className="text-xs text-[#3D322B] dark:text-[#D6C7B5] leading-relaxed">
                  Untuk melindungi script &amp; data agar tidak diambil atau disalahgunakan orang lain, Firestore Security Rules hanya mengizinkan akses baca/tulis untuk akun Google terverifikasi milik Anda.
                </p>
              </div>
              <button
                type="button"
                disabled={busy}
                onClick={handleGoogleConnect}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#D4A76A] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer disabled:opacity-50"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{busy ? 'Menghubungkan...' : 'Masuk & Aktifkan Brankas Google'}</span>
              </button>
              {errorMsg && (
                <p className="text-xs font-bold text-[#9F1239] dark:text-[#FDA4AF]">
                  {errorMsg}
                </p>
              )}
            </div>
          ) : (
            <>
              {/* Account Bar */}
              <div className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#C59656]/60 p-3.5 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-[#147D4E] dark:text-[#6EE7A8] shrink-0" />
                  <span className="font-bold text-black dark:text-white">
                    Terhubung: {firebaseUser.email}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      void onSyncBankChannels();
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-extrabold cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Sinkronisasi Rekening CS</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => void signOut(auth)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FBE7EB] hover:bg-[#F7D0D8] dark:bg-[#3E1621] dark:hover:bg-[#521D2B] text-[#9F1239] dark:text-[#FDA4AF] border border-[#F2B8C6] dark:border-[#70263A] text-[11px] font-extrabold cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Putuskan Firebase</span>
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="px-3.5 py-2.5 rounded-xl bg-[#FBE7EB] dark:bg-[#3E1621] border border-[#F2B8C6] dark:border-[#70263A] text-xs font-bold text-[#9F1239] dark:text-[#FDA4AF]">
                  {errorMsg}
                </div>
              )}

              {/* Form Save Protected Script */}
              <form
                onSubmit={handleSaveScript}
                className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#DFD1BE] dark:border-[#C59656]/60 p-4 space-y-3"
              >
                <div className="grid grid-cols-1 sm:grid-cols-[1fr_180px] gap-3">
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Judul Script / Rumus / Catatan Rahasia..."
                    maxLength={120}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-[#1F150F] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
                  />
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as ScriptCategory)}
                    className="px-3 py-2 rounded-xl bg-white dark:bg-[#1F150F] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={50000}
                  placeholder="Tempel isi script, format rahasia, atau konfigurasi penting di sini untuk disimpan ke Firebase..."
                  className="w-full p-3 rounded-xl bg-white dark:bg-[#1F150F] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
                />

                <div className="flex items-center justify-end gap-2">
                  {editingId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setTitle('');
                        setContent('');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white dark:bg-[#1F150F] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-bold cursor-pointer"
                    >
                      Batal Edit
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={busy}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#D4A76A] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{editingId ? 'Simpan Perubahan' : 'Simpan & Kunci di Firebase'}</span>
                  </button>
                </div>
              </form>

              {/* Saved Protected Scripts List */}
              <div className="space-y-2.5">
                <div className="text-xs font-extrabold uppercase tracking-wide text-black dark:text-white">
                  Daftar Script Tersimpan ({scripts.length})
                </div>

                {scripts.length === 0 ? (
                  <div className="py-8 text-center text-xs text-[#3D322B] dark:text-[#D6C7B5] border border-dashed border-[#D4C4AE] dark:border-[#C59656]/50 rounded-xl">
                    Belum ada script tersimpan di brankas Firebase Anda.
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {scripts.map((item) => (
                      <div
                        key={item.id}
                        className="rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] border border-[#D4C4AE] dark:border-[#C59656]/60 p-3.5 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-extrabold text-black dark:text-white">
                              {item.title}
                            </span>
                            <span className="text-[10px] font-bold text-[#6E3E20] dark:text-[#E5B874]">
                              · {item.category}
                            </span>
                            <span
                              className={`text-[10px] font-extrabold ${
                                item.isLocked
                                  ? 'text-[#147D4E] dark:text-[#6EE7A8]'
                                  : 'text-[#B45309] dark:text-[#FBBF24]'
                              }`}
                            >
                              · {item.isLocked ? 'TERKUNCI' : 'TERBUKA'}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onCopyText(item.content, item.title)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F150F] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-extrabold cursor-pointer"
                            >
                              <Copy className="w-3 h-3" />
                              <span>Salin</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => void handleToggleLock(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#EAE0D2] dark:bg-[#2C1E16] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-extrabold cursor-pointer"
                            >
                              {item.isLocked ? (
                                <>
                                  <Unlock className="w-3 h-3" />
                                  <span>Buka Kunci</span>
                                </>
                              ) : (
                                <>
                                  <Lock className="w-3 h-3" />
                                  <span>Kunci</span>
                                </>
                              )}
                            </button>

                            {!item.isLocked && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(item.id);
                                    setTitle(item.title);
                                    setCategory(item.category);
                                    setContent(item.content);
                                  }}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F150F] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-[11px] font-extrabold cursor-pointer"
                                >
                                  <Edit3 className="w-3 h-3" />
                                  <span>Edit</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => void handleDeleteScript(item)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FBE7EB] dark:bg-[#3E1621] text-[#9F1239] dark:text-[#FDA4AF] border border-[#F2B8C6] dark:border-[#70263A] text-[11px] font-extrabold cursor-pointer"
                                >
                                  <Trash2 className="w-3 h-3" />
                                  <span>Hapus</span>
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        <pre className="whitespace-pre-wrap break-words font-mono-tabular text-[11px] text-[#2E241E] dark:text-[#E2D6C8] bg-white dark:bg-[#1F150F] border border-[#E5DACB] dark:border-[#C59656]/35 rounded-lg p-2.5 max-h-36 overflow-y-auto">
                          {item.content}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
