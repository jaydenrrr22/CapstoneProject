import { Component } from "react";
import "./ErrorBoundary.css";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Unhandled render error:", error, errorInfo);
  }

  componentDidUpdate(previousProps) {
    const { resetKey } = this.props;

    if (this.state.hasError && previousProps.resetKey !== resetKey) {
      this.setState({
        hasError: false,
        error: null,
      });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
    });
  };

  render() {
    const { children } = this.props;
    const { hasError, error } = this.state;

    if (!hasError) {
      return children;
    }

    return (
      <main className="app-error-boundary" role="alert">
        <div className="app-error-boundary__card">
          <p className="app-error-boundary__eyebrow">Application Error</p>
          <h1>Something went wrong</h1>
          <p>
            Trace hit an unexpected issue. You can retry this screen without losing the rest
            of the app.
          </p>
          {error?.message ? (
            <p className="app-error-boundary__detail">{error.message}</p>
          ) : null}
          <div className="app-error-boundary__actions">
            <button type="button" onClick={this.handleRetry}>Try again</button>
            <button type="button" onClick={() => window.location.assign("/dashboard")}>Go to dashboard</button>
          </div>
        </div>
      </main>
    );
  }
}

export default ErrorBoundary;

