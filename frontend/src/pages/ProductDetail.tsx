// TypeScript
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductService } from '../services/product.service';
import { ProductResponse, ProductAnalysis } from '../types/api.types';
import Navbar from '../components/Navbar';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Package,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Calendar,
  Clock,
  Target,
  Sparkles,
  Info,
} from 'lucide-react';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { token } = useAuth();
  const navigate = useNavigate();

  const [product, setProduct] = useState<ProductResponse | null>(null);
  const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [consumedInput, setConsumedInput] = useState(0);
  const [updating, setUpdating] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    if (!id || !token) return;

    setLoading(true);
    Promise.all([
      ProductService.getProduct(id, token),
      ProductService.analyzeProduct(id, token),
    ])
        .then(([p, a]) => {
          setProduct(p);
          setAnalysis(a);
          setConsumedInput(p.quantityConsumed ?? 0);
        })
        .catch(err =>
            setError(err instanceof Error ? err.message : 'Failed to load product')
        )
        .finally(() => setLoading(false));
  }, [id, token]);

  const handleUpdateConsumed = async () => {
    if (!id || !token) return;

    setUpdating(true);
    try {
      await ProductService.updateQuantityConsumed(
          id,
          { quantityConsumed: consumedInput },
          token
      );
      const [p, a] = await Promise.all([
        ProductService.getProduct(id, token),
        ProductService.analyzeProduct(id, token),
      ]);
      setProduct(p);
      setAnalysis(a);
      setError(''); // Clear any previous errors
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !token) return;

    try {
      await ProductService.deleteProduct(id, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
          <Navbar />
          <div className="flex justify-center items-center h-96">
            <div className="text-center space-y-4">
              <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto" />
              <p className="text-emerald-700 font-medium">Loading product details...</p>
            </div>
          </div>
        </div>
    );
  }

  if (!product || !analysis) {
    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
          <Navbar />
          <div className="max-w-3xl mx-auto p-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-800 mb-2">Product Not Found</h2>
              <p className="text-red-600 mb-6">{error || 'This product could not be loaded'}</p>
              <button
                  onClick={() => navigate('/dashboard')}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
    );
  }

  const {
    remainingQuantity,
    percentConsumed,
    daysUntilExpiration,
    isExpired,
    statusSuggestion,
    recommendedDailyToFinish,
    estimatedFinishDate,
    warnings,
  } = analysis;

  const statusUI = (() => {
    switch (statusSuggestion) {
      case 'EXPIRED':
        return {
          label: 'Expired',
          color: 'red',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
          borderColor: 'border-red-200',
          Icon: AlertTriangle
        };
      case 'FINISHED':
        return {
          label: 'Finished',
          color: 'blue',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
          borderColor: 'border-blue-200',
          Icon: CheckCircle
        };
      default:
        return {
          label: 'Active',
          color: 'emerald',
          bgColor: 'bg-emerald-100',
          textColor: 'text-emerald-800',
          borderColor: 'border-emerald-200',
          Icon: CheckCircle
        };
    }
  })();

  const maxQuantity =
      product.quantityBought ??
      Math.max(product.quantityConsumed ?? 0, remainingQuantity + (product.quantityConsumed ?? 0));

  const sliderPercent = maxQuantity > 0 ? Math.min(100, (consumedInput / maxQuantity) * 100) : 0;

  // Determine urgency level for visual feedback
  const urgencyLevel = (() => {
    if (isExpired) return 'expired';
    if (daysUntilExpiration !== null && daysUntilExpiration <= 3) return 'critical';
    if (daysUntilExpiration !== null && daysUntilExpiration <= 7) return 'warning';
    return 'normal';
  })();

  const hasChanged = consumedInput !== (product.quantityConsumed ?? 0);

  return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <button
                onClick={() => navigate('/dashboard')}
                className="group flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
              <span>Back to Dashboard</span>
            </button>
          </div>

          {/* Error Banner */}
          {error && (
              <div className="mb-6 bg-red-50 border-l-4 border-red-500 rounded-r-xl p-4 shadow-sm animate-shake">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-red-800">Error</h3>
                    <p className="text-red-700 text-sm mt-1">{error}</p>
                  </div>
                  <button
                      onClick={() => setError('')}
                      className="text-red-400 hover:text-red-600 transition-colors"
                  >
                    ×
                  </button>
                </div>
              </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Hero Card */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-start gap-6 flex-1">
                      {/* Product Image Placeholder */}
                      <div className="flex-shrink-0">
                        <div className="w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-2xl flex items-center justify-center border-2 border-emerald-300">
                          <Package className="w-12 h-12 text-emerald-600" />
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="flex-1">
                        <div className="mb-3">
                          <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                          <p className="text-sm text-gray-500">
                            Added {new Date(product.createdAt).toLocaleDateString()}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold ${statusUI.bgColor} ${statusUI.textColor} border ${statusUI.borderColor}`}>
                          <statusUI.Icon className="w-4 h-4" />
                          {statusUI.label}
                        </span>

                          {daysUntilExpiration !== null && !isExpired && (
                              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                                  urgencyLevel === 'critical'
                                      ? 'bg-red-100 text-red-800 border border-red-200'
                                      : urgencyLevel === 'warning'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                              }`}>
                            <Clock className="w-4 h-4" />
                                {daysUntilExpiration} days left
                          </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Quick Stats Grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
                    <StatCard
                        icon={TrendingUp}
                        label="Consumed"
                        value={typeof percentConsumed === 'number' ? `${percentConsumed.toFixed(1)}%` : '—'}
                        color="emerald"
                    />
                    <StatCard
                        icon={Package}
                        label="Remaining"
                        value={`${remainingQuantity} ${product.unit}`}
                        color="blue"
                    />
                    {product.expirationDate && (
                        <StatCard
                            icon={Calendar}
                            label="Expires"
                            value={new Date(product.expirationDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            color={urgencyLevel === 'critical' ? 'red' : urgencyLevel === 'warning' ? 'amber' : 'gray'}
                        />
                    )}
                  </div>
                </div>
              </div>

              {/* Warnings */}
              {warnings && warnings.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-2xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                        <h3 className="font-semibold text-amber-900">Important Notices</h3>
                      </div>
                      <div className="space-y-3">
                        {warnings.map((warning, idx) => (
                            <div key={idx} className="flex items-start gap-3 bg-white/60 rounded-lg p-3">
                              <Info className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                              <p className="text-sm text-amber-900">{warning}</p>
                            </div>
                        ))}
                      </div>
                    </div>
                  </div>
              )}

              {/* Consumption Tracker */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-6">
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Target className="w-6 h-6" />
                    Update Consumption
                  </h2>
                  <p className="text-emerald-100 text-sm mt-1">Track how much you've used</p>
                </div>

                <div className="p-6">
                  <div className="space-y-6">
                    {/* Current Progress Display */}
                    <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border border-emerald-200">
                      <div className="flex items-baseline justify-between mb-3">
                        <span className="text-sm font-medium text-gray-700">Current Progress</span>
                        <span className="text-3xl font-bold text-emerald-700">
                        {sliderPercent.toFixed(0)}%
                      </span>
                      </div>
                      <div className="flex items-baseline justify-between text-sm text-gray-600">
                        <span>{consumedInput.toFixed(1)} {product.unit} consumed</span>
                        <span>{remainingQuantity.toFixed(1)} {product.unit} left</span>
                      </div>
                    </div>

                    {/* Interactive Slider */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-4">
                        Adjust consumption amount
                      </label>

                      <div className="relative">
                        {/* Progress background */}
                        <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
                          <div
                              className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-300 ease-out rounded-full"
                              style={{ width: `${sliderPercent}%` }}
                          />
                        </div>

                        {/* Slider input */}
                        <input
                            type="range"
                            min={0}
                            max={maxQuantity}
                            step={0.1}
                            value={consumedInput}
                            onChange={e => setConsumedInput(Number(e.target.value))}
                            className="absolute left-0 top-0 w-full h-3 opacity-0 cursor-pointer"
                        />
                      </div>

                      <div className="flex justify-between text-xs text-gray-500 mt-2">
                        <span>0 {product.unit}</span>
                        <span>{maxQuantity} {product.unit}</span>
                      </div>
                    </div>

                    {/* Update Button */}
                    <button
                        onClick={handleUpdateConsumed}
                        disabled={updating || !hasChanged}
                        className={`w-full py-4 rounded-xl font-semibold text-white transition-all duration-200 ${
                            hasChanged && !updating
                                ? 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5'
                                : 'bg-gray-300 cursor-not-allowed'
                        }`}
                    >
                      {updating ? (
                          <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin" />
                        Updating...
                      </span>
                      ) : hasChanged ? (
                          'Save Changes'
                      ) : (
                          'No Changes to Save'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Sidebar */}
            <div className="space-y-6">
              {/* Smart Recommendations */}
              {!isExpired && recommendedDailyToFinish && (
                  <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg border border-purple-200 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6">
                      <div className="flex items-center gap-2 text-white">
                        <Sparkles className="w-6 h-6" />
                        <h3 className="font-bold text-lg">Smart Suggestion</h3>
                      </div>
                    </div>

                    <div className="p-6">
                      <p className="text-sm text-gray-600 mb-4">
                        To finish before expiration:
                      </p>
                      <div className="bg-white rounded-xl p-5 border-2 border-purple-200 mb-4">
                        <p className="text-4xl font-bold text-purple-700 mb-1">
                          {recommendedDailyToFinish.toFixed(1)}
                        </p>
                        <p className="text-sm text-gray-600">{product.unit} per day</p>
                      </div>

                      {estimatedFinishDate && (
                          <div className="flex items-start gap-2 text-sm text-gray-700 bg-purple-50 rounded-lg p-3">
                            <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                            <p>
                              Expected finish date: <strong>{new Date(estimatedFinishDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</strong>
                            </p>
                          </div>
                      )}
                    </div>
                  </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
                  <div className="space-y-3">
                    <button
                        onClick={() => navigate(`/products/${id}/analysis`)}
                        className="w-full flex items-center justify-between bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white px-4 py-3 rounded-xl font-medium transition-all shadow-sm hover:shadow-md"
                    >
                    <span className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5" />
                      Full Analysis
                    </span>
                      <ArrowLeft className="w-4 h-4 rotate-180" />
                    </button>

                    <button
                        onClick={() => navigate(`/products/${id}/edit`)}
                        className="w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-sm"
                    >
                      <Edit className="w-5 h-5" />
                      Edit Product
                    </button>

                    <button
                        onClick={() => setShowDeleteConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-3 rounded-xl font-medium transition-colors shadow-sm"
                    >
                      <Trash2 className="w-5 h-5" />
                      Delete Product
                    </button>
                  </div>
                </div>
              </div>

              {/* Product Info */}
              <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                <div className="p-6">
                  <h3 className="font-semibold text-gray-900 mb-4">Product Details</h3>
                  <dl className="space-y-3 text-sm">
                    <div className="flex justify-between py-2 border-b border-gray-100">
                      <dt className="text-gray-600">Total Quantity</dt>
                      <dd className="font-semibold text-gray-900">{maxQuantity} {product.unit}</dd>
                    </div>
                    {product.expirationDate && (
                        <div className="flex justify-between py-2 border-b border-gray-100">
                          <dt className="text-gray-600">Expiration Date</dt>
                          <dd className="font-semibold text-gray-900">
                            {new Date(product.expirationDate).toLocaleDateString('en-US', {
                              month: 'long',
                              day: 'numeric',
                              year: 'numeric'
                            })}
                          </dd>
                        </div>
                    )}
                    <div className="flex justify-between py-2">
                      <dt className="text-gray-600">Created</dt>
                      <dd className="font-semibold text-gray-900">
                        {new Date(product.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && (
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-scale-in">
                <div className="bg-red-500 p-6">
                  <div className="flex items-center gap-3 text-white">
                    <div className="p-3 bg-white/20 rounded-full">
                      <AlertTriangle className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-bold">Delete Product</h3>
                  </div>
                </div>

                <div className="p-6">
                  <p className="text-gray-700 mb-6">
                    Are you sure you want to delete <strong>{product.name}</strong>? This action cannot be undone.
                  </p>

                  <div className="flex gap-3">
                    <button
                        onClick={() => setShowDeleteConfirm(false)}
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                        onClick={handleDelete}
                        className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
        )}
      </div>
  );
}

function StatCard({
                    icon: Icon,
                    label,
                    value,
                    color = 'gray',
                  }: {
  icon: any;
  label: string;
  value: string;
  color?: string;
}) {
  const colorClasses = {
    emerald: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    blue: 'bg-blue-100 text-blue-700 border-blue-200',
    red: 'bg-red-100 text-red-700 border-red-200',
    amber: 'bg-amber-100 text-amber-700 border-amber-200',
    gray: 'bg-gray-100 text-gray-700 border-gray-200',
  };

  return (
      <div className="bg-white rounded-xl p-4 border border-gray-200 hover:shadow-md transition-shadow">
        <div className={`inline-flex items-center justify-center p-2 rounded-lg mb-2 ${colorClasses[color as keyof typeof colorClasses]}`}>
          <Icon className="w-5 h-5" />
        </div>
        <p className="text-xs text-gray-600 font-medium mb-1">{label}</p>
        <p className="text-xl font-bold text-gray-900">{value}</p>
      </div>
  );
}