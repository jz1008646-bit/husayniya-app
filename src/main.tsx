import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

interface ErrorBoundaryState {
  hasError: boolean;
  message: string;
}

class AppErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: unknown): ErrorBoundaryState {
    return {
      hasError: true,
      message: error instanceof Error ? error.message : 'حدث خطأ غير متوقع أثناء عرض الصفحة.',
    };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="min-h-screen flex items-center justify-center bg-[#FAF8F4] text-[#1C1917] p-6"
        >
          <div className="max-w-md w-full rounded-2xl border border-[#E7E1D6] bg-white p-6 space-y-4 text-center shadow-sm">
            <h1 className="font-amiri text-2xl font-bold text-[#0F5132]">
              المدونة الحسينية
            </h1>
            <p className="text-sm text-stone-700 leading-relaxed">
              حدث خلل مؤقت أثناء تحميل الواجهة. اضغط على الزر أدناه لإعادة التحديث.
            </p>
            {this.state.message && (
              <p
                dir="ltr"
                className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 break-words"
              >
                {this.state.message}
              </p>
            )}
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="w-full min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0F5132] text-white text-sm font-semibold cursor-pointer"
            >
              إعادة تحميل التطبيق
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <AppErrorBoundary>
    <App />
  </AppErrorBoundary>
);
