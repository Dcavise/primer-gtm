import React, { Suspense } from "react";

interface LazyLoadProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * LazyLoad component for wrapping components that should be lazy loaded
 */
export function LazyLoad({ children, fallback }: LazyLoadProps) {
  return (
    <Suspense fallback={fallback || <DefaultFallback />}>{children}</Suspense>
  );
}

/**
 * Default fallback component for lazy loading
 */
function DefaultFallback() {
  return (
    <div className="w-full h-full min-h-[100px] flex items-center justify-center">
      <div className="animate-pulse-light">
        <div className="h-8 w-8 rounded-full bg-muted"></div>
      </div>
    </div>
  );
}

/**
 * Helper function to create lazy loaded components
 */
export function createLazyComponent<T extends React.ComponentType<any>>(
  importFn: () => Promise<{ default: T }>,
  fallback?: React.ReactNode,
) {
  const LazyComponent = React.lazy(importFn);

  return (props: React.ComponentProps<T>) => (
    <LazyLoad fallback={fallback}>
      <LazyComponent {...props} />
    </LazyLoad>
  );
}

/**
 * Create a lazy loaded route component
 */
export function LazyRoute({
  component: Component,
  fallback,
}: {
  component: React.LazyExoticComponent<React.ComponentType<any>>;
  fallback?: React.ReactNode;
}) {
  return (
    <LazyLoad fallback={fallback}>
      <Component />
    </LazyLoad>
  );
}

/**
 * Helper function to create lazy loaded routes
 */
export function lazyLoad(
  importFn: () => Promise<{ default: React.ComponentType<any> }>,
) {
  return React.lazy(importFn);
}
