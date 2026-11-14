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
    'MAU MALING YAA DEK ? NO NO YAA ..   ///   MAU MALING YAA DEK ? NO NO YAA ..   ///';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Security Warning"
      className="fixed inset-0 z-[9999] h-dvh w-screen bg-[#020A04] text-[#00FF66] overflow-hidden flex flex-col justify-between select-none"
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
      <div className="relative z-10 shrink-0 border-b-2 border-[#00FF66]/60 bg-black/85 py-2 overflow-hidden">
        <div className="animate-hacker-marquee whitespace-nowrap text-[clamp(1rem,min(2.6vw,3.4vh),2.1rem)] leading-[1.15] font-mono-tabular font-black tracking-widest text-[#00FF66]">
          <span className="shrink-0 px-5">{marqueeText}</span>
          <span className="shrink-0 px-5">{marqueeText}</span>
        </div>
      </div>

      {/* Center Giant Hacker Warning Card (fits comfortably at 100% zoom) */}
      <div className="relative z-10 flex-1 min-h-0 overflow-y-auto flex items-center justify-center px-3 py-2 sm:px-6 sm:py-3">
        <div className="w-full max-w-4xl my-auto rounded-2xl border-2 border-[#00FF66] bg-black/85 backdrop-blur-sm px-4 py-4 sm:px-8 sm:py-5 text-center shadow-[0_0_50px_rgba(0,255,102,0.28)] space-y-2.5 sm:space-y-3.5">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-lg border border-[#FF3B5C] bg-[#FF3B5C]/15 text-[#FF5C7A] text-[11px] sm:text-xs font-mono-tabular font-extrabold tracking-widest uppercase">
            <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
            <span>SECURITY ALERT // VIEW-SOURCE DIBLOKIR</span>
          </div>

          <div className="space-y-1 sm:space-y-1.5">
            <h1 className="animate-hacker-glitch text-[clamp(1.5rem,min(4.4vw,6.2vh),3.5rem)] font-mono-tabular font-black tracking-tight text-[#00FF66] leading-[1.08]">
              MAU MALING YAA DEK ?
            </h1>
            <p className="text-[clamp(1.25rem,min(3.4vw,4.8vh),2.6rem)] font-mono-tabular font-black tracking-widest text-[#FF3B5C] leading-[1.08]">
              NO NO YAA ..
            </p>
          </div>

          <div className="max-w-xl mx-auto rounded-xl border border-[#00FF66]/45 bg-[#041409] px-5 py-3 text-center font-mono-tabular text-xs sm:text-sm font-extrabold tracking-wider text-[#86EFAC] space-y-1">
            <div className="text-[#00FF66]">LEBIH CREATIF YAA DEK</div>
            <div>JANGAN CUMA NGINTIP BISANYA</div>
            <div>BELAJAR LAGI SANA</div>
            <div className="pt-1.5 text-[11px] sm:text-xs text-[#00FF66] tracking-widest">
              CREATED BY : DON PABLO
            </div>
          </div>

          <div className="pt-1">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 px-5 py-2 sm:py-2.5 rounded-xl border-2 border-[#00FF66] bg-[#00FF66]/15 hover:bg-[#00FF66] text-[#00FF66] hover:text-black font-mono-tabular text-xs sm:text-sm font-black tracking-wider transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
              <span>TUTUP PERINGATAN [ESC]</span>
            </button>
          </div>
        </div>
      </div>

      {/* Bottom Reverse Running Hacker Marquee */}
      <div className="relative z-10 shrink-0 border-t-2 border-[#FF3B5C]/65 bg-black/85 py-2 overflow-hidden">
        <div className="animate-hacker-marquee-reverse whitespace-nowrap text-[clamp(1rem,min(2.6vw,3.4vh),2.1rem)] leading-[1.15] font-mono-tabular font-black tracking-widest text-[#FF3B5C]">
          <span className="shrink-0 px-5">{marqueeText}</span>
          <span className="shrink-0 px-5">{marqueeText}</span>
        </div>
      </div>
    </div>
  );
};
