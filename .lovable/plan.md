## Problema
O carrossel está repetindo as mesmas ~4 fotos várias vezes porque o código faz `Array.from({ length: 4 }).flatMap(set)` — multiplica cada metade 4x. Com poucos compositores únicos vindos da query (limite atual = 12), o resultado fica visivelmente repetido.

## Solução em `src/pages/Portfolio.tsx`

1. **Buscar mais compositores com foto**: aumentar `get_public_composers` de `p_limit: 12` para `p_limit: 60` (temos ~46 perfis com avatar no banco).
2. **Não multiplicar a lista**: remover o `Array.from({ length: 4 }).flatMap(...)`. Cada fileira recebe sua metade única dos compositores.
3. **Loop suave sem repetição visível**: para a animação de marquee funcionar sem "salto", a faixa precisa ser duplicada exatamente **1 vez** (a animação translada -50%). Essa duplicação é apenas técnica — durante a rolagem o usuário vê a sequência única passar uma vez antes de "voltar", sem o efeito atual de ver a mesma cara 4x lado a lado.
4. **Embaralhar** a lista combinada uma vez (seed estável por sessão) para que as duas fileiras não fiquem visualmente parecidas.
5. Nada mais é alterado (copy, layout, RPC, restante da página).

## Detalhe técnico
- `photos` = únicos filtrados (já feito) → `shuffled`
- `set1 = shuffled.slice(0, half)`, `set2 = shuffled.slice(half)`
- `row1 = [...set1, ...set1]`, `row2 = [...set2, ...set2].reverse()` (duplicação única só para o loop CSS)
- Se `photos.length < 8`, cai para `[...photos, ...photos]` em ambas as fileiras (caso de borda).
