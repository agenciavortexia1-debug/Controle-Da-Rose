import React, { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Sale, SaleType, PRODUCTS } from '../types.ts';

interface SalesFormProps {
  onAddSale: (sale: Sale) => void;
  onClose: () => void;
  initialData?: {
    clientName: string;
    productName: string;
  } | null;
}

export const SalesForm: React.FC<SalesFormProps> = ({ onAddSale, onClose, initialData }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    productName: '',
    amount: '',
    cost: '',
    freight: '',
    commissionRate: '10', // Default 10%
    date: new Date().toISOString().split('T')[0],
    saleType: 'Instagram' as SaleType,
    adCost: '',
    discount: '',
  });

  // Load initial data if provided (from Leads)
  useEffect(() => {
    if (initialData) {
      const selectedProduct = PRODUCTS.find(p => p.name === initialData.productName);
      setFormData(prev => ({
        ...prev,
        clientName: initialData.clientName,
        productName: initialData.productName,
        amount: selectedProduct ? selectedProduct.price.toString() : prev.amount
      }));
    }
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    // Auto-fill amount (Valor Venda) when product changes
    if (name === 'productName') {
      const selectedProduct = PRODUCTS.find(p => p.name === value);
      if (selectedProduct) {
        setFormData(prev => ({
          ...prev,
          productName: value,
          amount: selectedProduct.price.toString()
        }));
        return;
      }
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const showCommission = formData.saleType !== 'Trafego Pago' && formData.saleType !== 'Instagram';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formData.amount);
    const costVal = parseFloat(formData.cost) || 0;
    const freightVal = parseFloat(formData.freight) || 0;
    const discountVal = parseFloat(formData.discount) || 0;
    
    // Only apply commission if the field is visible (i.e. not Traffic or Instagram)
    const rateVal = showCommission ? parseFloat(formData.commissionRate) : 0;
    
    const adCostVal = formData.saleType === 'Trafego Pago' ? (parseFloat(formData.adCost) || 0) : 0;
    
    const newSale: Sale = {
      id: crypto.randomUUID(),
      clientName: formData.clientName,
      productName: formData.productName,
      amount: amountVal,
      cost: costVal,
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

  // Calculations for preview
  const amountVal = parseFloat(formData.amount || '0');
  // Logic for preview must match logic for submit
  const commissionVal = showCommission ? amountVal * (parseFloat(formData.commissionRate || '0') / 100) : 0;
  
  const costVal = parseFloat(formData.cost || '0');
  const freightVal = parseFloat(formData.freight || '0');
  const discountVal = parseFloat(formData.discount || '0');
  const adCostVal = formData.saleType === 'Trafego Pago' ? (parseFloat(formData.adCost || '0')) : 0;
  
  // Lucro Liquido = Valor Venda - Desconto - Comissao - Custo Prod - Frete - Ads
  const netProfit = amountVal - discountVal - commissionVal - costVal - freightVal - adCostVal;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4 transition-all">
      <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800">Nova Venda</h2>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Cliente</label>
            <input
              required
              name="clientName"
              type="text"
              placeholder="Nome do cliente"
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
              value={formData.clientName}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Produto</label>
                <select
                  required
                  name="productName"
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base appearance-none"
                  value={formData.productName}
                  onChange={handleChange}
                >
                  <option value="" disabled>Selecione um produto</option>
                  {PRODUCTS.map(p => (
                    <option key={p.name} value={p.name}>{p.name}</option>
                  ))}
                  <option value="Outro">Outro</option>
                </select>
                {formData.productName === 'Outro' && (
                  <input 
                    type="text" 
                    placeholder="Nome do produto"
                    className="mt-2 w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] outline-none"
                    onChange={(e) => setFormData(prev => ({...prev, productName: e.target.value}))}
                  />
                )}
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Data</label>
                <input
                required
                name="date"
                type="date"
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
                value={formData.date}
                onChange={handleChange}
                />
            </div>
             <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Venda</label>
                <select
                    name="saleType"
                    className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
                    value={formData.saleType}
                    onChange={handleChange}
                >
                    <option value="Instagram">Instagram</option>
                    <option value="Indicacao">Indicação</option>
                    <option value="Trafego Pago">Tráfego Pago</option>
                </select>
            </div>
          </div>

          {formData.saleType === 'Trafego Pago' && (
            <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Custo por Venda (Ads)</label>
                <input
                    name="adCost"
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    className="w-full px-4 py-3 bg-purple-50 text-gray-900 border border-purple-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
                    value={formData.adCost}
                    onChange={handleChange}
                />
            </div>
          )}

          <div className={`grid ${showCommission ? 'grid-cols-2' : 'grid-cols-1'} gap-4`}>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Valor Venda (R$)</label>
              <input
                required
                name="amount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
                value={formData.amount}
                onChange={handleChange}
              />
            </div>
            
            {showCommission && (
              <div className="animate-fade-in">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Comissão (%)</label>
                <input
                  required
                  name="commissionRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="10"
                  className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
                  value={formData.commissionRate}
                  onChange={handleChange}
                />
              </div>
            )}
          </div>

           <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Custo Prod. (R$)</label>
              <input
                name="cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
                value={formData.cost}
                onChange={handleChange}
              />
            </div>
             <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Desconto (R$)</label>
              <input
                name="discount"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-red-50 text-gray-900 border border-red-200 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent outline-none transition text-base"
                value={formData.discount}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Frete (R$)</label>
              <input
                name="freight"
                type="number"
                min="0"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
                value={formData.freight}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="bg-[#fdf4fa] p-4 rounded-xl space-y-2 text-[#920074]">
             {discountVal > 0 && (
                 <div className="flex justify-between items-center text-sm text-red-600/80">
                    <span>Desconto:</span>
                    <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(discountVal)}</span>
                </div>
             )}
             {showCommission && (
               <div className="flex justify-between items-center text-sm">
                  <span>Comissão Prevista:</span>
                  <span className="font-semibold">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(commissionVal)}
                  </span>
               </div>
             )}
             {formData.saleType === 'Trafego Pago' && (
                <div className="flex justify-between items-center text-sm text-red-600/80">
                    <span>Custo Ads:</span>
                    <span>- {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(adCostVal)}</span>
                </div>
             )}
             <div className="flex justify-between items-center border-t border-[#f5d0ed] pt-2">
                <span className="font-bold">Lucro Líquido Estimado:</span>
                <span className="font-bold text-lg text-green-700">
                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(netProfit)}
                </span>
             </div>
          </div>

          <div className="pt-2">
            <button
                type="submit"
                className="w-full bg-[#920074] hover:bg-[#74005c] active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg transition transform flex items-center justify-center gap-2 text-lg"
            >
                <Plus size={24} />
                Salvar Venda
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};