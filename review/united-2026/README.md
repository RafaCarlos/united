# United Idiomas — SEO para produção · 18/09/2026

Pacote para Rafael revisar em `review/united-2026/`. Esta atualização parte do código incorporado à `main` em `933c80a`, mantém o Google Tag Manager e a integração RD, e não substitui o PHP da raiz nem publica no servidor.

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
python3 scripts/export-production.py --mode production --output /tmp/united-production
```

`site/` contém os arquivos publicáveis. `publication/` contém instruções e o fragmento Apache opcional, que precisa ser mesclado ao servidor por Rafael. O exportador não envia arquivos e não escreve `.htaccess`. Detalhes em [INSTRUCOES-PUBLICACAO.md](seo/production/INSTRUCOES-PUBLICACAO.md) e [INTEGRACAO.md](seo/INTEGRACAO.md).

A produção sai sem rótulos de prévia e com rastreamento liberado. O robots atualizado deve ocupar **a raiz HTTP `/robots.txt`**, junto ao sitemap comercial; nenhum arquivo robots dentro de uma subpasta governa o domínio. A política permite os recursos públicos e restringe a administração do WordPress, com AJAX liberado. O gerador preserva esse arquivo como fonte, sem sobrescrever suas regras. Veja [ROBOTS-RASTREAMENTO.md](seo/ROBOTS-RASTREAMENTO.md).

O modo `preview` permanece apenas como ferramenta de desenvolvimento isolada, documentada no exportador, e não é a entrega para publicação. Cópias antigas já públicas devem retornar `noindex` ou ser retiradas com 404/410 pelo responsável da hospedagem; não bloquear sua leitura no robots antes disso. Não publicar o repositório inteiro nem uma pasta `/review/` como substituto da raiz oficial.

O exportador exclui comparação/debug e recusa bloqueios de rastreamento, canonical incorreto, título duplicado, sitemap incompleto e HTML fora das quatro páginas registradas. `--force` só atualiza uma exportação anterior deste pacote. **O formulário RD é real**, inclusive nos testes locais; não houve novos envios de contatos nesta revisão.

## Conteúdo para buscas e Search Console

Os títulos e textos destacam inglês online e ao vivo, a trilha de 18 meses, conversação, storytelling e Jimmy 24/7. O OnDemand aparece como opcional, e o FAQ tem 22 perguntas. O mapa de intenção por página, a comparação com o site publicado e as etapas do Search Console estão em [MAPA-BUSCAS-E-SEARCH-CONSOLE.md](seo/MAPA-BUSCAS-E-SEARCH-CONSOLE.md). `seo/metadata.json` e `seo/content.json` controlam essa copy; o passo final de SEO reaplica os textos após os geradores de componentes.

## Reproduzir e validar

Requer Python com `lxml` e Pillow (`requirements-review.txt`) e Node para os testes RD. A entrega estática não requer build para ser servida.

```bash
python3 scripts/update-seo-performance.py
python3 scripts/optimize-static-assets.py
python3 scripts/prepare-subdirectory.py
python3 scripts/inventory-images.py
python3 scripts/audit-seo-performance.py
python3 scripts/test-production-export.py
python3 scripts/test-production-crawl.py
python3 scripts/test-production-redirects.py
node --test scripts/test-rdstation-form.cjs scripts/test-rdstation-whatsapp.cjs
python3 scripts/prepare-subdirectory.py --refresh-manifests
```

`MANIFEST.json` cobre o pacote; `MANIFEST-SERVIDOR.json` cobre `dist` e as instruções de caminhos. O inventário registra bytes, dimensões e SHA-256 das imagens, não o tráfego da primeira visita. `scripts/optimize-heavy-media.py` reproduz a compressão do fundo a partir do PNG original da raiz, sem reencodificar o WebP.

Aplique outros atualizadores de componentes somente quando houver alterações nesses componentes. Esta revisão não reexecuta `update-contact-layout.py`: preserva o HTML do banner e o GTM que Rafael modificou em `main`. Os geradores legados de prévia não são o fluxo atual; podem restaurar conteúdo antigo. Ao reutilizá-los, revise o diff e execute a validação final acima.

## Integrações preservadas

- Formulário oficial RD `form-vamos-conversar-5ba05329ea8c88b5c10d`, um embed por página, SDK oficial, retorno de sucesso na própria caixa e círculo verde; botão de envio vermelho.
- Loader `ee4f0815-8266-4fb5-ba25-416836b02312-loader.js` uma vez por página, `async`; SDK e inicializador com `defer` na ordem correta.
- WhatsApp geral `5511940040658`; Parcerias & Convênios e Seja um Franqueado exclusivamente `5511958575315`.
- Área do Aluno: `https://liveclass.app.br`. GTM `GTM-MTK74PV` preservado na Home.

Os formulários demonstrativos já foram substituídos pelo RD. Recebimento no Marketing e criação de negócio no CRM são verificações distintas; os testes desta revisão não enviam contatos. Histórico e limites em [RD-STATION.md](seo/RD-STATION.md).

## Blog, publicação e acompanhamento

O blog WordPress não está neste repositório. [seo/wordpress/](seo/wordpress/README.md) contém uma extensão opcional revisável, ainda não instalada, para os problemas verificados no HTML público. Não copie esse PHP para a raiz do site estático.

[PLANO-SEO-PRODUCAO.md](seo/PLANO-SEO-PRODUCAO.md) organiza publicação, conteúdo original, autoria, unidades, desempenho e medição, com responsáveis e critérios de aceite. [RECOMENDACOES-CONTEUDO.md](seo/RECOMENDACOES-CONTEUDO.md) detalha a pauta editorial. Depois da publicação, conferir URLs no Search Console, enviar os dois sitemaps e medir desempenho no servidor. Arquivos tecnicamente corretos não comprovam indexação nem garantem posição no Google. Resultados e limites estão em [AUDITORIA.md](seo/AUDITORIA.md); o estado ainda publicado está em [VERIFICACAO-PRODUCAO-FINAL-2026-09-18.md](seo/VERIFICACAO-PRODUCAO-FINAL-2026-09-18.md).
