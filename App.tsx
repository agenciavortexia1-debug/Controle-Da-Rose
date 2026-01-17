
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
  Package, 
  Loader2, 
  Home, 
  Wallet,
  Calendar,
  UserPlus,
  RefreshCw,
  ShoppingCart,
  Info,
  Truck,
  ChevronLeft,
  ChevronRight,
  FileText
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Cell, LabelList } from 'recharts';
import { Sale, SalesSummary, Lead, InventoryItem } from './types';
import { SalesForm } from './components/SalesForm';
import { LeadForm } from './components/LeadForm';
import { InventoryForm } from './components/InventoryForm';
import { StatsCard } from './components/StatsCard';
import * as db from './services/db';

const App: React.FC = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isLeadFormOpen, setIsLeadFormOpen] = useState(false);
  const [isInventoryFormOpen, setIsInventoryFormOpen] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'sales' | 'leads' | 'inventory' | 'repurchase'>('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const [salesFormInitialData, setSalesFormInitialData] = useState<{clientName: string, productName: string} | null>(null);
  const [convertingLeadId, setConvertingLeadId] = useState<string | null>(null);
  const [dateFilter, setDateFilter] = useState({ start: '', end: '' });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [salesData, leadsData, inventoryData] = await Promise.all([
        db.getSales(),
        db.getLeads(),
        db.getInventory()
      ]);
      setSales(salesData);
      setLeads(leadsData);
      setInventory(inventoryData);
    } catch (error) {
      console.error("Erro ao carregar dados:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredByDateSales = useMemo(() => {
    return sales.filter(sale => {
      if (!dateFilter.start && !dateFilter.end) return true;
      const saleDate = new Date(sale.date);
      const start = dateFilter.start ? new Date(dateFilter.start) : new Date('2000-01-01');
      const end = dateFilter.end ? new Date(dateFilter.end) : new Date('2099-12-31');
      saleDate.setHours(0,0,0,0);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      return saleDate >= start && saleDate <= end;
    });
  }, [sales, dateFilter]);

  const repurchaseList = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    const lastSalesByClient: Record<string, Sale> = {};
    sales.forEach(sale => {
      if (!lastSalesByClient[sale.clientName] || new Date(sale.date) > new Date(lastSalesByClient[sale.clientName].date)) {
        lastSalesByClient[sale.clientName] = sale;
      }
    });

    return Object.values(lastSalesByClient).filter(sale => {
        const saleDate = new Date(sale.date);
        saleDate.setHours(0,0,0,0);
        const diffDays = Math.ceil(Math.abs(today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24)); 
        return diffDays >= 28;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [sales]);

  const summary: SalesSummary = useMemo(() => {
    return filteredByDateSales.reduce((acc, sale) => {
        const adCost = sale.adCost || 0;
        const discount = sale.discount || 0;
        const freight = sale.freight || 0;
        const netProfit = sale.amount - discount - sale.commissionValue - (sale.cost || 0) - freight - adCost;
        return {
          totalSales: acc.totalSales + sale.amount,
          totalCommission: acc.totalCommission + sale.commissionValue,
          totalNetProfit: acc.totalNetProfit + netProfit,
          totalFreight: acc.totalFreight + freight,
          salesCount: acc.salesCount + 1,
          averageTicket: (acc.totalSales + sale.amount) / (acc.salesCount + 1),
        };
      }, { totalSales: 0, totalCommission: 0, totalNetProfit: 0, totalFreight: 0, salesCount: 0, averageTicket: 0 }
    );
  }, [filteredByDateSales]);

  const chartData = useMemo(() => {
    const data: Record<string, number> = {};
    filteredByDateSales.forEach(sale => {
      data[sale.productName] = (data[sale.productName] || 0) + sale.amount;
    });
    return Object.keys(data)
      .map(name => ({ name, value: data[name] }))
      .sort((a, b) => b.value - a.value);
  }, [filteredByDateSales]);

  const handleAddSale = async (newSale: Sale) => {
    setSales(prev => [newSale, ...prev]);
    await db.addSale(newSale);
    await db.updateStockQuantity(newSale.productName, -1);
    if (convertingLeadId) {
        setLeads(prev => prev.filter(l => l.id !== convertingLeadId));
        await db.deleteLead(convertingLeadId);
        setConvertingLeadId(null);
    }
    loadData();
  };

  const handleAddInventory = async (item: InventoryItem) => {
    const updated = await db.addOrUpdateProduct(item);
    setInventory(updated);
  };

  const handleDeleteProduct = async (id: string) => {
    if(window.confirm('Excluir este produto do estoque?')) {
        const updated = await db.deleteProduct(id);
        setInventory(updated);
    }
  };

  const handleConvertLead = (lead: Lead) => {
    setConvertingLeadId(lead.id);
    setSalesFormInitialData({ clientName: lead.clientName, productName: lead.productInterest || '' });
    setIsFormOpen(true);
  };

  const exportCSV = () => {
    const headers = ["Cliente", "Produto", "Valor Venda", "Desconto", "Comissao", "Custo", "Frete", "Ads", "Data", "Status"];
    const rows = filteredByDateSales.map(s => [
      s.clientName,
      s.productName,
      s.amount.toFixed(2),
      (s.discount || 0).toFixed(2),
      (s.commissionValue || 0).toFixed(2),
      (s.cost || 0).toFixed(2),
      (s.freight || 0).toFixed(2),
      (s.adCost || 0).toFixed(2),
      s.date,
      s.status
    ]);

    let csvContent = "data:text/csv;charset=utf-8," 
      + headers.join(",") + "\n"
      + rows.map(e => e.join(",")).join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Relatorio_Rose_${new Date().toLocaleDateString()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row pb-24 md:pb-0 overflow-hidden">
      {/* Sidebar Desktop */}
      <aside className={`hidden md:flex flex-col bg-slate-900 text-white flex-shrink-0 transition-all duration-300 relative ${sidebarCollapsed ? 'w-20' : 'w-64'}`}>
        <button 
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="absolute -right-3 top-10 bg-[#920074] p-1 rounded-full text-white shadow-lg z-10 hover:scale-110 transition"
        >
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>

        <div className={`p-6 border-b border-slate-800 flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'}`}>
          <div className="bg-[#920074] p-2 rounded-lg flex-shrink-0">
            <LayoutDashboard className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && <span className="text-xl font-bold tracking-tight whitespace-nowrap">Controle Rose</span>}
        </div>

        <nav className="p-4 space-y-2 flex-1">
          <button onClick={() => setActiveTab('dashboard')} title="Dashboard" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'dashboard' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'} ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <TrendingUp size={20} /> {!sidebarCollapsed && <span>Dashboard</span>}
          </button>
          <button onClick={() => setActiveTab('sales')} title="Histórico" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'sales' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'} ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <CreditCard size={20} /> {!sidebarCollapsed && <span>Histórico</span>}
          </button>
          <button onClick={() => setActiveTab('inventory')} title="Estoque" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'inventory' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'} ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Package size={20} /> {!sidebarCollapsed && <span>Estoque</span>}
          </button>
          <button onClick={() => setActiveTab('leads')} title="Pendentes" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'leads' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'} ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <Users size={20} /> {!sidebarCollapsed && <span>Pendentes</span>}
          </button>
          <button onClick={() => setActiveTab('repurchase')} title="Recompra" className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition ${activeTab === 'repurchase' ? 'bg-slate-800 text-[#f5d0ed]' : 'text-slate-400 hover:text-white'} ${sidebarCollapsed ? 'justify-center' : ''}`}>
            <RefreshCw size={20} /> {!sidebarCollapsed && <span>Recompra</span>}
          </button>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto h-screen w-full max-w-7xl mx-auto">
        {/* Header Responsivo */}
        <div className="flex flex-col gap-6 mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                  {activeTab === 'dashboard' ? 'Olá Rose, boas vendas!' : activeTab === 'inventory' ? 'Meu Almoxarifado' : activeTab === 'repurchase' ? 'Hora de Recontato!' : 'Gestão'}
              </h1>
              <p className="text-gray-500 text-sm mt-1">Acompanhe seu desempenho e metas.</p>
            </div>
            
            <div className="flex flex-wrap gap-2 md:self-center">
              <button onClick={exportCSV} className="flex-1 md:flex-none justify-center bg-white text-gray-700 border border-gray-200 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition">
                <FileText size={18} className="text-[#920074]" /> 
                <span className="text-sm">Exportar</span>
              </button>
              
              {activeTab === 'inventory' ? (
                  <button onClick={() => setIsInventoryFormOpen(true)} className="flex-1 md:flex-none justify-center bg-[#920074] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#74005c] transition">
                    <PlusCircle size={18} /> <span className="text-sm">Novo Produto</span>
                  </button>
              ) : activeTab === 'leads' ? (
                  <button onClick={() => setIsLeadFormOpen(true)} className="flex-1 md:flex-none justify-center bg-[#920074] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#74005c] transition">
                    <UserPlus size={18} /> <span className="text-sm">Novo Pendente</span>
                  </button>
              ) : (
                  <button onClick={() => setIsFormOpen(true)} className="flex-1 md:flex-none justify-center bg-[#920074] text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:bg-[#74005c] transition">
                    <PlusCircle size={18} /> <span className="text-sm">Nova Venda</span>
                  </button>
              )}
            </div>
          </div>

          {(activeTab === 'dashboard' || activeTab === 'sales') && (
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                    type="text" 
                    placeholder="Buscar cliente ou produto..." 
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm shadow-sm focus:ring-2 focus:ring-[#920074] outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-2 bg-white p-2 rounded-xl border border-gray-200 shadow-sm overflow-x-auto no-scrollbar whitespace-nowrap">
                 <Calendar size={14} className="text-[#920074] ml-1" />
                 <input 
                     type="date" 
                     value={dateFilter.start} 
                     onChange={(e) => setDateFilter({...dateFilter, start: e.target.value})}
                     className="text-xs bg-transparent outline-none text-gray-900 border-none focus:ring-0 p-0 w-28"
                 />
                 <span className="text-gray-300">até</span>
                 <input 
                     type="date" 
                     value={dateFilter.end} 
                     onChange={(e) => setDateFilter({...dateFilter, end: e.target.value})}
                     className="text-xs bg-transparent outline-none text-gray-900 border-none focus:ring-0 p-0 w-28"
                 />
              </div>
            </div>
          )}
        </div>

        {activeTab === 'dashboard' && (
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3 md:gap-4">
                    <StatsCard title="Líquido" value={formatCurrency(summary.totalNetProfit)} icon={Wallet} colorClass="bg-emerald-100 text-emerald-600" />
                    <StatsCard title="Bruto" value={formatCurrency(summary.totalSales)} icon={DollarSign} colorClass="bg-[#fce7f6] text-[#920074]" />
                    <StatsCard title="Frete" value={formatCurrency(summary.totalFreight)} icon={Truck} colorClass="bg-blue-100 text-blue-600" />
                    <StatsCard title="Ticket" value={formatCurrency(summary.averageTicket)} icon={TrendingUp} colorClass="bg-green-100 text-green-600" />
                    <StatsCard title="Vendas" value={summary.salesCount.toString()} icon={CreditCard} colorClass="bg-orange-100 text-orange-600" />
                    <StatsCard title="Comissões" value={formatCurrency(summary.totalCommission)} icon={Users} colorClass="bg-purple-100 text-purple-600" />
                </div>
                
                <div className="bg-white p-4 md:p-6 rounded-2xl shadow-sm border border-gray-100">
                    <h3 className="text-lg font-bold text-gray-800 mb-10">Ranking de Faturamento por Produto</h3>
                    <div className="h-64 md:h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={chartData} margin={{ top: 20, right: 20, left: 20, bottom: 40 }}>
                                <XAxis 
                                  dataKey="name" 
                                  tick={{fontSize: 9, fill: '#64748b'}} 
                                  axisLine={false} 
                                  tickLine={false} 
                                  interval={0}
                                />
                                <YAxis hide={true} />
                                <Bar dataKey="value" fill="#920074" radius={[6, 6, 0, 0]} barSize={45}>
                                    {chartData.map((_, i) => <Cell key={i} fill={['#920074', '#8B5CF6', '#10B981', '#3B82F6', '#F59E0B'][i % 5]} />)}
                                    <LabelList 
                                      dataKey="value" 
                                      position="top" 
                                      formatter={(val: number) => `R$${val.toFixed(0)}`} 
                                      style={{ fontSize: '11px', fontWeight: 'bold', fill: '#64748b' }}
                                    />
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        )}

        {activeTab === 'inventory' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                    <h3 className="font-bold text-gray-800">Almoxarifado</h3>
                    <div className="text-[10px] md:text-xs text-gray-500 flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
                      <Info size={14} className="text-blue-500" /> Custo médio calculado automaticamente.
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4">Estoque</th>
                                <th className="px-6 py-4">Custo</th>
                                <th className="px-6 py-4">Venda</th>
                                <th className="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {inventory.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{item.productName}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${item.quantity < 5 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                            {item.quantity} un.
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-slate-500 whitespace-nowrap">{formatCurrency(item.costPrice)}</td>
                                    <td className="px-6 py-4 font-bold text-[#920074] whitespace-nowrap">{item.defaultSellPrice ? formatCurrency(item.defaultSellPrice) : '-'}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => handleDeleteProduct(item.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            ))}
                            {inventory.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-20 text-center text-gray-400 italic">Nenhum item cadastrado.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'sales' && (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100">
                    <h3 className="font-bold text-gray-800">Histórico de Movimentações</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-gray-400 text-[10px] uppercase font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Data</th>
                                <th className="px-6 py-4">Cliente</th>
                                <th className="px-6 py-4">Produto</th>
                                <th className="px-6 py-4">Bruto</th>
                                <th className="px-6 py-4">Líquido</th>
                                <th className="px-6 py-4 text-right">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 text-sm">
                            {filteredByDateSales.filter(s => 
                              s.clientName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                              s.productName.toLowerCase().includes(searchTerm.toLowerCase())
                            ).map(sale => {
                                const adCost = sale.adCost || 0;
                                const disc = sale.discount || 0;
                                const profit = sale.amount - disc - sale.commissionValue - (sale.cost || 0) - (sale.freight || 0) - adCost;
                                return (
                                <tr key={sale.id} className="hover:bg-gray-50/50 transition">
                                    <td className="px-6 py-4 text-gray-400 text-[11px] whitespace-nowrap">{new Date(sale.date).toLocaleDateString('pt-BR')}</td>
                                    <td className="px-6 py-4 font-bold text-gray-900 whitespace-nowrap">{sale.clientName}</td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                      <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-bold text-slate-600">{sale.productName}</span>
                                    </td>
                                    <td className="px-6 py-4 font-medium text-gray-600 whitespace-nowrap">{formatCurrency(sale.amount)}</td>
                                    <td className="px-6 py-4 font-black text-emerald-600 whitespace-nowrap">{formatCurrency(profit)}</td>
                                    <td className="px-6 py-4 text-right">
                                        <button onClick={() => db.deleteSale(sale.id).then(loadData)} className="p-2 text-gray-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button>
                                    </td>
                                </tr>
                            )})}
                        </tbody>
                    </table>
                </div>
            </div>
        )}

        {activeTab === 'leads' && (
            <div className="space-y-4">
                <div className="flex items-center gap-3 text-sm text-amber-700 bg-amber-50 p-4 rounded-2xl border border-amber-100">
                  <div className="bg-amber-100 p-2 rounded-lg"><Users size={18} /></div>
                  <p><b>Leads:</b> Clientes que demonstraram interesse, mas ainda não converteram em venda.</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leads.map(lead => (
                        <div key={lead.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow group">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="font-bold text-gray-900 text-lg group-hover:text-[#920074] transition-colors">{lead.clientName}</h4>
                                    <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-1 rounded-full font-black uppercase">Pendente</span>
                                </div>
                                <div className="space-y-3 text-sm">
                                    <div className="flex items-center gap-2 text-gray-600">
                                      <ShoppingCart size={14} className="text-[#920074]" />
                                      <span>Interesse: <b className="text-gray-900">{lead.productInterest}</b></span>
                                    </div>
                                    {lead.phone && <div className="flex items-center gap-2 text-gray-600">
                                      <DollarSign size={14} className="text-emerald-500" />
                                      <span>{lead.phone}</span>
                                    </div>}
                                    {lead.expectedDate && <div className="flex items-center gap-2 text-orange-600 font-bold">
                                      <Calendar size={14} />
                                      <span>Previsão: {new Date(lead.expectedDate).toLocaleDateString('pt-BR')}</span>
                                    </div>}
                                    {lead.notes && <p className="italic text-xs text-gray-400 bg-gray-50 p-3 rounded-xl border border-gray-100 mt-2">"{lead.notes}"</p>}
                                </div>
                            </div>
                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center gap-2">
                                <button onClick={() => handleConvertLead(lead)} className="flex-1 bg-emerald-50 text-emerald-600 px-4 py-2.5 rounded-xl font-bold text-xs hover:bg-emerald-100 flex items-center justify-center gap-1.5 transition">
                                    <ShoppingCart size={16} /> Vender
                                </button>
                                <button onClick={() => db.deleteLead(lead.id).then(loadData)} className="p-2.5 text-gray-300 hover:text-red-500 bg-gray-50 rounded-xl transition-colors"><Trash2 size={18} /></button>
                            </div>
                        </div>
                    ))}
                    {leads.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-400 italic bg-white rounded-2xl border border-dashed border-gray-200">Sem leads pendentes no momento.</div>
                    )}
                </div>
            </div>
        )}

        {activeTab === 'repurchase' && (
            <div className="space-y-6">
                <div className="bg-gradient-to-br from-[#920074] to-[#74005c] p-6 md:p-8 rounded-3xl text-white shadow-xl overflow-hidden relative">
                  <div className="relative z-10">
                    <h3 className="text-xl md:text-2xl font-black mb-2 flex items-center gap-2">
                      <RefreshCw className="animate-spin-slow" size={24} /> Ouro na Mão!
                    </h3>
                    <p className="text-white/80 text-sm md:text-base max-w-lg">
                      Estes clientes compraram há mais de <b>28 dias</b>. Eles já conhecem a qualidade do seu produto, agora é só oferecer de novo!
                    </p>
                  </div>
                  <div className="absolute right-[-20px] bottom-[-20px] opacity-10">
                    <RefreshCw size={150} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {repurchaseList.map(sale => {
                        const today = new Date();
                        const saleDate = new Date(sale.date);
                        const diffDays = Math.ceil(Math.abs(today.getTime() - saleDate.getTime()) / (1000 * 60 * 60 * 24));
                        return (
                            <div key={sale.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:border-[#920074]/30 transition group">
                                <div>
                                    <div className="flex justify-between items-start mb-4">
                                        <h4 className="font-bold text-gray-900 text-lg">{sale.clientName}</h4>
                                        <span className="text-[10px] bg-purple-100 text-[#920074] px-2.5 py-1 rounded-full font-black uppercase">{diffDays} dias</span>
                                    </div>
                                    <div className="space-y-3 text-sm text-gray-500">
                                        <p className="flex items-center gap-2">📦 <b className="text-gray-800">{sale.productName}</b></p>
                                        <p className="flex items-center gap-2">📅 Última compra: <b>{new Date(sale.date).toLocaleDateString('pt-BR')}</b></p>
                                    </div>
                                </div>
                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <button 
                                      onClick={() => {
                                        setSalesFormInitialData({ clientName: sale.clientName, productName: sale.productName });
                                        setIsFormOpen(true);
                                      }}
                                      className="w-full bg-[#920074] text-white px-4 py-3 rounded-xl font-bold text-xs hover:bg-[#74005c] flex items-center justify-center gap-2 shadow-lg transition transform active:scale-[0.98]"
                                    >
                                        <RefreshCw size={16} /> Registrar Recompra
                                    </button>
                                </div>
                            </div>
                        )
                    })}
                    {repurchaseList.length === 0 && (
                        <div className="col-span-full py-20 text-center text-gray-400 italic bg-white rounded-2xl border border-dashed border-gray-200">Nenhum cliente no ciclo de recompra ainda.</div>
                    )}
                </div>
            </div>
        )}
      </main>

      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-lg border-t border-gray-100 flex justify-around items-center px-4 py-3 z-50 shadow-[0_-4px_20px_0_rgba(0,0,0,0.05)]">
        <button onClick={() => setActiveTab('dashboard')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'dashboard' ? 'text-[#920074]' : 'text-gray-400'}`}>
          <Home size={22} />
          <span className="text-[10px] font-bold">Início</span>
        </button>
        <button onClick={() => setActiveTab('sales')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'sales' ? 'text-[#920074]' : 'text-gray-400'}`}>
          <CreditCard size={22} />
          <span className="text-[10px] font-bold">Vendas</span>
        </button>
        <button onClick={() => setActiveTab('inventory')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'inventory' ? 'text-[#920074]' : 'text-gray-400'}`}>
          <Package size={22} />
          <span className="text-[10px] font-bold">Estoque</span>
        </button>
        <button onClick={() => setActiveTab('leads')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'leads' ? 'text-[#920074]' : 'text-gray-400'}`}>
          <Users size={22} />
          <span className="text-[10px] font-bold">Leads</span>
        </button>
        <button onClick={() => setActiveTab('repurchase')} className={`flex flex-col items-center gap-1 transition ${activeTab === 'repurchase' ? 'text-[#920074]' : 'text-gray-400'}`}>
          <RefreshCw size={22} />
          <span className="text-[10px] font-bold">Recompra</span>
        </button>
      </nav>

      {isFormOpen && <SalesForm onAddSale={handleAddSale} inventory={inventory} initialData={salesFormInitialData} onClose={() => { setIsFormOpen(false); setSalesFormInitialData(null); }} />}
      {isLeadFormOpen && <LeadForm onAddLead={(l) => { db.addLead(l).then(loadData); setIsLeadFormOpen(false); }} onClose={() => setIsLeadFormOpen(false)} />}
      {isInventoryFormOpen && <InventoryForm onAdd={handleAddInventory} onClose={() => setIsInventoryFormOpen(false)} />}
    </div>
  );
};

export default App;
