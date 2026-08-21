---
title: Adicionar Tutoriais da Equipe (Estilo Netflix)
description: Implementação de uma nova seção de tutoriais para membros da equipe no painel administrativo, com identidade visual premium estilo Netflix.
---

### Alterações sugeridas

#### Backend (Banco de Dados)
- Adicionar coluna `audience_type` (enum: 'user', 'staff') na tabela `public.tutorials`.
- Criar migração para adicionar a coluna e atualizar as políticas de RLS.
- Garantir que `audience_type = 'staff'` seja visível apenas para administradores.

#### Frontend (Componentes Admin)
- **Novo Componente**: `src/components/admin/AdminStaffTutorials.tsx` para visualização dos tutoriais da equipe.
    - Layout "Estilo Netflix" com fileiras de categorias.
    - Animações de hover com escala e detalhes.
    - Player de vídeo integrado.
- **Componente de Gestão**: Atualizar `src/components/admin/AdminTutorials.tsx` para permitir escolher o público-alvo (Usuários ou Equipe).

#### Navegação e Rotas
- **Sidebar Admin**: Adicionar item "Tutoriais Equipe" no `src/components/admin/AdminSidebar.tsx`.
- **Admin Dashboard**: Adicionar a nova aba e o novo componente no `src/pages/AdminDashboard.tsx`.

### Detalhes Técnicos
- Utilizar `framer-motion` para as animações de fileira/hover estilo streaming.
- Fundo `bg-[#0a0a0b]` consistente com o novo painel administrativo.
- Acabamento premium com bordas finas e sombras suaves.

### Próximos Passos
1. Executar migração SQL para adicionar `audience_type`.
2. Criar o componente `AdminStaffTutorials.tsx` com o design Netflix.
3. Integrar no sidebar e na lógica de abas do dashboard administrativo.
4. Atualizar o formulário de criação de tutoriais para suportar a nova classificação.