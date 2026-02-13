
# Correção: Dados do formulário de registro limpando ao trocar de aba

## Problema identificado

O componente `AuthorRegistrationSteps` (desktop) possui dois problemas de persistência:

1. **`lyrics` inicia vazio**: Na linha 94, `useState<string>('')` ignora completamente o valor de `initialData.lyrics` que vem do sessionStorage.

2. **`step2Form` ignora `initialData`**: Os valores padrão do formulário da etapa 2 (gênero, versão, tipo de registro, etc.) são hardcoded como strings vazias, ignorando os valores salvos em `initialData`.

3. **Dados intermediários não são salvos**: O parent (`AuthorRegistration`) só atualiza `formData` quando o formulário é submetido (`handleFormSubmit`), mas não captura os dados enquanto o usuário digita. Ao trocar de aba, o componente remonta e perde tudo.

## Solução

### 1. Corrigir `AuthorRegistrationSteps.tsx`

- Inicializar `lyrics` a partir de `initialData.lyrics`
- Inicializar `step2Form` com os valores de `initialData` (genre, styleVariation, songVersion, registrationType, additionalInfo, termsAccepted)
- Adicionar uma prop `onChange` que notifica o parent sempre que os dados mudarem (para que sejam salvos no sessionStorage em tempo real)

### 2. Corrigir `AuthorRegistration.tsx` (desktop)

- Passar uma callback `onChange` para `AuthorRegistrationSteps` que atualiza `formData` em tempo real
- Isso garante que o sessionStorage sempre tenha os dados mais recentes

## Detalhes técnicos

**`AuthorRegistrationSteps.tsx`** - Mudanças:

- Linha 94: `useState<string>('')` vira `useState<string>(initialData.lyrics || '')`
- Linhas 117-125: `step2Form defaultValues` passa a usar valores de `initialData`
- Nova prop `onChange?: (data: Partial<AuthorRegistrationData>) => void`
- Adicionar `useEffect` que chama `onChange` quando `lyrics`, `step1Data` ou `step2Form` mudam

**`AuthorRegistration.tsx`** - Mudanças:

- Adicionar handler `handleFormChange` que faz `setFormData(prev => ({...prev, ...partialData}))`
- Passar `onChange={handleFormChange}` para `AuthorRegistrationSteps`

Os componentes mobile (Step1, Step2) ja possuem persistência independente e nao serao alterados.
