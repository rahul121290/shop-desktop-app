// src/app/product-prices/page.tsx
// ✅ COMPLETE COPY-PASTE READY - MongoDB Connected

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

  const handleAddCategory = () => {
    const catName = newCategoryName.trim();
    if (catName && !categories.includes(catName)) {
      setCategories([...categories, catName]);
      setPrices({ ...prices, [catName]: 0 });
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
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 flex items-center justify-center">
        <div className="text-lg">Loading products from MongoDB...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-indigo-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent mb-4">
            Product Price Manager
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Manage product prices category-wise. Data saved to MongoDB.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Form Column */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingProductId ? '✏️ Edit Product' : '➕ Add Product'}
              </h2>
              {editingProductId && (
                <button
                  onClick={resetForm}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-all text-sm"
                >
                  Cancel
                </button>
              )}
            </div>

            {/* Product Name */}
            <div className="relative mb-6">
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Product Name *
              </label>
              <input
                type="text"
                placeholder="Enter product name"
                className="w-full p-4 border border-gray-200 rounded-2xl focus:ring-4 focus:ring-blue-500 focus:border-blue-500 text-lg"
                value={productName}
                onChange={handleProductNameChange}
              />
              
              {/* Product Suggestions */}
              {showProductSuggestions && productNameSuggestions.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border z-20 max-h-60 overflow-y-auto">
                  {productNameSuggestions.map((product) => (
                    <div
                      key={product._id || product.id}
                      className="p-4 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center justify-between"
                      onClick={() => handleSelectProductSuggestion(product)}
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{product.name}</div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(product.categories || []).slice(0, 3).map(cat => (
                            <span key={cat} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                      <span className="text-sm bg-blue-500 text-white px-3 py-1 rounded-full">EDIT</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Categories */}
            <div className="mb-8">
              <label className="block text-lg font-semibold text-gray-700 mb-4">
                Price Categories *
              </label>

              <div className="relative mb-6">
                <div className="flex gap-3 p-3 bg-blue-50 rounded-xl border-2 border-blue-100">
                  <input
                    type="text"
                    placeholder="Category (Piece, Dozen...)"
                    className="flex-1 p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-400 text-base"
                    value={newCategoryName}
                    onChange={handleCategoryNameChange}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddCategory()}
                  />
                  <button
                    onClick={handleAddCategory}
                    disabled={!newCategoryName.trim()}
                    className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap text-sm"
                  >
                    Add
                  </button>
                </div>

                {showCategorySuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border z-10 max-h-48 overflow-y-auto">
                    {allCategories
                      .filter(cat => 
                        cat.toLowerCase().includes(newCategoryName.toLowerCase()) && 
                        !categories.includes(cat)
                      )
                      .slice(0, 6)
                      .map(category => (
                        <div
                          key={category}
                          className="p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 last:border-b-0 flex items-center gap-2"
                          onClick={() => handleSelectCategorySuggestion(category)}
                        >
                          <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                          <span className="font-medium">{category}</span>
                          <span className="ml-auto text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">Used</span>
                        </div>
                      ))}
                  </div>
                )}
              </div>

              {categories.length > 0 ? (
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {categories.map(category => (
                    <div key={category} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl border hover:shadow-sm">
                      <span className="font-semibold text-base">{category}</span>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center">
                          <span className="text-gray-500 mr-2">₹</span>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            className="w-24 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-400 text-right font-mono"
                            value={prices[category] || 0}
                            onChange={(e) => setPrices({
                              ...prices,
                              [category]: parseFloat(e.target.value) || 0
                            })}
                          />
                        </div>
                        <button
                          onClick={() => handleRemoveCategory(category)}
                          className="p-2 text-red-500 hover:bg-red-50 rounded-lg hover:scale-110 transition-all"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                  Add your first category above
                </div>
              )}
            </div>

            <button
              onClick={handleSaveProduct}
              disabled={!productName.trim() || categories.length === 0 || saving}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white py-4 rounded-2xl font-bold shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all disabled:opacity-50 disabled:cursor-not-allowed text-lg"
            >
              {saving ? "Saving..." : (editingProductId ? "💾 Update Product" : "✅ Save Product")}
            </button>
          </div>

          {/* Products List */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Products ({products.length})
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {products.length === 0 ? (
                <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-xl">
                  No products yet. Add your first one!
                </div>
              ) : (
                products.map((product) => (
                  <div key={product._id || product.id} className="group bg-white p-6 rounded-2xl border-2 border-gray-200 hover:border-emerald-300 hover:shadow-xl transition-all cursor-pointer hover:bg-emerald-50">
                    <div className="flex justify-between items-start mb-4">
                      <h3 className="text-xl font-bold text-gray-900">{product.name}</h3>
                      <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-semibold hover:bg-emerald-600 text-sm transition-all"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id || '')}
                          className="px-4 py-2 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 text-sm transition-all"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                      {(product.categories || []).map((category) => (
                        <div key={category} className="text-center p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl border hover:shadow-md transition-all">
                          <div className="font-semibold text-sm text-gray-800">{category}</div>
                          <div className="text-lg font-bold text-emerald-600 mt-1">
                            ₹{product.price[category] || 0}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
