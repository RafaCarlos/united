# Terceiros, desempenho e preservação da captação — 23/09/2026

O maior grupo de custo observado é Google Tag Manager/Google tags, seguido por Facebook, RD Station e TikTok. Há espaço para revisar tags e acionamentos nas contas, mas os dados públicos não permitem decidir quais campanhas podem ser desligadas. Este plano registra evidências e verificações necessárias; não houve alteração de contas, publicação ou envio de leads nesta revisão.

## Evidência desta rodada

Fonte: relatório PageSpeed/Lighthouse 13.5 [mobile](https://pagespeed.web.dev/analysis/https-unitedidiomas-com/16d8uxo9sj?form_factor=mobile) e [desktop](https://pagespeed.web.dev/analysis/https-unitedidiomas-com/16d8uxo9sj?form_factor=desktop), transcritos da interface do relatório pela tarefa principal. São execuções de laboratório, sem média de três rodadas nesta coleta.

| Métrica | Mobile | Desktop |
|---|---:|---:|
| Nota de desempenho | 45 | 60 |
| FCP | 3,856 s | não transcrito |
| LCP | 12,356 s | 1,888 s |
| TBT | 697 ms | 1.637 ms |
| CLS de laboratório | 0 | 0,002 |

Os dados de campo dos 28 dias mostram INP mobile de 434 ms e CLS desktop de 0,36. Esse histórico não pode ser atribuído à compilação local de hoje nem comparado como se fosse o resultado imediato de uma alteração. O CLS baixo do laboratório também não invalida o problema observado em visitas reais.

Tempo atribuído aos grupos de URLs no diagnóstico de processamento, arredondado em milissegundos:

| Grupo | Mobile | Desktop | Leitura prática |
|---|---:|---:|---|
| Google Tag Manager/Google tags | 699 | 1.153 | Inclui GA4, Ads e container, não apenas `gtm.js` |
| Código/documento da United | 345 | 627 | Inclui trabalho do documento/renderização; não é todo JavaScript próprio |
| Facebook/Meta | 297 | 477 | Prioridade para revisar necessidade e acionamentos de campanhas |
| RD Station | 294 | 404 | Popup, loader e SDK participam da captação |
| TikTok | 164 | 222 | Revisar com o responsável por mídia |
| Microsoft Clarity | 98 | 130 | Avaliar escopo e necessidade da coleta comportamental |
| jsDelivr/Choices | 55 | 58 | Investigar iniciador e uso efetivo antes de retirar |
| Não atribuído | 201 | 275 | Não atribuir a um fornecedor sem trace |

Detalhamento Google (mobile/desktop): GA4 com parâmetros de contexto `cx` 215/409 ms; `gtm.js` 203/318 ms; Google Ads 200/318 ms; GA4 sem esses parâmetros 81/109 ms. RD: popup 173/237 ms; loader 63/98 ms; SDK de formulário 58/69 ms. United: documento 202/516 ms; scripts-core 86/111 ms; adaptador RD 58 ms no mobile. Pequenas diferenças entre totais e componentes vêm do arredondamento.

Esses tempos não são bytes transferidos nem parcelas aditivas do TBT ou do LCP. O TBT considera a parte bloqueante das tarefas longas em uma janela específica; não é o total de execução. Não foram transcritos bytes desta rodada, portanto não se reutilizaram os valores de 22/09 como se fossem atuais. O Chrome agrupa recursos por fornecedor; o insight de terceiros é informativo e não constitui, isoladamente, uma auditoria reprovada. [Documentação do Chrome](https://developer.chrome.com/docs/performance/insights/third-parties).

## O que os scripts públicos permitem afirmar

O HTML público salvo em `home.public.html` contém o container `GTM-MTK74PV`. A presença de duas URLs de biblioteca GA4 no relatório prova dois recursos observados, com custos próprios. Ela não prova duas conversões, dois `page_view` ou dois disparos para o mesmo destino. Para concluir duplicação de eventos, é preciso correlacionar o evento de origem, destino de medição, sequência no Tag Assistant e requisições de coleta; confirmar o resultado no [DebugView do GA4](https://support.google.com/analytics/answer/7201382?hl=pt-BR).

O [loader RD fornecido](https://d335luupugsy2.cloudfront.net/js/loader-scripts/ee4f0815-8266-4fb5-ba25-416836b02312-loader.js) inicializa popup, integração automática de formulários, rastreamento e consentimento. Chama `RdstationFormsIntegration.Integration.integrateAll` com o identificador UA legado informado pela conta. Não contém os literais GTM, Facebook ou TikTok. Isso não permite atribuir essas tags ao RD, nem excluir que outro recurso dinâmico as carregue. É necessário verificar os iniciadores no navegador/GTM. O parâmetro UA, sozinho, não comprova coleta Universal Analytics ativa ou falha do formulário.

O [SDK de formulários RD](https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js) busca o HTML remoto do formulário e pode carregar dependências, incluindo jQuery, validação e Select2. Apagar o loader porque o SDK já existe pode remover o popup e a integração; apagar o SDK porque o loader existe pode impedir a renderização do formulário incorporado. Seus papéis precisam ser preservados ou substituídos de modo validado.

As cópias dos dois scripts inspecionados e os cabeçalhos HTTP ficam nos artefatos locais de auditoria, fora deste repositório. A disponibilidade futura de `stable` pode mudar; a análise se refere às cópias coletadas em 23/09.

## Falha externa do Blue no diagnóstico de boas práticas

O PageSpeed público desta rodada registra falha de carregamento de `https://event.getblue.io/js/blue-tag.min.js` com `net::ERR_CONNECTION_FAILED`. O Lighthouse executado localmente registrou o mesmo host e caminho usando HTTP, com `net::ERR_NAME_NOT_RESOLVED`, nos artefatos `local-mobile-after.json` e `local-desktop-after.json`. A diferença de protocolo é compatível com uma URL construída a partir do protocolo da página, mas isso é hipótese até conferir o iniciador da requisição.

O recurso está no domínio externo `event.getblue.io`; não é um arquivo ausente do site da United. Os erros demonstram que as requisições falharam nas execuções registradas. Não comprovam que a tag foi descontinuada, que o domínio está permanentemente indisponível ou que a falha tem a mesma causa nos dois ambientes.

A ação é localizar a configuração que injeta o Blue, identificar seu responsável e finalidade, verificar se continua necessária e confirmar a URL correta com o fornecedor. Corrigir a configuração na origem ou retirar a tag comprovadamente dispensável exige validar campanhas, atribuição e captação antes/depois. Não ocultar o erro por interceptação de criação/inserção de scripts no DOM, substituição de respostas ou supressão de mensagens do console: isso pode mascarar a falha e alterar silenciosamente o comportamento da integração.

## Sequência recomendada para GTM e RD

1. **Inventariar antes de alterar.** Exportar a versão atual do container e relacionar cada tag a proprietário, finalidade, ID de destino, acionador, consentimento e campanha ativa. Identificar a origem de GA4, Ads, Meta, TikTok, Clarity, Choices e Blue. Manter uma versão de reversão.
2. **Confirmar duplicações por evento.** No Tag Assistant, executar uma navegação, abertura do formulário e envio válido controlado. Separar abertura, clique e sucesso real. Só consolidar implementações quando houver prova de duplicação para o mesmo destino; dois fornecedores recebendo um evento autorizado não constituem, por si, duplicação incorreta.
3. **Revisar custo dentro do container.** Remover tags comprovadamente abandonadas e limitar tags específicas às páginas/eventos em que têm função. Inspecionar Custom HTML com polling, observadores amplos ou ouvintes repetidos de scroll. Preferir eventos claros no `dataLayer` e modelos nativos Google em vez de instalar `gtag.js` por Custom HTML. Preservar inicialização da fila e ordem do consentimento. [Orientação oficial do Google](https://developers.google.com/tag-platform/tag-manager/datalayer).
4. **Decidir adiamentos com o responsável pelas campanhas.** Pixels sem necessidade imediata podem ser candidatos a carregamento posterior ou escopo menor. Essa decisão exige validar atribuição e remarketing. Não aplicar atraso genérico a todos os terceiros: adiar RD até o primeiro clique pode tornar esse clique inoperante; esperar scroll pode impedir a captação de quem abre o formulário pelo teclado ou pelo banner.
5. **Revisar o RD na conta.** Confirmar quais popups e integrações devem estar ativos por URL, se há mais de uma configuração sobre o mesmo formulário e como o lead chega ao Marketing e segue ao CRM. Manter identificador, campos, antispam, validação, atribuição e confirmação nativa. Sucesso visual não substitui recebimento do registro; recebimento no Marketing não comprova encaminhamento ao CRM.
6. **Medir a alteração isolada.** Após cada mudança aprovada, repetir o mesmo conjunto de navegação/captação e pelo menos três execuções comparáveis por dispositivo. Comparar mediana e variação de LCP/TBT, requisições e tarefas longas. O INP de campo exige acompanhamento após publicação e volume de visitas, não promessa baseada apenas em uma nota de laboratório.

Cache ou compressão no servidor da United não altera cabeçalhos dos arquivos servidos por fornecedores. Migração de parte das tags para servidor pode ser uma etapa posterior, com operação e validação próprias; ela ainda requer envio dos eventos pelo site e não substitui a interface RD. [Arquitetura oficial de tagging no servidor](https://developers.google.com/tag-platform/tag-manager/server-side/intro).

## Revisão dos honeypots RD

O DOM real foi conferido pela tarefa principal: os nomes corretos são `emP7yF13ld` e `sh0uldN07ch4ng3`, ambos readonly. O primeiro nome foi corrigido no seletor local e nas fixtures após essa conferência.

A alteração local aplica `hidden`, `aria-hidden="true"` e `tabindex="-1"` apenas a esses inputs readonly. Não altera `name`, `type`, `value`, `readonly`, `disabled` ou sua posição no formulário. O SDK inspecionado serializa campos tipados por `form.elements`, sem filtro de visibilidade; os dois nomes não estão na lista de campos ignorados. O caminho legado usa `jQuery.serialize()`. A ocultação visual, isoladamente, não exclui um controle habilitado e nomeado da serialização. [Serialização jQuery](https://api.jquery.com/serialize/) e [algoritmo HTML de construção dos dados do formulário](https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#constructing-the-entry-list).

Os testes locais verificaram `FormData` antes/depois, preservação dos valores, campos normais, inicialização tardia e handlers nativos. A suíte RD passou com 26 testes após a correção do nome. Não foi identificado prejuízo à carga de dados do SDK na mudança. Essa evidência não substitui um envio autorizado e confirmado na conta, nem garante o comportamento de futuras versões do HTML/SDK remoto. A checagem no navegador deve confirmar que os dois campos continuam presentes e ocultos e que o popup pode abrir, receber foco, validar e fechar normalmente.

## Critério de liberação

Liberar mudanças de tags somente com a mesma captação válida, confirmação de Marketing/CRM conforme o fluxo configurado, atribuição preservada e ausência de eventos repetidos não intencionais. A melhora de CPU deve ser medida contra o comportamento aprovado; não foi calculada uma economia garantida a partir dos custos acima. Este documento não autoriza remoção de campanhas nem registra execução de mudanças em contas.
