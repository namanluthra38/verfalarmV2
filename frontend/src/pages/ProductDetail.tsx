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
  Calendar,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Minus,
  Plus,
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed');
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!id || !token) return;
    if (!confirm('Delete this product permanently?')) return;

    try {
      await ProductService.deleteProduct(id, token);
      navigate('/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Delete failed');
    }
  };

  if (loading) {
    return (
        <div className="min-h-screen bg-emerald-50">
          <Navbar />
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
          </div>
        </div>
    );
  }

  if (!product || !analysis) {
    return (
        <div className="min-h-screen bg-emerald-50">
          <Navbar />
          <div className="max-w-3xl mx-auto p-6 text-red-700">
            {error || 'Product not found'}
          </div>
        </div>
    );
  }

  /* ---------------- BACKEND TRUTH ONLY ---------------- */

  const {
    remainingQuantity,
    percentConsumed,
    daysUntilExpiration,
    isExpired,
    statusSuggestion,
    recommendedDailyToFinish,
    estimatedFinishDate,
    summary,
  } = analysis;

  const statusUI = (() => {
    switch (statusSuggestion) {
      case 'EXPIRED':
      case 'EXPIRED_AND_FINISHED':
        return { label: 'Expired', color: 'red', Icon: AlertTriangle };
      case 'FINISHED':
        return { label: 'Finished', color: 'amber', Icon: CheckCircle };
      default:
        return { label: 'Usable', color: 'emerald', Icon: CheckCircle };
    }
  })();

  /* ---------------------------------------------------- */

  return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-amber-50">
        <Navbar />

        <div className="max-w-6xl mx-auto p-6 space-y-6">
          <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-emerald-700 font-semibold"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Dashboard
          </button>

          {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 p-3 rounded">
                {error}
              </div>
          )}

          {/* HEADER */}
          <div className="bg-white rounded-2xl shadow p-6 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-emerald-800">
                {product.name}
              </h1>

              <div
                  className={`inline-flex items-center gap-2 mt-2 px-3 py-1 rounded-full text-sm font-semibold
                bg-${statusUI.color}-100 text-${statusUI.color}-800`}
              >
                <statusUI.Icon className="w-4 h-4" />
                {statusUI.label}
              </div>

              <p className="text-sm text-gray-600 mt-3">{summary}</p>
            </div>

            <div className="flex gap-3">
              <button
                  onClick={() => navigate(`/products/${id}/edit`)}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded-lg"
              >
                <Edit className="w-4 h-4" />
                Edit
              </button>
              <button
                  onClick={handleDelete}
                  className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>

          {/* SNAPSHOT */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <InfoCard
                icon={Package}
                title="Remaining"
                value={`${remainingQuantity} ${product.unit}`}
            />

            <InfoCard
                icon={TrendingUp}
                title="Consumed"
                value={`${percentConsumed.toFixed(1)}%`}
            />

            <InfoCard
                icon={Calendar}
                title="Expires In"
                value={
                  daysUntilExpiration === null
                      ? 'No expiry'
                      : isExpired
                          ? 'Expired'
                          : `${daysUntilExpiration} days`
                }
                danger={daysUntilExpiration !== null && daysUntilExpiration <= 3}
            />
          </div>

          {/* GUIDANCE */}
          {!isExpired && recommendedDailyToFinish && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
                <div className="flex items-center gap-2 mb-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  <h2 className="font-semibold text-emerald-800">
                    Suggested daily usage
                  </h2>
                </div>

                <p className="text-2xl font-bold text-emerald-900">
                  {recommendedDailyToFinish.toFixed(2)} {product.unit} / day
                </p>

                {estimatedFinishDate && (
                    <p className="text-sm text-gray-600 mt-1">
                      Expected to finish by{' '}
                      {new Date(estimatedFinishDate).toLocaleDateString()}
                    </p>
                )}

                <button
                    onClick={() => navigate(`/products/${id}/analysis`)}
                    className="mt-4 text-emerald-700 font-semibold underline"
                >
                  View detailed analysis
                </button>
              </div>
          )}

          {/* UPDATE CONSUMPTION */}
          <div className="bg-white rounded-2xl shadow p-6">
            <h2 className="text-xl font-bold text-emerald-800 mb-4">
              Update Consumption
            </h2>

            <div className="flex items-center gap-3 mb-4">
              <button
                  onClick={() =>
                      setConsumedInput(prev => Math.max(0, prev - 1))
                  }
                  className="p-3 bg-gray-200 rounded-lg"
              >
                <Minus className="w-5 h-5" />
              </button>

              <input
                  type="number"
                  min="0"
                  step="0.1"
                  value={consumedInput}
                  onChange={e =>
                      setConsumedInput(Number(e.target.value) || 0)
                  }
                  className="flex-1 text-center text-xl font-bold border rounded-lg p-3"
              />

              <button
                  onClick={() => setConsumedInput(prev => prev + 1)}
                  className="p-3 bg-gray-200 rounded-lg"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

            <button
                onClick={handleUpdateConsumed}
                disabled={updating || consumedInput === product.quantityConsumed}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
            >
              {updating ? 'Updating…' : 'Update'}
            </button>
          </div>
        </div>
      </div>
  );
}


function InfoCard({
                    icon: Icon,
                    title,
                    value,
                    danger,
                  }: {
  icon: any;
  title: string;
  value: string;
  danger?: boolean;
}) {
  return (
      <div
          className={`rounded-xl p-6 border ${
              danger
                  ? 'bg-red-50 border-red-200'
                  : 'bg-emerald-50 border-emerald-200'
          }`}
      >
        <div className="flex items-center gap-2 mb-1">
          <Icon className="w-5 h-5 text-emerald-600" />
          <p className="text-sm text-gray-700">{title}</p>
        </div>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
  );
}
