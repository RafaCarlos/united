# United — indexação e integração da revisão de 21/10/2026

Este documento acompanha o candidato local. Nenhuma publicação, alteração de DNS, regra de servidor, commit ou envio ao Git é executado pelas ferramentas.

## O que está preparado

- 213 páginas: Home, Live Class, Business, Full, Quem somos, FAQ, 21 listagens do blog e 186 artigos.
- Um H1 por página, títulos únicos, descrições próprias, HTML com conteúdo legível sem depender de uma aplicação JavaScript.
- Canonical e Open Graph usando o domínio de destino configurado, com barra final. O conteúdo original importado do WordPress mantém seus slugs, autoria e datas.
- Dados estruturados de instituição, site, páginas, cursos, perguntas e respostas e artigos; trilha de navegação nos artigos e arquivos.
- Em 59 artigos agendados importados, o último salvamento do rascunho era anterior à publicação. Nesses casos, a data de atualização não é anunciada no schema/Open Graph. A data de publicação visível e os dados originais do WordPress permanecem preservados.
- Imagem de compartilhamento do blog igual à capa WebP exibida, com texto alternativo e dimensões.
- Sitemap parcial gerado a partir das rotas realmente incluídas. Não há datas `lastmod` inventadas pelo build.
- Prévia com `noindex,nofollow`; o candidato `dist/` retira essa restrição apenas das páginas registradas.
- Os servidores de revisão local continuam enviando `X-Robots-Tag: noindex`, inclusive para `dist/`. Não usar esses servidores em produção.
- O candidato contém somente recursos públicos referenciados. Fontes editoriais, apuração, prints, ferramentas e relatórios ficam fora do diretório público.

## Ponto obrigatório antes da publicação: domínio do blog

Na consulta de 21/10/2026, a Home oficial respondeu em `https://www.unitedidiomas.com/`, mas a abertura de `https://www.unitedidiomas.com/blog/` foi redirecionada para `https://unitedidiomas.com/blog/`.

O candidato usa `https://www.unitedidiomas.com` em `release.config.json`. A agência deve alinhar servidor, proxy e configuração do WordPress com esse domínio antes de integrar o blog. Publicar canonical com `www` enquanto o servidor redireciona o próprio blog para sem `www` envia sinais conflitantes.

Preservar caminhos, parâmetros e acesso ao painel do WordPress. Tratar a migração de domínio de forma coordenada, com um único redirecionamento permanente para cada URL pública. Não instalar uma regra genérica sem conferir regras existentes de WordPress, CDN e hospedagem; isso pode causar loops ou impedir o login.

Se a agência decidir manter o blog sem `www`, adaptar de forma consistente o mapa do build, canonical, links internos, schema e sitemap antes de publicar. Não misturar duas decisões dentro da mesma página.

## Robots e sitemap

A prévia contém `User-agent: *` e `Disallow: /`. Esse arquivo não entra no candidato de produção. O candidato também não tenta substituir o robots.txt ou o índice de sitemaps já existente no domínio.

1. Integrar o conteúdo de `publication/robots-snippet.txt` ao robots existente, preservando regras administrativas e as linhas de sitemaps anteriores.
2. Publicar o sitemap parcial `sitemap-united-pages.xml` junto às páginas aprovadas; ele deve responder 200 com XML válido e ter apenas URLs canônicas indexáveis.
3. Conferir grupos específicos de Googlebot, Bingbot e OAI-SearchBot, além de `User-agent: *`. Um grupo mais específico pode alterar o resultado esperado.
4. Conferir que HTML, CSS, JavaScript e imagens públicas não recebem bloqueios de firewall/CDN ou `X-Robots-Tag: noindex` em produção.
5. Manter a política de treinamento de IA separada: liberar busca não exige liberar GPTBot.
6. Usar a inspeção ao vivo do Search Console e o Bing Webmaster Tools após a integração. Um retorno obtido por uma ferramenta externa não comprova como os robôs oficiais são tratados.

Nesta revisão, as tentativas de abrir os arquivos oficiais `robots.txt` e `sitemap.xml` pela ferramenta web não retornaram conteúdo. Portanto, o acesso desses arquivos no servidor atual precisa ser conferido; não foi presumido um bloqueio do Google.

O `robots.txt` controla rastreamento; não é um mecanismo de privacidade nem uma forma segura de impedir indexação. Para staging público, preferir autenticação. Se depender de `noindex`, o robô precisa conseguir ler o HTML ou o cabeçalho que contém a regra. A prévia desta entrega é local, em localhost, e não deve ser disponibilizada como o site público.

## URLs e legado

As rotas de curso propostas são `/cursos/live-class/`, `/cursos/business/` e `/cursos/full/`; a Home local `/home/` vira `/` no candidato. As rotas locais da proposta não substituem automaticamente caminhos existentes do servidor.

O candidato não contém toda a instalação WordPress. Preservar catálogo `/cursos/`, páginas de autor, uploads, API e painel. O validador lista links históricos mantidos nos textos importados. Conferir essas URLs no servidor e, se forem descontinuadas, mapear cada uma para um destino equivalente com redirecionamento permanente. Não redirecionar indiscriminadamente todos os artigos ou URLs antigas para a Home.

Não copiar `src/`, `preview/`, `reports/`, `node_modules/` nem o pacote inteiro como raiz pública. Somente integrar os arquivos de `dist/` conforme a estrutura do repositório/hospedagem.

## Dados estruturados e descoberta por IA

Os dados estruturados descrevem o conteúdo visível. Não foram criados preços, avaliações agregadas de Google/Reclame Aqui nem garantias de certificação. Os depoimentos não viraram uma nota agregada inventada.

A presença de schema não garante resultados enriquecidos. O código pode estar tecnicamente correto sem que o Google apresente um recurso especial para a página.

Não é necessário adicionar `llms.txt` para a inclusão nas experiências de IA do Google. Nesta entrega, a prioridade é HTML acessível, informação consistente, autoria, fontes, links internos e condições de rastreamento. Não há promessa de ranking top 3 ou citação por IA.

## Verificação

Antes de integrar, executar os testes do pacote, o inventário SEO da fonte e o inventário SEO do candidato. Conferir visualmente desktop/mobile e o funcionamento de formulário, vídeos e menu conforme o relatório geral.

Após publicar, rodar `node tools/check-publication.mjs --origin https://www.unitedidiomas.com`, que faz apenas leituras HTTP e grava um relatório local. Ele verifica uma amostra representativa, robots e sitemap. Para verificar cada rota do candidato, acrescentar `--all`. Não executar com `--all` repetidamente em intervalos curtos.

O envio real autorizado de formulário já retornou callback de sucesso em 21/10/2026, conforme reports/rd-integration.json; confirmar ainda a entrada no CRM e as automações com a equipe. Concluir a revisão com inspeção de URL no Search Console, verificação dos redirecionamentos e medição PageSpeed/Core Web Vitals no ambiente publicado. Métricas locais não equivalem ao desempenho real dos visitantes.

## Referências oficiais consultadas em 21/10/2026

- Google: https://developers.google.com/search/docs/crawling-indexing/robots/intro
- Google: https://developers.google.com/search/docs/crawling-indexing/block-indexing
- Google: https://developers.google.com/search/docs/appearance/ai-features
- Google: https://developers.google.com/search/docs/appearance/structured-data/article
