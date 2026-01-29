

## Diagnostico Completo

Apos investigacao detalhada, confirmei:

| Item | Status |
|------|--------|
| Tabela `offer_page_analytics` existe | Sim |
| RLS INSERT para `anon` | PERMISSIVE (correto) |
| Privilegios INSERT para `anon` | true (correto) |
| Registros na tabela | **0 (zero)** |
| Site `compuse.com.br/oferta` carrega | Sim (HTML correto) |
| Logs `[Analytics]` no console | **NAO aparecem** |

---

## Causa Raiz Identificada

O codigo de tracking **nao esta executando** porque:

1. O `console.log` dentro do `trackOfferEvent` nao aparece
2. Isso indica que a funcao nunca e chamada, ou o modulo nao e carregado
3. A causa mais provavel e um **erro silencioso no import** ou **cache do Service Worker**

O Service Worker (PWA) pode estar servindo uma versao antiga do bundle JavaScript que nao contem o codigo de tracking atualizado.

---

## Plano de Correcao

### Passo 1: Adicionar log de inicializacao

Adicionar um `console.log` no inicio do arquivo `Oferta.tsx` para confirmar que o componente carrega:

```typescript
// No inicio do arquivo, logo apos os imports
console.log('[Oferta] Componente carregado - versao 2026.01.29');
```

### Passo 2: Adicionar log no servico de analytics

Adicionar um log no topo do arquivo `offerAnalyticsService.ts`:

```typescript
console.log('[Analytics Service] Modulo carregado');
```

### Passo 3: Melhorar o tratamento de erro do sessionStorage

O `sessionStorage` pode estar bloqueado em alguns navegadores. Adicionar fallback:

```typescript
const getSessionId = (): string => {
  try {
    let sessionId = sessionStorage.getItem('offer_session_id');
    if (!sessionId) {
      sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('offer_session_id', sessionId);
    }
    return sessionId;
  } catch (e) {
    console.warn('[Analytics] sessionStorage bloqueado, usando ID temporario');
    return `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
};
```

### Passo 4: Adicionar log antes de chamar trackPageView

No `useEffect` do `Oferta.tsx`, adicionar log antes da chamada:

```typescript
useEffect(() => {
  console.log('[Oferta] useEffect executando - iniciando tracking');
  // ... resto do codigo
  trackPageView();
  console.log('[Oferta] trackPageView chamado');
}, []);
```

---

## Acao Imediata Necessaria

Apos implementar as correcoes:

1. **Publicar novamente** o projeto
2. Acessar `compuse.com.br/oferta` e fazer **hard refresh** (Ctrl+Shift+R)
3. Se o PWA estiver instalado, **desinstalar e limpar cache**
4. Verificar no console se os novos logs aparecem

---

## Detalhes Tecnicos

O fluxo de tracking atual:

```text
Usuario acessa /oferta
       |
       v
React renderiza componente Oferta
       |
       v
useEffect dispara (deveria aparecer log)
       |
       v
trackPageView() chamado
       |
       v
trackOfferEvent('page_view') executa
       |
       v
console.log('[Analytics] Enviando evento...')  <-- NAO APARECE
       |
       v
supabase.insert(...)
```

O problema esta em algum ponto **antes** do log `[Analytics]`, por isso precisamos adicionar logs intermediarios para identificar exatamente onde o fluxo para.

