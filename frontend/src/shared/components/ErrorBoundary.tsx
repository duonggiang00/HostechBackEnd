import { Component, type ReactNode } from "react";
import { Button, Result } from "antd";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

/**
 * ErrorBoundary — bọc mỗi Route/Page để lỗi không crash cả app.
 * Usage:
 *   <ErrorBoundary>
 *     <ContractList />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack: string }) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="min-h-[300px] flex items-center justify-center">
          <Result
            status="error"
            title="Có lỗi xảy ra"
            subTitle={
              this.state.error?.message ?? "Vui lòng thử lại hoặc liên hệ admin"
            }
            extra={
              <Button type="primary" onClick={this.handleReset}>
                Thử lại
              </Button>
            }
          />
        </div>
      );
    }

    return this.props.children;
  }
}
