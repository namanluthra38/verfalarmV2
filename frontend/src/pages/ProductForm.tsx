import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductService } from '../services/product.service';
import { NotificationFrequency, ProductRequest } from '../types/api.types';
import Navbar from '../components/Navbar';
import { Save, ArrowLeft, X, Plus } from 'lucide-react';
import { Unit } from '../types/Unit';

export default function ProductForm() {
  const { id } = useParams();
  const isEditMode = !!id;
  const { token } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<ProductRequest>({
    name: '',
    quantityBought: 1,
    quantityConsumed: 0,
    unit: Unit.PIECES,
    purchaseDate: new Date().toISOString().split('T')[0],
    expirationDate: '',
    notificationFrequency: 'WEEKLY',
    tags: [],
  });

  const [tagInput, setTagInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isEditMode && token && id) {
      fetchProduct();
    }
  }, [id, token]);

  const fetchProduct = async () => {
    if (!token || !id) return;

    try {
      const product = await ProductService.getProduct(id, token);
      setFormData({
        name: product.name,
        quantityBought: product.quantityBought,
        quantityConsumed: product.quantityConsumed,
        unit: (product.unit as unknown) as Unit,
        purchaseDate: product.purchaseDate,
        expirationDate: product.expirationDate,
        notificationFrequency: product.notificationFrequency,
        tags: product.tags || [],
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load product');
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setLoading(true);
    setError('');

    try {
      if (isEditMode && id) {
        await ProductService.updateProduct(id, formData, token);
      } else {
        await ProductService.createProduct(formData, token);
      }
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save product');
    } finally {
      setLoading(false);
    }
  };

  const handleAddTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()],
      });
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter((tag) => tag !== tagToRemove),
    });
  };

  const unitOptions = Object.values(Unit) as Unit[];

  return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100">
        <Navbar />

        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-emerald-700 hover:text-emerald-800 mb-6 font-semibold transition"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <h1 className="text-3xl font-bold text-emerald-800 mb-6">
              {isEditMode ? 'Edit Product' : 'Add New Product'}
            </h1>

            {error && (
                <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                  {error}
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Product Name *
                </label>
                <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                    placeholder="e.g., Greek Yogurt"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Bought *
                  </label>
                  <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={formData.quantityBought}
                      onChange={(e) =>
                          setFormData({ ...formData, quantityBought: parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Quantity Consumed *
                  </label>
                  <input
                      type="number"
                      required
                      min="0"
                      step="0.1"
                      value={formData.quantityConsumed}
                      onChange={(e) =>
                          setFormData({ ...formData, quantityConsumed: parseFloat(e.target.value) })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Unit *
                </label>

                <div className="flex flex-wrap gap-3">
                  {unitOptions.map((u) => {
                    const isSelected = formData.unit === u;
                    return (
                        <button
                            key={u}
                            type="button"
                            onClick={() => setFormData({ ...formData, unit: u })}
                            className={`px-4 py-2.5 rounded-lg text-sm font-semibold border-2 transition-all duration-200 ${
                                isSelected
                                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-200 scale-105'
                                    : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400 hover:bg-emerald-50 hover:text-emerald-700'
                            }`}
                        >
                          {u}
                        </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Purchase Date *
                  </label>
                  <input
                      type="date"
                      required
                      value={formData.purchaseDate}
                      onChange={(e) => setFormData({ ...formData, purchaseDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Expiration Date *
                  </label>
                  <input
                      type="date"
                      required
                      value={formData.expirationDate}
                      onChange={(e) => setFormData({ ...formData, expirationDate: e.target.value })}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notification Frequency
                </label>
                <select
                    value={formData.notificationFrequency}
                    onChange={(e) =>
                        setFormData({
                          ...formData,
                          notificationFrequency: e.target.value as NotificationFrequency,
                        })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                >
                  <option value="DAILY">Daily</option>
                  <option value="WEEKLY">Weekly</option>
                  <option value="MONTHLY">Monthly</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags
                </label>
                <div className="flex gap-2 mb-3">
                  <input
                      type="text"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                      className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
                      placeholder="Add a tag"
                  />
                  <button
                      type="button"
                      onClick={handleAddTag}
                      className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-lg transition"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                {formData.tags && formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {formData.tags.map((tag) => (
                          <span
                              key={tag}
                              className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2"
                          >
                      {tag}
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="hover:text-amber-900"
                            >
                        <X className="w-4 h-4" />
                      </button>
                    </span>
                      ))}
                    </div>
                )}
              </div>

              <div className="flex gap-4 pt-4">
                <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 px-6 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200"
                >
                  <Save className="w-5 h-5" />
                  {loading ? 'Saving...' : isEditMode ? 'Update Product' : 'Add Product'}
                </button>
                <button
                    type="button"
                    onClick={() => navigate('/dashboard')}
                    className="px-6 py-3 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
  );
}
