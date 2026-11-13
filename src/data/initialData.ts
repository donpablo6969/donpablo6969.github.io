import {
  BankChannel,
  CashierMutationItem,
  MemberLookupRecord,
  WdQueueItem,
} from '../types';

export const INITIAL_WD_QUEUE: WdQueueItem[] = [
  {
    id: 'WD711-98214',
    time: '12:51:20',
    userId: 'bocahgacor88',
    accountName: 'BAMBANG SUTEDJO',
    bank: 'BCA',
    accountNumber: '5220391823',
    amount: 350000,
    status: 'FLOP SUKSES',
  },
  {
    id: 'WD711-98215',
    time: '12:51:42',
    userId: 'hoki_selalu77',
    accountName: 'AHMAD FAUZI',
    bank: 'MANDIRI',
    accountNumber: '1370019284719',
    amount: 150000,
    status: 'FLOP SUKSES',
  },
  {
    id: 'WD711-98216',
    time: '12:52:05',
    userId: 'sultan_toto99',
    accountName: 'DEDI SURYADI',
    bank: 'BRI',
    accountNumber: '012901928471502',
    amount: 450000,
    status: 'WAITING',
  },
  {
    id: 'WD711-98217',
    time: '12:50:11',
    userId: 'zeus_mania69',
    accountName: 'RIAN FIRMANSYAH',
    bank: 'BCA',
    accountNumber: '8220192841',
    amount: 8500000,
    status: 'MANUAL',
    note: 'Nominal > Rp 5.000.000 wajib verifikasi CS Senior',
  },
  {
    id: 'WD711-98218',
    time: '12:52:14',
    userId: 'mahjong_queen',
    accountName: 'SITI NURHALIZA',
    bank: 'DANA',
    accountNumber: '081392817401',
    amount: 280000,
    status: 'WAITING',
  },
  {
    id: 'WD711-98219',
    time: '12:53:02',
    userId: 'koko_parlay88',
    accountName: 'HENDRA WIJAYA',
    bank: 'BNI',
    accountNumber: '0844192837',
    amount: 750000,
    status: 'WAITING',
  },
];

export const INITIAL_BANK_CHANNELS: BankChannel[] = [
  {
    id: 'my-bca',
    bankName: 'MY - BCA',
    accountNumber: '3801435031',
    holderName: 'PT HS SINAR MAKMUR',
    status: 'ONLINE',
    minDeposit: 20000,
    maxDeposit: 100000000,
  },
  {
    id: 'bca-mobile',
    bankName: 'BCA MOBILE',
    accountNumber: '8220918731',
    holderName: 'HARTANTO',
    status: 'ONLINE',
    minDeposit: 20000,
    maxDeposit: 100000000,
  },
  {
    id: 'bni-mobile',
    bankName: 'BNI MOBILE',
    accountNumber: '1189029384',
    holderName: 'HS GROUP 711',
    status: 'ONLINE',
    minDeposit: 25000,
    maxDeposit: 50000000,
  },
  {
    id: 'bni-wonder',
    bankName: 'BNI WONDER',
    accountNumber: '1961474652',
    holderName: 'HS GROUP DIGITAL',
    status: 'ONLINE',
    minDeposit: 25000,
    maxDeposit: 50000000,
  },
  {
    id: 'brimo',
    bankName: 'BRIMO',
    accountNumber: '034101002938501',
    holderName: 'HS DIGITAL JAYA',
    status: 'ONLINE',
    minDeposit: 20000,
    maxDeposit: 50000000,
  },
  {
    id: 'mandiri-livin',
    bankName: 'MANDIRI LIVIN',
    accountNumber: '1420019283741',
    holderName: 'HS GROUP UTAMA',
    status: 'ONLINE',
    minDeposit: 20000,
    maxDeposit: 100000000,
  },
];

export const INITIAL_CASHIER_MUTATIONS: CashierMutationItem[] = [
  {
    id: 'DP711-44101',
    time: '12:49:18',
    type: 'DP',
    userId: 'bocahgacor88',
    bank: 'BCA',
    senderName: 'BAMBANG SUTEDJO',
    accountNumber: '5220391823',
    amount: 250000,
    status: 'PENDING',
    note: 'Mutasi masuk m-BCA terdeteksi, cek nominal unik',
  },
  {
    id: 'DP711-44102',
    time: '12:50:44',
    type: 'DP',
    userId: 'zeus_mania69',
    bank: 'MANDIRI',
    senderName: 'RIAN FIRMANSYAH',
    accountNumber: '1370088192011',
    amount: 1000000,
    status: 'PENDING',
    note: 'Transfer Livin Mandiri via BI-FAST',
  },
  {
    id: 'WD711-98217',
    time: '12:50:11',
    type: 'WD',
    userId: 'zeus_mania69',
    bank: 'BCA',
    senderName: 'RIAN FIRMANSYAH',
    accountNumber: '8220192841',
    amount: 8500000,
    status: 'HOLD',
    note: 'Menunggu konfirmasi bukti TO Sportbooks',
  },
  {
    id: 'DP711-44103',
    time: '12:44:05',
    type: 'DP',
    userId: 'hoki_selalu77',
    bank: 'BRI',
    senderName: 'AHMAD FAUZI',
    accountNumber: '0129011829301',
    amount: 150000,
    status: 'VERIFIED',
    note: 'Sudah diproses kasir shift siang',
  },
  {
    id: 'WD711-98216',
    time: '12:52:05',
    type: 'WD',
    userId: 'sultan_toto99',
    bank: 'BRI',
    senderName: 'DEDI SURYADI',
    accountNumber: '012901928471502',
    amount: 450000,
    status: 'PENDING',
    note: 'Antrian reguler kasir',
  },
];

export const MEMBER_DIRECTORY: MemberLookupRecord[] = [
  {
    userId: 'bocahgacor88',
    fullName: 'BAMBANG SUTEDJO',
    bank: 'BCA',
    accountNumber: '5220391823',
    balance: 1420500,
    lastDp: 'Rp 250.000 (12:49)',
    lastWd: 'Rp 350.000 (12:51)',
    tier: 'VIP Gold',
  },
  {
    userId: 'zeus_mania69',
    fullName: 'RIAN FIRMANSYAH',
    bank: 'BCA',
    accountNumber: '8220192841',
    balance: 9850000,
    lastDp: 'Rp 1.000.000 (12:50)',
    lastWd: 'Rp 8.500.000 (Pending)',
    tier: 'VIP Platinum',
  },
  {
    userId: 'hoki_selalu77',
    fullName: 'AHMAD FAUZI',
    bank: 'MANDIRI',
    accountNumber: '1370019284719',
    balance: 315000,
    lastDp: 'Rp 150.000 (12:44)',
    lastWd: 'Rp 150.000 (12:51)',
    tier: 'Reguler',
  },
  {
    userId: 'sultan_toto99',
    fullName: 'DEDI SURYADI',
    bank: 'BRI',
    accountNumber: '012901928471502',
    balance: 680000,
    lastDp: 'Rp 500.000 (11:18)',
    lastWd: 'Rp 450.000 (Waiting)',
    tier: 'VIP Silver',
  },
  {
    userId: 'mahjong_queen',
    fullName: 'SITI NURHALIZA',
    bank: 'DANA',
    accountNumber: '081392817401',
    balance: 495000,
    lastDp: 'Rp 100.000 (12:10)',
    lastWd: 'Rp 280.000 (Waiting)',
    tier: 'Reguler',
  },
];

export const SAMPLE_ADMIN_ROWS = `bocahgacor88 | 350000 | BCA | 12:51
hoki_selalu77 | 150000 | MANDIRI | 12:51
sultan_toto99 | 450000 | BRI | 12:52
zeus_mania69 | 8500000 | BCA | 12:50
mahjong_queen | 280000 | DANA | 12:52`;

export const SAMPLE_GARUDA_ROWS = `bocahgacor88 | 350000 | BCA | 12:51
hoki_selalu77 | 150000 | MANDIRI | 12:51
sultan_toto99 | 400000 | BRI | 12:52
mahjong_queen | 280000 | DANA | 12:52
koko_parlay88 | 750000 | BNI | 12:53`;

export const SAMPLE_DOCS_ROWS = `bocahgacor88 | 350000 | BCA | 12:51
hoki_selalu77 | 150000 | MANDIRI | 12:51
sultan_toto99 | 450000 | BRI | 12:52
zeus_mania69 | 8000000 | BCA | 12:50
slot_king123 | 120000 | BCA | 12:48`;
