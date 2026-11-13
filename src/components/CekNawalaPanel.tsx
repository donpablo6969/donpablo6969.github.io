import React, { useState } from 'react';
import {
  CheckCircle2,
  Copy,
  Eraser,
  ExternalLink,
  Globe,
  Loader2,
  Search,
  XCircle,
} from 'lucide-react';

interface CekNawalaPanelProps {
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

interface DomainCheckResult {
  domain: string;
  dnsStatus: 'RESOLVED' | 'NXDOMAIN' | 'ERROR';
  ips: string[];
  latencyMs: number;
  message: string;
}

function normalizeDomain(raw: string): string {
  return raw
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .split('/')[0]
    .split('?')[0]
    .split('#')[0]
    .split(':')[0]
    .toLowerCase();
}

export const CekNawalaPanel: React.FC<CekNawalaPanelProps> = ({ onCopyText }) => {
  const [domainInput, setDomainInput] = useState('');
  const [results, setResults] = useState<DomainCheckResult[]>([]);
  const [isChecking, setIsChecking] = useState(false);

  const handleCheckDomains = async () => {
    const uniqueDomains = Array.from(
      new Set(
        domainInput
          .split('\n')
          .map(normalizeDomain)
          .filter((d) => d.includes('.'))
      )
    );

    if (uniqueDomains.length === 0) {
      setResults([]);
      return;
    }

    setIsChecking(true);
    try {
      const checked = await Promise.all(
        uniqueDomains.map(async (domain): Promise<DomainCheckResult> => {
          const started = performance.now();
          try {
            const res = await fetch(
              `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`
            );
            const latencyMs = Math.round(performance.now() - started);
            if (!res.ok) {
              return {
                domain,
                dnsStatus: 'ERROR',
                ips: [],
                latencyMs,
                message: `HTTP ${res.status}`,
              };
            }
            const data = (await res.json()) as {
              Status?: number;
              Answer?: { type: number; data: string }[];
            };
            const ips = (data.Answer || [])
              .filter((a) => a.type === 1 && a.data)
              .map((a) => a.data);

            if (data.Status === 0 && ips.length > 0) {
              return {
                domain,
                dnsStatus: 'RESOLVED',
                ips,
                latencyMs,
                message: 'DNS Aktif (Record A ditemukan)',
              };
            }
            if (data.Status === 3) {
              return {
                domain,
                dnsStatus: 'NXDOMAIN',
                ips: [],
                latencyMs,
                message: 'Domain tidak terdaftar (NXDOMAIN)',
              };
            }
            return {
              domain,
              dnsStatus: 'ERROR',
              ips,
              latencyMs,
              message: `DNS Status ${data.Status ?? 'Unknown'}`,
            };
          } catch {
            return {
              domain,
              dnsStatus: 'ERROR',
              ips: [],
              latencyMs: Math.round(performance.now() - started),
              message: 'Gagal menghubungi DNS resolver',
            };
          }
        })
      );
      setResults(checked);
    } finally {
      setIsChecking(false);
    }
  };

  const resolvedLinks = results
    .filter((r) => r.dnsStatus === 'RESOLVED')
    .map((r) => `https://${r.domain}`);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <div className="text-[11px] font-extrabold uppercase tracking-wider text-[#4A2B18] dark:text-[#E5B874]">
            PEMERIKSAAN DOMAIN &amp; LINK ALTERNATIF
          </div>
          <h1 className="text-lg sm:text-xl font-extrabold text-black dark:text-white">
            CEK NAWALA &amp; STATUS DNS DOMAIN
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <a
            href="https://trustpositif.komdigi.go.id/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#EAE0D2] hover:bg-[#DFD1BE] dark:bg-[#2C1E16] dark:hover:bg-[#3A281D] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-extrabold whitespace-nowrap"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Buka TrustPositif Komdigi</span>
          </a>

          <button
            type="button"
            onClick={() => {
              if (resolvedLinks.length > 0) {
                onCopyText(resolvedLinks.join('\n'), 'Daftar Link DNS Aktif');
              }
            }}
            disabled={resolvedLinks.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] disabled:opacity-50 dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer whitespace-nowrap"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>Salin Link Aktif ({resolvedLinks.length})</span>
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 p-5 space-y-3">
        <div className="flex items-center justify-between text-xs font-extrabold text-black dark:text-white">
          <span className="inline-flex items-center gap-1.5">
            <Globe className="w-4 h-4 text-[#4A2B18] dark:text-[#E5B874]" />
            <span>Daftar Domain / Link Alternatif (1 domain per baris)</span>
          </span>
          <button
            type="button"
            onClick={() => {
              setDomainInput('');
              setResults([]);
            }}
            className="inline-flex items-center gap-1 text-[11px] font-bold text-[#6E3E20] dark:text-[#E5B874] hover:underline cursor-pointer"
          >
            <Eraser className="w-3 h-3" />
            <span>Bersihkan</span>
          </button>
        </div>

        <textarea
          rows={5}
          value={domainInput}
          onChange={(e) => setDomainInput(e.target.value)}
          placeholder={'Contoh:\ncontoh-domain1.com\nhttps://contoh-domain2.net'}
          className="w-full p-3 rounded-xl bg-[#F8F4EE] dark:bg-[#140D09] text-black dark:text-white border border-[#CBB9A0] dark:border-[#D4A373]/75 text-xs font-mono-tabular focus:outline-none focus:ring-2 focus:ring-[#4A2B18] dark:focus:ring-[#C59656]"
        />

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] text-[#5D4C3E] dark:text-[#D6C7B5]">
            Pengecekan memakai Google Public DNS (DoH) secara langsung untuk memastikan resolusi IP domain, lalu cocokkan pemblokiran ISP lokal pada tautan resmi TrustPositif.
          </p>

          <button
            type="button"
            onClick={handleCheckDomains}
            disabled={isChecking || !domainInput.trim()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#4A2B18] hover:bg-[#361F11] disabled:opacity-50 dark:bg-[#C59656] dark:hover:bg-[#B58342] text-white dark:text-[#140D09] text-xs font-extrabold cursor-pointer whitespace-nowrap"
          >
            {isChecking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
            <span>{isChecking ? 'Memeriksa...' : 'Cek DNS Domain'}</span>
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="rounded-2xl bg-white dark:bg-[#1F150F] border border-[#D4C4AE] dark:border-[#C59656]/60 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-[#F4EDE3] dark:bg-[#291C14] border-b border-[#DFD1BE] dark:border-[#C59656]/60 text-[11px] font-extrabold tracking-wider uppercase text-[#3D322B] dark:text-[#D6C7B5]">
                  <th className="py-3 px-4">DOMAIN</th>
                  <th className="py-3 px-4">STATUS DNS</th>
                  <th className="py-3 px-4">IP ADDRESS</th>
                  <th className="py-3 px-4 text-right">LATENSI</th>
                  <th className="py-3 px-4">KETERANGAN</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EAE0D2] dark:divide-[#C59656]/30 text-xs">
                {results.map((r) => (
                  <tr
                    key={r.domain}
                    className="hover:bg-[#F9F5EF] dark:hover:bg-[#261A12]"
                  >
                    <td className="py-3 px-4 font-mono-tabular font-extrabold text-black dark:text-white">
                      {r.domain}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      {r.dnsStatus === 'RESOLVED' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#E4F4EC] text-[#0E603A] dark:bg-[#143B27] dark:text-[#7CE8AD]">
                          <CheckCircle2 className="w-3 h-3" /> {r.dnsStatus}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-[#FBE7EB] text-[#9F1239] dark:bg-[#3E1621] dark:text-[#FDA4AF]">
                          <XCircle className="w-3 h-3" /> {r.dnsStatus}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono-tabular text-[#2E241E] dark:text-[#E2D6C8]">
                      {r.ips.length > 0 ? r.ips.join(', ') : '-'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono-tabular text-[#5D4C3E] dark:text-[#D6C7B5]">
                      {r.latencyMs} ms
                    </td>
                    <td className="py-3 px-4 text-[#3D322B] dark:text-[#D6C7B5]">
                      {r.message}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
