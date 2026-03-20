---
sidebar_position: 1
title: Introducao
slug: /
---

# Wizard — Abertura de Processo BPM via Dataset

## O que voce vai aprender

Este wizard ensina, passo a passo, como usar o dataset **`dsTAESvcStartProcess`** para iniciar um processo BPM do Fluig a partir de qualquer ponto — seja um layout WCM, uma pagina customizada ou ate outro dataset.

O dataset encapsula toda a complexidade de chamar o servico SOAP `ECMWorkflowEngineService` e executa a criacao do processo em **dois passos**:

1. **`startProcessClassic`** com `completeTask=false` — cria o processo e persiste o cardData no banco
2. **`saveAndSendTaskClassic`** — avanca a tarefa para a proxima atividade (servicetask)

Essa abordagem de dois passos garante que `hAPI.getCardValue()` funcione corretamente nas service tasks do workflow, pois o cardData ja esta salvo no banco antes do avanco.

## Arquitetura da integracao

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Layout WCM / Pagina)                         │
│                                                         │
│  1. Coleta dados do formulario (cardData)                │
│  2. Serializa destinatarios no formato pai-filho         │
│  3. Chama dsTAESvcStartProcess via DatasetFactory        │
└─────────────────────┬───────────────────────────────────┘
                      │ constraint: cardDataJson (JSON)
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Dataset: dsTAESvcStartProcess (servidor Fluig)          │
│                                                         │
│  1. Le parametros dos constraints                        │
│  2. Obtem credenciais via dsTAEParametros                │
│  3. Conecta ao ECMWorkflowEngineService (SOAP)           │
│  4. Monta cardData como KeyValueDtoArray                 │
│  5. PASSO 1: startProcessClassic (completeTask=false)    │
│  6. PASSO 2: saveAndSendTaskClassic (avanca tarefa)      │
│  7. Retorna: success, processInstanceId, message         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────┐
│  Workflow BPM: wf_ass_ele_tae_2                          │
│                                                         │
│  Inicio → servicetask5 → servicetask6 → servicetask12    │
│  (upload)   (status)      (download)                     │
└─────────────────────────────────────────────────────────┘
```

## Pre-requisitos

Antes de comecar, certifique-se de que:

| Requisito | Descricao |
|-----------|-----------|
| **Servico SOAP registrado** | `ECMWorkflowEngineService` deve estar registrado no Fluig Admin como servico do tipo SOAP/WSDL. URL: `{FLUIG_URL}/webdesk/ECMWorkflowEngineService?wsdl` |
| **Dataset dsTAEParametros** | Deve conter as credenciais `usuarioFluig` e `senhaFluig` preenchidas para o ambiente |
| **Processo publicado** | O workflow `wf_ass_ele_tae_2` deve estar publicado e ativo no Fluig |
| **Grupo AUTORES_TAE** | O grupo de seguranca deve existir e conter os usuarios autorizados a iniciar processos |
| **Formulario 14** | O formulario `frm_upload_doc_tae` deve estar publicado como ficha de registro |

## Fluxo completo

```
Coletar dados ──► Montar cardData ──► Chamar dataset ──► Processar resposta ──► Acompanhar
  (Passo 1)         (Passo 1)          (Passo 2)          (Passo 3)           (Passo 4)
```

Nos proximos passos, vamos detalhar cada etapa com exemplos de codigo reais extraidos do projeto.

## Quando usar este dataset

- **Layout WCM** (`totvs-tae-app`): quando o usuario cria um envelope pelo layout de acompanhamento e precisa iniciar o processo BPM associado
- **Integracao externa**: quando um sistema externo precisa disparar um processo de assinatura no Fluig
- **Automacao**: quando um dataset agendado precisa criar processos automaticamente

:::caution Importante
O dataset `dsTAESvcStartProcess` **nao faz upload de arquivos**. O upload deve ser feito antes (via `dsTAESvcUploadEnvelope`) e o `idDoc` retornado deve ser passado no cardData. O `servicetask5` detecta `origemPagina=true` e pula o upload, indo direto para a publicacao.
:::
