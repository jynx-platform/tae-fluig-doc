---
sidebar_position: 2
title: "Passo 1: Montar o cardData"
---

# Passo 1 — Montar o cardData

O `cardData` e o objeto JSON que contem todos os campos do formulario. Ele e enviado ao dataset como uma string JSON via constraint `cardDataJson`. O dataset converte cada par chave/valor em um `KeyValueDto` que o SOAP `startProcessClassic` persiste no banco.

## Estrutura basica do cardData

```javascript
var cardData = {
  // === Campos da solicitacao ===
  idDoc: "12345",                     // ID do envelope no TAE (retornado pelo upload)
  nomeEnvelope: "Contrato de Servico",
  origemPagina: "true",               // Indica que veio do layout (pula upload no servicetask5)

  // === Dados de abertura ===
  datAbertura: "20/03/2026",
  datAbertura_AAAAMMDD: "20260320",
  horAbertura: "14:30",
  nomSolic: "Joao Silva",
  loginSolic: "joao.silva",
  matSolicFluig: "000123",
  solicitante: "Joao Silva",
  matricula: "000123",
  abertura: "20/03/2026",
  solicitacaoStatus: "Aberta",

  // === Configuracoes do envelope ===
  dataExpiracao: "2026-04-20",
  assunto: "Assinatura do contrato de prestacao de servicos",
  mensagem: "Prezado, segue contrato para assinatura.",
  assinaManus: "on",                  // checkbox: "on" = true, "" = false
  rejeitarDocumento: "on",
  utilizaOrdemAss: "on",
  manifestoPath: "/pasta/ged/manifestos",

  // === Assinatura do responsavel ===
  assinarEnviar: "on",                // Responsavel tambem assina
  tipoDeAssinatura: "0",              // 0 = Eletronica, 4 = Testemunha

  // === Documento placeholder (obrigatorio para validacao) ===
  "documento___1": "contrato.pdf",
  "acoesDocumento___1": "1",          // 1 = Enviar para assinatura

  // === Destinatarios (formato pai-filho, ver abaixo) ===
  "emailCtt___1": "fulano@empresa.com",
  "tipoAss___1": "0",
  // ... mais campos por destinatario
};
```

## Campos obrigatorios

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `idDoc` | string | ID do envelope no TAE. Obrigatorio quando `origemPagina=true` |
| `nomeEnvelope` | string | Nome do envelope. Validado pelo `servicetask5` |
| `origemPagina` | string | `"true"` para pular upload no workflow |
| `documento___1` | string | Nome do primeiro arquivo (placeholder para validacao) |
| `acoesDocumento___1` | string | Acao do documento: `"1"` = assinar, `"2"` = anexo |

## Campos de data e solicitante

Estes campos preenchem a secao "Dados da Solicitacao" do formulario:

```javascript
// Gerar dados de abertura automaticamente
var now = new Date();
var dia = ("0" + now.getDate()).slice(-2);
var mes = ("0" + (now.getMonth() + 1)).slice(-2);
var ano = now.getFullYear();
var hor = ("0" + now.getHours()).slice(-2);
var min = ("0" + now.getMinutes()).slice(-2);

cardData.datAbertura = dia + "/" + mes + "/" + ano;
cardData.datAbertura_AAAAMMDD = ano + mes + dia;
cardData.horAbertura = hor + ":" + min;
```

## Formato pai-filho para destinatarios

O Fluig usa o padrao `nomeCampo___indice` para tabelas pai-filho. Cada destinatario ocupa um indice sequencial comecando em `1`.

```javascript
function serializeDestinatariosToCardData(destinatarios, observadores) {
  var cardData = {};
  var index = 1;

  // Destinatarios
  (destinatarios || []).forEach(function (d) {
    cardData["emailCtt___" + index]              = String(d.email || "");
    cardData["tipoAss___" + index]               = String(d.acao || "0");
    cardData["ordemAss___" + index]               = String(d.workflow || "0");
    cardData["papelAssinante___" + index]         = String(d.papelAssinante || "");
    cardData["nomeCompleto___" + index]           = String(d.nomeCompleto || "");
    cardData["tipoAuth___" + index]               = String(d.tipoAutenticacao || "1");
    cardData["tipoIdentificacao___" + index]      = String(d.tipoIdentificacao || "");
    cardData["documentoIdentificacao___" + index] = String(d.identificacao || "");
    cardData["tipoEnvioDocumento___" + index]     = String(d.tipoEnvioDocumento || "1");
    cardData["tipoEnvioCodigo___" + index]        = String(d.tipoEnvioCodigo || "1");
    cardData["telefone___" + index]               = String(d.telefone || "");
    index++;
  });

  // Observadores (acao = 3)
  (observadores || []).forEach(function (o) {
    cardData["emailCtt___" + index] = String(o.email || "");
    cardData["tipoAss___" + index]  = "3";   // 3 = Observar
    cardData["ordemAss___" + index]  = "0";
    cardData["papelAssinante___" + index] = "";
    cardData["nomeCompleto___" + index]   = "";
    cardData["tipoAuth___" + index]       = "1";
    cardData["tipoIdentificacao___" + index]      = "";
    cardData["documentoIdentificacao___" + index] = "";
    cardData["tipoEnvioDocumento___" + index]     = "1";
    cardData["tipoEnvioCodigo___" + index]        = "1";
    cardData["telefone___" + index]               = "";
    index++;
  });

  return cardData;
}
```

### Codigos de acao (tipoAss)

| Codigo | Acao |
|--------|------|
| `0` | Assinar |
| `1` | Validar |
| `2` | Testemunhar |
| `3` | Observar |
| `4` | Assinar com certificado (A1/A3) |

### Codigos de autenticacao (tipoAuth)

| Codigo | Tipo |
|--------|------|
| `1` | Login (padrao) |
| `2` | Codigo de verificacao — requer campos adicionais: `nomeCompleto`, `tipoIdentificacao`, `tipoEnvioDocumento`, `tipoEnvioCodigo`, `telefone` |

## Checkboxes do formulario

O Fluig armazena checkboxes como `"on"` (marcado) ou `""` (desmarcado):

```javascript
// Converter booleano para formato Fluig
cardData.assinaManus      = params.solicitaAssinaturaManuscrita ? "on" : "";
cardData.rejeitarDocumento = params.permiteRejeitarDocumento    ? "on" : "";
cardData.utilizaOrdemAss  = params.utilizaworkflow             ? "on" : "";
cardData.assinarEnviar    = params.responsavelAssinaDocumento   ? "on" : "";
```

## Documentos GED (opcional)

Se os arquivos foram publicados no GED pelo layout, passe a lista para o `servicetask5` anexar a solicitacao:

```javascript
var gedFiles = [
  { documentId: 1381, application: "application/pdf", fileName: "contrato.pdf" },
  { documentId: 1382, application: "application/pdf", fileName: "aditivo.pdf" }
];

cardData.gedFilesJson = JSON.stringify(gedFiles);
```

:::tip Dica
O campo `origemPagina: "true"` e fundamental. Sem ele, o `servicetask5` tenta fazer upload de arquivos via `hAPI.listAttachments()` e falha porque nao ha anexos no processo criado via SOAP.
:::
