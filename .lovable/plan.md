## Objetivo
Fazer com que as URLs `/portifolio`, `/portfólio` e `/portifólio` (comuns erros de digitação) abram a landing page pública de portfólio, em vez de caírem no SlugDispatcher e mostrarem "Compositor não encontrado".

## Alteração
No arquivo `src/App.tsx`, logo abaixo da rota `/portfolio`, adicionar três rotas estáticas adicionais que renderizam o mesmo componente `<Portfolio />`:
- `/portifolio`
- `/portfólio`
- `/portifólio`

## Por que funciona
Rotas estáticas no React Router têm prioridade sobre rotas dinâmicas (`/:slug`). Como o `SlugDispatcher` está no final do `<Routes>`, qualquer visitante que digitar qualquer uma das variações será direcionado corretamente à landing pública de portfólio, acessível para todos (logados ou não).

## Fora do escopo
- Nenhuma alteração no componente `Portfolio.tsx`
- Nenhuma alteração no `SlugDispatcher`
- Nenhuma outra rota será modificada

## Passo seguinte
Após a aplicação, será necessário publicar o projeto para que `compuse.com.br/portifolio` funcione em produção.