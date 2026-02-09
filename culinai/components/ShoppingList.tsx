import React from 'react';
import { Trash2, Plus, CheckSquare, Check } from 'lucide-react';
import { ShoppingItem } from '../types';

interface ShoppingListProps {
  items: ShoppingItem[];
  onRemove: (id: string) => void;
  onAdd: (item: string) => void;
  onToggle: (id: string) => void;
}

export const ShoppingList: React.FC<ShoppingListProps> = ({ items, onRemove, onAdd, onToggle }) => {
  const [newItem, setNewItem] = React.useState('');

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (newItem.trim()) {
      onAdd(newItem.trim());
      setNewItem('');
    }
  };

  const activeItems = items.filter(i => !i.checked);
  const purchasedItems = items.filter(i => i.checked);

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto w-full">
      <div className="mb-10 text-center md:text-left">
        <h2 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">Shopping List</h2>
        <p className="text-slate-500 font-medium">Don't forget the essentials for your masterpiece.</p>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden">
        <form onSubmit={handleAdd} className="p-6 border-b border-slate-100 flex gap-3 bg-slate-50/50">
          <input
            type="text"
            value={newItem}
            onChange={(e) => setNewItem(e.target.value)}
            placeholder="Add an item (e.g., 2 lbs Chicken)..."
            className="flex-1 px-6 py-4 rounded-2xl border border-slate-200 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium text-lg transition-all"
          />
          <button
            type="submit"
            className="bg-slate-900 text-white px-6 rounded-2xl hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
          >
            <Plus size={28} />
          </button>
        </form>

        <div className="divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="p-16 text-center text-slate-300">
              <CheckSquare size={64} className="mx-auto mb-6 opacity-20" />
              <p className="font-bold text-lg">Your list is empty.</p>
              <p className="text-sm font-medium opacity-60 mt-1">Add ingredients from recipes or manually.</p>
            </div>
          ) : (
            <>
              {activeItems.map((item) => (
                <div key={item.id} className="p-5 flex items-center justify-between group hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onToggle(item.id)}>
                  <div className="flex items-center gap-5 flex-1">
                      <div className="w-8 h-8 rounded-lg border-2 border-slate-300 group-hover:border-emerald-500 flex items-center justify-center transition-all bg-white shrink-0 group-hover:scale-110">
                        {/* Unchecked state */}
                      </div>
                      <span className="text-slate-800 font-bold text-lg md:text-xl">{item.name}</span>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                    className="text-slate-300 hover:text-red-500 p-3 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 md:opacity-0"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}

              {purchasedItems.length > 0 && (
                <>
                  <div className="bg-slate-50 px-6 py-3 text-xs font-extrabold text-slate-400 uppercase tracking-widest border-t border-slate-100 mt-2">
                    Purchased
                  </div>
                  {purchasedItems.map((item) => (
                    <div key={item.id} className="p-5 flex items-center justify-between group bg-slate-50/30 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => onToggle(item.id)}>
                      <div className="flex items-center gap-5 flex-1 opacity-50 group-hover:opacity-80 transition-opacity">
                          <div className="w-8 h-8 rounded-lg border-2 border-emerald-500 bg-emerald-500 flex items-center justify-center transition-all shrink-0">
                            <Check size={16} className="text-white" strokeWidth={4} />
                          </div>
                          <span className="text-slate-500 font-bold text-lg md:text-xl line-through decoration-2 decoration-slate-300">{item.name}</span>
                      </div>
                      <button
                        onClick={(e) => { e.stopPropagation(); onRemove(item.id); }}
                        className="text-slate-300 hover:text-red-500 p-3 rounded-full hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  ))}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};