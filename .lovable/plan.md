A funcionalidade de "Operar como" (impersonation) já existe no sistema, mas atualmente ela redireciona o administrador para o Dashboard do usuário selecionado. Para permitir que o administrador registre uma música para o usuário, o processo ideal é que, após clicar em "Operar como", ele possa navegar até a página de registro autoral e realizar o procedimento, que será atribuído ao usuário impersonado graças ao hook `useCurrentUser`.

Vou aprimorar o `AdvancedUserModal` para incluir um atalho direto de registro de música para o usuário selecionado, facilitando o fluxo solicitado.

### Alterações propostas:

1.  **Modificar `AdvancedUserModal.tsx`**:
    *   Adicionar um novo botão de ação na aba "Gerenciar" ou "Visão Geral" chamado "Registrar Música para este Usuário".
    *   Este botão irá disparar a impersonação e redirecionar o administrador diretamente para a página `/dashboard/author-registration`.
    *   Isso economiza cliques e torna o fluxo explícito, como solicitado pelo usuário.

2.  **Garantir a consistência no `ImpersonateButton.tsx`**:
    *   Confirmar que o redirecionamento padrão continua funcionando, mas permitindo que outros componentes (como o modal de detalhes) usem a lógica de impersonação para fluxos específicos.

### Detalhes técnicos:
*   Usarei a função `startImpersonation` do `useImpersonation` hook dentro do `AdvancedUserModal`.
*   Após a impersonação bem-sucedida, usarei o `useNavigate` para ir para `/dashboard/author-registration`.
*   O sistema de registro autoral já utiliza `useCurrentUser`, portanto, ao chegar na página, o formulário identificará o usuário impersonado como o autor, permitindo que o administrador preencha e finalize o registro em nome dele.
