// File: apps/pos/src/components/ErrorBoundary.jsx
/**
 * ErrorBoundary — catches runtime errors in the React tree
 * and shows a friendly fallback UI instead of a white screen.
 */
import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    console.error('[ErrorBoundary] Uncaught error:', error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gray-900 px-6 text-center">
          <span className="text-6xl">⚠️</span>
          <div>
            <h1 className="text-xl font-bold text-white">Terjadi Kesalahan</h1>
            <p className="mt-1 text-sm text-gray-400">
              Komponen mengalami error yang tidak tertangani.
            </p>
          </div>

          {import.meta.env.DEV && this.state.error && (
            <details className="w-full max-w-lg text-left">
              <summary className="cursor-pointer text-xs font-medium text-gray-500 hover:text-gray-300">
                Detail Error (Dev Mode)
              </summary>
              <pre className="mt-2 max-h-48 overflow-auto rounded-xl bg-gray-800 p-4 text-xs text-red-300 scrollbar-thin">
                {this.state.error.toString()}
                {'\n\n'}
                {this.state.errorInfo?.componentStack}
              </pre>
            </details>
          )}

          <div className="flex gap-3">
            <button
              onClick={this.handleReset}
              className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-white hover:bg-amber-400 active:scale-95 transition-all"
            >
              Coba Lagi
            </button>
            <button
              onClick={() => window.location.reload()}
              className="rounded-xl border border-gray-600 px-5 py-2.5 text-sm font-medium text-gray-300 hover:bg-gray-800 transition-all"
            >
              Muat Ulang Halaman
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
