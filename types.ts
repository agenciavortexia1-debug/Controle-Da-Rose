
export type SaleType = 'Trafego Pago' | 'Indicacao' | 'Instagram';

export interface Sale {
  id: string;
  clientName: string;
  productName: string;
  amount: number;
  cost?: number; // Cost of goods sold
  freight?: number; // Shipping cost
  commissionRate: number; // Percentage
  commissionValue: number;
  date: string;
  status: 'Paid' | 'Pending' | 'Cancelled';
  saleType?: SaleType;
  adCost?: number; // Custo por venda (se Tráfego Pago)
  discount?: number; // Valor do desconto dado
}

export interface Lead {
  id: string;
  clientName: string;
  phone?: string;
  productInterest?: string;
  expectedDate?: string;
  notes?: string;
  createdAt: string;
  status: 'Pending' | 'Contacted' | 'Converted' | 'Lost';
}

export interface SalesSummary {
  totalSales: number;
  totalCommission: number;
  totalNetProfit: number;
  averageTicket: number;
  salesCount: number;
}

export interface InventoryItem {
  productName: string;
  quantity: number;
}

export const PRODUCTS = [
  { name: 'Monjauro', price: 200, isBundle: false },
  { name: 'Monjauro Red', price: 250, isBundle: false },
  { name: 'Seca Barriga', price: 80, isBundle: false },
  { name: 'Detox Power', price: 180, isBundle: false },
  { name: 'Kit Monjauro + Seca Barriga', price: 250, isBundle: true },
];
