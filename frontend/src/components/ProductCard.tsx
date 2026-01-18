import { Link } from 'react-router-dom';
import { ProductResponse } from '../types/api.types';
import { Calendar, Package, TrendingDown, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

interface ProductCardProps {
  product: ProductResponse;
}

export default function ProductCard({ product }: ProductCardProps) {
  const remainingQty = product.quantityBought - product.quantityConsumed;
  const percentageConsumed = (product.quantityConsumed / product.quantityBought) * 100;

  const daysUntilExpiration = Math.ceil(
    (new Date(product.expirationDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  const getStatusColor = () => {
    if (daysUntilExpiration <= 0) return 'bg-red-100 border-red-300 text-red-800';
    if (daysUntilExpiration <= 3) return 'bg-orange-100 border-orange-300 text-orange-800';
    return 'bg-emerald-100 border-emerald-300 text-emerald-800';
  };

  const getStatusIcon = () => {
    if (daysUntilExpiration <= 0) return <XCircle className="w-5 h-5" />;
    if (daysUntilExpiration <= 3) return <AlertCircle className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (daysUntilExpiration <= 0) return 'Expired';
    if (daysUntilExpiration === 1) return 'Expires Tomorrow';
    if (daysUntilExpiration <= 3) return `${daysUntilExpiration} Days Left`;
    return `${daysUntilExpiration} Days Left`;
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
              {remainingQty} of {product.quantityBought} {product.unit} remaining
            </span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <TrendingDown className="w-5 h-5 text-amber-600" />
            <span>{percentageConsumed.toFixed(1)}% consumed</span>
          </div>

          <div className="flex items-center gap-2 text-gray-600">
            <Calendar className="w-5 h-5 text-emerald-600" />
            <span>Expires {new Date(product.expirationDate).toLocaleDateString()}</span>
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
