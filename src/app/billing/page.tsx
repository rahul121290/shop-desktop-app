"use client";

import { useState, useEffect } from "react";

/* ================= TYPES ================= */
type PriceCategory = string; // Dynamic for "pice", "dozen", etc.

type Item = {
  id: number | string;
  _id?: string;
  name: string;
  categories: PriceCategory[];  // ✅ YOUR FORMAT: ["pice"]
  price: Partial<Record<PriceCategory, number>>;  // ✅ YOUR FORMAT: { "pice": 5 }
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
          // ✅ Transform YOUR exact format
          setItems(itemsData.map((p: any) => ({ 
            id: p._id.$oid || p._id || Math.random(),
            _id: p._id,
            name: p.name,
            categories: p.categories || [],
            price: p.price || {}
          })));
        }
        
        if (customersRes.ok) {
          const customersData = await customersRes.json();
          setCustomers(customersData.map((p: any) => ({
            id: p._id.$oid || p._id || Math.random(),
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
      <div className="p-6 max-w-7xl mx-auto flex items-center justify-center min-h-screen">
        <div className="text-lg text-gray-500">Loading items and customers...</div>
      </div>
    );
  }

  /* ================= UI (UNCHANGED) ================= */
  return (
    <div className="p-6 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Billing</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ================= LEFT ================= */}
        <div className="space-y-4">
          {/* Customer */}
          <select
            className="border p-2 w-full rounded"
            value={selectedCustomer?.id ?? ""}
            onChange={e => {
              const customer = customers.find(
                c => c.id === Number(e.target.value) || c.id === e.target.value
              );
              setSelectedCustomer(customer || null);
            }}
          >
            <option value="">Select Customer</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Unified Item Search */}
          {selectedCustomer && (
            <div className="border p-4 rounded space-y-3 relative">
              <input
                type="text"
                placeholder="Search and select item..."
                className="border p-2 w-full rounded"
                value={search}
                onChange={e => setSearch(e.target.value)}
                onFocus={() => {
                  if (!selectedItem) setSearch("");
                }}
              />

              {/* Inline suggestions below search box */}
              {search && filteredItems.length > 0 && !selectedItem && (
                <div className="border-t pt-2 max-h-48 overflow-y-auto bg-white absolute z-10 w-full shadow-lg rounded-b-lg">
                  {filteredItems.map(item => (
                    <div
                      key={item.id}
                      className="p-2 cursor-pointer hover:bg-gray-100 border-b last:border-b-0"
                      onClick={() => {
                        setSelectedItem(item);
                        const firstCategory = item.categories[0] || "";
                        setSelectedCategory(firstCategory);
                        setQuantity(1);
                      }}
                    >
                      {item.name}
                    </div>
                  ))}
                </div>
              )}

              {/* Item Config */}
              {selectedItem && (
                <>
                  <p className="font-semibold">{selectedItem.name}</p>

                  {/* Category - Radio Buttons */}
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <div className="grid grid-cols-2 gap-1 max-h-32 overflow-y-auto">
                      {selectedItem.categories.map((cat: PriceCategory) => {
                        const rate = getRate(selectedItem, cat);
                        if (rate === 0) return null;
                        return (
                          <label key={cat} className="flex items-center p-1.5 cursor-pointer hover:bg-gray-50 rounded">
                            <input
                              type="radio"
                              name="category"
                              value={cat}
                              checked={selectedCategory === cat}
                              onChange={() => setSelectedCategory(cat)}
                              className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500"
                            />
                            <span className="text-sm">
                              {cat} - Rs {rate}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Quantity */}
                  <input
                    type="number"
                    min={1}
                    className="border p-2 w-full rounded"
                    value={quantity}
                    onChange={e => setQuantity(Number(e.target.value))}
                  />

                  <div className="text-right font-semibold">
                    Amount: Rs {getRate(selectedItem, selectedCategory) * quantity}
                  </div>

                  <button
                    onClick={handleAddItem}
                    className="bg-blue-600 text-white w-full py-2 rounded hover:bg-blue-700"
                  >
                    Add Item
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* ================= RIGHT (UNCHANGED) ================= */}
        <div className="border rounded p-4 space-y-4">
          <h2 className="text-xl font-semibold">Bill Summary</h2>

          {/* Bill Table */}
          {billItems.length === 0 ? (
            <p className="text-gray-500">No items added</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[500px]">
                <thead>
                  <tr className="border-b bg-gray-50">
                    <th className="text-left py-3 px-2">Item</th>
                    <th className="text-left py-3 px-2">Category</th>
                    <th className="text-right py-3 px-2">Qty</th>
                    <th className="text-right py-3 px-2">Rate</th>
                    <th className="text-right py-3 px-2">Amount</th>
                    <th className="text-center py-3 px-2 w-12">X</th>
                  </tr>
                </thead>
                <tbody>
                  {billItems.map((item, index) => (
                    <tr key={index} className="border-b hover:bg-gray-50">
                      <td className="py-2 px-2">{item.name}</td>
                      <td className="py-2 px-2">{item.category}</td>
                      <td className="text-right py-2 px-2">{item.quantity}</td>
                      <td className="text-right py-2 px-2">Rs {item.rate}</td>
                      <td className="text-right py-2 px-2">Rs {item.amount}</td>
                      <td className="text-center py-2 px-2">
                        <button
                          onClick={() => handleRemoveItem(index)}
                          className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50"
                        >
                          X
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Totals */}
          <div className="border-t pt-4 space-y-2">
            <div className="flex justify-between">
              <span>Current Bill</span>
              <span>Rs {currentBillTotal.toLocaleString()}</span>
            </div>

            <div className="flex justify-between">
              <span>Previous Balance</span>
              <input
                readOnly
                value={previousBalance.toLocaleString()}
                className="w-28 text-right border bg-gray-100 p-1 rounded"
              />
            </div>

            <div className="flex justify-between font-semibold text-lg">
              <span>Grand Total</span>
              <span>Rs {grandTotal.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="border-t pt-4 space-y-3">
            <p className="font-semibold">Payment Received</p>

            <div className="flex gap-6 p-2 bg-gray-50 rounded-lg">
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={paymentMode === "cash"}
                  onChange={() => setPaymentMode("cash")}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                <span className="font-medium">Cash</span>
              </label>
              <label className="flex items-center cursor-pointer">
                <input
                  type="radio"
                  checked={paymentMode === "upi"}
                  onChange={() => setPaymentMode("upi")}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                <span className="font-medium">UPI</span>
              </label>
            </div>

            <input
              type="number"
              className="border p-2 w-full rounded focus:ring-2 focus:ring-blue-500"
              placeholder="Amount received"
              value={paymentReceived}
              onChange={e => setPaymentReceived(Number(e.target.value))}
            />

            <div className="flex justify-between font-bold text-xl p-3 bg-gray-50 rounded-lg">
              <span>Balance Due</span>
              <span className={`font-black ${balanceDue > 0 ? 'text-red-600' : 'text-green-600'}`}>
                Rs {balanceDue.toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
