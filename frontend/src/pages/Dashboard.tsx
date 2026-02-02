import { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductService } from '../services/product.service';
import { ProductResponse } from '../types/api.types';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import { Plus, RefreshCw, SearchX, Search, ChevronLeft, ChevronRight, ArrowDownToDot, ArrowUpFromDot } from 'lucide-react';

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

  // Sort state
  const DEFAULT_SORT_BY = 'expirationDate';
  const DEFAULT_SORT_DIR = 'asc' as const;
  const [sortBy, setSortBy] = useState<string>(() => {
    try { return localStorage.getItem('prod_sortBy') || DEFAULT_SORT_BY; } catch(e) { return DEFAULT_SORT_BY; }
  });
  const [sortDirection, setSortDirection] = useState<'asc'|'desc'>(() => {
    try {
      const v = localStorage.getItem('prod_sortDir');
      return v === 'desc' ? 'desc' : DEFAULT_SORT_DIR;
    } catch (e) { return DEFAULT_SORT_DIR; }
  });

  // Filters
  const FILTER_KEY = 'prod_filters_v1';
  const [filterStatuses, setFilterStatuses] = useState<string[]>(() => {
    try { const raw = localStorage.getItem(FILTER_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return parsed.statuses || []; } catch(e) { return []; }
  });
  const [filterNotificationFreqs, setFilterNotificationFreqs] = useState<string[]>(() => {
    try { const raw = localStorage.getItem(FILTER_KEY); if (!raw) return []; const parsed = JSON.parse(raw); return parsed.notificationFrequencies || []; } catch(e) { return []; }
  });

  // Search state and debounce
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQuery(searchQuery.trim()), 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  // When the debounced query changes, fetch results (reset to first page).
  // We intentionally avoid listing fetchProducts in deps to prevent re-creating the effect loop.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (authLoading) return;
    if (!user || !token) return;
    if (location.pathname !== '/dashboard') return;

    // always fetch first page for a new query
    fetchProducts(0);
  }, [debouncedQuery, authLoading, user, token, location.pathname]);

  const requestIdRef = useRef(0);

  const ALLOWED_SORT_FIELDS = ['name','purchaseDate','expirationDate','createdAt','percentageLeft'];
  const SORT_LABELS: Record<string,string> = {
    name: 'Name', purchaseDate: 'Purchase date', expirationDate: 'Expiration date', createdAt: 'Tracking Since', percentageLeft: 'Percentage Left'
  };

  useEffect(() => {
    try { if (!ALLOWED_SORT_FIELDS.includes(sortBy)) { setSortBy(DEFAULT_SORT_BY); localStorage.setItem('prod_sortBy', DEFAULT_SORT_BY); } } catch(e) {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const persistFilters = (statuses: string[], freqs: string[]) => {
    try { localStorage.setItem(FILTER_KEY, JSON.stringify({ statuses, notificationFrequencies: freqs })); } catch(e) {}
  };

  const sortProductsLocal = (items: ProductResponse[], field: string, dir: 'asc'|'desc') => {
    const mul = dir === 'asc' ? 1 : -1;
    const copy = [...items];
    copy.sort((a,b) => {
      const av = (a as any)[field];
      const bv = (b as any)[field];
      if (av == null && bv == null) return 0;
      if (av == null) return 1 * mul;
      if (bv == null) return -1 * mul;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * mul;
      const dateA = Date.parse(String(av)); const dateB = Date.parse(String(bv));
      if (!isNaN(dateA) && !isNaN(dateB)) return (dateA - dateB) * mul;
      return String(av).localeCompare(String(bv)) * mul;
    });
    return copy;
  };

  const applySortPreference = (newSortBy: string, newSortDir: 'asc'|'desc') => {
    if (!ALLOWED_SORT_FIELDS.includes(newSortBy)) return;
    setSortBy(newSortBy); setSortDirection(newSortDir);
    try { localStorage.setItem('prod_sortBy', newSortBy); localStorage.setItem('prod_sortDir', newSortDir); } catch(e) {}
    setProducts(prev => sortProductsLocal(prev, newSortBy, newSortDir));
    fetchProducts(pageNumber, newSortBy, newSortDir).catch(() => {});
  };

  const fetchProducts = async (page: number, sortByOverride?: string, sortDirOverride?: 'asc'|'desc', statusesOverride?: string[], nfOverride?: string[]) => {
    if (!user || !token) return;
    const requestId = ++requestIdRef.current;
    setLoading(true); setError('');
    const useSortBy = sortByOverride ?? sortBy;
    const useSortDirection = sortDirOverride ?? sortDirection;
    const useStatuses = statusesOverride ?? filterStatuses;
    const useNf = nfOverride ?? filterNotificationFreqs;

    try {
      let response;
      if (debouncedQuery && debouncedQuery.length > 0) {
        response = await ProductService.searchUserProducts(user.id, token, debouncedQuery, {
          pageNumber: page, pageSize: PAGE_SIZE, sortBy: useSortBy, sortDirection: useSortDirection
        });
      } else {
        response = await ProductService.getUserProducts(user.id, token, {
          pageNumber: page, pageSize: PAGE_SIZE, sortBy: useSortBy, sortDirection: useSortDirection,
          statuses: useStatuses.length ? useStatuses : undefined,
          notificationFrequencies: useNf.length ? useNf : undefined,
        });
      }

      if (requestId !== requestIdRef.current) return;
      setProducts(response.content); setTotalPages(response.totalPages); setTotalElements(response.totalElements); setPageNumber(page);
    } catch (err) {
      if (requestId !== requestIdRef.current) return;
      setError(err instanceof Error ? err.message : 'Failed to load products');
    } finally {
      if (requestId === requestIdRef.current) setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && token && location.pathname === '/dashboard') {
      let didFetch = false;
      const doRecomputeThenFetch = async () => {
        try {
          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 3000);
          try { await ProductService.recomputeStatuses(user.id, token, controller.signal); } finally { clearTimeout(timeout); }
        } catch (e) {}
        finally { if (!didFetch) { didFetch = true; fetchProducts(0).catch(() => {}); } }
      };
      doRecomputeThenFetch();
    }
  }, [authLoading, user, token, location.pathname]);

  useEffect(() => {
    if (authLoading) return;
    const onVisibility = () => {
      if (document.visibilityState === 'visible' && user && token && location.pathname === '/dashboard') {
        fetchProducts(pageNumber);
      }
    };
    document.addEventListener('visibilitychange', onVisibility);
    return () => document.removeEventListener('visibilitychange', onVisibility);
  }, [authLoading, user, token, location.pathname, pageNumber, debouncedQuery]);

  const handlePrevPage = () => { if (pageNumber > 0) fetchProducts(pageNumber - 1); };
  const handleNextPage = () => { if (pageNumber < totalPages - 1) fetchProducts(pageNumber + 1); };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-amber-50 to-emerald-100">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-emerald-800">Your Products</h1>
            <p className="text-emerald-700 mt-1">{totalElements} {totalElements === 1 ? 'item' : 'items'} tracked</p>
          </div>

          <div className="flex gap-3 items-center">
            <div className="relative">
              <SortControl sortBy={sortBy} sortDir={sortDirection} onChange={applySortPreference} labels={SORT_LABELS} />
            </div>

            <div className="relative">
              <FilterControl statuses={filterStatuses} notificationFreqs={filterNotificationFreqs} onChange={(s,f) => { setFilterStatuses(s); setFilterNotificationFreqs(f); persistFilters(s,f); fetchProducts(0, sortBy, sortDirection, s, f).catch(()=>{}); }} />
            </div>

            <div className="relative">
              <div className="flex items-center bg-white px-3 py-2 rounded-lg border-2 border-emerald-200">
                <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search by name..." className="outline-none w-64 text-sm" />
                {searchQuery ? (
                  <button onClick={() => { setSearchQuery(''); setDebouncedQuery(''); fetchProducts(0).catch(()=>{}); }} className="ml-2 text-gray-500">Clear</button>
                ) : (
                  <Search className="w-5 h-5 text-emerald-600 ml-2" />
                )}
              </div>
            </div>

            <button disabled={loading} onClick={() => fetchProducts(pageNumber)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg shadow-md border-2 border-emerald-200 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed">
              <RefreshCw className="w-5 h-5" /> Refresh
            </button>

            <button onClick={() => navigate('/products/new')} className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700 shadow-lg shadow-emerald-200 font-semibold">
              <Plus className="w-5 h-5" /> Add Product
            </button>
          </div>
        </div>

        {error && (<div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">{error}</div>)}

        {loading ? (
          <div className="flex justify-center items-center h-64"><div className="animate-spin h-12 w-12 rounded-full border-4 border-emerald-600 border-t-transparent" /></div>
        ) : products.length === 0 ? (
          (filterStatuses.length > 0 || filterNotificationFreqs.length > 0) ? (
            <div className="bg-white rounded-xl shadow-lg p-8 text-center">
              <div className="mb-4"><SearchX className="w-12 h-12 text-emerald-600 mx-auto" /></div>
              <h2 className="text-2xl font-bold text-emerald-800 mb-2">No results</h2>
              <p className="text-gray-600 mb-6">No products match your current filters. Try adjusting or clearing filters to see more items.</p>
              <div className="flex items-center justify-center gap-3">
                <button onClick={() => { setFilterStatuses([]); setFilterNotificationFreqs([]); persistFilters([],[]); fetchProducts(0, sortBy, sortDirection, [], []).catch(()=>{}); }} className="bg-emerald-600 text-white px-4 py-2 rounded-lg">Clear filters</button>
                <button onClick={() => navigate('/products/new')} className="bg-white border border-emerald-200 px-4 py-2 rounded-lg">Add Product</button>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-lg p-12 text-center">
              <div className="text-6xl mb-4">🥗</div>
              <h2 className="text-2xl font-bold text-emerald-800 mb-2">No products yet</h2>
              <p className="text-gray-600 mb-6">Start tracking your food to reduce waste and save money</p>
              <button onClick={() => navigate('/products/new')} className="bg-emerald-600 text-white px-6 py-3 rounded-lg hover:bg-emerald-700 shadow-lg">Add Your First Product</button>
            </div>
          )
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map(product => <ProductCard key={product.id} product={product} />)}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-8">
                <button disabled={pageNumber === 0} onClick={handlePrevPage} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-emerald-200 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /> Previous</button>
                <span className="font-semibold text-emerald-800">Page {pageNumber + 1} of {totalPages}</span>
                <button disabled={pageNumber >= totalPages - 1} onClick={handleNextPage} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-emerald-200 hover:bg-gray-50 disabled:opacity-50">Next <ChevronRight className="w-5 h-5" /></button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- Small typed subcomponents ---

type SortControlProps = {
  sortBy: string;
  sortDir: 'asc'|'desc';
  onChange: (b: string, d: 'asc'|'desc') => void;
  labels: Record<string,string>;
};

function SortControl(props: SortControlProps) {
  const { sortBy, sortDir, onChange, labels } = props;
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <div className="inline-flex items-stretch rounded-lg shadow-sm">
        <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-l-lg border-2 border-emerald-200 hover:bg-gray-50" aria-haspopup="true" aria-expanded={open}>
          <span className="font-medium text-emerald-700">Sort</span>
          <span className="text-sm text-gray-600">{labels[sortBy] || sortBy}</span>
          <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </button>
        <button title="Toggle direction" onClick={() => onChange(sortBy, sortDir === 'asc' ? 'desc' : 'asc')} className="px-3 py-2 rounded-r-lg bg-white border-t-2 border-b-2 border-r-2 border-emerald-200 hover:bg-gray-50 flex items-center" aria-label="Toggle sort direction">
          {sortDir === 'asc' ? <ArrowUpFromDot className="w-4 h-4 text-emerald-700" /> : <ArrowDownToDot className="w-4 h-4 text-emerald-700" />}
        </button>
      </div>

      {open && (
        <div className="absolute right-0 mt-12 w-64 bg-white rounded-lg shadow-lg border border-emerald-100 z-50">
          <div className="p-3">
            <h4 className="text-sm font-semibold text-emerald-800 mb-2">Sort by</h4>
            <div className="max-h-56 overflow-auto">
              {Object.keys(labels).map(key => (
                <button key={key} onClick={() => { onChange(key, sortDir); setOpen(false); }} className={`w-full text-left px-3 py-2 rounded-md hover:bg-emerald-50 ${key === sortBy ? 'bg-emerald-50 font-semibold' : ''}`}>{labels[key]}</button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

type FilterControlProps = {
  statuses: string[];
  notificationFreqs: string[];
  onChange: (s: string[], f: string[]) => void;
};

function FilterControl({ statuses, notificationFreqs, onChange }: FilterControlProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const handler = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, []);

  const STATUS_OPTIONS = ['AVAILABLE','FINISHED','EXPIRED'];
  const NF_OPTIONS = ['DAILY','WEEKLY','MONTHLY'];

  const toggleOption = (arr: string[], setFn: (s: string[]) => void, val: string) => {
    const copy = [...arr];
    const idx = copy.indexOf(val);
    if (idx === -1) copy.push(val); else copy.splice(idx, 1);
    setFn(copy);
  };

  const [localStatuses, setLocalStatuses] = useState<string[]>(statuses);
  const [localNf, setLocalNf] = useState<string[]>(notificationFreqs);
  useEffect(() => setLocalStatuses(statuses), [statuses]);
  useEffect(() => setLocalNf(notificationFreqs), [notificationFreqs]);

  return (
    <div ref={ref} className="relative">
      <button onClick={() => setOpen(v => !v)} className="flex items-center gap-2 bg-white px-4 py-2 rounded-lg border-2 border-emerald-200 hover:bg-gray-50">
        <span className="font-medium text-emerald-700">Filter</span>
        <span className="text-sm text-gray-600">{localStatuses.length + localNf.length > 0 ? `${localStatuses.length + localNf.length} active` : 'All'}</span>
        <svg className="w-4 h-4 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M6 9l6 6 6-6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
      </button>

      {open && (
        <div className="absolute right-0 mt-12 w-72 bg-white rounded-lg shadow-lg border border-emerald-100 z-50 p-3">
          <div>
            <h4 className="text-sm font-semibold text-emerald-800 mb-2">Status</h4>
            <div className="flex flex-col gap-1 mb-3">
              {STATUS_OPTIONS.map(o => (
                <button key={o} type="button" onClick={() => toggleOption(localStatuses, setLocalStatuses, o)} className={`w-full text-left px-3 py-2 rounded-md hover:bg-emerald-50 inline-flex items-center gap-2 ${localStatuses.includes(o) ? 'bg-emerald-50 font-semibold' : ''}`}>
                  <input type="checkbox" checked={localStatuses.includes(o)} readOnly className="pointer-events-none" />
                  <span className="text-sm">{o}</span>
                </button>
              ))}
            </div>

            <h4 className="text-sm font-semibold text-emerald-800 mb-2">Notification</h4>
            <div className="flex flex-col gap-1 mb-3">
              {NF_OPTIONS.map(o => (
                <button key={o} type="button" onClick={() => toggleOption(localNf, setLocalNf, o)} className={`w-full text-left px-3 py-2 rounded-md hover:bg-emerald-50 inline-flex items-center gap-2 ${localNf.includes(o) ? 'bg-emerald-50 font-semibold' : ''}`}>
                  <input type="checkbox" checked={localNf.includes(o)} readOnly className="pointer-events-none" />
                  <span className="text-sm">{o}</span>
                </button>
              ))}
            </div>

            <div className="flex justify-end gap-2">
              <button onClick={() => { setLocalStatuses([]); setLocalNf([]); }} className="px-3 py-1 rounded bg-emerald-50 text-sm">Clear</button>
              <button onClick={() => { onChange(localStatuses, localNf); setOpen(false); }} className="px-3 py-1 rounded bg-emerald-600 text-white">Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
