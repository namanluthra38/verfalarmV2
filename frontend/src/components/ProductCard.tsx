import { Link } from 'react-router-dom';
import { ProductResponse } from '../types/api.types';
import { Calendar, Package, TrendingDown, CircleDotIcon, XCircle, CheckCircleIcon } from 'lucide-react';
import { formatDateISO, formatSignificant } from '../utils/format';

interface ProductCardProps {
  product: ProductResponse;
}

export default function ProductCard({ product }: ProductCardProps) {
  // Safe numeric values (avoid runtime errors if backend returns null/undefined)
  const bought = Number(product.quantityBought ?? 0);
  const consumed = Number(product.quantityConsumed ?? 0);
  const remainingQty = bought - consumed;
  const percentageConsumed = bought > 0 ? (consumed / bought) * 100 : 0;

  const daysUntilExpiration = product.expirationDate ? Math.ceil((new Date(product.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

  // Use backend-provided status as source of truth; fallback to computing from dates/quantities if missing
  const status = product.status ?? ( (bought > 0 && consumed >= bought) ? 'FINISHED' : (daysUntilExpiration != null && daysUntilExpiration < 0) ? 'EXPIRED' : 'AVAILABLE');

  const getStatusColor = () => {
    switch (status) {
      case 'FINISHED': return 'bg-blue-100 border-blue-300 text-blue-800';
      case 'EXPIRED': return 'bg-red-100 border-red-300 text-red-800';
      case 'AVAILABLE': default: return 'bg-emerald-100 border-emerald-300 text-emerald-800';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'FINISHED': return <CheckCircleIcon className="w-5 h-5" />; // finished icon
      case 'EXPIRED': return <XCircle className="w-5 h-5" />;
      case 'AVAILABLE': default: return <CircleDotIcon className="w-5 h-5" />;
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'FINISHED': return 'Finished';
      case 'EXPIRED': return 'Expired';
      case 'AVAILABLE': default:
        if (daysUntilExpiration == null) return 'Available';
        if (daysUntilExpiration === 1) return 'Expires Tomorrow';
        if (daysUntilExpiration > 1) return `${daysUntilExpiration} Days Left`;
        return 'Available';
    }
  };

  return (
    <Link to={`/products/${product.id}`}>
      <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 hover:border-emerald-300 cursor-pointer">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-xl font-bold text-emerald-800">{product.name}</h3>
          <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor()}`}>
            {getStatusIcon()}
            {getStatusText()}
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-600">
            <Package className="w-5 h-5 text-emerald-600" />
            <span>
              {formatSignificant(remainingQty, 2)} of {formatSignificant(product.quantityBought ?? 0, 2)} {product.unit} remaining
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <TrendingDown className="w-5 h-5 text-amber-600" />
            <span>{percentageConsumed.toFixed(1)}% consumed</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>Expires {formatDateISO(product.expirationDate)}</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-3 mt-4">
            <div
              className="bg-gradient-to-r from-emerald-500 to-amber-400 h-3 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(percentageConsumed, 100)}%` }}
            />
          </div>

          {product.tags && product.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {product.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-amber-100 text-amber-800 text-xs font-semibold px-2 py-1 rounded-full"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
