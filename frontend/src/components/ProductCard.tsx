import { Link } from 'react-router-dom';
import { ProductResponse } from '../types/api.types';
import { Calendar, Package, TrendingDown, CircleDotIcon, XCircle, CheckCircleIcon } from 'lucide-react';
import { formatDateISO, formatSignificant } from '../utils/format';
import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { ProductService } from '../services/product.service';
import { Trash2, AlertTriangle } from 'lucide-react';

interface ProductCardProps {
  product: ProductResponse;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { token } = useAuth();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
   // Safe numeric values (avoid runtime errors if backend returns null/undefined)
   const bought = Number(product.quantityBought ?? 0);
   const consumed = Number(product.quantityConsumed ?? 0);
   const remainingQty = bought - consumed;
   const percentageConsumed = bought > 0 ? (consumed / bought) * 100 : 0;

   const daysUntilExpiration = product.expirationDate ? Math.ceil((new Date(product.expirationDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : null;

   // Use backend-provided status as source of truth; fallback to computing from dates/quantities if missing
   const status = product.status ?? ( (bought > 0 && consumed >= bought) ? 'FINISHED' : (daysUntilExpiration != null && daysUntilExpiration < 0) ? 'EXPIRED' : 'AVAILABLE');

  const canQuickDelete = status === 'FINISHED' || status === 'EXPIRED';

  const handleDelete = async () => {
    if (!token) return;
    setDeleting(true);
    try {
      await ProductService.deleteProduct(product.id, token);
      // Refresh the page/list after deletion - minimal approach to let parent reload
      window.location.reload();
    } catch (err) {
      // swallow or optionally display an alert
      console.error('Failed to delete product', err);
      setShowDeleteConfirm(false);
      setDeleting(false);
      alert(err instanceof Error ? err.message : 'Delete failed');
    }
  };

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
    <div>
      <Link to={`/products/${product.id}`}>
        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border-2 border-gray-100 hover:border-emerald-300 cursor-pointer">
           <div className="flex justify-between items-start mb-4">
             <h3 className="text-xl font-bold text-emerald-800">{product.name}</h3>
            <div className="flex items-center gap-2">
              <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold border-2 ${getStatusColor()}`}>
                {getStatusIcon()}
                {getStatusText()}
              </div>

              {/* Quick delete button - only for finished/expired */}
              {canQuickDelete && (
                <button
                  onClick={(e) => { e.preventDefault(); setShowDeleteConfirm(true); }}
                  title="Quick delete"
                  className="ml-2 p-2 rounded-full bg-red-50 hover:bg-red-100 text-red-600 border border-red-100"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
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

      {/* Delete Confirmation Modal (copied/adapted from ProductDetail) */}
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
                  disabled={deleting}
                  className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors"
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
     </div>
   );
 }
