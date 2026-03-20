---
sidebar_position: 8
title: Troubleshooting
---

# Troubleshooting

Guia de resolucao de problemas comuns ao usar o `dsTAESvcStartProcess`.

## Diagnostico rapido

```
Processo nao foi criado?
├── Dataset retornou success=false?
│   ├── "cardDataJson nao informado" → Verificar constraint (ver #1)
│   ├── "Credenciais Fluig nao encontradas" → Configurar dsTAEParametros (ver #2)
│   ├── "Servico nao encontrado" → Registrar ECMWorkflowEngineService (ver #3)
│   └── "Erro SOAP" → Verificar logs do servidor (ver #4)
├── Dataset retornou vazio?
│   └── Dataset nao esta publicado ou erro de permissao (ver #5)
└── Processo criado mas parado?
    └── Passo 2 (saveAndSendTask) falhou (ver #6)
```

## 1. cardDataJson nao informado ou vazio

**Sintoma**: `"Erro ao iniciar processo: cardDataJson nao informado ou vazio"`

**Causas**:
- Constraint nao foi passada na chamada do dataset
- O JSON esta `null`, `undefined` ou string vazia

**Solucao**:
```javascript
// ERRADO — constraint sem valor
DatasetFactory.createConstraint("cardDataJson", "", null, ConstraintType.MUST)

// CORRETO — JSON valido
var json = JSON.stringify(cardData);
DatasetFactory.createConstraint("cardDataJson", json, json, ConstraintType.MUST)
```

## 2. Credenciais Fluig nao encontradas

**Sintoma**: `"Credenciais Fluig (usuarioFluig/senhaFluig) nao encontradas no dsTAEParametros"`

**Causas**:
- O dataset `dsTAEParametros` esta com campos vazios
- O dataset nao esta publicado no ambiente

**Solucao**:
1. Editar o arquivo `datasets/dsTAEParametros.js`
2. Preencher `usuarioFluig` e `senhaFluig` com credenciais validas do ambiente
3. Republicar o dataset no Fluig

```javascript
dataset.addRow(new Array(
    "usuario@tae.com",     // usuarioTAE
    "senhaTAE123",         // senhaTAE
    "admin",               // usuarioFluig  ← preencher
    "senhaFluig123",       // senhaFluig    ← preencher
    "4734"                 // pastaGEDPadrao
));
```

:::warning Seguranca
Nunca commitar credenciais reais no repositorio. Configure por ambiente.
:::

## 3. Servico ECMWorkflowEngineService nao encontrado

**Sintoma**: `"Servico 'ECMWorkflowEngineService' nao encontrado no ServiceManager apos 2 tentativas"`

**Solucao passo a passo**:

1. Acessar o **Fluig Admin** (`{URL}/admin`)
2. Ir em **Configuracoes** → **Servicos**
3. Clicar em **Novo Servico**
4. Preencher:
   - **Nome**: `ECMWorkflowEngineService`
   - **Tipo**: SOAP/WSDL
   - **URL**: `{FLUIG_URL}/webdesk/ECMWorkflowEngineService?wsdl`
5. Salvar e testar a conexao

## 4. Erro SOAP

**Sintoma**: `"Erro SOAP (PASSO 1): ..."` ou `"Erro SOAP (PASSO 2): ..."`

**Causas comuns**:

| Mensagem SOAP | Causa | Solucao |
|--------------|-------|---------|
| `Process not found` | Processo `wf_ass_ele_tae_2` nao esta publicado | Publicar o workflow no Fluig |
| `User without permission` | Usuario nao tem permissao para iniciar o processo | Adicionar usuario ao grupo `AUTORES_TAE` |
| `Form not found` | Formulario 14 nao esta publicado | Publicar o formulario como ficha de registro |
| `Invalid card data` | Campo obrigatorio do formulario ausente | Verificar se todos os campos necessarios estao no cardData |

**Como investigar**:
```bash
# Logs do servidor Fluig
tail -f /volume/log/server.log | grep -i "dsTAESvcStartProcess"

# Ou no admin: Monitoramento → Logs
```

## 5. Dataset retornou vazio

**Sintoma**: A chamada ao dataset retorna sem linhas (`rowsCount = 0` ou `values = []`).

**Causas**:
- Dataset `dsTAESvcStartProcess` nao esta publicado no Fluig
- Erro de permissao — usuario nao pode executar datasets
- Timeout no servidor

**Solucao**:
1. Verificar se o dataset esta listado em **Painel de Controle** → **Datasets**
2. Testar o dataset diretamente no Fluig: **Datasets** → **dsTAESvcStartProcess** → **Visualizar**
3. Verificar logs do servidor para erros de execucao

## 6. Processo criado mas parado na atividade inicial

**Sintoma**: O processo aparece na Central de Tarefas mas nao avanca para o `servicetask5`.

**Causa**: O Passo 1 (`startProcessClassic`) funcionou mas o Passo 2 (`saveAndSendTaskClassic`) falhou.

**Solucao**:
1. Verificar logs: buscar `"PASSO 2"` nos logs do dataset
2. No Fluig Admin, localizar a solicitacao e mover a tarefa manualmente
3. Ou cancelar a solicitacao e criar uma nova

## 7. hAPI.getCardValue retorna null no servicetask5

**Sintoma**: O `servicetask5` nao consegue ler os campos do formulario — todos retornam `null`.

**Causa**: O processo foi criado com `completeTask=true` em um unico passo, e o cardData nao foi persistido antes do avanco.

**Solucao**: O dataset `dsTAESvcStartProcess` ja trata isso com o padrao de dois passos. Se voce esta usando uma versao antiga:
1. Atualizar para a versao que usa `completeTask=false` + `saveAndSendTaskClassic`
2. Verificar se o dataset esta na versao mais recente

## 8. Timeout na chamada do dataset

**Sintoma**: A chamada do dataset demora e eventualmente retorna erro de timeout.

**Causas**:
- O `ECMWorkflowEngineService` esta lento
- O servidor Fluig esta sob carga

**Solucao**:
- O dataset ja tem retry automatico (2 tentativas com 3s de intervalo) para o `ServiceManager.getService()`
- Se o problema persistir, aumentar o timeout do Authorize Client no Fluig Admin
- Verificar saude do servidor Fluig

## 9. Destinatarios nao aparecem na tabela TAE

**Sintoma**: O processo foi criado com sucesso, mas a tabela `destinatariosTAE` esta vazia.

**Causa**: Normal. A tabela e preenchida pelo `servicetask6` na primeira consulta de status, nao pelo `dsTAESvcStartProcess`.

**Solucao**: Aguardar a execucao do `servicetask6`. Os destinatarios serao populados automaticamente.

## 10. Erros de encoding no cardData

**Sintoma**: Caracteres especiais (acentos, cedilha) aparecem incorretos no formulario.

**Causa**: O `JSON.stringify` pode produzir encoding diferente do esperado pelo SOAP.

**Solucao**: O dataset converte todos os valores para `String()` via Java — o encoding e tratado automaticamente. Se persistir, verificar o charset do banco de dados do Fluig.

## Checklist de verificacao

Antes de abrir um chamado, verifique:

- [ ] Dataset `dsTAESvcStartProcess` publicado no Fluig
- [ ] Dataset `dsTAEParametros` com credenciais preenchidas
- [ ] Servico `ECMWorkflowEngineService` registrado (tipo SOAP/WSDL)
- [ ] Workflow `wf_ass_ele_tae_2` publicado e ativo
- [ ] Formulario 14 publicado como ficha de registro
- [ ] Grupo `AUTORES_TAE` criado e com usuarios
- [ ] Constraint `cardDataJson` com JSON valido e nao vazio
- [ ] Logs do servidor verificados (`/volume/log/server.log`)
