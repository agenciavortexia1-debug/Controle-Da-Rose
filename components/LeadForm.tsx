import React, { useState } from 'react';
import { Plus, X, UserPlus } from 'lucide-react';
import { Lead } from '../types';

interface LeadFormProps {
  onAddLead: (lead: Lead) => void;
  onClose: () => void;
}

export const LeadForm: React.FC<LeadFormProps> = ({ onAddLead, onClose }) => {
  const [formData, setFormData] = useState({
    clientName: '',
    phone: '',
    productInterest: '',
    expectedDate: '',
    notes: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const newLead: Lead = {
      id: crypto.randomUUID(),
      clientName: formData.clientName,
      phone: formData.phone,
      productInterest: formData.productInterest,
      expectedDate: formData.expectedDate,
      notes: formData.notes,
      createdAt: new Date().toISOString(),
      status: 'Pending',
    };

    onAddLead(newLead);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 sm:p-4 transition-all">
      <div className="bg-white w-full h-[95vh] sm:h-auto sm:max-w-md rounded-t-2xl sm:rounded-2xl shadow-2xl overflow-hidden animate-slide-up sm:animate-fade-in flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 flex-shrink-0">
          <div className="flex items-center gap-2">
            <UserPlus className="text-[#920074]" size={24} />
            <h2 className="text-xl font-bold text-gray-800">Novo Cliente Pendente</h2>
          </div>
          <button onClick={onClose} className="bg-gray-100 p-2 rounded-full text-gray-500 hover:bg-gray-200 transition">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Cliente</label>
            <input
              required
              name="clientName"
              type="text"
              placeholder="Ex: Maria da Silva"
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
              value={formData.clientName}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Telefone / WhatsApp</label>
            <input
              name="phone"
              type="tel"
              placeholder="(00) 00000-0000"
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
              value={formData.phone}
              onChange={handleChange}
            />
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Produto de Interesse</label>
             <input
              name="productInterest"
              type="text"
              placeholder="Ex: Monjaro"
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
              value={formData.productInterest}
              onChange={handleChange}
            />
          </div>

          <div>
             <label className="block text-sm font-semibold text-gray-700 mb-2">Previsão de Compra</label>
             <input
              name="expectedDate"
              type="date"
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base"
              value={formData.expectedDate}
              onChange={handleChange}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Observações</label>
            <textarea
              name="notes"
              rows={3}
              placeholder="Ex: Aguardando cartão virar..."
              className="w-full px-4 py-3 bg-gray-50 text-gray-900 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#920074] focus:border-transparent outline-none transition text-base resize-none"
              value={formData.notes}
              onChange={handleChange}
            />
          </div>

          <div className="pt-2">
            <button
                type="submit"
                className="w-full bg-[#920074] hover:bg-[#74005c] active:scale-[0.98] text-white font-bold py-4 rounded-xl shadow-lg transition transform flex items-center justify-center gap-2 text-lg"
            >
                <Plus size={24} />
                Salvar Pendência
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};