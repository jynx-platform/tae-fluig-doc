---
sidebar_position: 3
title: "Passo 2: Chamar o Dataset"
---

# Passo 2 — Chamar o Dataset dsTAESvcStartProcess

Com o `cardData` montado (Passo 1), agora voce precisa chamar o dataset passando o JSON como constraint.

## Interface do dataset

### Entrada (constraints)

| Constraint | Tipo | Obrigatorio | Descricao |
|-----------|------|-------------|-----------|
| `cardDataJson` | string (JSON) | Sim | JSON com todos os campos do formulario `{ "campo": "valor", ... }` |
| `processId` | string | Nao | ID do processo. Default: `"wf_ass_ele_tae_2"` |
| `comment` | string | Nao | Comentario da movimentacao. Default: `"Envelope criado via página TAE"` |
| `choosedState` | string | Nao | Estado destino. Default: `"0"` (automatico) |
| `managerMode` | string | Nao | Modo gerente. Default: `"false"` |

### Saida (colunas)

| Coluna | Tipo | Descricao |
|--------|------|-----------|
| `success` | boolean | `true` se o processo foi criado com sucesso |
| `processInstanceId` | string | Numero da solicitacao criada |
| `message` | string | Mensagem de sucesso ou descricao do erro |

## Chamada no frontend (layout WCM / pagina)

No frontend, use `DatasetFactory.getDataset` com callback assincrono:

```javascript
async function iniciarProcesso(cardData) {
  var cardDataJson = JSON.stringify(cardData);

  var processInstanceId = await new Promise(function (resolve, reject) {
    // Monta a constraint com o JSON do cardData
    var constraints = [
      DatasetFactory.createConstraint(
        "cardDataJson",     // fieldName
        cardDataJson,       // initialValue
        cardDataJson,       // finalValue
        ConstraintType.MUST // tipo
      )
    ];

    // Chama o dataset no servidor
    DatasetFactory.getDataset(
      "dsTAESvcStartProcess",  // nome do dataset
      null,                     // fields (nao usado)
      constraints,              // constraints
      null,                     // sortFields (nao usado)
      {
        success: function (res) {
          var values = res.values || [];
          if (!values.length) {
            return reject(new Error("Dataset retornou vazio"));
          }

          var row = values[0];
          var success = String(row.success) === "true";
          var pid = row.processInstanceId || "";
          var message = row.message || "";

          if (!success) {
            return reject(new Error(message || "Erro ao iniciar processo"));
          }

          resolve(pid);
        },
        error: function (jqXHR, textStatus, errorThrown) {
          reject(new Error(errorThrown || "Erro de comunicacao com o servidor"));
        }
      }
    );
  });

  console.log("Processo criado! Solicitacao:", processInstanceId);
  return processInstanceId;
}
```

## Chamada no backend (outro dataset ou evento de formulario)

No backend (server-side), a chamada e sincrona:

```javascript
// Montar constraint
var constraints = [];
constraints.push(
  DatasetFactory.createConstraint(
    "cardDataJson",
    JSON.stringify(cardData),
    JSON.stringify(cardData),
    ConstraintType.MUST
  )
);

// Chamar o dataset
var dsResult = DatasetFactory.getDataset(
  "dsTAESvcStartProcess",
  null,
  constraints,
  null
);

// Processar resposta
if (dsResult && dsResult.rowsCount > 0) {
  var success = dsResult.getValue(0, "success");
  var processInstanceId = dsResult.getValue(0, "processInstanceId");
  var message = dsResult.getValue(0, "message");

  if (success === true || success === "true") {
    log.info("Processo criado: " + processInstanceId);
  } else {
    log.error("Erro: " + message);
  }
}
```

## Parametros opcionais

### Mudar o processo destino

Se voce tem um workflow diferente do padrao:

```javascript
constraints.push(
  DatasetFactory.createConstraint("processId", "meu_workflow_custom", null, ConstraintType.MUST)
);
```

### Adicionar comentario

```javascript
constraints.push(
  DatasetFactory.createConstraint("comment", "Criado automaticamente pelo agendamento", null, ConstraintType.MUST)
);
```

### Modo gerente

Permite iniciar processo em nome de outro usuario (requer permissao):

```javascript
constraints.push(
  DatasetFactory.createConstraint("managerMode", "true", null, ConstraintType.MUST)
);
```

## O que acontece internamente

Quando o dataset e executado, ele realiza as seguintes operacoes:

```
1. Le cardDataJson da constraint
   └─ JSON.parse → objeto com campos do formulario

2. Obtem credenciais do dsTAEParametros
   └─ usuarioFluig, senhaFluig

3. Conecta ao ECMWorkflowEngineService via ServiceManager
   └─ ServiceManager.getService("ECMWorkflowEngineService")
   └─ Retry automatico (2 tentativas com 3s de intervalo)

4. Monta estruturas SOAP:
   ├─ colleagueIds (StringArray) → usuario que criara o processo
   ├─ cardDataArray (KeyValueDtoArray) → campos do formulario
   ├─ attachments (ProcessAttachmentDtoArray) → vazio
   └─ appointments (ProcessTaskAppointmentDtoArray) → vazio

5. PASSO 1: startProcessClassic(completeTask=FALSE)
   ├─ Cria o processo no banco
   ├─ Persiste o cardData
   └─ Retorna processInstanceId (iProcess)

6. Seta numSolicitacao = processInstanceId no cardData

7. PASSO 2: saveAndSendTaskClassic(completeTask=TRUE)
   ├─ Reenvia o cardData (com numSolicitacao)
   └─ Avanca a tarefa para o proximo estado (servicetask5)

8. Retorna: success=true, processInstanceId, message
```

:::warning Atencao
O dataset faz **duas chamadas SOAP sequenciais**. Se o Passo 1 falhar, o Passo 2 nao e executado. Se o Passo 2 falhar, o processo fica criado mas parado na atividade inicial — nesse caso, use o Fluig Admin para mover a tarefa manualmente.
:::

:::info Por que dois passos?
Se usassemos `startProcessClassic` com `completeTask=true` diretamente, o `servicetask5` seria executado **antes** do cardData ser persistido no banco. Isso causava `hAPI.getCardValue()` retornando `null` para todos os campos. O padrao de dois passos resolve isso garantindo a persistencia antes do avanco.
:::
