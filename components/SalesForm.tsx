
import React, { useState, useEffect, useMemo } from 'react';
import { X, Info } from 'lucide-react';
import { Sale, SaleType, InventoryItem } from '../types';

interface SalesFormProps {
  onAddSale: (sale: Sale) => void;
  onClose: () => void;
  inventory: InventoryItem[];
  initialData?: {
    clientName: string;
    productName: string;
  } | null;
}

export const SalesForm: React.FC<SalesFormProps> = ({ onAddSale, onClose, inventory, initialData }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    productName: '',
    amount: '',
    freight: '',
    commissionRate: '10',
    date: new Date().toISOString().split('T')[0],
    saleType: 'Instagram' as SaleType,
    adCost: '',
    discount: '',
  });

  useEffect(() => {
    if (initialData) {
      const product = inventory.find(p => p.productName === initialData.productName);
      setFormData(prev => ({
        ...prev,
        clientName: initialData.clientName,
        productName: initialData.productName,
        amount: product?.defaultSellPrice?.toString() || prev.amount
      }));
    }
  }, [initialData, inventory]);

  const autoCost = useMemo(() => {
    const item = inventory.find(i => i.productName === formData.productName);
    return item ? item.costPrice : 0;
  }, [formData.productName, inventory]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    if (name === 'productName') {
      const selectedProduct = inventory.find(p => p.productName === value);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          productName: value,
          amount: selectedProduct.defaultSellPrice?.toString() || ''
        }));
        return;
      }
    }

    if (name === 'saleType' && value === 'Pessoal') {
        setFormData(prev => ({ ...prev, saleType: 'Pessoal', commissionRate: '0' }));
        return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showCommission = formData.saleType !== 'Trafego Pago' && formData.saleType !== 'Instagram' && formData.saleType !== 'Pessoal';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount) || 0;
    const freightVal = parseFloat(formData.freight) || 0;
    const discountVal = parseFloat(formData.discount) || 0;
    const rateVal = showCommission ? parseFloat(formData.commissionRate) : 0;
    const adCostVal = formData.saleType === 'Trafego Pago' ? (parseFloat(formData.adCost) || 0) : 0;
    
    const newSale: Sale = {
      id: crypto.randomUUID(),
      clientName: formData.clientName,
      productName: formData.productName,
      amount: amountVal,
      cost: autoCost,
      freight: freightVal,
      commissionRate: rateVal,
      commissionValue: amountVal * (rateVal / 100),
      date: formData.date,
      status: 'Pending',
      saleType: formData.saleType,
      adCost: adCostVal,
      discount: discountVal,
    };

    onAddSale(newSale);
    onClose();
  };

  const amountVal = parseFloat(formData.amount || '0');
  const commissionVal = showCommission ? amountVal * (parseFloat(formData.commissionRate || '0') / 100) : 0;
  const freightVal = parseFloat(formData.freight || '0');
  const discountVal = parseFloat(formData.discount || '0');
  const adCostVal = formData.saleType === 'Trafego Pago' ? (parseFloat(formData.adCost || '0')) : 0;
  const netProfit = amountVal - discountVal - commissionVal - autoCost - freightVal - adCostVal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4">
      <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-slide-up">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-800">Registrar Venda</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Cliente</label>
            <input
              required
              name="clientName"
              placeholder="Nome do cliente"
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] outline-none"
              value={formData.clientName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Produto em Estoque</label>
            <select
              required
              name="productName"
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] outline-none appearance-none"
              value={formData.productName}
              onChange={handleChange}
            >
              <option value="" disabled>Selecione um produto</option>
              {inventory.map(item => (
                <option key={item.id} value={item.productName}>
                    {item.productName} ({item.quantity} un. em estoque)
                </option>
              ))}
            </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Data</label>
                <input required name="date" type="date" className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl outline-none" value={formData.date} onChange={handleChange} />
            </div>
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Origem</label>
                <select name="saleType" className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl outline-none" value={formData.saleType} onChange={handleChange}>
                    <option value="Instagram">Instagram</option>
                    <option value="Indicacao">Indicação</option>
                    <option value="Trafego Pago">Tráfego Pago</option>
                    <option value="Pessoal">Venda Pessoal</option>
                </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valor Venda (R$)</label>
              <input required name="amount" type="number" step="0.01" className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl outline-none" value={formData.amount} onChange={handleChange} />
            </div>
            {showCommission && (
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Comissão (%)</label>
                <input required name="commissionRate" type="number" step="0.1" className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl outline-none" value={formData.commissionRate} onChange={handleChange} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Desconto (R$)</label>
              <input name="discount" type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-3 bg-red-50 text-gray-900 border border-red-100 rounded-xl outline-none" value={formData.discount} onChange={handleChange} />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Frete (R$)</label>
              <input name="freight" type="number" step="0.01" placeholder="0.00" className="w-full px-4 py-3 bg-blue-50 text-gray-900 border border-blue-100 rounded-xl outline-none" value={formData.freight} onChange={handleChange} />
            </div>
          </div>

          {formData.saleType === 'Trafego Pago' && (
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Custo Ads</label>
                <input name="adCost" type="number" step="0.01" className="w-full px-4 py-3 bg-purple-50 text-gray-900 border border-purple-100 rounded-xl outline-none" value={formData.adCost} onChange={handleChange} />
            </div>
          )}

          <div className="bg-[#fdf4fa] p-4 rounded-xl space-y-2 border border-[#f5d0ed]">
             <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase">
                <Info size={14} /> Detalhamento de Lucro
             </div>
             <div className="flex justify-between text-sm text-gray-600">
                <span>Custo Unitário do Produto:</span>
                <span className="font-bold">{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(autoCost)}</span>
             </div>
             {freightVal > 0 && (
                <div className="flex justify-between text-sm text-gray-600">
                    <span>Frete:</span>
                    <span className="font-bold text-red-400">-{new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(freightVal)}</span>
                </div>
             )}
             <div className="flex justify-between border-t border-purple-100 pt-2 text-lg font-black">
                <span className="text-gray-800">Lucro Líquido:</span>
                <span className={netProfit >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netProfit)}
                </span>
             </div>
          </div>

          <button type="submit" className="w-full bg-[#920074] hover:bg-[#74005c] text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95">
            Finalizar Venda
          </button>
        </form>
      </div>
    </div>
  );
};
