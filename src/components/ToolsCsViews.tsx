import React from 'react';
import { BankChannel, NavRoute } from '../types';
import { BagiBonusPanel } from './BagiBonusPanel';
import { EditPembayaranPanel } from './EditPembayaranPanel';
import { LaporanCsPanel } from './LaporanCsPanel';
import { RekapanTotoPanel } from './RekapanTotoPanel';
import { RekapanWlSportbooksPanel } from './RekapanWlSportbooksPanel';

interface ToolsCsViewsProps {
  route: Extract<
    NavRoute,
    | 'bagi-bonus'
    | 'edit-pembayaran'
    | 'rekapan-toto'
    | 'rekapan-wl-sportbooks'
    | 'laporan-cs'
  >;
  bankChannels: BankChannel[];
  onUpdateBankChannel: (updated: BankChannel) => void;
  onCopyText: (text: string, label: string, customToast?: string) => void;
}

export const ToolsCsViews: React.FC<ToolsCsViewsProps> = ({
  route,
  bankChannels,
  onUpdateBankChannel,
  onCopyText,
}) => {
  switch (route) {
    case 'bagi-bonus':
      return <BagiBonusPanel onCopyText={onCopyText} />;
    case 'edit-pembayaran':
      return (
        <EditPembayaranPanel
          bankChannels={bankChannels}
          onUpdateBankChannel={onUpdateBankChannel}
          onCopyText={onCopyText}
        />
      );
    case 'rekapan-toto':
      return <RekapanTotoPanel onCopyText={onCopyText} />;
    case 'rekapan-wl-sportbooks':
      return <RekapanWlSportbooksPanel onCopyText={onCopyText} />;
    case 'laporan-cs':
      return <LaporanCsPanel onCopyText={onCopyText} />;
  }
};
