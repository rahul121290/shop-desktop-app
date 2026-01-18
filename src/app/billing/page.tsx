"use client";

import { useState, useEffect } from "react";

/* ================= TYPES ================= */
type PriceCategory = string;

type Item = {
  id: number | string;
  _id?: string;
  name: string;
  categories: PriceCategory[];
  price: Partial<Record<PriceCategory, number>>;
};

type Customer = {
  id: number | string;
  _id?: string;
  name: string;
  previousBalance: number;
};

type BillItem = {
  name: string;
  category: PriceCategory;
  quantity: number;
  rate: number;
  amount: number;
};

/* ================= PAGE ================= */
export default function BillingPage() {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Item[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [search, setSearch] = useState("");
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<PriceCategory>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [billItems, setBillItems] = useState<BillItem[]>([]);
  const [paymentMode, setPaymentMode] = useState<"cash" | "upi">("cash");
  const [paymentReceived, setPaymentReceived] = useState<number>(0);

  /* ================= FETCH FROM YOUR DB ================= */
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [itemsRes, customersRes] = await Promise.all([
          fetch('/api/items'),
          fetch('/api/customers')
        ]);
        
        if (itemsRes.ok) {
          const itemsData = await itemsRes.json();
          setItems(itemsData.map((p: any) => ({ 
            id: p._id?.$oid || p._id || Math.random(),
            _id: p._id,
            name: p.name,
            categories: p.categories || [],
            price: p.price || {}
          })));
        }
        
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.map((p: any) => ({
            id: p._id?.$oid || p._id || Math.random(),
            _id: p._id,
            name: p.name,
            previousBalance: p.previousBalance || 0
          })));
        }
      } catch (error) {
        console.error('Failed to fetch:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  /* ================= FETCH LATEST ITEMS ================= */
  const refreshItemsFromDB = async () => {
    try {
      const res = await fetch('/api/items');
      if (res.ok) {
        const freshData = await res.json();
        const updatedItems = freshData.map((p: any) => ({ 
          id: p._id?.$oid || p._id || Math.random(),
          _id: p._id,
          name: p.name,
          categories: p.categories || [],
          price: p.price || {}
        }));
        setItems(updatedItems);
        return updatedItems;
      }
    } catch (error) {
      console.error('Failed to refresh items:', error);
    }
    return items;
  };

  /* ================= HELPERS ================= */
  const getRate = (item: Item, category: PriceCategory): number => {
    return item.price[category] ?? 0;
  };

  /* ================= CALCULATIONS ================= */
  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  const currentBillTotal = billItems.reduce(
    (sum, item) => sum + item.amount,
    0
  );

  const previousBalance = selectedCustomer?.previousBalance ?? 0;
  const grandTotal = previousBalance + currentBillTotal;
  const balanceDue = Math.max(grandTotal - paymentReceived, 0);

  /* ================= ACTIONS ================= */
  const handleAddItem = () => {
    if (!selectedItem || !selectedCategory) return;

    const rate = getRate(selectedItem, selectedCategory);
    if (rate <= 0) return;

    const amount = rate * quantity;

    setBillItems(prev => {
      const existingIndex = prev.findIndex(
        item =>
          item.name === selectedItem.name &&
          item.category === selectedCategory
      );

      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: updated[existingIndex].quantity + quantity,
          amount: updated[existingIndex].amount + amount,
        };
        return updated;
      }

      return [
        ...prev,
        {
          name: selectedItem.name,
          category: selectedCategory,
          quantity,
          rate,
          amount,
        },
      ];
    });

    setSelectedItem(null);
    setSelectedCategory("");
    setQuantity(1);
    setSearch("");
  };

  const handleRemoveItem = (index: number) => {
    setBillItems(prev => prev.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-lg text-gray-600">Loading items and customers...</div>
      </div>
    );
  }

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
            💰 Billing System
          </h1>
          <p className="text-gray-600 mt-2">Live prices from MongoDB</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* ================= LEFT - ADD ITEMS ================= */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/50 space-y-4">
            {/* Customer Select */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Customer</label>
              <select
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-sm"
                value={selectedCustomer?.id ?? ""}
                onChange={e => {
                  const customer = customers.find(
                    c => c.id === e.target.value
                  );
                  setSelectedCustomer(customer || null);
                  setBillItems([]); // Reset bill
                }}
              >
                <option value="">Select Customer</option>
                {customers.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Item Search & Add */}
            {selectedCustomer && (
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4 space-y-3 bg-blue-50/50">
                <input
                  type="text"
                  placeholder="🔍 Search items..."
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 text-sm"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />

                {/* Item Suggestions */}
                {search && filteredItems.length > 0 && !selectedItem && (
                  <div className="bg-white border rounded-xl shadow-lg max-h-48 overflow-y-auto absolute z-20 w-full">
                    {filteredItems.slice(0, 8).map(item => (
                      <div
                        key={item.id}
                        className="p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 text-sm"
                        onClick={() => {
                          setSelectedItem(item);
                          setSelectedCategory("");
                          setQuantity(1);
                        }}
                      >
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">
                          {item.categories.slice(0, 2).join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Selected Item Config */}
                {selectedItem && (
                  <div className="space-y-3 pt-2 border-t">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-lg">{selectedItem.name}</span>
                      <button
                        onClick={() => {
                          setSelectedItem(null);
                          setSelectedCategory("");
                          setSearch("");
                        }}
                        className="text-gray-500 hover:text-gray-700 text-sm"
                      >
                        × Clear
                      </button>
                    </div>

                    {/* ✅ CATEGORIES WITH LIVE DB FETCH */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                      <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-2 bg-gray-50 rounded-xl">
                        {selectedItem.categories.map((cat: PriceCategory) => {
                          const rate = getRate(selectedItem, cat);
                          if (rate === 0) return null;
                          return (
                            <label key={cat} className="flex items-center p-2 cursor-pointer hover:bg-white rounded-lg border">
                              <input
                                type="radio"
                                name="category"
                                value={cat}
                                checked={selectedCategory === cat}
                                onChange={async () => {
                                  // ✅ FETCH LATEST FROM DB
                                  const originalItems = items;
                                  setItems([]); // Show loading
                                  
                                  const updatedItems = await refreshItemsFromDB();
                                  
                                  // Update selected item with fresh data
                                  const freshItem = updatedItems.find((i:any) => i.id === selectedItem.id);
                                  if (freshItem) {
                                    setSelectedItem(freshItem);
                                  }
                                  
                                  setSelectedCategory(cat);
                                }}
                                className="mr-3 h-4 w-4 text-blue-600 focus:ring-blue-500"
                              />
                              <span className="text-sm">
                                {cat} - ₹{rate.toLocaleString()}
                              </span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Quantity */}
                    {selectedCategory && (
                      <>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                          <input
                            type="number"
                            min={1}
                            className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-400 text-sm"
                            value={quantity}
                            onChange={e => setQuantity(Number(e.target.value) || 1)}
                          />
                        </div>

                        <div className="p-3 bg-emerald-50 rounded-xl text-right">
                          <div className="text-2xl font-bold text-emerald-700">
                            ₹{(getRate(selectedItem, selectedCategory) * quantity).toLocaleString()}
                          </div>
                          <div className="text-sm text-emerald-600">
                            @ ₹{getRate(selectedItem, selectedCategory).toLocaleString()} × {quantity}
                          </div>
                        </div>

                        <button
                          onClick={handleAddItem}
                          disabled={!selectedCategory}
                          className="w-full bg-gradient-to-r from-blue-500 to-blue-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50 text-sm"
                        >
                          ➕ Add to Bill
                        </button>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ================= RIGHT - BILL SUMMARY ================= */}
          <div className="bg-white/90 backdrop-blur-xl rounded-3xl p-6 shadow-2xl border border-white/50 space-y-4">
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              🧾 Bill Summary
            </h2>

            {/* Bill Items Table */}
            {billItems.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                Select customer and add items
              </div>
            ) : (
              <div className="overflow-x-auto max-h-80 rounded-xl border">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="p-3 text-left font-semibold text-gray-700">Item</th>
                      <th className="p-3 text-left font-semibold text-gray-700 w-24">Category</th>
                      <th className="p-3 text-right font-semibold text-gray-700 w-20">Qty</th>
                      <th className="p-3 text-right font-semibold text-gray-700 w-24">Rate</th>
                      <th className="p-3 text-right font-semibold text-gray-700">Amount</th>
                      <th className="p-3 text-center font-semibold text-gray-700 w-12">×</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {billItems.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3">
                          <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs">
                            {item.category}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono">{item.quantity}</td>
                        <td className="p-3 text-right font-mono">₹{item.rate}</td>
                        <td className="p-3 text-right font-bold text-emerald-600 font-mono">
                          ₹{item.amount.toLocaleString()}
                        </td>
                        <td className="p-3 text-center">
                          <button
                            onClick={() => handleRemoveItem(index)}
                            className="text-red-500 hover:bg-red-50 p-2 rounded-lg hover:scale-110 transition-all"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Totals */}
            <div className="bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-2xl space-y-3">
              <div className="flex justify-between text-sm">
                <span>Current Bill:</span>
                <span className="font-semibold">₹{currentBillTotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Previous Balance:</span>
                <span className="font-semibold">₹{previousBalance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xl font-bold border-t pt-3">
                <span>Grand Total:</span>
                <span className="text-2xl text-emerald-600">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            {/* Payment */}
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-gray-700">Payment</label>
              
              <div className="flex gap-4 p-3 bg-gray-50 rounded-xl">
                <label className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-white">
                  <input
                    type="radio"
                    checked={paymentMode === "cash"}
                    onChange={() => setPaymentMode("cash")}
                    className="mr-2 h-4 w-4 text-emerald-600"
                  />
                  <span className="font-medium">💵 Cash</span>
                </label>
                <label className="flex items-center cursor-pointer p-2 rounded-lg hover:bg-white">
                  <input
                    type="radio"
                    checked={paymentMode === "upi"}
                    onChange={() => setPaymentMode("upi")}
                    className="mr-2 h-4 w-4 text-blue-600"
                  />
                  <span className="font-medium">📱 UPI</span>
                </label>
              </div>

              <input
                type="number"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 text-sm"
                placeholder="Amount received"
                value={paymentReceived}
                onChange={e => setPaymentReceived(Number(e.target.value) || 0)}
              />

              <div className={`p-4 rounded-xl text-center font-bold text-2xl ${
                balanceDue > 0 
                  ? 'bg-red-50 border-2 border-red-200 text-red-700' 
                  : 'bg-emerald-50 border-2 border-emerald-200 text-emerald-700'
              }`}>
                Balance Due: ₹{balanceDue.toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
