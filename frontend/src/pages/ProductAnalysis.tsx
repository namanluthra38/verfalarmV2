import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { ProductService } from '../services/product.service';
import { ProductAnalysis } from '../types/api.types.ts';
import Navbar from '../components/Navbar';

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
            <div className="min-h-screen bg-emerald-50">
                <Navbar />
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin h-10 w-10 border-4 border-emerald-600 border-t-transparent rounded-full" />
                </div>
            </div>
        );
    }

    if (!analysis) {
        return (
            <div className="min-h-screen bg-emerald-50">
                <Navbar />
                <div className="max-w-3xl mx-auto p-6 text-red-700">
                    {error || 'Analysis not available'}
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
        summary,
        warnings
    } = analysis;

    return (
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-amber-50">
            <Navbar />

            <div className="max-w-4xl mx-auto p-6 space-y-6">
                <button
                    onClick={() => navigate(-1)}
                    className="text-emerald-700 font-semibold"
                >
                    ← Back to product
                </button>

                {/* STATUS HEADER */}
                <div className={`rounded-xl p-6 border ${
                    statusSuggestion.includes('EXPIRED')
                        ? 'bg-red-50 border-red-200'
                        : statusSuggestion === 'FINISHED'
                            ? 'bg-amber-50 border-amber-200'
                            : 'bg-emerald-50 border-emerald-200'
                }`}>
                    <h1 className="text-2xl font-bold">
                        {statusSuggestion === 'AVAILABLE' && 'Product is usable'}
                        {statusSuggestion === 'FINISHED' && 'Product is fully consumed'}
                        {statusSuggestion === 'EXPIRED' && 'Product has expired'}
                        {statusSuggestion === 'EXPIRED_AND_FINISHED' && 'Product expired after full use'}
                    </h1>
                    <p className="text-sm text-gray-700 mt-2">
                        {summary}
                    </p>
                </div>

                {/* PROGRESS */}
                <div className="bg-white rounded-xl shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Consumption Progress
                    </h2>

                    <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                            <span>Consumed</span>
                            <span>{percentConsumed}%</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded">
                            <div
                                className="h-3 bg-emerald-600 rounded"
                                style={{ width: `${percentConsumed}%` }}
                            />
                        </div>
                        <p className="text-sm text-gray-600">
                            {percentRemaining}% remaining · {remainingQuantity} units left
                        </p>
                    </div>
                </div>

                {/* TIME & PLANNING */}
                <div className="bg-white rounded-xl shadow p-6 space-y-4">
                    <h2 className="text-lg font-semibold text-emerald-800">
                        Time & Planning
                    </h2>

                    {daysUntilExpiration !== null && (
                        <InfoRow
                            label="Days until expiry"
                            value={
                                isExpired
                                    ? 'Already expired'
                                    : `${daysUntilExpiration} days`
                            }
                        />
                    )}

                    <InfoRow
                        label="Your current usage rate"
                        value={
                            currentAvgDailyConsumption
                                ? `${currentAvgDailyConsumption.toFixed(2)} units / day`
                                : 'Not enough data yet'
                        }
                    />

                    <InfoRow
                        label="Suggested daily usage to finish on time"
                        value={
                            recommendedDailyToFinish
                                ? `${recommendedDailyToFinish.toFixed(2)} units / day`
                                : 'Not applicable'
                        }
                    />

                    <InfoRow
                        label="Estimated finish date"
                        value={estimatedFinishDate ?? 'Cannot be estimated'}
                    />
                </div>

                {/* WARNINGS */}
                {warnings && warnings.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                        <h2 className="font-semibold text-red-700 mb-2">
                            Important notes
                        </h2>
                        <ul className="list-disc pl-5 text-sm text-red-700 space-y-1">
                            {warnings.map((w, i) => (
                                <li key={i}>{w}</li>
                            ))}
                        </ul>
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value }: { label: string; value: string }) {
    return (
        <div className="flex justify-between text-sm border-b pb-2">
            <span className="text-gray-600">{label}</span>
            <span className="font-medium text-gray-800">{value}</span>
        </div>
    );
}
