import React from 'react';
import { ProOnlyWrapper } from '@/components/layout/ProOnlyWrapper';

export default function CifradorNeoPage() {
  return (
    <ProOnlyWrapper featureName="Cifrador Neo">
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Cifrador Neo</h1>
          <div className="bg-muted/50 border border-border rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Em desenvolvimento</h2>
            <p className="text-muted-foreground">
              O Cifrador Neo está sendo desenvolvido e estará disponível em breve.
            </p>
          </div>
        </div>
      </div>
    </ProOnlyWrapper>
  );
}