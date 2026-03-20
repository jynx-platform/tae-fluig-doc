---
sidebar_position: 4
title: "Passo 3: Processar Resposta"
---

# Passo 3 — Processar a Resposta

Apos chamar o dataset, voce recebe uma linha com tres colunas: `success`, `processInstanceId` e `message`. Aqui esta como tratar cada cenario.

## Estrutura da resposta

| Coluna | Valor (sucesso) | Valor (erro) |
|--------|-----------------|--------------|
| `success` | `true` | `false` |
| `processInstanceId` | `"78432"` (numero da solicitacao) | `""` (vazio) |
| `message` | `"Processo iniciado com sucesso"` | Descricao do erro |

## Tratamento no frontend

```javascript
async function startProcessTAE(params) {
  FLUIGC.loading(".modal-dialog").show();

  try {
    var processInstanceId = await iniciarProcesso(cardData); // Passo 2

    // === SUCESSO ===
    // 1. Exibir alerta de sucesso
    alerta(
      "Processo de assinatura iniciado com sucesso! Solicitacao n. " + processInstanceId,
      "success"
    );

    // 2. Atualizar a interface (ex: grid com link para a solicitacao)
    atualizarCelulaBPM(params.idDocumento, processInstanceId);

    // 3. Salvar mapeamento envelope → BPM no sessionStorage
    try {
      var bpmMap = JSON.parse(sessionStorage.getItem("TAE_BPM_MAP") || "{}");
      bpmMap[String(params.idDocumento)] = String(processInstanceId);
      sessionStorage.setItem("TAE_BPM_MAP", JSON.stringify(bpmMap));
    } catch (e) { /* ignore */ }

    // 4. Limpar dados temporarios
    sessionStorage.removeItem("TAE_ENVELOPE_NAME");
    sessionStorage.removeItem("TAE_ENVELOPE_FILES");

    // 5. Recarregar o grid
    refresh();

    return { processInstanceId: processInstanceId };

  } catch (err) {
    // === ERRO ===
    console.error("[startProcessTAE] Erro:", err);
    alerta(err.message || "Erro ao iniciar processo de assinatura", "error");
    throw err;

  } finally {
    FLUIGC.loading(".modal-dialog").hide();
  }
}
```

## Tratamento no backend

```javascript
var dsResult = DatasetFactory.getDataset("dsTAESvcStartProcess", null, constraints, null);

if (!dsResult || dsResult.rowsCount === 0) {
  throw "dsTAESvcStartProcess retornou vazio - verifique se o dataset esta publicado";
}

var success = dsResult.getValue(0, "success");
var processInstanceId = dsResult.getValue(0, "processInstanceId");
var message = dsResult.getValue(0, "message");

// Normalizar booleano (pode vir como String ou boolean)
var isSuccess = (success === true || success === "true"
  || String(success).trim().toLowerCase() === "true");

if (isSuccess) {
  log.info("Processo criado com sucesso: " + processInstanceId);
  // Continuar fluxo...
} else {
  log.error("Falha ao criar processo: " + message);
  throw "Erro ao iniciar processo BPM: " + message;
}
```

## Erros comuns e como trata-los

### 1. Credenciais nao encontradas

```
Erro: Credenciais Fluig (usuarioFluig/senhaFluig) nao encontradas no dsTAEParametros
```

**Causa**: O dataset `dsTAEParametros` esta com os campos `usuarioFluig` e `senhaFluig` vazios.

**Solucao**: Configurar as credenciais no `dsTAEParametros` para o ambiente.

### 2. Servico SOAP nao encontrado

```
Erro: Servico "ECMWorkflowEngineService" nao encontrado no ServiceManager apos 2 tentativas.
Registre-o no Fluig Admin (tipo SOAP/WSDL).
```

**Causa**: O servico SOAP nao esta registrado no Fluig.

**Solucao**:
1. Acessar **Fluig Admin** → **Servicos** → **Novo Servico**
2. Nome: `ECMWorkflowEngineService`
3. Tipo: SOAP/WSDL
4. URL: `{FLUIG_URL}/webdesk/ECMWorkflowEngineService?wsdl`

### 3. cardDataJson vazio

```
Erro: cardDataJson nao informado ou vazio
```

**Causa**: A constraint `cardDataJson` nao foi passada ou esta vazia.

**Solucao**: Verificar se o JSON esta sendo montado e serializado corretamente antes da chamada.

### 4. Erro SOAP generico

```
Erro: Erro SOAP (PASSO 1): <mensagem do servidor>
```

**Causa**: O servico SOAP retornou erro. Pode ser problema de permissao, processo inexistente ou formulario nao encontrado.

**Solucao**: Verificar nos logs do servidor (`/volume/log/`) a mensagem completa do erro SOAP.

### 5. Processo criado mas tarefa nao avancou

Se o Passo 1 funciona mas o Passo 2 falha, o processo fica parado na atividade inicial.

**Solucao**:
1. Acessar o **Fluig Central de Tarefas**
2. Localizar a solicitacao pelo numero
3. Avancar manualmente ou cancelar e recriar

## Atualizar a interface apos sucesso

Apos criar o processo, atualize o grid para mostrar o link da solicitacao:

```javascript
function atualizarCelulaBPM(envelopeId, numSolicitacao) {
  // Localiza o span no grid pelo ID do envelope
  var linkBPM = document.querySelector(".idTAE" + envelopeId);

  if (linkBPM) {
    linkBPM.innerText = numSolicitacao;
    linkBPM.onclick = function () {
      // Abre a visualizacao do processo
      exibirBPMEnvelope(numSolicitacao);
    };
    $(linkBPM).addClass("fakeAnchor");
  }
}
```

## Boas praticas

1. **Sempre valide o cardData antes de chamar o dataset** — o dataset faz validacao basica, mas erros de dados mal formatados podem causar comportamento inesperado no workflow
2. **Trate o erro de forma amigavel** — exiba mensagens claras ao usuario, nao stack traces
3. **Guarde o mapeamento envelope → processo** — use `sessionStorage` ou banco de dados para referenciar o processo a partir do envelope
4. **Limpe dados temporarios apos sucesso** — evite reprocessamento acidental
