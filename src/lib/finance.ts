export type TransactionType = "CASH_IN" | "CASH_OUT";
export type TransactionStatus = "PENDING" | "APPROVED" | "REJECTED";

export interface FinanceTransaction {
  id: string;
  receiptNumber: string | null;
  type: TransactionType;
  fromEntity: string;
  toEntity: string;
  amount: number;
  description: string;
  transactionDate: string;
  status: TransactionStatus;
  receiptPdfUrl: string | null;
  createdBy: string;
  approvedBy: string | null;
  approvedAt: string | null;
  rejectionReason: string | null;
  createdAt: string;
  creatorName: string | null;
}

export interface MonthlyCashflowItem {
  month: string;
  monthNumber: number;
  cashIn: number;
  cashOut: number;
  net: number;
}

export interface FinanceSummary {
  totalBalance: number;
  periodProfit: number;
  totalCashIn: number;
  totalCashOut: number;
  monthlyCashflow: MonthlyCashflowItem[];
  year: number;
}

export const TX_TYPE_META: Record<
  TransactionType,
  { label: string; badgeClass: string; amountPrefix: string; amountClass: string }
> = {
  CASH_IN: {
    label: "Kas Masuk",
    badgeClass: "border-[#B6E8B8] bg-[#E2FBCE] text-[#076653]",
    amountPrefix: "+",
    amountClass: "text-[#076653]",
  },
  CASH_OUT: {
    label: "Kas Keluar",
    badgeClass: "border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C]",
    amountPrefix: "-",
    amountClass: "text-[#BE123C]",
  },
};

export const TX_STATUS_META: Record<
  TransactionStatus,
  { label: string; className: string }
> = {
  PENDING: {
    label: "Menunggu",
    className: "border-[#FDE68A] bg-[#FEF3C7] text-[#92400E]",
  },
  APPROVED: {
    label: "Disetujui",
    className: "border-[#B6E8B8] bg-[#E2FBCE] text-[#076653]",
  },
  REJECTED: {
    label: "Ditolak",
    className: "border-[#FECACA] bg-[#FEE2E2] text-[#991B1B]",
  },
};

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function triggerBlobDownload(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
