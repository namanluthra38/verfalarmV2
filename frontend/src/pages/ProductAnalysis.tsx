// typescript
// File: `frontend/src/pages/ProductAnalysis.tsx`
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductService } from '../services/product.service';
import { ProductAnalysis, ProductResponse } from '../types/api.types.ts';
import Navbar from '../components/Navbar';
import {
    ArrowLeft,
    TrendingUp,
    Package,
    Calendar,
    Clock,
    Target,
    Activity,
    AlertTriangle,
    CheckCircle,
    XCircle,
    BarChart3,

} from 'lucide-react';
import {formatSignificant, formatPercent } from '../utils/format';

export default function ProductAnalysisPage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
    const [product, setProduct] = useState<ProductResponse | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id || !token) return;

        Promise.all([
            ProductService.getProduct(id, token),
            ProductService.analyzeProduct(id, token)
        ])
            .then(([p, a]) => {
                setProduct(p);
                setAnalysis(a);
            })
            .catch(err =>
                setError(err instanceof Error ? err.message : String(err))
            )
            .finally(() => setLoading(false));
    }, [id, token]);

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
                <Navbar />
                <div className="flex justify-center items-center h-96">
                    <div className="text-center space-y-4">
                        <div className="animate-spin h-12 w-12 border-4 border-emerald-600 border-t-transparent rounded-full mx-auto" />
                        <p className="text-emerald-700 font-medium">Analyzing product data...</p>
                    </div>
                </div>
            </div>
        );
    }

    if (!analysis || !product) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
                <Navbar />
                <div className="max-w-3xl mx-auto p-6">
                    <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-8 text-center">
                        <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-red-800 mb-2">Analysis Unavailable</h2>
                        <p className="text-red-600 mb-6">{error || 'Could not load analysis data'}</p>
                        <button
                            onClick={() => navigate(-1)}
                            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const {
        remainingQuantity,
        percentConsumed,
        percentRemaining,
        daysUntilExpiration,
        isExpired,
        recommendedDailyToFinish,
        currentAvgDailyConsumption,
        estimatedFinishDate,
        statusSuggestion,
        warnings,
        estimatedDaysToFinishFromNow
    } = analysis;

    // Calculate actual consumed quantity for hover display
    const totalQuantity = percentRemaining ? remainingQuantity / (percentRemaining / 100) : undefined;
    const consumedQuantity = typeof totalQuantity === 'number' ? totalQuantity - remainingQuantity : undefined;

    // Get product unit from the fetched product (safe fallback)
    const productUnit = product?.unit ?? '';

    // Helper: format days into nearest weeks when <30 days, otherwise months
    function formatDaysToWeeksOrMonths(days?: number | null): string | undefined {
        if (days === null || days === undefined || !isFinite(Number(days))) return undefined;
        const d = Math.max(0, Math.round(Number(days)));
        if (d < 30) {
            const weeks = Math.max(1, Math.round(d / 7));
            return `${weeks} week${weeks > 1 ? 's' : ''}`;
        }
        const months = Math.max(1, Math.round(d / 30));
        return `${months} month${months > 1 ? 's' : ''}`;
    }

    // Treat both expired and finished as final states where recommendations/targets don't apply
    const isFinalState = isExpired || statusSuggestion === 'FINISHED' ;

    // Determine status UI properties
    const statusConfig = (() => {
        if (String(statusSuggestion).includes('EXPIRED')) {
            return {
                title: 'Product Has Expired',
                icon: XCircle,
                gradient: 'from-red-500 to-rose-500',
                bgColor: 'bg-red-50',
                borderColor: 'border-red-200',
                textColor: 'text-red-800',
                iconBg: 'bg-red-100',
                iconColor: 'text-red-600',
            };
        } else if (statusSuggestion === 'FINISHED') {
            return {
                title: 'Product Fully Consumed',
                icon: CheckCircle,
                gradient: 'from-blue-500 to-indigo-500',
                bgColor: 'bg-blue-50',
                borderColor: 'border-blue-200',
                textColor: 'text-blue-800',
                iconBg: 'bg-blue-100',
                iconColor: 'text-blue-600',
            };
        } else {
            return {
                title: 'Product Available',
                icon: CheckCircle,
                gradient: 'from-emerald-500 to-green-500',
                bgColor: 'bg-emerald-50',
                borderColor: 'border-emerald-200',
                textColor: 'text-emerald-800',
                iconBg: 'bg-emerald-100',
                iconColor: 'text-emerald-600',
            };
        }
    })();

    // Determine urgency level
    const urgencyLevel = (() => {
        if (isExpired) return 'expired';
        if (daysUntilExpiration !== null && daysUntilExpiration <= 3) return 'critical';
        if (daysUntilExpiration !== null && daysUntilExpiration <= 7) return 'warning';
        return 'normal';
    })();

    const hasStartedConsumption =
        typeof currentAvgDailyConsumption === 'number' &&
        currentAvgDailyConsumption > 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50">
            <Navbar />

            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Breadcrumb Navigation */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)}
                        className="group flex items-center gap-2 text-emerald-700 hover:text-emerald-800 font-medium transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Product</span>
                    </button>
                </div>

                <div className="space-y-6">
                    {/* Hero Status Card */}
                    <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                        <div className={`bg-gradient-to-r ${statusConfig.gradient} p-8`}>
                            <div className="flex items-start gap-4">
                                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                                    <statusConfig.icon className="w-10 h-10 text-white" />
                                </div>
                                <div className="flex-1">
                                    <h1 className="text-4xl font-bold text-white mt-2">
                                        {statusConfig.title}
                                    </h1>
                                </div>
                            </div>
                        </div>

                        {/* Quick Stats Bar */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-200">
                            <QuickStat
                                label="Consumed"
                                value={formatPercent(percentConsumed, 2)}
                                hoverValue={typeof consumedQuantity === 'number' ? `${formatSignificant(consumedQuantity, 2)} ${productUnit}` : undefined}
                                icon={TrendingUp}
                                color="emerald"
                            />
                            <QuickStat
                                label="Remaining"
                                value={formatPercent(percentRemaining, 2)}
                                hoverValue={`${formatSignificant(remainingQuantity, 2)} ${productUnit}`}
                                icon={Package}
                                color="blue"
                            />
                            <QuickStat
                                label="Days Left"
                                value={isExpired ? 'Expired' : daysUntilExpiration !== null ? `${daysUntilExpiration}` : '—'}
                                hoverValue={isExpired ? undefined : formatDaysToWeeksOrMonths(daysUntilExpiration)}
                                icon={Clock}
                                color={urgencyLevel === 'critical' ? 'red' : urgencyLevel === 'warning' ? 'amber' : 'gray'}
                            />
                            <QuickStat
                                label="Daily Rate"
                                value={typeof currentAvgDailyConsumption === 'number' ? `${formatSignificant(currentAvgDailyConsumption, 2)} ${productUnit}/day` : '—'}
                                hoverValue={typeof currentAvgDailyConsumption === 'number' ? `${formatSignificant(currentAvgDailyConsumption * 30, 2)} ${productUnit}/month` : undefined}
                                icon={Activity}
                                color="purple"
                            />
                        </div>
                    </div>

                    {/* 2x2 Grid Layout */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Consumption Progress */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6">
                                <div className="flex items-center gap-2 text-white">
                                    <BarChart3 className="w-6 h-6" />
                                    <h2 className="text-xl font-bold">Consumption Progress</h2>
                                </div>
                            </div>

                            <div className="p-6">
                                {/* Progress Bar */}
                                <div className="mb-6">
                                    <div className="flex justify-between items-baseline mb-3">
                                        <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                                        <span className="text-3xl font-bold text-emerald-700">
                                            {formatPercent(percentConsumed, 2)}
                                        </span>
                                    </div>

                                    <div className="relative h-6 bg-gray-200 rounded-full overflow-hidden">
                                        <div
                                            className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-400 via-emerald-500 to-green-500 rounded-full transition-all duration-500 ease-out flex items-center justify-end pr-2"
                                            style={{ width: `${Math.min(percentConsumed ?? 0, 100)}%` }}
                                        >
                                            {(percentConsumed ?? 0) > 10 && (
                                                <span className="text-xs font-bold text-white">
                                                    {(percentConsumed ?? 0).toFixed(0)}%
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex justify-between text-sm text-gray-600 mt-2">
                                        <span>Started</span>
                                        <span className="font-medium">{formatSignificant(remainingQuantity, 2)} {productUnit} remaining</span>
                                    </div>
                                </div>

                                {/* Warnings - Only show if warnings exist */}
                                {warnings && warnings.length > 0 && (
                                    <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl border border-amber-200 p-4">
                                        <div className="flex items-center gap-2 mb-2">
                                            <AlertTriangle className="w-4 h-4 text-amber-600" />
                                            <h3 className="text-sm font-semibold text-amber-900">Warnings</h3>
                                        </div>
                                        <div className="space-y-1">
                                            {warnings.map((w, idx) => (
                                                <div key={idx} className="text-sm text-amber-900 pl-6">• {w}</div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Timeline Analysis */}
                        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6">
                                <div className="flex items-center gap-2 text-white">
                                    <Calendar className="w-6 h-6" />
                                    <h2 className="text-xl font-bold">Timeline Analysis</h2>
                                </div>
                            </div>

                            <div className="p-6">
                                <div className="space-y-4">
                                    {daysUntilExpiration !== null && (
                                        <DataRow
                                            icon={Clock}
                                            label="Days until expiration"
                                            value={isExpired ? 'Already expired' : `${daysUntilExpiration} days`}
                                            hoverValue={
                                                isExpired
                                                    ? undefined
                                                    : formatDaysToWeeksOrMonths(daysUntilExpiration)
                                            }
                                            highlight={urgencyLevel === 'critical'}
                                            warning={urgencyLevel === 'warning'}
                                        />

                                    )}

                                    {hasStartedConsumption && (
                                        <DataRow
                                            icon={Activity}
                                            label="Current usage rate"
                                            value={`${formatSignificant(currentAvgDailyConsumption, 2)} ${productUnit}/day`}
                                        />
                                    )}

                                    {/* Recommended daily usage only when not final state */}
                                    {!isFinalState && recommendedDailyToFinish && (
                                        <DataRow
                                            icon={Target}
                                            label="Recommended daily usage"
                                            value={`${formatSignificant(recommendedDailyToFinish, 2)} ${productUnit}/day`}
                                            highlighted
                                        />
                                    )}

                                    {!isFinalState && estimatedFinishDate && estimatedDaysToFinishFromNow && (
                                        <DataRow
                                            icon={Calendar}
                                            label="Estimated finish date"
                                            value={new Date(estimatedFinishDate).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric'
                                            })}
                                            hoverValue={formatDaysToWeeksOrMonths(estimatedDaysToFinishFromNow)}
                                        />
                                    )}

                                    {/* Usage Efficiency Status - moved from right column */}
                                    {!isFinalState &&
                                        hasStartedConsumption &&
                                        typeof recommendedDailyToFinish === 'number' && (
                                            <div className="mt-2 p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 border-2 border-emerald-200">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <Activity className="w-4 h-4 text-emerald-600" />
                                                    <p className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Usage Status</p>
                                                </div>
                                                <p className="text-sm font-semibold text-emerald-800">
                                                    {currentAvgDailyConsumption < recommendedDailyToFinish
                                                        ? '⚠️ Usage below recommended pace'
                                                        : currentAvgDailyConsumption > recommendedDailyToFinish * 1.5
                                                            ? '⚡ Using faster than needed'
                                                            : '✓ On track to finish on time'
                                                    }
                                                </p>
                                            </div>
                                        )}

                                    {!isFinalState && !hasStartedConsumption && (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 text-sm text-emerald-800">
                                            Start consuming this product to see usage insights.
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

function QuickStat({
                       label,
                       value,
                       hoverValue,
                       icon: Icon,
                       color
                   }: {
    label: string;
    value: string;
    hoverValue?: string;
    icon: any;
    color: string;
}) {
    const [isHovered, setIsHovered] = useState(false);

    const colorClasses = {
        emerald: 'text-emerald-600',
        blue: 'text-blue-600',
        red: 'text-red-600',
        amber: 'text-amber-600',
        purple: 'text-purple-600',
        gray: 'text-gray-600',
    };

    return (
        <div
            className="bg-white p-6 cursor-pointer relative transition-all hover:bg-gray-50"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${colorClasses[color as keyof typeof colorClasses]}`} />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {label}
                </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">
                {isHovered && hoverValue ? hoverValue : value}
            </p>
            {hoverValue && (
                <div className="absolute top-2 right-2 text-gray-400 text-xs">
                    ⓘ
                </div>
            )}
        </div>
    );
}

function DataRow({
                     icon: Icon,
                     label,
                     value,
                     hoverValue,
                     highlight = false,
                     warning = false,
                     highlighted = false
                 }: {
    icon: any;
    label: string;
    value: string;
    hoverValue?: string;
    highlight?: boolean;
    warning?: boolean;
    highlighted?: boolean;
}) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <div
            className={`flex items-start justify-between p-4 rounded-xl border-2 transition-all cursor-pointer ${
                highlighted
                    ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300'
                    : highlight
                        ? 'bg-red-50 border-red-200'
                        : warning
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-gray-50 border-gray-200'
            }`}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <div className="flex items-center gap-3 flex-1">
                <Icon className={`w-5 h-5 flex-shrink-0 ${
                    highlighted ? 'text-emerald-600' :
                        highlight ? 'text-red-600' :
                            warning ? 'text-amber-600' :
                                'text-gray-600'
                }`} />
                <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className={`text-sm font-bold text-right ${
                    highlighted ? 'text-emerald-700' :
                        highlight ? 'text-red-700' :
                            warning ? 'text-amber-700' :
                                'text-gray-900'
                }`}>
                    {isHovered && hoverValue ? hoverValue : value}
                </span>
                {hoverValue && (
                    <span className="text-gray-400 text-xs">ⓘ</span>
                )}
            </div>
        </div>
    );
}