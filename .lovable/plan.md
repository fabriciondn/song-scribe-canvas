

## Diagnóstico

A investigacao revelou o seguinte:

| Verificacao | Resultado |
|------------|-----------|
| Tabela `offer_page_analytics` existe | Sim (test e live) |
| RLS habilitado | Sim |
| Política INSERT permissiva para `anon` | Sim |
| Privilegio INSERT para `anon` | Sim |
| Registros na tabela | **0 (zero)** |
| Logs de erro no Postgres | Nenhum |

**Conclusao**: O banco de dados esta corretamente configurado, porem o codigo atualizado com as correcoes de tracking ainda nao foi publicado no dominio `compuse.com.br`.

---

## Causa Raiz

O site `compuse.com.br` esta rodando uma versao antiga do codigo que pode:
1. Nao ter o tracking implementado
2. Ter um bug no tracking que impede o envio
3. Estar sendo bloqueado por cache de Service Worker (PWA)

---

## Plano de Correcao

### 1. Publicar o projeto atualizado

Voce precisa clicar no botao **Publish** no Lovable para enviar o codigo corrigido para producao.

### 2. Verificar no console do navegador

Apos publicar, abra `compuse.com.br/oferta` e verifique no Console (F12) se aparece:

```text
[Analytics] Enviando evento: page_view Session: 1234567890-abc123def
[Analytics] Evento registrado com sucesso: page_view [...]
```

Se aparecer **erro**, me envie a mensagem completa.

### 3. Forcear limpeza de cache (PWA)

Se voce instalou o app como PWA, o Service Worker pode estar servindo uma versao antiga. Para resolver:
- No Chrome: F12 → Application → Service Workers → Unregister
- Ou limpe todo o cache do site nas configuracoes do navegador

---

## Informacoes Tecnicas

O tracking funciona da seguinte forma:

```text
Usuario acessa /oferta
       ↓
useEffect dispara trackPageView()
       ↓
trackOfferEvent('page_view')
       ↓
supabase.from('offer_page_analytics').insert(...)
       ↓
Evento salvo no banco
```

O codigo atual (linha 74 de `src/pages/Oferta.tsx`) ja chama `trackPageView()` corretamente no `useEffect` inicial.

A funcao RPC `get_offer_page_stats` tambem foi corrigida para calcular corretamente:
- Tempo medio de video (maximo por sessao, nao soma cumulativa)
- Horarios de pico (filtrando pelo periodo selecionado)
- Taxa de conclusao (baseada em eventos `video_complete`)

---

## Proximos Passos

1. Publicar o projeto (botao Publish)
2. Acessar `compuse.com.br/oferta` e verificar o console
3. Recarregar o Dashboard Admin e verificar se os dados aparecem

