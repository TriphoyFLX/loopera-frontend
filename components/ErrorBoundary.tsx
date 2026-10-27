import { Component, type ErrorInfo, type ReactNode } from 'react';
import { reportClientError } from '../utils/sentry';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error?.message || 'Unexpected error' };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary:', error, info.componentStack);
    reportClientError({
      message: error.message,
      stack: error.stack,
      componentStack: info.componentStack,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: '60vh',
            display: 'grid',
            placeItems: 'center',
            padding: 24,
            color: '#fff',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <div style={{ maxWidth: 420, textAlign: 'center' }}>
            <h1 style={{ fontSize: 20, marginBottom: 8 }}>Что-то пошло не так</h1>
            <p style={{ opacity: 0.65, fontSize: 14, marginBottom: 20 }}>
              Обновите страницу. Если ошибка повторяется — напишите в поддержку.
            </p>
            <button
              type="button"
              onClick={() => window.location.assign('/')}
              style={{
                border: 0,
                borderRadius: 10,
                padding: '10px 16px',
                background: '#fff',
                color: '#000',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              На главную
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
