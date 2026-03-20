---
sidebar_position: 5
title: "Passo 4: Acompanhar no Grid"
---

# Passo 4 — Acompanhar no Grid

Apos criar o processo BPM, o usuario precisa acompanhar o andamento. Esta secao mostra como o layout `totvs-tae-app` exibe o vinculo entre o envelope TAE e o processo BPM no grid.

## Fluxo de acompanhamento

```
Processo criado (dsTAESvcStartProcess)
    │
    ├──► Grid atualizado imediatamente (atualizarCelulaBPM)
    │
    ├──► servicetask5 executa (upload/publicacao no TAE)
    │
    ├──► servicetask6 monitora status (polling dsTAESvcConsultaStatus)
    │       └─ Atualiza: codStatusAssinatura, resultadoAssinatura,
    │                     destinatariosTAE (tabela pai-filho)
    │
    └──► servicetask12 faz download do manifesto quando finalizado
            └─ Publica no GED via dsTAEPublishECM
```

## Mapeamento envelope → processo (sessionStorage)

O layout usa `sessionStorage` para manter o vinculo entre envelope e processo mesmo apos refresh:

```javascript
// Ao criar o processo (Passo 3)
var bpmMap = JSON.parse(sessionStorage.getItem("TAE_BPM_MAP") || "{}");
bpmMap[String(envelopeId)] = String(processInstanceId);
sessionStorage.setItem("TAE_BPM_MAP", JSON.stringify(bpmMap));

// Ao renderizar o grid
function obterNumSolicitacao(envelopeId) {
  var bpmMap = JSON.parse(sessionStorage.getItem("TAE_BPM_MAP") || "{}");
  return bpmMap[String(envelopeId)] || null;
}
```

## Status do envelope no TAE

O `servicetask6` consulta periodicamente o status do envelope usando `dsTAESvcConsultaStatus`:

| Codigo | Status | Descricao |
|--------|--------|-----------|
| `0` | Pendente | Aguardando assinaturas |
| `1` | Parcialmente assinado | Algumas assinaturas realizadas |
| `2` | Finalizado | Todas as assinaturas concluidas |
| `4` | Rejeitado | Envelope rejeitado por um destinatario |
| `5` | Rascunho | Envelope em modo rascunho |
| `99` | Erro terminal | Documento excluido, sem permissao ou erro na API |

## Dados atualizados pelo workflow

Apos cada consulta de status, o `servicetask6` atualiza os seguintes campos do formulario:

| Campo | Descricao |
|-------|-----------|
| `codStatusAssinatura` | Codigo numerico do status |
| `desStatusAssinatura` | Descricao textual (mapeada) |
| `resultadoAssinatura` | Resultado final (ex: "Finalizado", "Rejeitado") |
| `nomeArquivo` | Nome do arquivo no TAE |
| `dataPublicacao` | Data de criacao do envelope |
| `recModifiedOn` | Data da ultima modificacao |
| `dataExpiracao` | Data de expiracao do envelope |
| `motivoRejeicao` | Motivo da rejeicao (se status = 4) |
| `numeroConsultas` | Contador de consultas realizadas |

### Tabela destinatariosTAE

A cada consulta, a tabela pai-filho `destinatariosTAE` e atualizada com o status real de cada assinante:

| Campo | Descricao |
|-------|-----------|
| `dest_email_tae` | E-mail do destinatario |
| `dest_nome_tae` | Nome do destinatario |
| `dest_acao_tae` | Acao (Assinar, Validar, Testemunhar) |
| `dest_data_tae` | Data da assinatura (ou "-" se pendente) |
| `dest_pendente_tae` | "Sim" ou "Nao" |
| `dest_statusTipoAssinatura_tae` | Status da assinatura individual |

## Acessar a solicitacao

Para acessar a solicitacao BPM a partir do grid:

```javascript
function exibirBPMEnvelope(numSolicitacao) {
  // Abre a visualizacao do processo no Fluig
  window.open(
    "/portal/p/1/pageworkflowview?app_ecm_workflowview_top=" + numSolicitacao,
    "_blank"
  );
}
```

## Ciclo de vida completo

```
1. Usuario cria envelope no TAE (upload + destinatarios)
        ↓
2. Usuario clica "Iniciar processo" → dsTAESvcStartProcess
        ↓
3. Processo BPM criado → servicetask5 executa
   ├─ Detecta origemPagina=true → pula upload
   ├─ Anexa documentos GED (gedFilesJson)
   └─ Cria envelope no TAE (dsTAECriarEnvelope)
        ↓
4. servicetask6 (loop de monitoramento)
   ├─ Consulta status a cada execucao
   ├─ Atualiza campos do formulario
   └─ Processa assinantes (pendentes vs concluidos)
        ↓
5. Quando status = 2 (Finalizado):
   ├─ servicetask12 → download do manifesto
   ├─ dsTAEPublishECM → publica no GED
   └─ Processo finaliza
```

## Monitoramento agendado (dsTAEMonitoraEnvelopes)

Alem do `servicetask6`, existe o dataset `dsTAEMonitoraEnvelopes` que pode ser configurado como **dataset agendado** no Fluig para sincronizar envelopes finalizados em background:

- Busca envelopes com `status=2` (finalizado)
- Publica o manifesto assinado no GED automaticamente
- Util como fallback caso o `servicetask6` nao tenha completado a publicacao
