
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function Pricing() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Planos e Preços
        </h1>
        <p className="text-xl text-muted-foreground">
          Escolha o plano ideal para suas necessidades
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Gratuito</CardTitle>
            <CardDescription>Para iniciantes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">R$ 0</div>
            <ul className="space-y-2 mb-6">
              <li>✓ 5 composições por mês</li>
              <li>✓ Ferramentas básicas</li>
              <li>✓ Suporte por email</li>
            </ul>
            <Button className="w-full">Começar Grátis</Button>
          </CardContent>
        </Card>

        <Card className="border-primary">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Pro</CardTitle>
              <Badge>Mais Popular</Badge>
            </div>
            <CardDescription>Para profissionais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">R$ 29,90</div>
            <ul className="space-y-2 mb-6">
              <li>✓ Composições ilimitadas</li>
              <li>✓ Todas as ferramentas</li>
              <li>✓ Bases musicais premium</li>
              <li>✓ Suporte prioritário</li>
            </ul>
            <Button className="w-full">Assinar Pro</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Enterprise</CardTitle>
            <CardDescription>Para estúdios</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold mb-4">R$ 99,90</div>
            <ul className="space-y-2 mb-6">
              <li>✓ Tudo do Pro</li>
              <li>✓ Colaboração em equipe</li>
              <li>✓ API personalizada</li>
              <li>✓ Suporte dedicado</li>
            </ul>
            <Button className="w-full">Falar com Vendas</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
