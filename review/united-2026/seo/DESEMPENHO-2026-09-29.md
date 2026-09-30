# Carregamento da Home — 29/09/2026

**Estado do envio em 30/09:** o usuário autorizou o envio ao GitHub da entrega WebP/minificada v2 após a rodada de testes abaixo. A branch `codex/united-performance-v2-2026-09-30` parte de `origin/main` em `d5929f8`. A autorização permite revisão do código; não confirma a meta pública de desempenho 80, INP corrigido, merge ou publicação em produção. As indicações de Git retido nas medições anteriores descrevem o estado daquela rodada.

## Complemento de 30/09: WebP, minificação e cache v2

Foram gerados 68 derivados WebP sem perda, verificando pixels RGBA, dimensões e hashes contra os originais preservados. Os 32 PNG únicos usados em elementos `img` nas quatro páginas passaram de 839.969 para 523.154 bytes (37,7%); na Home, 17 arquivos somam 86.472 → 56.652 bytes. O fundo Jimmy, separado dessas imagens, passou de 206.313 para 109.382 bytes. Estes são totais de arquivos, não tráfego inicial medido. Os demais derivados incluem CSS legado e não foram contados como ganho de rede da Home. SVG, favicon, imagens PNG de metadados/compartilhamento e GIFs animados foram preservados; dois JPEG legados permaneceram porque WebP lossless aumentaria seu tamanho.

A opção `export-production.py --optimize --asset-version 2` finaliza somente a cópia exportada: minifica HTML/CSS e espaços/comentários não legais do JavaScript, sem renomear identificadores ou alterar sua lógica. Aplica `?v=2` aos recursos locais carregados, inclusive CSS, fontes, imagens, srcsets e preloads, com recalculo dos hashes de CSS. URLs externas RD/GTM, navegação, ações, canonical e metadados permanecem iguais. Nas próximas entregas modificadas, incrementar a versão; cache da hospedagem/CDN deve considerar a query e o HTML deve revalidar. A configuração Apache proposta admite versões numéricas nos JS conhecidos, sem cache immutable nesses scripts.

No conjunto de arquivos da exportação, HTML passou de 245.555 para 214.619 bytes; CSS de 830.753 para 810.782; JavaScript de 361.039 para 320.500. Esses totais incluem arquivos de referência não carregados pela Home. Com gzip, os totais são respectivamente 52.026 → 49.336, 139.163 → 134.368 e 109.323 → 104.129 bytes. O HTML da Home passou de 108.275 para 101.122 bytes (gzip 23.295 → 22.376). Não apresentar essa redução como nova nota PageSpeed ou correção comprovada do INP.

Validação: 60 testes de comportamento executados contra o JS efetivamente minificado, 22 de exportação, 5 de minificação/idempotência, 15 de CSS crítico, 15 de redirecionamento/cache e 13 de rastreamento, todos aprovados. Apache passou na verificação de sintaxe isolada, sem iniciar servidor. Chrome desktop e viewport de 390 px: quatro páginas sem imagens quebradas detectadas, menu/FAQ funcionais, campos RD e popup WhatsApp carregados sem enviar contatos; no celular, sem rolagem horizontal e com atalho acima da barra Quero conhecer. Não substitui teste de Safari em aparelho real. Relatório técnico: `delivery-optimization.json`. Sem commit, push, deploy ou nova medição pública do candidato nesta rodada.

## Complemento de 30/09: resposta às interações (INP)

O [relatório de produção de 30/09 às 12:12](https://pagespeed.web.dev/analysis/https-unitedidiomas-com/tk7wha0os7?form_factor=mobile) mostra INP móvel de **432 ms** e desktop de **138 ms** nos dados reais dos últimos 28 dias. O problema de campo do desktop é CLS **0,33**; mobile tem CLS 0,03 e LCP 2,1 s. O alvo de INP bom é **≤200 ms no percentil 75**, por dispositivo, segundo a [definição do Google](https://web.dev/articles/inp). A nota de laboratório de carregamento e seu TBT não substituem a medição de interações.

Foi feita uma coleta local com Event Timing e Long Animation Frames, em Chrome no Mac e viewport 390×844, sem limitação artificial de CPU. Menu, troca de banner, abertura do formulário, foco nos campos, fechamento e WhatsApp responderam entre 40 e 112 ms nas interações registradas. Isso não reproduz o hardware do iPhone nem demonstra INP de campo corrigido. Nenhum contato ou mensagem foi enviado. O código de diagnóstico fica fora do repositório, não na entrega de produção.

Houve custo concreto de terceiros durante cliques: no banner Jimmy, um frame de 92,4 ms incluiu 27,4 ms no handler de documento de Choices.js, 16,1 ms em Meta e 5,5 ms em GTM. Ao focar Nome, Choices.js consumiu 44,3 ms e TikTok 8,8 ms em um frame de 58,1 ms. Esses exemplos ajudam a direcionar investigação, mas não comprovam que expliquem os 432 ms agregados de visitantes. O tempo atribuído ao adaptador WhatsApp inclui sua chamada síncrona ao handler nativo RD; não atribuir todo esse tempo ao código local.

Inspeção do código público confirmou um mecanismo de trabalho redundante: o SDK de popup RD carrega Choices.js 4 para o seletor de país quando o telefone usa `INTERNATIONAL_MASK`. Na versão 4.1.4 servida pelo CDN, o handler global `document.click` testa o array `highlightedActiveItems` como booleano; mesmo vazio, chama `unhighlightAll()`, que dispara atualização e evento para os itens. Isso é compatível com o custo de Choices medido ao clicar fora do seletor. O encaminhamento ao suporte RD é pedir correção/atualização do componente e verificar se há configuração oficial de telefone Brasil sem seletor internacional, preservando prefixo, validação e captura. Não foi confirmada essa opção no painel; não aplicar troca de biblioteca ou remendo do fornecedor sem validação. Esse achado não explica sozinho o INP agregado de 432 ms.

Correção local específica: `outsidePanel()` agora descarta eventos cujo alvo seja campo, botão ou outro descendente do diálogo antes de consultar sua geometria. Antes, todo toque dentro do formulário lia `getBoundingClientRect()`, mesmo sem poder fechar pelo fundo. Três testes confirmam ausência dessa leitura em controles, fechamento externo e preservação do clique dentro do painel. Mais 21 testes do formulário/carregamento passaram. Não houve alteração de SDK, GTM, destinos, campos ou captação.

O próximo diagnóstico de INP deve registrar interações lentas em aparelhos reais, com alvo, atraso de entrada, execução e apresentação; caso se adote coleta de visitantes, definir destino e minimização de dados antes de integrá-la. Rever handlers globais de terceiros com os responsáveis, preservando conversões. Não inferir sucesso de campo apenas de um teste local ou da nota 80. Sem commit/push nesta rodada.

## Estado da entrega

Alterações locais, sem commit/push nem publicação em produção desta rodada. A main remota consultada em 29/09 está em `d5929f8`, merge do PR #7; sua árvore é igual à referência `8204614` usada neste trabalho. Nenhuma mudança do Rafael foi descartada e nenhum PHP da raiz foi alterado.

A meta permanece desempenho mínimo 80 em celular e desktop, com as demais categorias bem posicionadas. A primeira versão do candidato cumpriu 80 nas medições locais descritas abaixo, mas **não cumpriu a meta no primeiro PageSpeed público da cópia temporária autorizada**. O Git permanece sem atualização. Não apresentar notas locais como resultado do domínio oficial; a rede, hospedagem e ambiente do Lighthouse são diferentes.

## Mudanças

- Banners responsivos reencodificados das artes originais em WebP qualidade 85, em vez de 90. Mesmas dimensões, proporções, recortes, conteúdo e seleção por densidade. O banner institucional móvel de 680 px caiu de 87.200 para 68.030 bytes (22%). Foram conferidos texto, rosto e composição em comparações visuais dos três retratos e do institucional largo. Os originais permanecem intactos.
- No desktop, a composição larga de um painel inativo e o retrato duplicado do painel ativo não têm caixa de layout. Com carregamento nativo tardio, não são baixados na abertura. As imagens dos painéis laterais visíveis continuam carregando; a seleção dos banners e sua geometria foram verificadas no navegador. A primeira seleção de uma composição ainda não carregada depende da rede.
- Mantidos CSS crítico da Home e folha completa assíncrona com fallback sem JavaScript; SDK do formulário oficial RD carregado por intenção/proximidade; correções de viewport/restauração do WhatsApp e remoção da seta de Quero conhecer preparadas em 24/09.
- Testes de CSS crítico agora verificam o estilo inline efetivamente entregue, regras de formulário/Safari e fallback completo em noscript, sem depender apenas de uma nova extração do bundle.
- Depois do primeiro PageSpeed temporário: medição da barra sob o WhatsApp usa a dimensão entregue pelo ResizeObserver e agrupa o fallback por frame, incluindo a recuperação de Safari/bfcache. Depoimentos também agrupam scroll/resize e só atualizam controles e anúncio acessível quando mudam. Não há remoção ou adiamento artificial de tags para alterar o resultado da auditoria.

GTM, loader da conta RD, destinos dos links, confirmação correlacionada do formulário, logo, cores aprovadas e conteúdo SEO foram preservados. Nenhum serviço foi bloqueado para favorecer a medição.

## Comparação controlada local anterior à revisão de scroll/ResizeObserver

Lighthouse 13.5.0, Chrome 154/macOS, HTTPS, gzip, carregamento frio e integrações externas reais. Três execuções sequenciais por dispositivo, alternando referência anterior e candidato. Exceção de certificado restrita à chave de teste localhost de cada processo Chrome isolado; nenhuma confiança global do computador foi alterada. Os dois servidores usam a mesma configuração e não simulam cache de produção ainda não aplicado.

| Categoria | Referência celular | Candidato celular | Referência desktop | Candidato desktop |
|---|---:|---:|---:|---:|
| Desempenho, execuções | 66 / 83 / 84 | 83 / 84 / 85 | 97 / 98 / 98 | 99 / 99 / 99 |
| Desempenho, mediana | 83 | 84 | 98 | 99 |
| Acessibilidade | 100 | 100 | 100 | 100 |
| Boas práticas | 73 | 73 | 73 | 73 |
| SEO | 100 | 100 | 100 | 100 |
| Navegação agêntica aplicável | 2/2 | 2/2 | 2/2 | 2/2 |

Não atribuir a diferença 66 → 85 a um ganho consistente: o primeiro teste da referência foi uma execução mais lenta. A comparação das medianas mostra ganho modesto de nota, com redução verificável de bytes.

| Mediana | Referência celular | Candidato celular | Referência desktop | Candidato desktop |
|---|---:|---:|---:|---:|
| FCP | 1,35 s | 1,20 s | 0,36 s | 0,32 s |
| LCP | 3,83 s | 3,68 s | 1,16 s | 1,00 s |
| TBT | 266,5 ms | 257 ms | 0 ms | 0 ms |
| CLS | 0 | 0 | 0 | 0 |
| Speed Index | 2,67 s | 2,88 s | 0,86 s | 0,32 s |
| Transferência | 2.076.057 B | 1.960.712 B | 3.278.308 B | 2.569.693 B |

Redução de transferência: 115.345 B no celular (5,6%) e 708.615 B no desktop (21,6%). O Speed Index móvel não melhorou nessa amostra. O LCP móvel continua acima de 2,5 s; cumprir nota 80 não significa excelência em todos os indicadores ou aprovação dos dados reais de 28 dias.

As seis auditorias do candidato não baixaram o SDK principal RD na abertura. No desktop, não houve pedido inicial dos dois wides inativos nem do retrato institucional oculto; a referência baixou esses três arquivos. As imagens visíveis e as integrações externas continuaram presentes.

Boas práticas não regrediu no mesmo ambiente: ambas as versões tiveram cookies de terceiros, Issues de cookies e falha DNS do script Blue em `https://event.getblue.io/js/blue-tag.min.js`. Não apareceu erro de JavaScript próprio. Os relatórios públicos de hoje tiveram 96 em boas práticas, num ambiente diferente (Chromium 153/Linux); 73 local não deve ser apresentado como nova nota PageSpeed nem comparado diretamente como queda.

Relatórios brutos e script reprodutível ficam fora do Git, em `seo-performance-2026-09-29/lighthouse/` e `seo-performance-2026-09-29/compare-local.cjs`. Contêm URLs de telemetria e não devem ser publicados junto ao site.

## Conferências funcionais

- Na revisão final, 57 testes RD, acessibilidade de componentes, WhatsApp, estabilidade de banners e depoimentos passaram; 55 verificações comportamentais nas quatro páginas passaram.
- 15 testes de CSS crítico passaram. Exportação: 19; rastreamento: 13; redirecionamentos: 14. Auditoria estática das quatro páginas e 194 dependências sem erros.
- Chrome real: troca dos três banners desktop, abertura do formulário RD, popup WhatsApp e redimensionamentos 320/390/844 px. Sem rolagem horizontal; formulário principal com um SDK e uma instância. Campos visíveis medidos em 16 px.
- Em 320 px, barra de contato com topo em 647 e WhatsApp com base em 635: distância de 12 px. O retorno entre larguras manteve um único atalho.
- Nenhum envio de lead ou mensagem foi feito. Carregamento e testes simulados não comprovam recebimento no Marketing/CRM. Continua pendente validação no Safari de um iPhone físico, especialmente alternância entre aplicativos.

## PageSpeed público da cópia isolada

A cópia contém apenas os 285 arquivos públicos da exportação; não expõe Git, PHP, documentos ou listagens. Foi disponibilizada mediante autorização expressa do usuário, sem alterar domínio, DNS, hospedagem, produção ou GitHub. O conteúdo HTML recebido externamente foi comparado por SHA-256 com cada exportação testada. Ao fim, túnel e servidor temporários foram encerrados; o domínio principal respondeu HTTP 200. Os links PageSpeed preservam os relatórios, mas a cópia não permanece publicada.

Lighthouse 13.5.0 / HeadlessChromium 153.0.8010.36/Linux, interface oficial PageSpeed. A cópia usa a conexão temporária do computador por Cloudflare; não reproduz a hospedagem da United. Os resultados não constituem comparação controlada com as notas do domínio oficial ou com o benchmark HTTPS local.

| Execução | Celular | Desktop | Acessibilidade | Boas práticas | SEO do túnel | Navegação agêntica |
|---|---:|---:|---:|---:|---:|---:|
| 17:09, antes do ajuste de medição WhatsApp | 55 | 65 | 100 | 96 | 69 | 2/2 |
| 17:16, com ajuste WhatsApp | 60 | 67 | 100 | 96 | 69 | 2/2 |
| 17:18, exportação final completa | 41 | 68 | 100 | 96 | 69 | 2/2 |

Relatórios: [17:09](https://pagespeed.web.dev/analysis/https-proceed-warner-conservation-gray-trycloudflare-com/3cpyhtb42e?form_factor=mobile), [17:16](https://pagespeed.web.dev/analysis/https-proceed-warner-conservation-gray-trycloudflare-com/ciokfe3jt5?form_factor=mobile), [17:18](https://pagespeed.web.dev/analysis/https-proceed-warner-conservation-gray-trycloudflare-com/9e9icy793x?form_factor=mobile). Selecionar Computador na mesma página para as medições desktop.

No teste 17:16, a validação de bytes identificou que o build ainda não copiava `src/site-refinement.js`. O pipeline foi corrigido para incluir o arquivo; a medição final registra a versão completa. Não atribuir a oscilação de notas aos pequenos ajustes: no primeiro teste o TBT foi 1.381 ms mobile / 5.980 ms desktop; no segundo, 7.245 / 270 ms. A variabilidade é grande, sem causa única comprovada.

Na exportação final, mobile teve FCP 5,776 s, LCP 14,315 s, TBT 728 ms, CLS 0 e Speed Index 7,156 s. Desktop teve FCP 0,349 s, LCP 0,844 s, TBT 3.049 ms, CLS 0,01 e Speed Index 1,490 s. A meta não foi cumprida; o resultado móvel não permite afirmar ganho público. O detalhamento observado do LCP e as métricas simuladas não têm a mesma escala. São necessários um ambiente representativo e diagnóstico de rede/renderização/terceiros antes de liberar.

**SEO 69 tem uma causa específica do ambiente:** o serviço temporário injeta `X-Robots-Tag: none` na resposta. Esse cabeçalho não é enviado pelo servidor local; a exportação permanece com `index,follow`, canonical e robots de produção. A auditoria PageSpeed apontou esse cabeçalho como bloqueio. Não houve alteração dos metadados para compensar a proteção do túnel. SEO 100 no laboratório e na segunda medição do domínio oficial não deve ser apresentado como nota desta cópia pública.

No primeiro teste mobile, o grupo de scripts Google consumiu 1.111 ms de CPU, Meta 424 ms, RD 331 ms, TikTok 185 ms e Clarity 166 ms. Esses valores não são parcelas diretamente aditivas do TBT. O relatório também apontou 38 ms de reflow na medição da barra WhatsApp; isso motivou o ajuste local. Boas práticas permaneceu em 96, com a falha da Blue já investigada. Não foi comprovada duplicação de eventos apenas por haver duas URLs de `gtag.js`.

## Publicação e pendências

**Git retido enquanto não houver validação de desempenho ≥80 nos dois dispositivos.** A aprovação não pode ser inferida das notas locais ou de uma imagem mais leve. Para a próxima rodada, Rafael deve fornecer uma homologação HTTPS isolada na hospedagem real e o responsável por `GTM-MTK74PV` deve revisar as tags disparadas na Home. Verificar necessidade e gatilhos de pixels, eventual dupla instalação GA4/GTM/RD e a tag Blue com falha. Confirmar eventos, conversões e atribuição com Tag Assistant; um export do container permite revisão offline, mas não concede acesso à conta nem comprova eventos reais. Não remover serviços em lote ou adiar todas as tags para esconder custo do teste. Orientação oficial: [Google — carregamento de JavaScript de terceiros](https://web.dev/articles/optimizing-content-efficiency-loading-third-party-javascript).

Rafael deve integrar e verificar as regras de cache já fornecidas em `production/apache-seo.conf`; no servidor público consultado hoje elas ainda não aparecem nos cabeçalhos dos recursos examinados. A correção da Blue e a revisão de tags dependem do acesso ao GTM/fornecedor, conforme `BOAS-PRATICAS-GTM-2026-09-24.md`. Não remover o RD ou o container para elevar notas.
