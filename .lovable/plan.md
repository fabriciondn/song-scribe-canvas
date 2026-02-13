
# Correção: Página de registro voltando ao início ao minimizar

## Problema raiz identificado

Quando o usuário minimiza a página e volta, o hook `useUserCredits` recebe um evento de mudança de autenticação (via `onAuthStateChange`) que dispara `shouldRefresh = true`, fazendo:

1. `setCredits(null)` e `setIsLoading(true)`
2. O componente `AuthorRegistration` renderiza o spinner de loading (linha 174)
3. Isso **desmonta** o `AuthorRegistrationSteps`, perdendo todo estado interno dos formulários
4. Depois, `credits` brevemente fica `null`, mostrando a tela de "créditos necessários"
5. Quando os créditos carregam de volta, `AuthorRegistrationSteps` é remontado do zero

Embora o `desktopStep` e `formData` estejam no sessionStorage, a **remontagem** causa perda de estado interno do react-hook-form (como validações, dirty state, etc).

## Solucao

Evitar que o `AuthorRegistrationSteps` seja desmontado/remontado durante recarregamentos de créditos. Em vez de usar retornos antecipados (early returns) que substituem toda a renderização, usar visibilidade condicional (`display: none` / CSS) ou, mais simplesmente, tratar o caso de loading/null credits de forma que nao desmonte o formulário.

### Mudanca em `AuthorRegistration.tsx`

1. **Remover o early return do `creditsLoading`** - Em vez de retornar um spinner que substitui todo o componente, renderizar o spinner como overlay ou simplesmente ignorar o estado de loading intermediário se o usuário já tinha créditos carregados anteriormente.

2. **Usar ref para "travar" os créditos**: Armazenar o último valor válido de créditos em um `useRef`. Se `credits` voltar a `null` durante um refresh, usar o valor do ref em vez de mostrar a tela de "sem créditos". Isso evita que a tela pisque.

3. **Proteger contra remontagem**: Adicionar um `useRef` para `hasLoadedCredits` que, uma vez `true`, nunca mais mostra o spinner ou a tela de "sem créditos" durante recarregamentos.

### Detalhes tecnicos

```
// Novo estado para "travar" créditos
const creditsRef = useRef<number | null>(null);
const hasLoadedOnce = useRef(false);

// Atualizar ref quando créditos carregam
useEffect(() => {
  if (!creditsLoading && credits !== null) {
    creditsRef.current = credits;
    hasLoadedOnce.current = true;
  }
}, [credits, creditsLoading]);

// Usar creditsRef.current para as verificações
// em vez de credits diretamente
const effectiveCredits = credits ?? creditsRef.current;
const showLoading = creditsLoading && !hasLoadedOnce.current;
const showNoCredits = !showLoading && (effectiveCredits === null || effectiveCredits === 0);
```

Isso garante que:
- O spinner so aparece no primeiro carregamento (nunca mais depois)
- A tela de "sem créditos" nunca aparece durante um refresh intermediário
- O `AuthorRegistrationSteps` nunca é desmontado por causa de loading de créditos
- Nenhuma funcionalidade existente é alterada

### Arquivo modificado

- `src/pages/AuthorRegistration.tsx` - Apenas adicionar logica de ref para estabilizar créditos
