import React, { useState } from 'react';
import { AlertCircle, Eye, EyeOff, Lock, LogIn, Moon, Sun, User } from 'lucide-react';
import { GraffitiMotif } from './GraffitiMotif';

interface LoginGateProps {
  isDark: boolean;
  onToggleTheme: () => void;
  onLoginSuccess: () => void;
}

const VALID_ID = 'donpablo';
const VALID_PASS = '6969';
const LOGIN_IMAGE_SRC =
  './assets/aistudio/8ec91335-cd7f-479e-ba84-1a3e4e825de2_28f32334.png';

export const LoginGate: React.FC<LoginGateProps> = ({
  isDark,
  onToggleTheme,
  onLoginSuccess,
}) => {
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imgFailed, setImgFailed] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const normalizedId = userId.trim().toLowerCase();
    const trimmedPass = password.trim();

    if (!normalizedId || !trimmedPass) {
      setErrorMsg('Harap isi ID dan Password terlebih dahulu.');
      return;
    }

    if (normalizedId === VALID_ID && trimmedPass === VALID_PASS) {
      setErrorMsg(null);
      onLoginSuccess();
    } else {
      setErrorMsg('ID atau Password salah. Periksa kembali akses Anda.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#EFE7DC] dark:bg-[#140D09] text-black dark:text-white transition-colors duration-200 px-4 py-6 sm:px-6 lg:px-8">
      {/* Minimal Top Action: Theme Switch */}
      <div className="w-full max-w-5xl mx-auto flex items-center justify-between gap-4 mb-6">
        <div className="text-sm font-extrabold tracking-tight text-black dark:text-white whitespace-nowrap">
          DON <span className="text-[#6E3E20] dark:text-[#E5B874]">PABLO</span>
        </div>
        <button
          type="button"
          onClick={onToggleTheme}
          aria-label={isDark ? 'Aktifkan Tema Terang' : 'Aktifkan Tema Gelap'}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-white hover:bg-[#EAE0D2] dark:bg-[#241811] dark:hover:bg-[#322218] text-black dark:text-white border border-[#CBB9A0] dark:border-[#4D3627] text-xs font-bold transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          {isDark ? (
            <>
              <Sun className="w-4 h-4 text-[#E5B874]" />
              <span>Tema Terang</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-[#4A2B18]" />
              <span>Tema Gelap</span>
            </>
          )}
        </button>
      </div>

      {/* Main Centered Login Showcase */}
      <main className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-5xl rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#3A281D] shadow-sm overflow-hidden grid grid-cols-1 lg:grid-cols-12 items-stretch">
          {/* Left Showcase: Attached Image */}
          <div className="lg:col-span-6 bg-[#140D09] relative flex flex-col items-center justify-center p-6 sm:p-8 border-b lg:border-b-0 lg:border-r border-[#D4C4AE] dark:border-[#3A281D]">
            <div className="w-full max-w-[360px] aspect-square rounded-2xl overflow-hidden border-2 border-[#C59656] shadow-lg bg-[#1A110C] flex items-center justify-center">
              {!imgFailed ? (
                <img
                  src={LOGIN_IMAGE_SRC}
                  alt="DON PABLO Portal Kerja Operasional"
                  referrerPolicy="no-referrer"
                  onError={() => setImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#2B190E] to-[#140D09] text-[#E5B874] p-6 text-center">
                  <Lock className="w-10 h-10" />
                  <span className="text-lg font-extrabold tracking-wide text-white">
                    DON PABLO
                  </span>
                </div>
              )}
            </div>

            <div className="mt-5 text-center space-y-1.5 flex flex-col items-center">
              <GraffitiMotif isDark={true} size="lg" />
              <p className="text-xs font-semibold text-[#D6C7B5] tracking-wide">
                Portal Kerja Operasional
              </p>
            </div>
          </div>

          {/* Right Form Panel */}
          <div className="lg:col-span-6 p-6 sm:p-10 flex flex-col justify-center">
            <div className="space-y-2 mb-7">
              <p className="text-xs font-extrabold uppercase tracking-wider text-[#6E3E20] dark:text-[#E5B874]">
                PORTAL KERJA OPERASIONAL
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-black dark:text-white">
                Login Akses Dashboard
              </h1>
              <p className="text-sm text-[#3D322B] dark:text-[#D6C7B5]">
                Masukkan ID dan Password operator untuk membuka panel kerja DON PABLO.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label
                  htmlFor="login-id"
                  className="block text-xs font-extrabold uppercase tracking-wide text-black dark:text-white"
                >
                  ID Operator
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-[#6E3E20] dark:text-[#E5B874] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-id"
                    type="text"
                    autoComplete="username"
                    value={userId}
                    onChange={(e) => {
                      setUserId(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Masukkan ID"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white placeholder-[#7A6B5F] dark:placeholder-[#9E8B78] border border-[#CBB9A0] dark:border-[#4D3627] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#D4A373]"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label
                  htmlFor="login-password"
                  className="block text-xs font-extrabold uppercase tracking-wide text-black dark:text-white"
                >
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-[#6E3E20] dark:text-[#E5B874] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errorMsg) setErrorMsg(null);
                    }}
                    placeholder="Masukkan Password"
                    className="w-full pl-10 pr-11 py-2.5 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white placeholder-[#7A6B5F] dark:placeholder-[#9E8B78] border border-[#CBB9A0] dark:border-[#4D3627] text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#D4A373]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Sembunyikan password' : 'Lihat password'}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-lg text-[#4A2B18] dark:text-[#E5B874] hover:bg-[#EAE0D2] dark:hover:bg-[#2C1E16] cursor-pointer"
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div
                  role="alert"
                  className="flex items-center gap-2 rounded-xl bg-[#FBE7EB] dark:bg-[#3E1621] border border-[#F2B8C6] dark:border-[#70263A] px-3.5 py-2.5 text-xs font-bold text-[#9F1239] dark:text-[#FDA4AF]"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] dark:bg-[#C59656] dark:hover:bg-[#D4A76A] text-white dark:text-[#140D09] text-sm font-extrabold tracking-wide transition-colors cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Masuk ke Dashboard</span>
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};
