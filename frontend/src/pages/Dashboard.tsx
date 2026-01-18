import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductService } from '../services/product.service';
import { ProductResponse } from '../types/api.types';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { Plus, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';

const PAGE_SIZE = 9;

export default function Dashboard() {
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [products, setProducts] = useState<ProductResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [pageNumber, setPageNumber] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // prevents stale API responses from overwriting newer ones
  const requestIdRef = useRef(0);

  const fetchProducts = async (page: number) => {
    if (!user || !token) return;

    const requestId = ++requestIdRef.current;
    setLoading(true);
    setError('');

    try {
      const response = await ProductService.getUserProducts(user.id, token, {
        pageNumber: page,
        pageSize: PAGE_SIZE,
        sortBy: 'expirationDate',
        sortDirection: 'asc',
      });

      if (requestId !== requestIdRef.current) return;

      setProducts(response.content);
      setTotalPages(response.totalPages);
      setTotalElements(response.totalElements);
      setPageNumber(page);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      if (requestId === requestIdRef.current) {
        setLoading(false);
      }
    }
  };

  /* Fetch when dashboard becomes active */
  useEffect(() => {
    if (!authLoading && user && token && location.pathname === '/dashboard') {
      fetchProducts(0);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token, location.pathname]);

  /* Refetch when tab becomes visible again */
  useEffect(() => {
    if (authLoading) return;

    const onVisibility = () => {
      if (
          document.visibilityState === 'visible' &&
          user &&
          token &&
          location.pathname === '/dashboard'
      ) {
        fetchProducts(pageNumber);
      }
    };

    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, user, token, location.pathname, pageNumber]);

  const handlePrevPage = () => {
    if (pageNumber > 0) fetchProducts(pageNumber - 1);
  };

  const handleNextPage = () => {
    if (pageNumber < totalPages - 1) fetchProducts(pageNumber + 1);
  };

  return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100">
        <Navbar />

        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-3xl font-bold text-emerald-800">Your Products</h1>
              <p className="text-emerald-700 mt-1">
                {totalElements} {totalElements === 1 ? 'item' : 'items'} tracked
              </p>
            </div>

            <div className="flex gap-3">
              <button
                  disabled={loading}
                  onClick={() => fetchProducts(pageNumber)}
                  className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border-2 border-emerald-200
                         hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className="w-5 h-5" />
                Refresh
              </button>

              <button
                  onClick={() => navigate('/products/new')}
                  className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg
                         hover:bg-emerald-700 shadow-lg shadow-emerald-200 font-semibold"
              >
                <Plus className="w-5 h-5" />
                Add Product
              </button>
            </div>
          </div>

          {error && (
              <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
          )}

          {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin h-12 w-12 rounded-full border-4 border-emerald-600 border-t-transparent" />
              </div>
          ) : products.length === 0 ? (
              <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                <div className="text-6xl mb-4">🥗</div>
                <h2 className="text-2xl font-bold text-emerald-800 mb-2">
                  No products yet
                </h2>
                <p className="text-gray-600 mb-6">
                  Start tracking your food to reduce waste and save money
                </p>
                <button
                    onClick={() => navigate('/products/new')}
                    className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 shadow-lg"
                >
                  Add Your First Product
                </button>
              </div>
          ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map(product => (
                      <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {totalPages > 1 && (
                    <div className="flex justify-center items-center gap-4 mt-8">
                      <button
                          disabled={pageNumber === 0}
                          onClick={handlePrevPage}
                          className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-emerald-200
                             hover:bg-gray-50 disabled:opacity-50"
                      >
                        <ChevronLeft className="w-5 h-5" />
                        Previous
                      </button>

                      <span className="font-semibold text-emerald-800">
                  Page {pageNumber + 1} of {totalPages}
                </span>

                      <button
                          disabled={pageNumber >= totalPages - 1}
                          onClick={handleNextPage}
                          className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-emerald-200
                             hover:bg-gray-50 disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>
                )}
              </>
          )}
        </div>
      </div>
  );
}
