---
sidebar_position: 6
title: Referencia de Campos
---

# Referencia de Campos

Referencia completa de todos os campos do formulario `frm_upload_doc_tae` (Form 14), organizados por secao.

## Dados da Solicitacao

| Campo | ID HTML | Tipo | Descricao |
|-------|---------|------|-----------|
| N. Solicitacao | `numSolicitacao` | text (readonly) | Numero do processo BPM (preenchido automaticamente) |
| Data Abertura | `datAbertura` | text (readonly) | Data de abertura no formato DD/MM/AAAA |
| Data Abertura (aux) | `datAbertura_AAAAMMDD` | hidden | Data no formato AAAAMMDD para ordenacao |
| Hora | `horAbertura` | text (readonly) | Hora de abertura no formato HH:MM |
| Solicitante | `nomSolic` | text (readonly) | Nome completo do solicitante |
| Login | `loginSolic` | hidden | Login do solicitante |
| Matricula Fluig | `matSolicFluig` | hidden | Matricula do usuario no Fluig |
| Situacao | `solicitacaoStatus` | text (readonly) | Status atual da solicitacao |
| N. Consultas | `numeroConsultas` | text (readonly) | Contador de consultas de status |

## Campos Auxiliares (hidden)

| Campo | ID HTML | Descricao |
|-------|---------|-----------|
| `atividade_atual` | `atividade_atual` | Atividade atual do workflow |
| `matricula` | `matricula` | Matricula do usuario |
| `solicitante` | `solicitante` | Nome do solicitante (duplicado) |
| `abertura` | `abertura` | Data de abertura (duplicado) |
| `loginValido` | `loginValido` | Flag de validacao de login |
| `TokenUsuario` | `TokenUsuario` | Token do usuario autenticado |
| `idDoc` | `idDoc` | **ID do envelope no TAE** (chave de integracao) |
| `documentIdAssinado` | `documentIdAssinado` | ID do documento assinado no GED |
| `descritor` | `descritor` | Descritor do documento |
| `limiteUpload` | `limiteUpload` | Limite de upload em bytes |
| `tamanhoTotalAnexos` | `tamanhoTotalAnexos` | Tamanho total dos anexos |
| `token` | `token` | Token JWT do TAE |
| `refreshToken` | `refreshToken` | Refresh token do TAE |
| `prazoExcedido` | `prazoExcedido` | Flag de prazo excedido |
| `endpoint` | `endpoint` | URL base da API TAE |
| `seqItem` | `seqItem` | Sequencia do item (controle pai-filho) |
| `ultItem` | `ultItem` | Ultimo item (controle pai-filho) |

## Configuracoes

| Campo | ID HTML | Tipo | Descricao |
|-------|---------|------|-----------|
| Nome do envelope | `nomeEnvelope` | text | **Obrigatorio**. Nome do envelope no TAE |
| Armazenar manifesto em | `manifestoPath` | text (readonly) | Caminho da pasta GED para o manifesto assinado |

## Tabela Documentos (pai-filho: `documentos`)

| Campo | ID HTML | Tipo | Descricao |
|-------|---------|------|-----------|
| Documento | `documento` | text (readonly) | Nome do arquivo |
| Acoes | `acoesDocumento` | select | `1` = Enviar para assinatura, `2` = Enviar como anexo, `0` = Nao enviar |
| Tamanho | `fileSize` | hidden | Tamanho do arquivo em bytes |
| Nome Original | `nomeOriginal` | hidden | Nome original do arquivo |

## Destinatarios (tabela pai-filho: `tbCtts`)

| Campo | ID HTML | Tipo | Descricao |
|-------|---------|------|-----------|
| Ordem | `ordemAss` | select | Ordem de assinatura (quando utilizaOrdemAss=on) |
| Ordem (valor) | `ordemAssValor` | hidden | Valor numerico da ordem |
| E-mail | `emailCtt` | text (readonly) | E-mail do destinatario |
| Tipo assinatura | `tipoAss` | select | `0`=Assinar, `1`=Validar, `2`=Testemunhar, `3`=Observar, `4`=Certificado A1/A3 |
| Papel assinante | `papelAssinante` | hidden | Papel do assinante no TAE |
| Tipo autenticacao | `tipoAuth` | hidden | `1`=Login, `2`=Codigo de verificacao |
| Nome completo | `nomeCompleto` | hidden | Nome completo (para tipoAuth=2) |
| Tipo identificacao | `tipoIdentificacao` | hidden | Tipo de documento de identidade |
| Documento | `documentoIdentificacao` | hidden | Numero do documento |
| Tipo envio documento | `tipoEnvioDocumento` | hidden | Como enviar o documento |
| Tipo envio codigo | `tipoEnvioCodigo` | hidden | Como enviar o codigo de verificacao |
| Telefone | `telefone` | hidden | Telefone (para tipoAuth=2) |
| ID contato | `idContatoAgenda` | hidden | ID do contato na agenda TAE |

## Checkboxes

| Campo | ID HTML | Valores | Descricao |
|-------|---------|---------|-----------|
| Assinar e enviar | `assinarEnviar` | `on` / `""` | Responsavel tambem assina o documento |
| Ordem de assinaturas | `utilizaOrdemAss` | `on` / `""` | Definir ordem sequencial de assinaturas |
| Assinatura manuscrita | `assinaManus` | `on` / `""` | Solicitar assinatura manuscrita digital |
| Rejeitar documento | `rejeitarDocumento` | `on` / `""` | Permitir que destinatarios rejeitem |

## Informacoes Adicionais

| Campo | ID HTML | Tipo | Descricao |
|-------|---------|------|-----------|
| Data de expiracao | `dataExpiracao` | date | Data limite para assinaturas (formato AAAA-MM-DD) |
| Tipo de assinatura | `tipoDeAssinatura` | select | `0`=Assinatura Eletronica, `4`=Testemunha (do responsavel) |
| Assunto | `assunto` | text | Assunto da mensagem do envelope |
| Mensagem | `mensagem` | textarea | Corpo da mensagem enviada aos destinatarios |

## Dados da Assinatura (preenchidos automaticamente pelo workflow)

| Campo | ID HTML | Tipo | Descricao |
|-------|---------|------|-----------|
| Arquivo | `nomeArquivo` | text (readonly) | Nome do arquivo no TAE |
| Data Publicacao | `dataPublicacao` | text (readonly) | Data de criacao do envelope no TAE |
| Ultima atualizacao | `recModifiedOn` | text (readonly) | Data da ultima modificacao |
| Status (codigo) | `codStatusAssinatura` | hidden | Codigo numerico do status |
| Status (descricao) | `desStatusAssinatura` | text (readonly) | Status textual |
| Resultado | `resultadoAssinatura` | text (readonly) | Resultado final da assinatura |
| Motivo rejeicao | `motivoRejeicao` | textarea (readonly) | Motivo da rejeicao (quando aplicavel) |

## Destinatarios TAE (tabela pai-filho: `destinatariosTAE`)

Tabela preenchida automaticamente pelo `servicetask6` com o status real de cada assinante:

| Campo | ID HTML | Tipo | Descricao |
|-------|---------|------|-----------|
| Nome | `dest_nome_tae` | text (readonly, oculto) | Nome do destinatario |
| E-mail | `dest_email_tae` | text (readonly) | E-mail do destinatario |
| Acao | `dest_acao_tae` | select (readonly) | `0`=Assinar, `1`=Validar, `2`=Testemunhar |
| Data | `dest_data_tae` | text (readonly) | Data da assinatura ou "-" |
| Status | `dest_statusTipoAssinatura_tae` | text (readonly, oculto) | Status individual |
| Pendente? | `dest_pendente_tae` | text (readonly) | "Sim" ou "Nao" |

## Campos extras (layout totvs-tae-app)

Campos adicionais usados somente no fluxo via pagina de acompanhamento:

| Campo | Descricao |
|-------|-----------|
| `origemPagina` | `"true"` — indica que o processo foi criado via layout (nao pelo formulario nativo) |
| `gedFilesJson` | JSON array com documentos GED para anexar: `[{documentId, application, fileName}]` |
