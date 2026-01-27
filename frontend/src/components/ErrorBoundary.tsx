import React from 'react';

type State = { hasError: boolean; error?: Error };

export default class ErrorBoundary extends React.Component<React.PropsWithChildren<{}>, State> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log error to analytics service here
    console.error('ErrorBoundary caught:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-red-50">
          <div className="max-w-lg w-full bg-white rounded-lg shadow p-6 text-center">
            <h2 className="text-xl font-semibold text-red-600 mb-4">Something went wrong</h2>
            <p className="text-gray-700 mb-4">An unexpected error occurred while loading this page.</p>
            <details className="text-left text-sm text-gray-600 whitespace-pre-wrap">{String(this.state.error)}</details>
            <div className="mt-6">
              <button onClick={() => window.location.reload()} className="px-4 py-2 bg-emerald-600 text-white rounded">Reload</button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children as React.ReactElement;
  }
}

