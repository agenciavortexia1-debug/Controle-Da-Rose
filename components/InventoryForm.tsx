
import React, { useState } from 'react';
import { X, Package, Calculator } from 'lucide-react';
import { InventoryItem } from '../types.ts';

interface InventoryFormProps {
  onAdd: (item: InventoryItem) => void;
  onClose: () => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ onAdd, onClose }) => {
  const [formData, setFormData] = useState({
    productName: '',
    quantity: '',
    totalPurchaseValue: '',
    defaultSellPrice: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const qty = parseFloat(formData.quantity) || 0;
  const totalCost = parseFloat(formData.totalPurchaseValue) || 0;
  const unitCost = qty > 0 ? totalCost / qty : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (qty <= 0) return;

    const newItem: InventoryItem = {
      id: crypto.randomUUID(),
      productName: formData.productName,
      quantity: qty,
      costPrice: unitCost,
      defaultSellPrice: parseFloat(formData.defaultSellPrice) || 0
    };

    onAdd(newItem);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4 animate-fade-in">
      <div className="bg-white w-full sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <Package className="text-[#920074]" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Cadastrar Produto</h2>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nome do Produto</label>
            <input
              required
              name="productName"
              placeholder="Ex: Monjauro Red"
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] outline-none"
              value={formData.productName}
              onChange={handleChange}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Qtd. Comprada</label>
              <input
                required
                name="quantity"
                type="number"
                min="1"
                placeholder="0"
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] outline-none"
                value={formData.quantity}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Valor Total Pago (R$)</label>
              <input
                required
                name="totalPurchaseValue"
                type="number"
                step="0.01"
                placeholder="0.00"
                className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] outline-none"
                value={formData.totalPurchaseValue}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 flex items-center justify-between">
             <div className="flex items-center gap-2 text-[#920074]">
                <Calculator size={20} />
                <span className="text-sm font-bold uppercase">Custo Unitário Auto:</span>
             </div>
             <span className="text-xl font-black text-[#920074]">
                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(unitCost)}
             </span>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Preço Sugerido de Venda (Opcional)</label>
            <input
              name="defaultSellPrice"
              type="number"
              step="0.01"
              placeholder="0.00"
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] outline-none"
              value={formData.defaultSellPrice}
              onChange={handleChange}
            />
          </div>

          <button
            type="submit"
            className="w-full bg-[#920074] hover:bg-[#74005c] text-white font-bold py-4 rounded-xl shadow-lg transition transform active:scale-95 flex items-center justify-center gap-2"
          >
            Confirmar Cadastro
          </button>
        </form>
      </div>
    </div>
  );
};
