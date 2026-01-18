"use client";

import { useState, useEffect, useCallback } from "react";

type PriceCategory = string;

type Product = {
  _id?: string;
  id?: number;
  name: string;
  price: Record<PriceCategory, number>;
  categories: PriceCategory[];
};

export default function ProductPriceManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [tableFilter, setTableFilter] = useState(""); // ✅ FILTER
  
  // Form states
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [productName, setProductName] = useState("");
  const [productNameSuggestions, setProductNameSuggestions] = useState<Product[]>([]);
  const [showProductSuggestions, setShowProductSuggestions] = useState(false);
  const [categories, setCategories] = useState<string[]>([]);
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showCategorySuggestions, setShowCategorySuggestions] = useState(false);

  // Fetch products from MongoDB
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setProducts(data.map((p: any) => ({ ...p, id: p._id })));
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // ✅ FILTER LOGIC
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(tableFilter.toLowerCase()) ||
    product.categories.some(cat => 
      cat.toLowerCase().includes(tableFilter.toLowerCase())
    )
  );

  // Save/Update product to MongoDB
  const handleSaveProduct = async () => {
    if (!productName.trim() || categories.length === 0) return;

    setSaving(true);
    try {
      const productData = {
        name: productName.trim(),
        categories,
        price: prices,
      };

      const url = editingProductId 
        ? `/api/products/${editingProductId}`
        : '/api/products';
      const method = editingProductId ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(productData),
      });

      if (res.ok) {
        fetchProducts();
        resetForm();
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to save product');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setEditingProductId(null);
    setProductName("");
    setCategories([]);
    setPrices({});
    setNewCategoryName("");
    setShowProductSuggestions(false);
    setShowCategorySuggestions(false);
  };

  // Product name suggestions
  const handleProductNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setProductName(value);
    
    if (value.length > 0 && !editingProductId) {
      const suggestions = products.filter(product =>
        product.name.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 5);
      setProductNameSuggestions(suggestions);
      setShowProductSuggestions(true);
    } else {
      setShowProductSuggestions(false);
      setProductNameSuggestions([]);
    }
  };

  const handleSelectProductSuggestion = (product: Product) => {
    setEditingProductId(product._id || '');
    setProductName(product.name);
    setCategories(product.categories || []);
    setPrices(product.price);
    setShowProductSuggestions(false);
  };

  // Category handlers
  const allCategories = Array.from(new Set(products.flatMap(p => p.categories || [])));
  
  const handleCategoryNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setNewCategoryName(value);
    
    if (value.length > 0) {
      const suggestions = allCategories.filter(cat =>
        cat.toLowerCase().includes(value.toLowerCase()) && !categories.includes(cat)
      );
      setShowCategorySuggestions(suggestions.length > 0);
    } else {
      setShowCategorySuggestions(false);
    }
  };

  // const handleAddCategory = () => {
  //   const catName = newCategoryName.trim();
  //   if (catName && !categories.includes(catName)) {
  //     setCategories([...categories, catName]);
  //     setPrices({ ...prices, [catName]: 0 });
  //     setNewCategoryName("");
  //     setShowCategorySuggestions(false);
  //   }
  // };
  const handleAddCategory = () => {
  const catName = newCategoryName.trim();
  if (catName && !categories.includes(catName)) {
    // ✅ NEW CATEGORY ON TOP
    setCategories([catName, ...categories]);
    setPrices({ [catName]: 0, ...prices });
    setNewCategoryName("");
    setShowCategorySuggestions(false);
  }
};


  const handleSelectCategorySuggestion = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
      setPrices({ ...prices, [category]: 0 });
    }
    setNewCategoryName("");
    setShowCategorySuggestions(false);
  };

  const handleRemoveCategory = (category: string) => {
    setCategories(categories.filter(c => c !== category));
    const { [category]: _, ...rest } = prices;
    setPrices(rest);
  };

  // Delete product
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Delete this product?')) return;
    
    try {
      const res = await fetch(`/api/products/${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchProducts();
        if (editingProductId === id) resetForm();
      }
    } catch (error) {
      alert('Failed to delete product');
    }
  };

  const handleEditProduct = (product: Product) => {
    setEditingProductId(product._id || '');
    setProductName(product.name);
    setCategories(product.categories || []);
    setPrices(product.price);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center p-6">
        <div className="text-base text-gray-500">Loading products from MongoDB...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-4 px-2 sm:px-4">
      <div className="w-full max-w-none">
        {/* Header */}
        <div className="text-center mb-6 px-4">
          <h1 className="text-2xl font-bold text-gray-800 mb-1">Product Price Manager</h1>
          <p className="text-sm text-gray-600 max-w-4xl mx-auto">Manage product prices category-wise. Data saved to MongoDB.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Form Column */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-6 shadow-lg border w-full lg:max-w-2xl mx-auto lg:mx-0">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-bold text-gray-900">
                {editingProductId ? 'Edit Product' : 'Add Product'}
              </h2>
              {editingProductId && (
                <button
                  onClick={resetForm}
                  className="px-3 py-1 bg-gray-200 text-gray-700 text-sm rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Product Name */}
            <div className="relative mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Product Name *</label>
              <input
                type="text"
                placeholder="Enter product name"
                className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-sm"
                value={productName}
                onChange={handleProductNameChange}
              />
              
              {showProductSuggestions && productNameSuggestions.length > 0 && (
                <div className="absolute z-20 w-full mt-1 bg-white rounded-xl shadow-lg border max-h-48 overflow-y-auto">
                  {productNameSuggestions.map((product) => (
                    <div
                      key={product._id || product.id}
                      className="p-3 text-sm cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                      onClick={() => handleSelectProductSuggestion(product)}
                    >
                      <div>
                        <div className="font-medium text-gray-900">{product.name}</div>
                        <div className="flex flex-wrap gap-1 mt-0.5 text-xs">
                          {(product.categories || []).slice(0, 2).map(cat => (
                            <span key={cat} className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-xs bg-blue-500 text-white px-2 py-0.5 rounded">EDIT</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categories - COMPACT HEIGHT + TEXTBOX */}
<div className="mb-6">
  <label className="block text-sm font-medium text-gray-700 mb-3">Price Categories *</label>

  <div className="relative mb-3"> {/* Reduced mb-4 → mb-3 */}
    <div className="flex gap-2 p-2 bg-blue-50 rounded-lg border">
      <input
        type="text"
        placeholder="Category (Piece, Dozen...)"
        className="flex-1 p-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-300 text-sm"
        value={newCategoryName}
        onChange={handleCategoryNameChange}
        onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
      />
      <button
        onClick={handleAddCategory}
        disabled={!newCategoryName.trim()}
        className="px-4 py-2 bg-blue-500 text-white text-xs rounded-lg hover:bg-blue-600 disabled:bg-gray-400 whitespace-nowrap"
      >
        Add
      </button>
    </div>

    {showCategorySuggestions && (
      <div className="absolute z-10 w-full mt-1 bg-white rounded-lg shadow-md border max-h-32 overflow-y-auto"> {/* Reduced height */}
        {allCategories
          .filter(cat => 
            cat.toLowerCase().includes(newCategoryName.toLowerCase()) && 
            !categories.includes(cat)
          )
          .slice(0, 6)
          .map(category => (
            <div
              key={category}
              className="p-2 text-xs cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
              onClick={() => handleSelectCategorySuggestion(category)}
            >
              <span className="w-1.5 h-1.5 bg-blue-400 rounded-full"></span>
              <span>{category}</span>
              <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">Used</span>
            </div>
          ))}
      </div>
    )}
  </div>

  {categories.length > 0 ? (
    <div className="space-y-2 max-h-32 overflow-y-auto"> {/* Reduced max-h-48 → max-h-32 */}
      {categories.map(category => (
        <div key={category} className="flex items-center justify-between p-2.5 bg-gray-50 rounded border"> {/* Tighter padding */}
          <span className="font-medium text-xs">{category}</span> {/* Smaller text */}
          <div className="flex items-center gap-2">
            <div className="flex items-center">
              <span className="text-gray-500 text-xs mr-1">₹</span>
              <input
                type="text"  // ✅ CHANGED TO TEXTBOX
                className="w-20 p-1.5 border border-gray-200 rounded text-xs text-right focus:ring-1 focus:ring-emerald-300" // Tighter input
                value={prices[category]?.toString() || ""}
                onChange={(e) => setPrices({
                  ...prices,
                  [category]: parseFloat(e.target.value) || 0
                })}
                placeholder="0"
              />
            </div>
            <button
              onClick={() => handleRemoveCategory(category)}
              className="p-1 text-red-500 hover:bg-red-50 rounded hover:scale-105"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-4 text-xs text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200"> {/* Tighter py-6 → py-4 */}
      Add your first category
    </div>
  )}
</div>


            <button
              onClick={handleSaveProduct}
              disabled={!productName.trim() || categories.length === 0 || saving}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : (editingProductId ? "Update Product" : "Save Product")}
            </button>
          </div>

          {/* ✅ PRODUCTS TABLE WITH FILTER - FULL WIDTH */}
          <div className="bg-white/90 backdrop-blur-xl rounded-2xl p-4 shadow-lg border w-full">
            <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
              <h2 className="text-base font-bold text-gray-900 flex-1">📦 Products ({filteredProducts.length})</h2>
              
              {/* Search Filter */}
              <div className="relative flex-1 sm:max-w-md w-full">
                <input
                  type="text"
                  placeholder="🔍 Filter products or categories..."
                  className="w-full pl-10 pr-4 py-2 text-xs border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-400 focus:border-blue-400"
                  value={tableFilter}
                  onChange={(e) => setTableFilter(e.target.value)}
                />
                <svg className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
            
            <div className="overflow-x-auto max-h-96 w-full">
              <table className="w-full text-xs">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="p-2 text-left font-semibold text-gray-700 border-b min-w-[180px]">Product</th>
                    <th className="p-2 text-left font-semibold text-gray-700 border-b w-28">Categories</th>
                    <th className="p-2 text-right font-semibold text-gray-700 border-b">Prices</th>
                    <th className="p-2 text-center font-semibold text-gray-700 border-b w-24">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-8 text-center text-gray-500 text-xs">
                        {tableFilter ? `No products found for "${tableFilter}"` : "No products yet. Add your first one!"}
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((product) => (
                      <tr key={product._id || product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="p-2 font-medium text-gray-900 max-w-[200px] truncate">
                          {product.name}
                        </td>
                        <td className="p-2">
                          <div className="flex flex-wrap gap-1 max-w-[110px]">
                            {(product.categories || []).slice(0, 3).map(cat => (
                              <span key={cat} className="text-xs bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded">
                                {cat}
                              </span>
                            ))}
                            {product.categories.length > 3 && (
                              <span className="text-xs text-gray-500">+{product.categories.length - 3}</span>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-right">
                          <div className="space-y-0.5">
                            {(product.categories || []).slice(0, 2).map(cat => (
                              <div key={cat} className="text-xs">
                                <span className="text-gray-500">{cat}:</span>{' '}
                                <span className="font-bold text-emerald-600">₹{product.price[cat] || 0}</span>
                              </div>
                            ))}
                            {product.categories.length > 2 && (
                              <div className="text-xs text-gray-400">+{product.categories.length - 2} more</div>
                            )}
                          </div>
                        </td>
                        <td className="p-2 text-center">
                          <div className="flex gap-1 justify-center">
                            <button
                              onClick={() => handleEditProduct(product)}
                              className="px-2 py-1 bg-emerald-500 text-white text-xs rounded hover:bg-emerald-600 transition-colors"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteProduct(product._id || '')}
                              className="px-2 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition-colors"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
