
export type SaleType = 'Trafego Pago' | 'Indicacao' | 'Instagram' | 'Pessoal';

export interface Sale {
  id: string;
  clientName: string;
  productName: string;
  amount: number;
  cost?: number; // Total cost for this sale (calculated automatically)
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
  totalFreight: number;
  averageTicket: number;
  salesCount: number;
}

export interface InventoryItem {
  id: string;
  productName: string;
  quantity: number;
  costPrice: number; // Unit cost price calculated: Total Purchase / Quantity
  defaultSellPrice?: number; // Optional default selling price
}
