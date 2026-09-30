# Boas práticas: correção no GTM — 24/09/2026

## Diagnóstico confirmado

O site público e o candidato local receberam **73 em boas práticas** na comparação em **HTTPS, Chrome 153 e Lighthouse 13.5**; HTTPS passou nos dois. Os 54 anteriores incluíam a solicitação HTTP da Blue. As mesmas pendências já existiam antes das otimizações.

A diferença entre os 96 do PageSpeed fornecido e a medição local não comprova regressão: as condições diferem. Em condições equivalentes, as pendências também aparecem no site publicado.

| Pendência em HTTPS | Evidência | Responsável pela correção |
|---|---|---|
| Script Blue não carrega | `https://event.getblue.io/js/blue-tag.min.js` → `ERR_NAME_NOT_RESOLVED` | Responsável pelo GTM e pela campanha/fornecedor Blue |
| Cookies de terceiros | 18 cookies de Clarity/Bing, TikTok, Google/DoubleClick, Meta e LinkedIn | Responsáveis pelas integrações e campanhas |
| Avisos no painel Issues | Problemas do tipo `Cookie` | Revisão das configurações e restrições de cada integração |

A primeira execução candidata teve duas interrupções transitórias do servidor HTTPS local em imagens. A fila de conexões do servidor de diagnóstico foi corrigida e a medição refeita: referência anterior, candidato e site publicado ficaram em **73**, com o único erro de console na Blue. Nenhum arquivo do site precisou mudar para essa correção do ambiente de teste.

Evidências fora do Git, na pasta `performance-evidence-2026-09-24/`: `https-check/public.json`, `https-check/baseline-https.json`, `https-check/candidate-https-recheck.json`, `https-check/summary.json` e `blue-tag-origin/blue-origin-summary.json`. Não publicar esses artefatos no servidor. O HTTPS local usa certificado temporário aceito somente pelo processo isolado da auditoria através da impressão da chave pública; nenhuma confiança global do sistema foi alterada.

O relatório PageSpeed fornecido usa Chromium 153.0.8010.36/Linux; o teste local usa Chrome 153.0.8010.54/macOS. No PageSpeed, cookies e Issues passaram e apenas a Blue falhou. Não foi determinada a causa exata da diferença de avisos de cookies entre os ambientes; não atribuí-la automaticamente ao protocolo.

## Tag exata que Rafael deve localizar

No container **GTM-MTK74PV**, procurar tags de **HTML personalizado** contendo `getblue.io`, `blue-tag.min.js` ou `blue_q`. O [script público do container](https://www.googletagmanager.com/gtm.js?id=GTM-MTK74PV), recurso versão 69 examinado em 24/09, identifica a tag da Home assim:

- ID público da tag: **68**; índice 75 no array do recurso.
- Fila/configuração: `blue_q`, `setPageType: "visit"`.
- Gatilho: evento `gtm.js` **e caminho da página exatamente `/`**.
- Frequência: `once_per_load: true`.
- Origem do script: `//event.getblue.io/js/blue-tag.min.js`.

O nome da tag na interface não consta no recurso público. A URL herda HTTP/HTTPS da página; tornar HTTPS explícito não resolve a falha DNS. As tags Blue 62, 64, 70, 72 e 74 têm outros gatilhos: não presumir disparo conjunto nem pausá-las em lote.

Em 24/09, consultas DNS independentes a Google (8.8.8.8) e Cloudflare (1.1.1.1) retornaram **NXDOMAIN** para `event.getblue.io`. Isso confirma a indisponibilidade desse nome nos dois resolvedores no momento da consulta, sem provar que a campanha foi encerrada. O endereço substituto precisa vir do fornecedor.

A conta autenticada inspecionada não tem acesso visível ao container. Rafael ou o responsável autorizado precisa executar a correção; leitura pública não dá permissão de edição.

## Procedimento de correção com escopo limitado

1. **Preservar o workspace.** Conferir versão publicada e alterações pendentes. Registrar a tag 68 e seus gatilhos. Preferir workspace separado, sem descartar trabalho existente nem publicar mudanças não relacionadas.
2. **Confirmar a campanha Blue.** Se ativa, usar somente o endpoint HTTPS validado pelo fornecedor. Se obsoleta, pausar a tag de visita após confirmação do responsável pela campanha e registrar a decisão. Não inventar um domínio substituto.
3. **Testar em pré-visualização/Tag Assistant.** Conferir gatilho `/`, endpoint e ausência do erro. Preservar RD, GA4, Google Ads, conversões e atribuição. Não remover o container nem interceptar o script no site para ocultar falhas.
4. **Revisar cookies por fornecedor.** Consultar motivo/recomendação no [painel Privacy and Security do Chrome](https://developer.chrome.com/docs/devtools/security). Rever versões, restrições de terceiros e escopo das integrações com seus responsáveis. Conferir o mecanismo de consentimento existente e as escolhas reais do visitante; não impor recusa global ou bloquear serviços apenas para elevar a nota.
5. **Revisar o diff.** Incluir somente as alterações pretendidas. **Não publicar automaticamente.** A publicação depende da aprovação e do procedimento do responsável pela conta, com versão anterior identificada para reversão.

## Critério de aceite

A meta é **boas práticas ≥90**, comparada antes/depois **no mesmo ambiente**, junto a desempenho ≥80 em celular e computador. Manter Lighthouse/Chrome, HTTPS, configuração de cookies e condições equivalentes; conferir também acessibilidade, SEO, estabilidade e formulários.

Corrigir só a Blue não garante 90 nem 100: cookies têm peso próprio e não são simples consequência do HTTP. Não desativar auditorias, ocultar erros ou bloquear tags para favorecer a nota.

Antes do GitHub, eliminar os erros locais e consolidar as medições e pendências do GTM. Após publicação autorizada, medir o domínio público e conferir captação/atribuição. Sucesso visual não comprova recebimento no Marketing/CRM. Esta investigação não alterou tags, publicou no GTM ou enviou leads.
