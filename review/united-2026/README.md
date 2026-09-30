# United Idiomas — SEO para produção · 18/09/2026

Pacote para Rafael revisar em `review/united-2026/`. Esta atualização parte do código incorporado à `main` em `933c80a`, mantém o Google Tag Manager e a integração RD, e não substitui o PHP da raiz nem publica no servidor.

## Envio para revisão — 30/09/2026

O envio destas atualizações ao GitHub foi autorizado após a validação local da entrega WebP/minificada v2. A branch `codex/united-performance-v2-2026-09-30` parte da `main` em `d5929f8`, preservando as alterações incorporadas por Rafael. O escopo permanece exclusivamente em `review/united-2026/`, sem alterar PHP da raiz, fazer merge ou publicar na hospedagem.

São 130 testes aprovados na rodada final e integridade dos arquivos conferida. A autorização de envio ao Git não equivale à aprovação de desempenho em produção: a meta pública de 80 e o INP móvel ainda precisam ser validados com o pacote atualizado. As seções datadas abaixo registram o histórico de trabalho local; os resultados antigos não são notas desta entrega publicada.

## WebP, minificação e versão 2 — 30/09/2026

As imagens PNG restantes usadas no conteúdo agora têm derivados WebP sem perda, incluindo a logo visível: pixels, transparência e dimensões são verificados contra os originais preservados. SVG, GIFs animados, favicon e imagens PNG de metadados/compartilhamento mantêm os formatos adequados. Imagens já responsivas não são reencodificadas. O conversor também cobre referências em CSS legado; arquivos não exibidos não representam economia de tráfego da Home.

A entrega otimizada é gerada por `export-production.py --optimize --asset-version 2`. A etapa final minifica HTML, CSS e JavaScript na cópia `site/`, aplica `?v=2` aos recursos locais carregados e recalcula os nomes com hash dos bundles CSS. Os arquivos editáveis em `src/` e os insumos de build em `dist/` permanecem disponíveis para manutenção. Publicar a cópia otimizada, não copiar os insumos de build por cima dela.

URLs externas RD/GTM, links de navegação, WhatsApp, canonical e metadados não recebem a query. A versão deve subir para 3, 4 etc. a cada nova entrega com arquivos modificados; `v=2` fixo não impede cache antigo para sempre. O HTML deve revalidar e a hospedagem/CDN deve incluir a query na chave de cache. As regras propostas continuam separadas, sem aplicação automática no servidor. Redução em bytes não comprova nota PageSpeed ou INP; a condição de desempenho mínimo 80 continua pendente de validação pública representativa.

## Histórico: carregamento e validação — 29/09/2026

O candidato local agora evita imagens de banners ocultos no desktop e entrega os banners WebP com qualidade 85, preservando as dimensões, o conteúdo e os recortes aprovados. Mantém também CSS crítico, formulário RD sob demanda e correções de retorno do WhatsApp da rodada anterior.

Em comparação HTTPS local com Lighthouse 13.5.0 e Chrome 154, antes da revisão final de scroll, três execuções por versão e dispositivo deram medianas **83 → 84 no celular** e **98 → 99 no desktop**. Esses resultados não se repetiram no PageSpeed público da cópia temporária: foram 55/65, 60/67 e **41/68** (celular/desktop), com grande variação. Acessibilidade ficou em 100, boas práticas em 96 e navegação agêntica em 2/2. O SEO 69 dessa cópia decorre do `X-Robots-Tag: none` imposto pelo túnel; a exportação continua indexável. **Meta pública de desempenho 80 não validada: sem commit, push ou publicação desta rodada.** É preciso homologação representativa e revisão das tags antes de liberar. Detalhes, relatórios, ganho em bytes e limites em [DESEMPENHO-2026-09-29.md](seo/DESEMPENHO-2026-09-29.md).

## Rodada anterior: desempenho e retorno do WhatsApp — 24/09/2026

Alterações locais em validação; esta rodada ainda não foi enviada ao GitHub nem publicada. A meta solicitada é desempenho mínimo de **80 no celular e no computador**, com as demais métricas e a navegação verificadas antes do envio. A medição final do candidato ainda está pendente: não tratar as notas históricas abaixo como resultado desta versão.

A Home passou a entregar CSS essencial no HTML e carregar a folha completa sem bloquear a primeira renderização, com alternativa para JavaScript desativado. O formulário principal RD carrega por intenção de contato ou proximidade da área de contato; o loader da conta RD e o GTM permanecem ativos. Os campos do popup WhatsApp usam 16 px em telas móveis/ponteiro de toque e os controladores recalculam a posição ao voltar de outro aplicativo, restaurar a página ou girar a tela. O WhatsApp acompanha a rolagem acima da barra “Quero conhecer”, agora sem a seta decorativa. A correção ainda precisa ser conferida em um iPhone físico com Safari.

Arquitetura, testes, limites de medição e critérios de aceite em [DESEMPENHO-E-SAFARI-2026-09-24.md](seo/DESEMPENHO-E-SAFARI-2026-09-24.md). Esta seção descreve o estado atual; as rodadas datadas abaixo são histórico.

## Atualização de desempenho e cores — 23/09/2026

Esta rodada parte da `main` em `97265d0` (PR #6 integrado). Evita três downloads de retratos exclusivos de desktop no mobile (~493 KB), aprimora WebP responsivo e estabilidade dos banners, corrige semântica e acessibilidade dos componentes RD e aplica o verde #25D366 aprovado aos botões WhatsApp e Área do Aluno. Texto/ícones escuros mantêm contraste; WhatsApp móvel continua 12 px acima da barra Quero conhecer. Captação RD, destinos dos links e botão vermelho de envio preservados.

Resultados, validação e limites em [PAGESPEED-2026-09-23.md](seo/PAGESPEED-2026-09-23.md). O mobile e as boas práticas ainda têm pendências, incluindo a integração externa Blue e a revisão das tags; Rafael precisa integrar as regras de cache na hospedagem. As notas locais não comprovam aprovação em produção. Plano para os responsáveis em [TERCEIROS-2026-09-23.md](seo/TERCEIROS-2026-09-23.md).

O complemento de marca fornece favicon e cartão de compartilhamento com fundo azul, mantendo intacta a logo dentro do site. As quatro páginas e os fragmentos de integração usam os novos metadados. Arquivos, validação e publicação em [MARCA-COMPARTILHAMENTO.md](seo/MARCA-COMPARTILHAMENTO.md).

## Atualização de desempenho — 22/09/2026

A atualização de desempenho parte da `main` em `2e47f7b`. Inclui imagens WebP responsivas, posters menores, prioridade para a imagem inicial, redução de CSS e JavaScript próprios e regras de cache revisáveis. No celular, o WhatsApp acompanha a rolagem e permanece 12 px acima da barra “Quero conhecer”; no desktop, conserva sua posição no banner. O formulário oficial e o loader RD permanecem ativos.

Resultados medidos, limitações e sequência de geração em [OTIMIZACAO-LOCAL-2026-09-22.md](seo/OTIMIZACAO-LOCAL-2026-09-22.md). A configuração de cache precisa ser integrada por Rafael na hospedagem. Os ganhos em bytes foram verificados localmente; uma nova nota PageSpeed depende da publicação e da medição do site atualizado.

## O que mudou

- `dist/` agora representa **produção**: indexação permitida, sem rótulos de prévia nas quatro páginas, canonical, títulos/descrições próprios e dados estruturados coerentes.
- Sitemap comercial com Home, Cursos, Quem Somos e FAQ. O `robots.txt` também informa o sitemap automático do blog WordPress, preservando a descoberta dos artigos.
- Contexto de curso de inglês no título principal de Cursos, links úteis na FAQ, âncoras e links de mapa para as seis unidades já exibidas.
- Imagem de fundo reduzida de 1.423.198 para 148.032 bytes, com dimensões/transparência preservadas. Layout, banners e formulários mantidos.
- Entrega de produção com verificação de rastreamento, canonical, sitemap e inventário de páginas; regras de servidor, mapa de URLs antigas e pacote WordPress para integração.
- Censo técnico dos 182 artigos do blog e 48 descrições específicas no plugin opcional (47 duplicadas + artigo IA); orientações pontuais para os 11 artigos com H1 adicionais.

## Entrega de produção

```bash
npm ci
python3 scripts/export-production.py --mode production --optimize --asset-version 2 --output /tmp/united-production
```

`site/` contém os arquivos publicáveis. `publication/` contém instruções, o relatório de minificação e o fragmento Apache opcional, que precisa ser mesclado ao servidor por Rafael. O exportador não envia arquivos e não escreve `.htaccess`. Detalhes em [INSTRUCOES-PUBLICACAO.md](seo/production/INSTRUCOES-PUBLICACAO.md) e [INTEGRACAO.md](seo/INTEGRACAO.md).

A produção sai sem rótulos de prévia e com rastreamento liberado. O robots atualizado deve ocupar **a raiz HTTP `/robots.txt`**, junto ao sitemap comercial; nenhum arquivo robots dentro de uma subpasta governa o domínio. A política permite os recursos públicos e restringe a administração do WordPress, com AJAX liberado. O gerador preserva esse arquivo como fonte, sem sobrescrever suas regras. Veja [ROBOTS-RASTREAMENTO.md](seo/ROBOTS-RASTREAMENTO.md).

O modo `preview` permanece apenas como ferramenta de desenvolvimento isolada, documentada no exportador, e não é a entrega para publicação. Cópias antigas já públicas devem retornar `noindex` ou ser retiradas com 404/410 pelo responsável da hospedagem; não bloquear sua leitura no robots antes disso. Não publicar o repositório inteiro nem uma pasta `/review/` como substituto da raiz oficial.

O exportador exclui comparação/debug e recusa bloqueios de rastreamento, canonical incorreto, título duplicado, sitemap incompleto e HTML fora das quatro páginas registradas. `--force` só atualiza uma exportação anterior deste pacote. **O formulário RD é real**, inclusive nos testes locais; não houve novos envios de contatos nesta revisão.

## Conteúdo para buscas e Search Console

Os títulos e textos destacam inglês online e ao vivo, a trilha de 18 meses, conversação, storytelling e Jimmy 24/7. O OnDemand aparece como opcional, e o FAQ tem 22 perguntas. O mapa de intenção por página, a comparação com o site publicado e as etapas do Search Console estão em [MAPA-BUSCAS-E-SEARCH-CONSOLE.md](seo/MAPA-BUSCAS-E-SEARCH-CONSOLE.md). `seo/metadata.json` e `seo/content.json` controlam essa copy; o passo final de SEO reaplica os textos após os geradores de componentes.

## Reproduzir e validar

Requer Python com as dependências de `requirements-review.txt` e Node para os testes RD. A nova suíte de carregamento RD usa `jsdom` 26, disponível no ambiente de testes. A entrega estática não requer build para ser servida.

```bash
python3 scripts/optimize-remaining-images.py
python3 scripts/update-seo-performance.py
python3 scripts/optimize-static-assets.py
python3 scripts/prepare-subdirectory.py
python3 scripts/inventory-images.py
python3 scripts/audit-seo-performance.py
python3 scripts/test-home-critical-css.py
python3 scripts/test-production-export.py
python3 scripts/test-production-crawl.py
python3 scripts/test-production-redirects.py
node scripts/test-finalize-delivery.cjs
node --test scripts/test-rdstation-form.cjs scripts/test-rdstation-loading.cjs scripts/test-rdstation-whatsapp.cjs scripts/test-banner-stability.cjs
python3 scripts/prepare-subdirectory.py --refresh-manifests
```

`MANIFEST.json` cobre o pacote; `MANIFEST-SERVIDOR.json` cobre `dist` e as instruções de caminhos. O inventário registra bytes, dimensões e SHA-256 das imagens, não o tráfego da primeira visita. `scripts/optimize-heavy-media.py` reproduz a compressão do fundo a partir do PNG original da raiz, sem reencodificar o WebP.

Aplique outros atualizadores de componentes somente quando houver alterações nesses componentes. Esta revisão não reexecuta `update-contact-layout.py`: preserva o HTML do banner e o GTM que Rafael modificou em `main`. Os geradores legados de prévia não são o fluxo atual; podem restaurar conteúdo antigo. Ao reutilizá-los, revise o diff e execute a validação final acima.

Para reproduzir a nova compressão dos banners, execute `python3 scripts/optimize-responsive-images.py` antes de `update-seo-performance.py` e dos demais passos acima. Os testes Node que usam `UNITED_CODE_TOOLS` esperam uma pasta com `node_modules/jsdom`; `test-rdstation-loading.cjs` usa a resolução normal do Node (ou `NODE_PATH`). Não incluir dependências de teste ou `__pycache__` na entrega.

## Integrações preservadas

- Formulário oficial RD `form-vamos-conversar-5ba05329ea8c88b5c10d`, um embed por página, SDK oficial, retorno de sucesso na própria caixa e círculo verde; botão de envio vermelho.
- Loader `ee4f0815-8266-4fb5-ba25-416836b02312-loader.js` uma vez por página, `async`; adaptador local `rdstation-form.js` com `defer`, responsável por carregar e inicializar o SDK oficial sob demanda. Não reinserir um SDK remoto antecipado no HTML: isso desfaz a otimização.
- WhatsApp geral `5511940040658`; Parcerias & Convênios e Seja um Franqueado exclusivamente `5511958575315`.
- Área do Aluno: `https://liveclass.app.br`. GTM `GTM-MTK74PV` preservado na Home.

Os formulários demonstrativos já foram substituídos pelo RD. Recebimento no Marketing e criação de negócio no CRM são verificações distintas; os testes desta revisão não enviam contatos. Histórico e limites em [RD-STATION.md](seo/RD-STATION.md).

## Blog, publicação e acompanhamento

O blog WordPress não está neste repositório. [seo/wordpress/](seo/wordpress/README.md) contém uma extensão opcional revisável, ainda não instalada, para os problemas verificados no HTML público. Não copie esse PHP para a raiz do site estático.

[PLANO-SEO-PRODUCAO.md](seo/PLANO-SEO-PRODUCAO.md) organiza publicação, conteúdo original, autoria, unidades, desempenho e medição, com responsáveis e critérios de aceite. [RECOMENDACOES-CONTEUDO.md](seo/RECOMENDACOES-CONTEUDO.md) detalha a pauta editorial. Depois da publicação, conferir URLs no Search Console, enviar os dois sitemaps e medir desempenho no servidor. Arquivos tecnicamente corretos não comprovam indexação nem garantem posição no Google. Resultados e limites estão em [AUDITORIA.md](seo/AUDITORIA.md); o estado ainda publicado está em [VERIFICACAO-PRODUCAO-FINAL-2026-09-18.md](seo/VERIFICACAO-PRODUCAO-FINAL-2026-09-18.md).
