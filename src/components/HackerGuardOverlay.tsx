import React, { useEffect, useRef } from 'react';
import { ShieldAlert, X } from 'lucide-react';

interface HackerGuardOverlayProps {
  onClose: () => void;
}

export const HackerGuardOverlay: React.FC<HackerGuardOverlayProps> = ({ onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId = 0;
    const chars = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%@&*<>/{}[]=+';
    const fontSize = 18;
    let columns = 0;
    let drops: number[] = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      columns = Math.ceil(canvas.width / fontSize);
      drops = Array.from({ length: columns }, () => Math.floor(Math.random() * -30));
    };

    resize();
    window.addEventListener('resize', resize);

    let frame = 0;
    const draw = () => {
      frame += 1;
      if (frame % 2 === 0) {
        ctx.fillStyle = 'rgba(2, 10, 4, 0.14)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        ctx.font = `700 ${fontSize}px "JetBrains Mono", monospace`;
        for (let i = 0; i < drops.length; i++) {
          const text = chars[Math.floor(Math.random() * chars.length)];
          const y = drops[i] * fontSize;
          ctx.fillStyle = drops[i] * fontSize > canvas.height * 0.7 ? '#A7F3D0' : '#00FF66';
          ctx.fillText(text, i * fontSize, y);

          if (y > canvas.height && Math.random() > 0.97) {
            drops[i] = 0;
          }
          drops[i] += 1;
        }
      }
      animId = window.requestAnimationFrame(draw);
    };

    animId = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(animId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const marqueeText =
    'MAU MALING YAA DEK ? NO NO YAA ..   ///   MAU MALING YAA DEK ? NO NO YAA ..   ///   ';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Security Warning"
      className="fixed inset-0 z-[9999] bg-[#020A04] text-[#00FF66] overflow-hidden flex flex-col justify-between select-none"
    >
      {/* Matrix Hacker Rain Canvas */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none opacity-80"
      />

      {/* CRT Scanline Texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.45) 0px, rgba(0,0,0,0.45) 1px, transparent 1px, transparent 3px)',
        }}
      />

      {/* Top Running Hacker Marquee */}
      <div className="relative z-10 border-b-2 border-[#00FF66]/60 bg-black/80 py-3 overflow-hidden">
        <div className="animate-hacker-marquee whitespace-nowrap text-2xl sm:text-4xl lg:text-5xl font-mono-tabular font-black tracking-widest text-[#00FF66]">
          <span className="px-4">{marqueeText}</span>
          <span className="px-4">{marqueeText}</span>
        </div>
      </div>

      {/* Center Giant Hacker Warning Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl rounded-2xl border-2 border-[#00FF66] bg-black/85 backdrop-blur-sm p-6 sm:p-10 text-center shadow-[0_0_50px_rgba(0,255,102,0.28)] space-y-6">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-[#FF3B5C] bg-[#FF3B5C]/15 text-[#FF5C7A] text-xs sm:text-sm font-mono-tabular font-extrabold tracking-widest uppercase">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>SECURITY ALERT // VIEW-SOURCE DIBLOKIR</span>
          </div>

          <div className="space-y-3">
            <h1 className="animate-hacker-glitch text-4xl sm:text-6xl lg:text-7xl xl:text-8xl font-mono-tabular font-black tracking-tight text-[#00FF66] leading-none">
              MAU MALING YAA DEK ?
            </h1>
            <p className="text-3xl sm:text-5xl lg:text-6xl font-mono-tabular font-black tracking-widest text-[#FF3B5C]">
              NO NO YAA ..
            </p>
          </div>

          <div className="max-w-2xl mx-auto rounded-xl border border-[#00FF66]/45 bg-[#041409] px-6 py-4 text-center font-mono-tabular text-sm sm:text-base font-extrabold tracking-wider text-[#86EFAC] space-y-1.5">
            <div className="text-[#00FF66]">LEBIH CREATIF YAA DEK</div>
            <div>JANGAN CUMA NGINTIP BISANYA</div>
            <div>BELAJAR LAGI SANA</div>
            <div className="pt-2 text-xs sm:text-sm text-[#00FF66] tracking-widest">
              CREATED BY : DON PABLO
            </div>
          </div>

          <div className="pt-2">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border-2 border-[#00FF66] bg-[#00FF66]/15 hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-mono-tabular text-xs sm:text-sm font-black tracking-wider transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>TUTUP PERINGATAN [ESC]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Reverse Running Hacker Marquee */}
      <div className="relative z-10 border-t-2 border-[#FF3B5C]/65 bg-black/85 py-3 overflow-hidden">
        <div className="animate-hacker-marquee-reverse whitespace-nowrap text-2xl sm:text-4xl lg:text-5xl font-mono-tabular font-black tracking-widest text-[#FF3B5C]">
          <span className="px-4">{marqueeText}</span>
          <span className="px-4">{marqueeText}</span>
        </div>
      </div>
    </div>
  );
};
