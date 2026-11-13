export type NavRoute =
  | 'dashboard'
  | 'wd-auto-flop'
  | 'admin-vs-garuda'
  | 'admin-vs-docs'
  | 'bagi-bonus'
  | 'edit-pembayaran'
  | 'rekapan-toto'
  | 'rekapan-wl-sportbooks'
  | 'laporan-cs'
  | 'validasi'
  | 'cek-nawala';

export type WdStatus = 'FLOP SUKSES' | 'WAITING' | 'MANUAL';

export interface WdQueueItem {
  id: string;
  time: string;
  userId: string;
  accountName: string;
  bank: string;
  accountNumber: string;
  amount: number;
  status: WdStatus;
  note?: string;
}

export type BankStatus = 'ONLINE' | 'GANGGUAN' | 'OFFLINE';

export interface BankChannel {
  id: string;
  bankName: string;
  accountNumber: string;
  holderName: string;
  status: BankStatus;
  minDeposit: number;
  maxDeposit: number;
}

export type MutationType = 'DP' | 'WD';
export type MutationStatus = 'PENDING' | 'VERIFIED' | 'HOLD';

export interface CashierMutationItem {
  id: string;
  time: string;
  type: MutationType;
  userId: string;
  bank: string;
  senderName: string;
  accountNumber: string;
  amount: number;
  status: MutationStatus;
  note: string;
}

export interface MemberLookupRecord {
  userId: string;
  fullName: string;
  bank: string;
  accountNumber: string;
  balance: number;
  lastDp: string;
  lastWd: string;
  tier: string;
}
