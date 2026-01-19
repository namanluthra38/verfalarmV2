// typescript
// File: `frontend/src/pages/ProductAnalysis.tsx`
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductService } from '../services/product.service';
import { ProductAnalysis } from '../types/api.types.ts';
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
    Sparkles,
    Info,
} from 'lucide-react';

export default function ProductAnalysisPage() {
    const { id } = useParams<{ id: string }>();
    const { token } = useAuth();
    const navigate = useNavigate();

    const [analysis, setAnalysis] = useState<ProductAnalysis | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!id || !token) return;

        ProductService.analyzeProduct(id, token)
            .then(setAnalysis)
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

    if (!analysis) {
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
        warnings
    } = analysis;

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
                                <div className="flex-2">
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
                                value={`${(percentConsumed ?? 0).toFixed(1)}%`}
                                icon={TrendingUp}
                                color="emerald"
                            />
                            <QuickStat
                                label="Remaining"
                                value={`${(percentRemaining ?? 0).toFixed(1)}%`}
                                icon={Package}
                                color="blue"
                            />
                            <QuickStat
                                label="Days Left"
                                value={isExpired ? 'Expired' : daysUntilExpiration !== null ? `${daysUntilExpiration}` : '—'}
                                icon={Clock}
                                color={urgencyLevel === 'critical' ? 'red' : urgencyLevel === 'warning' ? 'amber' : 'gray'}
                            />
                            <QuickStat
                                label="Daily Rate"
                                value={currentAvgDailyConsumption ? currentAvgDailyConsumption.toFixed(1) : '—'}
                                icon={Activity}
                                color="purple"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Left Column - Main Analysis */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Consumption Progress */}
                            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                <div className="bg-gradient-to-r from-emerald-500 to-green-500 p-6">
                                    <div className="flex items-center gap-2 text-white">
                                        <BarChart3 className="w-6 h-6" />
                                        <h2 className="text-xl font-bold">Consumption Progress</h2>
                                    </div>
                                </div>

                                <div className="p-6 space-y-6">
                                    {/* Progress Bar */}
                                    <div>
                                        <div className="flex justify-between items-baseline mb-3">
                                            <span className="text-sm font-medium text-gray-600">Overall Progress</span>
                                            <span className="text-3xl font-bold text-emerald-700">
                                                {(percentConsumed ?? 0).toFixed(1)}%
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
                                            <span className="font-medium">{remainingQuantity} units remaining</span>
                                        </div>
                                    </div>

                                    {/* Progress Stats */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-emerald-50 rounded-xl p-4 border border-emerald-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <TrendingUp className="w-5 h-5 text-emerald-600" />
                                                <span className="text-sm font-medium text-gray-600">Consumed</span>
                                            </div>
                                            <p className="text-2xl font-bold text-emerald-700">
                                                {(percentConsumed ?? 0).toFixed(1)}%
                                            </p>
                                        </div>

                                        <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Package className="w-5 h-5 text-blue-600" />
                                                <span className="text-sm font-medium text-gray-600">Remaining</span>
                                            </div>
                                            <p className="text-2xl font-bold text-blue-700">
                                                {(percentRemaining ?? 0).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Time & Planning */}
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
                                                highlight={urgencyLevel === 'critical'}
                                                warning={urgencyLevel === 'warning'}
                                            />
                                        )}

                                        <DataRow
                                            icon={Activity}
                                            label="Current usage rate"
                                            value={currentAvgDailyConsumption ? `${currentAvgDailyConsumption.toFixed(2)}/day` : '—'}
                                        />

                                        {/* Recommended daily usage only when not final state */}
                                        {!isFinalState && (
                                            <DataRow
                                                icon={Target}
                                                label="Recommended daily usage"
                                                value={recommendedDailyToFinish ? `${recommendedDailyToFinish.toFixed(2)}/day` : '—'}
                                                highlighted
                                            />
                                        )}

                                        <DataRow
                                            icon={Calendar}
                                            label="Estimated finish date"
                                            value={
                                                !isFinalState && estimatedFinishDate
                                                    ? new Date(estimatedFinishDate).toLocaleDateString('en-US', {
                                                        month: 'short',
                                                        day: 'numeric',
                                                        year: 'numeric'
                                                    })
                                                    : isFinalState
                                                        ? 'Not applicable'
                                                        : 'Cannot be estimated'
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Warnings */}
                            {warnings && warnings.length > 0 && (
                                <div className="bg-gradient-to-r from-amber-50 to-orange-50 border-l-4 border-amber-500 rounded-r-2xl shadow-sm overflow-hidden">
                                    <div className="p-6">
                                        <div className="flex items-center gap-2 mb-4">
                                            <AlertTriangle className="w-6 h-6 text-amber-600" />
                                            <h3 className="text-lg font-bold text-amber-900">Important Notices</h3>
                                        </div>
                                        <div className="space-y-3">
                                            {warnings.map((warning, idx) => (
                                                <div key={idx} className="flex items-start gap-3 bg-white/70 rounded-lg p-4 border border-amber-200">
                                                    <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                                    <p className="text-sm text-amber-900 leading-relaxed">{warning}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Right Column - Insights */}
                        <div className="space-y-6">
                            {/* Smart Recommendation - hidden for final states */}
                            {!isFinalState && recommendedDailyToFinish && (
                                <div className="bg-gradient-to-br from-purple-50 to-indigo-50 rounded-2xl shadow-lg border border-purple-200 overflow-hidden">
                                    <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6">
                                        <div className="flex items-center gap-2 text-white">
                                            <Sparkles className="w-6 h-6" />
                                            <h3 className="font-bold text-lg">Smart Recommendation</h3>
                                        </div>
                                    </div>

                                    <div className="p-6">
                                        <p className="text-sm text-gray-600 mb-4">
                                            To finish before expiration:
                                        </p>
                                        <div className="bg-white rounded-xl p-6 border-2 border-purple-200 mb-4 text-center">
                                            <p className="text-5xl font-bold text-purple-700 mb-2">
                                                {recommendedDailyToFinish.toFixed(1)}
                                            </p>
                                            <p className="text-sm text-gray-600 font-medium">units per day</p>
                                        </div>

                                        {estimatedFinishDate && (
                                            <div className="bg-purple-100 rounded-lg p-4 border border-purple-200">
                                                <div className="flex items-start gap-2 text-sm">
                                                    <Calendar className="w-4 h-4 text-purple-600 mt-0.5 flex-shrink-0" />
                                                    <div>
                                                        <div className="text-sm font-medium text-purple-700">Estimated finish</div>
                                                        <div className="text-xs text-gray-600">{new Date(estimatedFinishDate).toLocaleDateString()}</div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Usage Efficiency - hidden for final states */}
                            {!isFinalState &&
                                hasStartedConsumption &&
                                typeof recommendedDailyToFinish === 'number' && (
                                <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
                                    <div className="p-6">
                                        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                            <Activity className="w-5 h-5 text-emerald-600" />
                                            Usage Efficiency
                                        </h3>

                                        <div className="space-y-4">
                                            <div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-gray-600">Current pace</span>
                                                    <span className="font-semibold text-gray-900">{currentAvgDailyConsumption.toFixed(2)}/day</span>
                                                </div>
                                                <div className="flex justify-between text-sm mb-2">
                                                    <span className="text-gray-600">Recommended pace</span>
                                                    <span className="font-semibold text-emerald-700">
                                                        {recommendedDailyToFinish.toFixed(2)}/day
                                                    </span>
                                                </div>

                                                <div className="mt-4 p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200">
                                                    <p className="text-xs text-gray-600 mb-1">Status</p>
                                                    <p className="text-sm font-semibold text-emerald-800">
                                                        {currentAvgDailyConsumption < recommendedDailyToFinish
                                                            ? '⚠️ Usage below recommended pace'
                                                            : currentAvgDailyConsumption > recommendedDailyToFinish * 1.5
                                                                ? '⚡ Using faster than needed'
                                                                : '✓ On track to finish on time'
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                            {!isFinalState && currentAvgDailyConsumption === 0 && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-sm text-emerald-800">
                                    Start consuming this product to see usage efficiency insights.
                                </div>
                            )}


                            {/* Status Summary */}
                            <div className={`rounded-2xl shadow-lg border overflow-hidden ${statusConfig.bgColor} ${statusConfig.borderColor}`}>
                                <div className="p-6">
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className={`p-3 ${statusConfig.iconBg} rounded-xl`}>
                                            <statusConfig.icon className={`w-6 h-6 ${statusConfig.iconColor}`} />
                                        </div>
                                        <h3 className={`font-bold text-lg ${statusConfig.textColor}`}>
                                            Status Summary
                                        </h3>
                                    </div>

                                    <div className="space-y-3 text-sm">
                                        <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Status</span>
                                            <span className={`font-semibold ${statusConfig.textColor}`}>
                                                {statusConfig.title}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between py-2 border-b border-gray-200">
                                            <span className="text-gray-600">Progress</span>
                                            <span className="font-semibold text-gray-900">
                                                {(percentConsumed ?? 0).toFixed(1)}% Complete
                                            </span>
                                        </div>

                                        {!isFinalState && daysUntilExpiration !== null && (
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-gray-600">Time remaining</span>
                                                <span className={`font-semibold ${
                                                    urgencyLevel === 'critical' ? 'text-red-700' :
                                                        urgencyLevel === 'warning' ? 'text-amber-700' :
                                                            'text-gray-900'
                                                }`}>
                                                    {daysUntilExpiration} days
                                                </span>
                                            </div>
                                        )}

                                        {isFinalState && (
                                            <div className="flex items-center justify-between py-2">
                                                <span className="text-gray-600">Time remaining</span>
                                                <span className="font-semibold text-gray-700">Not applicable</span>
                                            </div>
                                        )}
                                    </div>
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
                       icon: Icon,
                       color
                   }: {
    label: string;
    value: string;
    icon: any;
    color: string;
}) {
    const colorClasses = {
        emerald: 'text-emerald-600',
        blue: 'text-blue-600',
        red: 'text-red-600',
        amber: 'text-amber-600',
        purple: 'text-purple-600',
        gray: 'text-gray-600',
    };

    return (
        <div className="bg-white p-6">
            <div className="flex items-center gap-2 mb-2">
                <Icon className={`w-5 h-5 ${colorClasses[color as keyof typeof colorClasses]}`} />
                <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                    {label}
                </span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
        </div>
    );
}

function DataRow({
                     icon: Icon,
                     label,
                     value,
                     highlight = false,
                     warning = false,
                     highlighted = false
                 }: {
    icon: any;
    label: string;
    value: string;
    highlight?: boolean;
    warning?: boolean;
    highlighted?: boolean;
}) {
    return (
        <div className={`flex items-start justify-between p-4 rounded-xl border-2 transition-all ${
            highlighted
                ? 'bg-gradient-to-r from-emerald-50 to-green-50 border-emerald-300'
                : highlight
                    ? 'bg-red-50 border-red-200'
                    : warning
                        ? 'bg-amber-50 border-amber-200'
                        : 'bg-gray-50 border-gray-200'
        }`}>
            <div className="flex items-center gap-3 flex-1">
                <Icon className={`w-5 h-5 flex-shrink-0 ${
                    highlighted ? 'text-emerald-600' :
                        highlight ? 'text-red-600' :
                            warning ? 'text-amber-600' :
                                'text-gray-600'
                }`} />
                <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
            <span className={`text-sm font-bold text-right ml-4 ${
                highlighted ? 'text-emerald-700' :
                    highlight ? 'text-red-700' :
                        warning ? 'text-amber-700' :
                            'text-gray-900'
            }`}>
                {value}
            </span>
        </div>
    );
}
