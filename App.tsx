import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  PlusCircle, 
  TrendingUp, 
  DollarSign, 
  Users, 
  CreditCard, 
  Search, 
  Trash2, 
  Download, 
  Filter, 
  Package, 
  Database, 
  Loader2, 
  Plus, 
  Home, 
  FileText, 
  Wallet,
  Calendar,
  UserPlus,
  Clock,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  ShoppingCart
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, Cell } from 'recharts';
import { Sale, SalesSummary, Lead, InventoryItem, PRODUCTS } from './types';
import { SalesForm } from './components/SalesForm';
import { LeadForm } from './components/LeadForm';
import { StatsCard } from './components/StatsCard';
import * as db from './services/db';

const App: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'leads' | 'inventory' | 'repurchase'>('dashboard');

  // Input state for adding stock
  const [stockInput, setStockInput] = useState<Record<string, string>>({});

  // Form pre-fill data for creating sale from lead
  const [salesFormInitialData, setSalesFormInitialData] = useState<{clientName: string, productName: string} | null>(null);
  
  // Track which lead is being converted to remove it later
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);

  // Date Filter State
  const [dateFilter, setDateFilter] = useState({
    start: '',
    end: ''
  });

  // Load data on mount
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    const salesData = await db.getSales();
    const leadsData = await db.getLeads();
    const inventoryData = await db.getInventory();
    setSales(salesData);
    setLeads(leadsData);
    setInventory(inventoryData);
    setLoading(false);
  };

  // Filter Sales based on Date Range
  const filteredByDateSales = useMemo(() => {
    return sales.filter(sale => {
      if (!dateFilter.start && !dateFilter.end) return true;
      const saleDate = new Date(sale.date);
      const start = dateFilter.start ? new Date(dateFilter.start) : new Date('2000-01-01');
      const end = dateFilter.end ? new Date(dateFilter.end) : new Date('2099-12-31');
      // Normalize to compare only dates not times
      saleDate.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      
      return saleDate >= start && saleDate <= end;
    });
  }, [sales, dateFilter]);

  // Identify sales ready for repurchase (28 days or older)
  const repurchaseList = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);

    return sales.filter(sale => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0,0,0,0);
        
        const diffTime = Math.abs(today.getTime() - saleDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
        
        // Show if 28 days or more have passed
        return diffDays >= 28;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales]);

  // Summary Calculations (Based on Filtered Data)
  const summary: SalesSummary = useMemo(() => {
    return filteredByDateSales.reduce(
      (acc, sale) => {
        const adCost = sale.adCost || 0;
        const discount = sale.discount || 0;
        // Net profit calculation subtracts discount
        const netProfit = sale.amount - discount - sale.commissionValue - (sale.cost || 0) - (sale.freight || 0) - adCost;
        return {
          totalSales: acc.totalSales + sale.amount,
          totalCommission: acc.totalCommission + sale.commissionValue,
          totalNetProfit: acc.totalNetProfit + netProfit,
          salesCount: acc.salesCount + 1,
          averageTicket: (acc.totalSales + sale.amount) / (acc.salesCount + 1),
        };
      },
      { totalSales: 0, totalCommission: 0, totalNetProfit: 0, salesCount: 0, averageTicket: 0 }
    );
  }, [filteredByDateSales]);

  // Chart Data Preparation (Sales per Product - Filtered)
  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredByDateSales.forEach(sale => {
      data[sale.productName] = (data[sale.productName] || 0) + sale.amount;
    });
    return Object.keys(data).map(name => ({ name, value: data[name] }));
  }, [filteredByDateSales]);

  const handleAddSale = async (newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);
    await db.addSale(newSale);
    
    // Automatically deduct from stock
    // Special logic for Kit Monjauro + Seca Barriga
    if (newSale.productName === 'Kit Monjauro + Seca Barriga') {
       await db.updateStock('Monjauro', -1);
       await db.updateStock('Seca Barriga', -1);
    } else {
       await db.updateStock(newSale.productName, -1);
    }

    // Lead Conversion Logic:
    // If this sale came from a lead, remove the lead from the list
    if (convertingLeadId) {
        setLeads(prev => prev.filter(l => l.id !== convertingLeadId));
        await db.deleteLead(convertingLeadId);
        setConvertingLeadId(null); // Reset
    }
    
    // Refresh inventory to show new levels
    const updatedInventory = await db.getInventory();
    setInventory(updatedInventory);
    
    loadData(); // Ensure everything is synced
  };

  const handleAddLead = async (newLead: Lead) => {
    setLeads(prev => [newLead, ...prev]);
    await db.addLead(newLead);
  };

  const handleConvertLead = (lead: Lead) => {
    setConvertingLeadId(lead.id);
    setSalesFormInitialData({
      clientName: lead.clientName,
      productName: lead.productInterest || ''
    });
    setIsFormOpen(true);
  };

  const handleDeleteSale = async (id: string) => {
    if(window.confirm('Tem certeza que deseja excluir esta venda?')) {
        // Optional: Could revert stock here, but simple logic for now
        setSales(prev => prev.filter(s => s.id !== id));
        await db.deleteSale(id);
    }
  };

  const handleDeleteLead = async (id: string) => {
    if(window.confirm('Excluir cliente pendente?')) {
      setLeads(prev => prev.filter(l => l.id !== id));
      await db.deleteLead(id);
    }
  };

  const handleUpdateStock = async (productName: string, amount: number) => {
      const updated = await db.updateStock(productName, amount);
      setInventory(updated);
      setStockInput(prev => ({...prev, [productName]: ''}));
  };

  const handleDownloadReport = () => {
    const headers = ['ID', 'Cliente', 'Produto', 'Data', 'Tipo', 'Valor Venda', 'Desconto', 'Custo Prod', 'Frete', 'Ads Cost', 'Comissão (%)', 'Comissão (R$)', 'Lucro Líquido', 'Status'];
    const csvContent = [
      headers.join(','),
      ...filteredByDateSales.map(sale => {
        const adCost = sale.adCost || 0;
        const discount = sale.discount || 0;
        const netProfit = sale.amount - discount - sale.commissionValue - (sale.cost || 0) - (sale.freight || 0) - adCost;
        return [
          sale.id,
          `"${sale.clientName}"`,
          `"${sale.productName}"`,
          sale.date,
          sale.saleType || 'N/A',
          sale.amount.toFixed(2),
          discount.toFixed(2),
          (sale.cost || 0).toFixed(2),
          (sale.freight || 0).toFixed(2),
          adCost.toFixed(2),
          sale.commissionRate.toFixed(2),
          sale.commissionValue.toFixed(2),
          netProfit.toFixed(2),
          sale.status
        ].join(',')
      })
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `relatorio_vendas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredSalesList = filteredByDateSales.filter(sale => 
    sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.productName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredLeadsList = leads.filter(lead => 
    lead.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (loading && sales.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-2 text-[#920074]">
          <Loader2 className="w-8 h-8 animate-spin" />
          <span className="font-medium text-sm">Carregando Controle Da Rose...</span>
        </div>
      </div>
    );
  }

  const getPageTitle = () => {
      switch(activeTab) {
          case 'dashboard': return 'Olá Rose, vamos vender?';
          case 'sales': return 'Vendas Realizadas';
          case 'inventory': return 'Controle de Estoque';
          case 'leads': return 'Clientes Pendentes';
          case 'repurchase': return 'Oportunidades de Recompra';
          default: return '';
      }
  }

  const getPageSubtitle = () => {
    switch(activeTab) {
        case 'dashboard': return 'Visão geral de desempenho';
        case 'sales': return 'Gestão completa de histórico';
        case 'inventory': return 'Gerencie a quantidade de produtos';
        case 'leads': return 'Próximos clientes a comprar';
        case 'repurchase': return 'Clientes que compraram há 28 dias ou mais';
        default: return '';
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-24 md:pb-0">
      {/* Desktop Sidebar */}
      <aside className="hidden md:block w-64 bg-slate-900 text-white flex-shrink-0 min-h-screen">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="bg-[#920074] p-2 rounded-lg">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight">Controle Da Rose</span>
        </div>
        <nav className="p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('dashboard')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${activeTab === 'dashboard' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'}`}
          >
            <TrendingUp size={20} /> Dashboard
          </button>
          <button 
            onClick={() => setActiveTab('sales')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${activeTab === 'sales' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'}`}
          >
            <CreditCard size={20} /> Histórico
          </button>
          <button 
            onClick={() => setActiveTab('repurchase')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${activeTab === 'repurchase' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'}`}
          >
            <RefreshCw size={20} /> Recompra
          </button>
           <button 
            onClick={() => setActiveTab('inventory')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${activeTab === 'inventory' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'}`}
          >
            <Package size={20} /> Estoque
          </button>
          <button 
            onClick={() => setActiveTab('leads')} 
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition font-medium ${activeTab === 'leads' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'}`}
          >
            <Users size={20} /> Pendentes
          </button>
          <button onClick={handleDownloadReport} className="w-full flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-slate-800 hover:text-white rounded-lg transition">
            <Download size={20} /> Relatório CSV
          </button>
        </nav>
      </aside>

      {/* Mobile Header */}
      <header className="md:hidden bg-white px-4 py-4 border-b border-gray-100 sticky top-0 z-30 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2">
          <div className="bg-[#920074] p-1.5 rounded-lg">
            <LayoutDashboard className="w-5 h-5 text-white" />
          </div>
          <span className="text-lg font-bold text-slate-800">Controle Da Rose</span>
        </div>
        <button onClick={handleDownloadReport} className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center text-gray-600 hover:bg-gray-200">
            <Download size={16} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
                {getPageTitle()}
            </h1>
            <p className="text-gray-500">
                {getPageSubtitle()}
            </p>
          </div>
          <div className="flex flex-wrap gap-2 items-center">
             {/* Filter Section */}
             {(activeTab === 'dashboard' || activeTab === 'sales') && (
                 <div className="flex items-center gap-2 bg-white p-1.5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-1 px-2 border-r border-gray-200">
                        <Calendar size={14} className="text-gray-400" />
                        <span className="text-xs font-medium text-gray-500">Filtro</span>
                    </div>
                    <input 
                        type="date" 
                        value={dateFilter.start} 
                        onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                        className="text-xs bg-transparent outline-none text-gray-600 w-24 md:w-auto"
                    />
                    <span className="text-gray-300">-</span>
                    <input 
                        type="date" 
                        value={dateFilter.end} 
                        onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                        className="text-xs bg-transparent outline-none text-gray-600 w-24 md:w-auto"
                    />
                    {(dateFilter.start || dateFilter.end) && (
                        <button onClick={() => setDateFilter({start: '', end: ''})} className="text-red-500 hover:bg-red-50 p-1 rounded">
                            <Trash2 size={12} />
                        </button>
                    )}
                 </div>
             )}

            <button 
                onClick={() => {
                  setSalesFormInitialData(null);
                  setConvertingLeadId(null);
                  setIsFormOpen(true);
                }}
                className="bg-[#920074] hover:bg-[#74005c] text-white px-5 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg transition-all hover:scale-105"
            >
                <PlusCircle size={20} /> Venda
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        {activeTab === 'dashboard' && (
            <div className="space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 md:gap-6">
                <StatsCard 
                    title="Lucro Líquido" 
                    value={formatCurrency(summary.totalNetProfit)} 
                    icon={Wallet} 
                    colorClass="text-emerald-600 bg-emerald-100"
                    trend="Desc. Custos + Ads + Descontos"
                />
                <StatsCard 
                    title="Vendas Brutas" 
                    value={formatCurrency(summary.totalSales)} 
                    icon={DollarSign} 
                    colorClass="text-[#920074] bg-[#fce7f6]"
                />
                <StatsCard 
                    title="Comissões Pagas" 
                    value={formatCurrency(summary.totalCommission)} 
                    icon={Users} 
                    colorClass="text-purple-600 bg-purple-100" 
                />
                <StatsCard 
                    title="Ticket Médio" 
                    value={formatCurrency(summary.averageTicket)} 
                    icon={TrendingUp} 
                    colorClass="text-green-600 bg-green-100" 
                />
                <StatsCard 
                    title="Qtd. Vendas" 
                    value={summary.salesCount.toString()} 
                    icon={CreditCard} 
                    colorClass="text-orange-600 bg-orange-100" 
                />
                </div>

                {/* Chart Section */}
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-4">Vendas por Produto</h3>
                    {filteredByDateSales.length > 0 ? (
                    <div className="h-56 md:h-64 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dy={10} interval={0} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} tickFormatter={(value) => `R$${value/1000}k`} />
                            <RechartsTooltip 
                            cursor={{fill: '#F3F4F6'}}
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                            />
                            <Bar dataKey="value" fill="#920074" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={['#920074', '#8B5CF6', '#10B981', '#F59E0B'][index % 4]} />
                            ))}
                            </Bar>
                        </BarChart>
                        </ResponsiveContainer>
                    </div>
                    ) : (
                    <div className="h-40 w-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                        <p className="text-sm">Sem dados neste período</p>
                    </div>
                    )}
                </div>
            </div>
        )}

        {/* Sales List */}
        {(activeTab === 'sales') && (
            <div className={`space-y-4 animate-fade-in`}>
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                    <h3 className="text-lg font-bold text-gray-800 w-full md:w-auto">Histórico</h3>
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Buscar venda..." 
                            className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-xl text-sm w-full focus:ring-2 focus:ring-[#920074] focus:outline-none"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-left">
                    <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                        <tr>
                        <th className="px-6 py-4">Cliente</th>
                        <th className="px-6 py-4">Produto</th>
                        <th className="px-6 py-4">Tipo</th>
                        <th className="px-6 py-4">Valor</th>
                        <th className="px-6 py-4">Comissão</th>
                        <th className="px-6 py-4">Lucro Líq.</th>
                        <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {filteredSalesList.map((sale) => {
                             const adCost = sale.adCost || 0;
                             const discount = sale.discount || 0;
                             const netProfit = sale.amount - discount - sale.commissionValue - (sale.cost || 0) - (sale.freight || 0) - adCost;
                             return (
                            <tr key={sale.id} className="hover:bg-gray-50 transition">
                                <td className="px-6 py-4">
                                    <div className="font-medium text-gray-900">{sale.clientName}</div>
                                    <div className="text-xs text-gray-400">{new Date(sale.date).toLocaleDateString('pt-BR')}</div>
                                </td>
                                <td className="px-6 py-4 text-gray-600">
                                    <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium w-fit">
                                        {sale.productName}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-xs text-gray-500">
                                    {sale.saleType || '-'}
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900">
                                    {formatCurrency(sale.amount)}
                                    {discount > 0 && <div className="text-xs text-red-400">-{formatCurrency(discount)}</div>}
                                </td>
                                <td className="px-6 py-4 text-green-600 font-medium">
                                    {formatCurrency(sale.commissionValue)} 
                                </td>
                                <td className="px-6 py-4 text-gray-700 font-medium">
                                    {formatCurrency(netProfit)}
                                </td>
                                <td className="px-6 py-4 text-right">
                                <button 
                                    onClick={() => handleDeleteSale(sale.id)}
                                    className="text-gray-400 hover:text-red-500 transition"
                                >
                                    <Trash2 size={18} />
                                </button>
                                </td>
                            </tr>
                        )})}
                    </tbody>
                    </table>
                </div>

                {/* Mobile Card List */}
                <div className="md:hidden bg-gray-50 p-3 space-y-3">
                    {filteredSalesList.map((sale) => {
                         const adCost = sale.adCost || 0;
                         const discount = sale.discount || 0;
                         const netProfit = sale.amount - discount - sale.commissionValue - (sale.cost || 0) - (sale.freight || 0) - adCost;
                        return (
                        <div key={sale.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 relative">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <h4 className="font-bold text-gray-900">{sale.clientName}</h4>
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded mt-1 inline-block">{sale.productName}</span>
                                </div>
                                {sale.saleType && (
                                    <span className="text-[10px] bg-purple-50 text-purple-700 px-2 py-1 rounded border border-purple-100">
                                        {sale.saleType}
                                    </span>
                                )}
                            </div>
                            
                            <div className="flex justify-between items-end mt-4">
                                <div>
                                    <p className="text-xs text-gray-400 mb-0.5">{new Date(sale.date).toLocaleDateString('pt-BR')}</p>
                                    <p className="text-sm font-semibold text-gray-900">Venda: {formatCurrency(sale.amount)}</p>
                                    
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {sale.adCost && sale.adCost > 0 && (
                                             <span className="text-[10px] bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-100">
                                                Ads: {formatCurrency(sale.adCost)}
                                            </span>
                                        )}
                                        {discount > 0 && (
                                             <span className="text-[10px] bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded border border-orange-100">
                                                Desc: -{formatCurrency(discount)}
                                            </span>
                                        )}
                                        {netProfit > 0 && (
                                             <span className="text-[10px] bg-green-50 text-green-700 px-1.5 py-0.5 rounded border border-green-100">
                                                Líq: {formatCurrency(netProfit)}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-xs text-gray-400 mb-0.5">Comissão</p>
                                    <p className="text-lg font-bold text-green-600">{formatCurrency(sale.commissionValue)}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleDeleteSale(sale.id)}
                                className="absolute top-4 right-2 p-2 text-gray-300 hover:text-red-500"
                            >
                                <Trash2 size={16} />
                            </button>
                        </div>
                    )})}
                    {filteredSalesList.length === 0 && (
                        <div className="text-center py-10 text-gray-400">
                            <p>Nenhuma venda encontrada</p>
                        </div>
                    )}
                </div>
                </div>
            </div>
        )}

        {/* REPURCHASE TAB (NEW) */}
        {activeTab === 'repurchase' && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-100">
                         <h3 className="text-lg font-bold text-gray-800">Prontos para Recompra</h3>
                         <p className="text-sm text-gray-500">Clientes que compraram há 28 dias ou mais.</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                             <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Cliente</th>
                                    <th className="px-6 py-4">Última Compra</th>
                                    <th className="px-6 py-4">Produto</th>
                                    <th className="px-6 py-4">Tempo Decorrido</th>
                                    <th className="px-6 py-4">Ação</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {repurchaseList.map((sale) => {
                                    const saleDate = new Date(sale.date);
                                    const diffDays = Math.ceil(Math.abs(new Date().getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
                                    
                                    return (
                                    <tr key={sale.id} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {sale.clientName}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {saleDate.toLocaleDateString('pt-BR')}
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-1 bg-gray-100 rounded text-xs text-gray-600 font-medium">
                                                {sale.productName}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-orange-600 font-semibold">
                                            {diffDays} dias
                                        </td>
                                        <td className="px-6 py-4">
                                            <button 
                                                onClick={() => {
                                                     setSalesFormInitialData({
                                                        clientName: sale.clientName,
                                                        productName: sale.productName
                                                     });
                                                     setIsFormOpen(true);
                                                }}
                                                className="text-[#920074] hover:bg-purple-50 px-3 py-1.5 rounded-lg border border-[#920074] text-xs font-bold transition flex items-center gap-1"
                                            >
                                                <RefreshCw size={14} /> Ofertar Novamente
                                            </button>
                                        </td>
                                    </tr>
                                )})}
                            </tbody>
                        </table>
                        {repurchaseList.length === 0 && (
                            <div className="text-center py-12 text-gray-400">
                                <p>Nenhum cliente para recompra no momento.</p>
                            </div>
                        )}
                    </div>
                </div>
                
                {/* Mobile View for Repurchase */}
                <div className="md:hidden space-y-3">
                     {repurchaseList.map((sale) => {
                         const saleDate = new Date(sale.date);
                         const diffDays = Math.ceil(Math.abs(new Date().getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
                         return (
                             <div key={sale.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                                 <div className="flex justify-between items-start">
                                     <h3 className="font-bold text-gray-900">{sale.clientName}</h3>
                                     <span className="text-xs bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full font-bold">
                                         {diffDays} dias
                                     </span>
                                 </div>
                                 <p className="text-sm text-gray-600 mt-1">Comprou: {sale.productName}</p>
                                 <p className="text-xs text-gray-400 mb-3">{saleDate.toLocaleDateString('pt-BR')}</p>
                                 <button 
                                     onClick={() => {
                                          setSalesFormInitialData({
                                            clientName: sale.clientName,
                                            productName: sale.productName
                                          });
                                          setIsFormOpen(true);
                                     }}
                                     className="w-full py-2 border border-[#920074] text-[#920074] rounded-lg font-bold text-sm flex items-center justify-center gap-2 active:bg-purple-50"
                                 >
                                     <RefreshCw size={16} /> Ofertar Novamente
                                 </button>
                             </div>
                         )
                     })}
                </div>
             </div>
        )}

        {/* INVENTORY TAB */}
        {activeTab === 'inventory' && (
             <div className="space-y-6 animate-fade-in">
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 md:p-6 border-b border-gray-100">
                         <h3 className="text-lg font-bold text-gray-800">Estoque de Produtos</h3>
                         <p className="text-sm text-gray-500">Gerencie a entrada de produtos. A saída é automática a cada venda.</p>
                    </div>
                    
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                             <thead className="bg-gray-50 text-gray-600 text-xs uppercase tracking-wider font-semibold">
                                <tr>
                                    <th className="px-6 py-4">Produto</th>
                                    <th className="px-6 py-4 text-center">Em Estoque</th>
                                    <th className="px-6 py-4">Adicionar Estoque</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {inventory
                                    // Filter out bundles from inventory view
                                    .filter(item => !PRODUCTS.find(p => p.name === item.productName)?.isBundle)
                                    .map((item, index) => (
                                    <tr key={item.productName} className="hover:bg-gray-50 transition">
                                        <td className="px-6 py-4 font-medium text-gray-900">
                                            {item.productName}
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${
                                                item.quantity <= 5 ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                                            }`}>
                                                {item.quantity}
                                            </span>
                                            {item.quantity <= 5 && <div className="text-[10px] text-red-500 mt-1">Estoque Baixo</div>}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <input 
                                                    type="number" 
                                                    min="1"
                                                    placeholder="Qtd"
                                                    className="w-20 px-3 py-2 bg-white text-gray-900 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-[#920074] focus:outline-none"
                                                    value={stockInput[item.productName] || ''}
                                                    onChange={(e) => setStockInput(prev => ({...prev, [item.productName]: e.target.value}))}
                                                />
                                                <button 
                                                    onClick={() => {
                                                        const val = parseInt(stockInput[item.productName]);
                                                        if (val > 0) handleUpdateStock(item.productName, val);
                                                    }}
                                                    className="bg-[#920074] text-white p-2 rounded-lg hover:bg-[#74005c] transition"
                                                    disabled={!stockInput[item.productName]}
                                                >
                                                    <Plus size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
             </div>
        )}

        {/* LEADS TAB */}
        {activeTab === 'leads' && (
             <div className="space-y-4 animate-fade-in">
                <div className="flex justify-end">
                    <button 
                        onClick={() => setIsLeadFormOpen(true)}
                        className="bg-[#920074] hover:bg-[#74005c] text-white px-4 py-2 rounded-lg font-medium flex items-center gap-2 shadow transition-all text-sm"
                    >
                        <UserPlus size={18} /> Novo Cliente
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLeadsList.map(lead => (
                        <div key={lead.id} className="bg-white p-5 rounded-xl shadow-sm border border-gray-100 flex flex-col justify-between relative">
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-gray-900 text-lg">{lead.clientName}</h3>
                                    <span className="text-[10px] bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded-full uppercase font-bold tracking-wide">
                                        Pendente
                                    </span>
                                </div>
                                <div className="mt-3 space-y-2 text-sm text-gray-600">
                                    {lead.phone && <p className="flex items-center gap-2">📞 {lead.phone}</p>}
                                    {lead.productInterest && <p className="flex items-center gap-2">🛍️ Interesse: <span className="font-medium text-[#920074]">{lead.productInterest}</span></p>}
                                    {lead.expectedDate && (
                                        <p className="flex items-center gap-2 text-orange-600 font-medium">
                                            <Clock size={14} /> Previsto: {new Date(lead.expectedDate).toLocaleDateString('pt-BR')}
                                        </p>
                                    )}
                                    {lead.notes && (
                                        <div className="bg-gray-50 p-2 rounded text-xs italic text-gray-500 mt-2 border border-gray-100">
                                            "{lead.notes}"
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-between items-center">
                                <button 
                                    onClick={() => handleConvertLead(lead)}
                                    className="text-green-600 hover:bg-green-50 px-3 py-1 rounded text-sm font-semibold transition flex items-center gap-1"
                                >
                                    <ShoppingCart size={14} /> Vender
                                </button>
                                <button 
                                    onClick={() => handleDeleteLead(lead.id)}
                                    className="text-gray-400 hover:text-red-500 text-xs flex items-center gap-1 transition"
                                >
                                    <Trash2 size={14} /> Remover
                                </button>
                            </div>
                        </div>
                    ))}
                    {filteredLeadsList.length === 0 && (
                        <div className="col-span-full text-center py-10">
                            <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                                <Users className="text-gray-400" size={32} />
                            </div>
                            <h3 className="text-gray-500 font-medium">Nenhum cliente pendente</h3>
                            <p className="text-gray-400 text-sm mt-1">Cadastre clientes que demonstraram interesse para não perder a venda.</p>
                        </div>
                    )}
                </div>
             </div>
        )}
      </main>

      {/* Floating Action Button (Mobile) - Changes based on tab */}
      <button 
        onClick={() => {
            if (activeTab === 'leads') {
                setIsLeadFormOpen(true);
            } else {
                setSalesFormInitialData(null);
                setConvertingLeadId(null);
                setIsFormOpen(true);
            }
        }}
        className="md:hidden fixed right-4 bottom-20 bg-[#920074] text-white p-4 rounded-full shadow-lg shadow-[#920074]/30 z-40 active:scale-95 transition-transform"
      >
        {activeTab === 'leads' ? <UserPlus size={24} /> : <Plus size={24} />}
      </button>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 w-full bg-white border-t border-gray-200 flex justify-around items-center py-2 z-40 pb-safe">
        <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center p-2 rounded-lg transition ${activeTab === 'dashboard' ? 'text-[#920074]' : 'text-gray-400'}`}
        >
            <Home size={24} strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Início</span>
        </button>
        <button 
            onClick={() => setActiveTab('sales')}
            className={`flex flex-col items-center p-2 rounded-lg transition ${activeTab === 'sales' ? 'text-[#920074]' : 'text-gray-400'}`}
        >
            <CreditCard size={24} strokeWidth={activeTab === 'sales' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Vendas</span>
        </button>
        <button 
            onClick={() => setActiveTab('repurchase')}
            className={`flex flex-col items-center p-2 rounded-lg transition ${activeTab === 'repurchase' ? 'text-[#920074]' : 'text-gray-400'}`}
        >
            <RefreshCw size={24} strokeWidth={activeTab === 'repurchase' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Recompra</span>
        </button>
        <button 
            onClick={() => setActiveTab('inventory')}
            className={`flex flex-col items-center p-2 rounded-lg transition ${activeTab === 'inventory' ? 'text-[#920074]' : 'text-gray-400'}`}
        >
            <Package size={24} strokeWidth={activeTab === 'inventory' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Estoque</span>
        </button>
        <button 
            onClick={() => setActiveTab('leads')}
            className={`flex flex-col items-center p-2 rounded-lg transition ${activeTab === 'leads' ? 'text-[#920074]' : 'text-gray-400'}`}
        >
            <Users size={24} strokeWidth={activeTab === 'leads' ? 2.5 : 2} />
            <span className="text-[10px] font-medium mt-1">Pendentes</span>
        </button>
      </div>

      {/* Modal Sales Form */}
      {isFormOpen && (
        <SalesForm 
            onAddSale={handleAddSale} 
            onClose={() => {
                setIsFormOpen(false);
                setConvertingLeadId(null);
                setSalesFormInitialData(null);
            }}
            initialData={salesFormInitialData}
        />
      )}

      {/* Modal Lead Form */}
      {isLeadFormOpen && (
        <LeadForm 
            onAddLead={handleAddLead} 
            onClose={() => setIsLeadFormOpen(false)} 
        />
      )}
    </div>
  );
};

export default App;