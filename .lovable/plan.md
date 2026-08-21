---
title: Adicionar Tutoriais da Equipe (Estilo Netflix)
description: Implementação de uma nova seção de tutoriais para membros da equipe no painel administrativo, com identidade visual premium estilo Netflix.
---

### Alterações sugeridas

#### Backend (Banco de Dados)
- Criar tabela `staff_tutorials` (ou adicionar coluna `target_audience` na tabela `tutorials`) para separar tutoriais de usuários e da equipe.
- Definir políticas de RLS para que apenas administradores possam gerenciar e visualizar esses tutoriais.

#### Frontend (Componentes Admin)
- **Novo Componente**: `src/components/admin/AdminStaffTutorials.tsx` para gerenciamento (CRUD).
- **Nova Página**: `src/pages/AdminStaffTutorials.tsx` (ou integrar no `AdminDashboard.tsx`) com layout "Estilo Netflix":
    - Carrossel de categorias (Fileiras).
    - Thumbnails grandes com efeito hover.
    - Modal de reprodução de vídeo integrado.
    - Fundo escuro profundo com detalhes em vermelho/branco (estética Compuse/Netflix).

#### Navegação
- **Sidebar Admin**: Adicionar item "Tutoriais Equipe" no `AdminSidebar.tsx`.
- **Rotas**: Registrar a nova rota no `src/App.tsx`.

### Detalhes Técnicos
- Utilizar `framer-motion` para animações suaves de carrossel.
- Reutilizar a lógica de upload e URL assinada para segurança dos vídeos internos.
- Manter consistência com o Design System (círculos flutuantes e tema dark).

### Próximos Passos
1. Criar a migração SQL para a nova tabela.
2. Desenvolver o componente de visualização estilo Netflix.
3. Desenvolver o componente de gerenciamento administrativo.
4. Integrar na navegação e rotas.