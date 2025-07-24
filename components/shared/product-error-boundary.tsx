/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Component, ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ProductErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("Product loading error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="min-h-screen bg-gray-50 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Card className="max-w-md mx-auto">
                <CardContent className="p-8 text-center">
                  <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Failed to Load Products
                  </h2>
                  <p className="text-gray-600 mb-6">
                    We&apos;re having trouble loading the products. Please try again.
                  </p>
                  <Button
                    onClick={() => window.location.reload()}
                    className="w-full"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Retry
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}