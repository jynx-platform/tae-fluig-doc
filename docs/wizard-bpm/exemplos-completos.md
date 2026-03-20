---
sidebar_position: 7
title: Exemplos Completos
---

# Exemplos Completos

Exemplos end-to-end de como usar o `dsTAESvcStartProcess` em diferentes cenarios.

## Exemplo 1 — Layout WCM (totvs-tae-app)

Este e o cenario real implementado no projeto. O usuario cria um envelope pelo layout de acompanhamento e inicia o processo BPM.

```javascript
/**
 * Fluxo completo:
 * 1. Upload de arquivos para o TAE (dsTAESvcUploadEnvelope)
 * 2. Coleta de destinatarios (modal do layout)
 * 3. Inicio do processo BPM (dsTAESvcStartProcess)
 */
async function enviarParaAssinatura(envelopeId, nomeEnvelope, destinatarios, opcoes) {

  // ── 1. Montar cardData ────────────────────────────────────────────
  var now = new Date();
  var dia = ("0" + now.getDate()).slice(-2);
  var mes = ("0" + (now.getMonth() + 1)).slice(-2);
  var ano = now.getFullYear();

  var cardData = {
    // Envelope
    idDoc: String(envelopeId),
    nomeEnvelope: nomeEnvelope,
    origemPagina: "true",

    // Abertura
    datAbertura: dia + "/" + mes + "/" + ano,
    datAbertura_AAAAMMDD: ano + mes + dia,
    horAbertura: ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2),
    nomSolic: WCMAPI.userFullName || "",
    loginSolic: WCMAPI.userLogin || "",
    matSolicFluig: String(WCMAPI.userCode || ""),
    solicitante: WCMAPI.userFullName || "",
    matricula: String(WCMAPI.userCode || ""),
    abertura: dia + "/" + mes + "/" + ano,
    solicitacaoStatus: "Aberta",

    // Opcoes
    dataExpiracao: opcoes.dataExpiracao || "",
    assunto: opcoes.assunto || "",
    mensagem: opcoes.mensagem || "",
    assinaManus: opcoes.assinaturaManuscrita ? "on" : "",
    rejeitarDocumento: opcoes.permitirRejeicao ? "on" : "",
    utilizaOrdemAss: opcoes.ordemAssinaturas ? "on" : "",
    manifestoPath: opcoes.manifestoPath || "",
    assinarEnviar: opcoes.responsavelAssina ? "on" : "",
    tipoDeAssinatura: String(opcoes.tipoAssinaturaResp || 0),

    // Documento placeholder
    "documento___1": nomeEnvelope + ".pdf",
    "acoesDocumento___1": "1",
  };

  // ── 2. Serializar destinatarios ───────────────────────────────────
  var index = 1;
  destinatarios.forEach(function (d) {
    cardData["emailCtt___" + index]              = d.email;
    cardData["tipoAss___" + index]               = String(d.acao || "0");
    cardData["ordemAss___" + index]               = String(d.ordem || "0");
    cardData["papelAssinante___" + index]         = d.papel || "";
    cardData["nomeCompleto___" + index]           = d.nome || "";
    cardData["tipoAuth___" + index]               = String(d.tipoAuth || "1");
    cardData["tipoIdentificacao___" + index]      = String(d.tipoId || "");
    cardData["documentoIdentificacao___" + index] = d.docId || "";
    cardData["tipoEnvioDocumento___" + index]     = String(d.tipoEnvioDoc || "1");
    cardData["tipoEnvioCodigo___" + index]        = String(d.tipoEnvioCod || "1");
    cardData["telefone___" + index]               = d.telefone || "";
    index++;
  });

  // ── 3. Chamar dataset ─────────────────────────────────────────────
  var cardDataJson = JSON.stringify(cardData);

  var processInstanceId = await new Promise(function (resolve, reject) {
    DatasetFactory.getDataset(
      "dsTAESvcStartProcess",
      null,
      [DatasetFactory.createConstraint("cardDataJson", cardDataJson, cardDataJson, ConstraintType.MUST)],
      null,
      {
        success: function (res) {
          var row = (res.values || [])[0];
          if (!row || String(row.success) !== "true") {
            return reject(new Error(row ? row.message : "Retorno vazio"));
          }
          resolve(row.processInstanceId);
        },
        error: function (_, __, err) {
          reject(new Error(err || "Erro de comunicacao"));
        }
      }
    );
  });

  // ── 4. Atualizar interface ────────────────────────────────────────
  console.log("Processo criado:", processInstanceId);
  alerta("Solicitacao " + processInstanceId + " criada com sucesso!", "success");

  // Salvar mapeamento
  var map = JSON.parse(sessionStorage.getItem("TAE_BPM_MAP") || "{}");
  map[String(envelopeId)] = processInstanceId;
  sessionStorage.setItem("TAE_BPM_MAP", JSON.stringify(map));

  return processInstanceId;
}
```

## Exemplo 2 — Backend (dataset agendado)

Criar processos BPM automaticamente a partir de um dataset agendado:

```javascript
/**
 * Dataset agendado que cria processos BPM para envelopes finalizados
 * que ainda nao possuem solicitacao no Fluig.
 */
function createDataset(fields, constraints, sortFields) {
  var dataset = DatasetBuilder.newDataset();
  dataset.addColumn("envelopeId");
  dataset.addColumn("processInstanceId");
  dataset.addColumn("status");

  try {
    // Buscar envelopes pendentes de processo (exemplo)
    var envelopesPendentes = obterEnvelopesSemProcesso();

    for (var i = 0; i < envelopesPendentes.length; i++) {
      var env = envelopesPendentes[i];

      // Montar cardData minimo
      var cardData = {
        idDoc: String(env.id),
        nomeEnvelope: env.nome,
        origemPagina: "true",
        datAbertura: formatarData(new Date()),
        datAbertura_AAAAMMDD: formatarDataAAAAMMDD(new Date()),
        horAbertura: formatarHora(new Date()),
        nomSolic: "Sistema",
        loginSolic: "admin",
        matSolicFluig: "1",
        solicitante: "Sistema",
        matricula: "1",
        abertura: formatarData(new Date()),
        solicitacaoStatus: "Aberta",
        "documento___1": env.nome + ".pdf",
        "acoesDocumento___1": "1",
      };

      // Adicionar destinatarios
      for (var j = 0; j < env.destinatarios.length; j++) {
        var idx = j + 1;
        cardData["emailCtt___" + idx] = env.destinatarios[j].email;
        cardData["tipoAss___" + idx]  = "0";
        cardData["ordemAss___" + idx]  = "0";
        cardData["tipoAuth___" + idx]  = "1";
      }

      // Chamar dataset (sincrono no backend)
      var c = [
        DatasetFactory.createConstraint(
          "cardDataJson",
          JSON.stringify(cardData),
          JSON.stringify(cardData),
          ConstraintType.MUST
        ),
        DatasetFactory.createConstraint(
          "comment",
          "Processo criado automaticamente pelo agendamento",
          null,
          ConstraintType.MUST
        )
      ];

      var result = DatasetFactory.getDataset("dsTAESvcStartProcess", null, c, null);

      if (result && result.rowsCount > 0) {
        var success = result.getValue(0, "success");
        var pid = result.getValue(0, "processInstanceId");
        var msg = result.getValue(0, "message");

        dataset.addRow([
          String(env.id),
          success === true || success === "true" ? pid : "",
          success === true || success === "true" ? "OK" : "ERRO: " + msg
        ]);
      }
    }

  } catch (e) {
    log.error("[dsAutoCreateProcess] Erro: " + e);
    dataset.addRow(["", "", "ERRO GERAL: " + String(e)]);
  }

  return dataset;
}
```

## Exemplo 3 — Evento de formulario

Iniciar um segundo processo a partir de um evento `afterProcessFinish`:

```javascript
function afterProcessFinish(processId) {
  // Le dados do processo atual
  var idDoc = hAPI.getCardValue("idDoc");
  var nomeEnvelope = hAPI.getCardValue("nomeEnvelope");

  if (!idDoc) {
    log.info("Sem idDoc — nao criando processo secundario");
    return;
  }

  // Montar cardData para o novo processo
  var cardData = {
    idDoc: idDoc,
    nomeEnvelope: nomeEnvelope + " (copia)",
    origemPagina: "true",
    solicitacaoStatus: "Aberta",
    // ... demais campos
  };

  var constraints = [
    DatasetFactory.createConstraint(
      "cardDataJson",
      JSON.stringify(cardData),
      JSON.stringify(cardData),
      ConstraintType.MUST
    ),
    DatasetFactory.createConstraint(
      "processId",
      "wf_ass_ele_tae_2",
      null,
      ConstraintType.MUST
    )
  ];

  var result = DatasetFactory.getDataset("dsTAESvcStartProcess", null, constraints, null);

  if (result && result.rowsCount > 0) {
    var success = result.getValue(0, "success");
    if (success === true || success === "true") {
      log.info("Processo secundario criado: " + result.getValue(0, "processInstanceId"));
    }
  }
}
```

## Exemplo 4 — Fluxo completo com upload + processo

Quando voce precisa fazer o upload para o TAE E criar o processo:

```javascript
async function fluxoCompletoUploadEProcesso(arquivos, destinatarios, opcoes) {

  // ── ETAPA 1: Upload para o TAE ────────────────────────────────────
  var uploadParams = {
    nomeEnvelope: opcoes.nomeEnvelope,
    endpoint: opcoes.endpoint,
    destinatarios: destinatarios,
    arquivos: arquivos.map(function (a) {
      return { dir: a.dir, documentId: a.documentId, fileName: a.fileName, tipo: 1 };
    })
  };

  var uploadResult = await chamarDataset("dsTAESvcUploadEnvelope", [JSON.stringify(uploadParams)]);

  if (!uploadResult.success) {
    throw new Error("Falha no upload: " + uploadResult.message);
  }

  var envelopeId = uploadResult.idDoc;
  console.log("Envelope criado no TAE:", envelopeId);

  // ── ETAPA 2: Iniciar processo BPM ─────────────────────────────────
  var processInstanceId = await enviarParaAssinatura(
    envelopeId,
    opcoes.nomeEnvelope,
    destinatarios,
    opcoes
  );

  console.log("Processo BPM:", processInstanceId, "→ Envelope TAE:", envelopeId);
  return { envelopeId: envelopeId, processInstanceId: processInstanceId };
}
```

:::tip Dica
O Exemplo 1 (layout WCM) e o padrao usado pelo projeto. Os demais exemplos mostram adaptacoes para cenarios especificos. Adapte conforme sua necessidade.
:::
