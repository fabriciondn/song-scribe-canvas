import { lazy, Suspense } from 'react';
import { Loader2 } from 'lucide-react';

// Lazy load do componente otimizado
const OptimizedSettings = lazy(() => import('@/components/layout/OptimizedSettings'));

export default function Settings() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    }>
      <OptimizedSettings />
    </Suspense>
  );
}