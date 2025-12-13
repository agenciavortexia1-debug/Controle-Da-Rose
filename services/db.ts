
import { Sale, Lead, InventoryItem, PRODUCTS } from '../types';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, Timestamp, updateDoc, setDoc, getDoc } from 'firebase/firestore';

// --- CONFIGURAÇÃO DO GOOGLE FIREBASE ---
const USE_GOOGLE_FIREBASE = false;

const firebaseConfig = {
  apiKey: "SUA_API_KEY_AQUI",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let db: any;
let salesCollection: any;
let leadsCollection: any;
let inventoryCollection: any;

if (USE_GOOGLE_FIREBASE) {
  try {
    const app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    salesCollection = collection(db, 'sales');
    leadsCollection = collection(db, 'leads');
    inventoryCollection = collection(db, 'inventory');
  } catch (e) {
    console.error("Erro ao inicializar Firebase.", e);
  }
}

// --- MÉTODOS DE VENDAS ---

export const getSales = async (): Promise<Sale[]> => {
  if (USE_GOOGLE_FIREBASE) {
    try {
      const snapshot = await getDocs(salesCollection);
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Sale[];
    } catch (error) {
      console.error("Erro ao buscar do Firebase:", error);
      return [];
    }
  } else {
    const stored = localStorage.getItem('sales_db');
    if (!stored) return [];
    return JSON.parse(stored);
  }
};

export const addSale = async (sale: Sale): Promise<Sale> => {
  if (USE_GOOGLE_FIREBASE) {
    const { id, ...saleData } = sale; 
    const docRef = await addDoc(salesCollection, saleData);
    return { ...sale, id: docRef.id };
  } else {
    const currentSales = await getSales();
    const newSales = [sale, ...currentSales];
    localStorage.setItem('sales_db', JSON.stringify(newSales));
    return sale;
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  if (USE_GOOGLE_FIREBASE) {
    await deleteDoc(doc(db, 'sales', id));
  } else {
    const currentSales = await getSales();
    const newSales = currentSales.filter(s => s.id !== id);
    localStorage.setItem('sales_db', JSON.stringify(newSales));
  }
};

// --- MÉTODOS DE LEADS (CLIENTES PENDENTES) ---

export const getLeads = async (): Promise<Lead[]> => {
  if (USE_GOOGLE_FIREBASE) {
    try {
      const snapshot = await getDocs(leadsCollection);
      return snapshot.docs.map((doc: any) => ({
        id: doc.id,
        ...doc.data()
      })) as Lead[];
    } catch (error) {
      return [];
    }
  } else {
    const stored = localStorage.getItem('leads_db');
    if (!stored) return [];
    return JSON.parse(stored);
  }
};

export const addLead = async (lead: Lead): Promise<Lead> => {
  if (USE_GOOGLE_FIREBASE) {
    const { id, ...leadData } = lead;
    const docRef = await addDoc(leadsCollection, leadData);
    return { ...lead, id: docRef.id };
  } else {
    const currentLeads = await getLeads();
    const newLeads = [lead, ...currentLeads];
    localStorage.setItem('leads_db', JSON.stringify(newLeads));
    return lead;
  }
};

export const deleteLead = async (id: string): Promise<void> => {
  if (USE_GOOGLE_FIREBASE) {
    await deleteDoc(doc(db, 'leads', id));
  } else {
    const currentLeads = await getLeads();
    const newLeads = currentLeads.filter(l => l.id !== id);
    localStorage.setItem('leads_db', JSON.stringify(newLeads));
  }
};

export const updateLeadStatus = async (id: string, status: Lead['status']): Promise<void> => {
    if (USE_GOOGLE_FIREBASE) {
        await updateDoc(doc(db, 'leads', id), { status });
    } else {
        const currentLeads = await getLeads();
        const updatedLeads = currentLeads.map(l => l.id === id ? { ...l, status } : l);
        localStorage.setItem('leads_db', JSON.stringify(updatedLeads));
    }
}

// --- MÉTODOS DE ESTOQUE ---

export const getInventory = async (): Promise<InventoryItem[]> => {
  if (USE_GOOGLE_FIREBASE) {
    try {
        const snapshot = await getDocs(inventoryCollection);
        const dbItems = snapshot.docs.map((doc: any) => ({
            productName: doc.id,
            ...doc.data()
        })) as InventoryItem[];
        
        // Merge with pre-defined products to ensure all are listed
        return PRODUCTS.map(p => {
            const found = dbItems.find(i => i.productName === p.name);
            return found || { productName: p.name, quantity: 0 };
        });
    } catch (error) {
        console.error("Erro ao buscar estoque", error);
        return PRODUCTS.map(p => ({ productName: p.name, quantity: 0 }));
    }
  } else {
    const stored = localStorage.getItem('inventory_db');
    const storedInventory: InventoryItem[] = stored ? JSON.parse(stored) : [];
    
    // Ensure all fixed products exist
    return PRODUCTS.map(p => {
        const found = storedInventory.find(i => i.productName === p.name);
        return found || { productName: p.name, quantity: 0 };
    });
  }
};

export const updateStock = async (productName: string, quantityChange: number): Promise<InventoryItem[]> => {
    // Only track fixed products
    if (!PRODUCTS.find(p => p.name === productName)) {
        return getInventory();
    }

    if (USE_GOOGLE_FIREBASE) {
        // Implementation for Firebase requires doc ref logic matching productName
        // Simplified for now assuming local storage primary as per context
        return []; 
    } else {
        let inventory = await getInventory();
        const index = inventory.findIndex(i => i.productName === productName);
        
        if (index >= 0) {
            inventory[index].quantity += quantityChange;
        } else {
            inventory.push({ productName, quantity: quantityChange });
        }
        
        localStorage.setItem('inventory_db', JSON.stringify(inventory));
        return inventory;
    }
};
