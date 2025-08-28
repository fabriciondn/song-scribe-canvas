
import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="container mx-auto px-4 py-12">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold mb-4">
          Bem-vindo ao MusiCifra
        </h1>
        <p className="text-xl text-muted-foreground">
          Sua plataforma completa para composição musical
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        <Card>
          <CardHeader>
            <CardTitle>Composer</CardTitle>
            <CardDescription>
              Crie suas letras com ferramentas inteligentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Começar a Compor</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cifrador</CardTitle>
            <CardDescription>
              Adicione acordes às suas composições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Criar Cifras</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Bases Musicais</CardTitle>
            <CardDescription>
              Encontre bases para suas composições
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full">Explorar Bases</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
