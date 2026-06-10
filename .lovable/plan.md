## Objetivo
No hero da página `Portfolio`, exibir somente compositores que possuem foto de perfil (avatar), removendo os círculos com inicial (fallback).

## Mudanças em `src/pages/Portfolio.tsx`

1. Ao montar a lista do carrossel (combinação de `works` + `heroComposers`), filtrar somente itens que tenham `composer_photo_url`/`avatar_url` não vazio.
2. Remover o fallback de inicial no `Avatar` do carrossel (já que todos terão foto). Manter `AvatarImage` apenas.
3. Se após o filtro houver menos de N itens para preencher as duas fileiras, duplicar a lista para manter a animação de scroll contínua sem espaços vazios.
4. Não alterar mais nada (copy, layout, animações, RPC permanecem iguais).

Nenhuma outra parte do projeto será tocada.