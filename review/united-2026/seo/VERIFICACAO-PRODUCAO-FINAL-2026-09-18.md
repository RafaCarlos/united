# Verificação final da produção — 18/09/2026

Esta leitura pública foi executada das **15h59m17s às 15h59m38s de 18/09/2026 (America/Sao_Paulo)**, com 30 requisições GET, no máximo quatro conexões simultâneas e nenhum envio de formulário. A evidência por URL — status, sequência de redirecionamentos, cabeçalhos, metadados e hashes — está em [VERIFICACAO-PRODUCAO-FINAL-2026-09-18.json](VERIFICACAO-PRODUCAO-FINAL-2026-09-18.json). O commit local no início da coleta era `0d94bdcc7dbee9db8fcc01c3fd48a4a25fc6f4a2`; esta verificação descreve **o servidor público**, não presume que o PR esteja publicado.

**Conclusão:** as quatro páginas comerciais podem ser lidas publicamente e não apresentam bloqueio de indexação nos HTMLs/cabeçalhos observados. Ainda há pendências concretas de publicação: robots ausente, sitemap antigo, rótulos de prévia, imagem antiga pesada e redirecionamentos que podem ser mais precisos. Disponibilidade técnica não demonstra visita real do Googlebot, indexação, posição ou Core Web Vitals.

## Páginas e descoberta

| URL / recurso | Resultado público observado | Ação necessária na integração |
|---|---|---|
| `/` | 200, canonical correto, uma H1, `pt-BR`, sem noindex | Publicar títulos e conteúdo atualizados do pacote. |
| `/cursos/` | 200, canonical correto, uma H1, sem noindex; `PRÉVIA · UNITED` ainda visível no HTML | Publicar versão final sem o rótulo e com contexto explícito do curso no título principal. |
| `/quem-somos/` | 200, canonical correto, uma H1, sem noindex; rótulo de prévia | Publicar versão final sem o rótulo. |
| `/faq/` | 200, canonical correto, uma H1, sem noindex; rótulo de prévia | Publicar versão final e perguntas atualizadas. |
| `https://www.unitedidiomas.com/robots.txt` | 404, corpo HTML de página não encontrada | Servir o robots final como texto simples na raiz. |
| `https://unitedidiomas.com/robots.txt` | 301 para www, então 404 | Conferir a resposta também no host do blog após a integração. |
| `https://www.unitedidiomas.com/sitemap.xml` | 200, 186 entradas antigas; datas declaradas de 19/03/2024 | Publicar o sitemap das páginas comerciais atuais; `/cursos/`, `/quem-somos/` e `/faq/` não constam no arquivo público examinado. |
| `https://unitedidiomas.com/blog/sitemap_index.xml` | 200, cinco sitemaps filhos | Preservar o índice dinâmico do WordPress, declarado no robots final. |
| `https://unitedidiomas.com/blog/post-sitemap.xml` | 200, 182 artigos | Preservar URLs e geração dinâmica. |

Um **404 em robots.txt não bloqueia o rastreamento**: o Google o trata como ausência de restrições desse arquivo. O `noindex,nofollow` que aparece no HTML de erro de `/robots.txt` não é uma regra global para o site. As regras de robots são próprias do host/protocolo; a coleta documenta o redirecionamento efetivamente observado do domínio sem `www`. [Especificação oficial de robots.txt](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

Os XMLs do WordPress respondem `X-Robots-Tag: noindex, follow`; esse cabeçalho pertence aos próprios arquivos XML e **não significa que os artigos listados estejam bloqueados**. O censo anterior de [todos os 182 artigos](wordpress/AUDITORIA-ACERVO.md), realizado neste mesmo dia, documenta os HTMLs dos posts. Esta rodada não repetiu os 182 acessos nem deve ser tratada como nova auditoria editorial de todo o acervo.

## Redirecionamentos e URLs duplicadas

| Origem testada | Resultado | Recomendação |
|---|---|---|
| `http://www.unitedidiomas.com/` | Um 301 até HTTPS/www | Preservar. |
| `http://unitedidiomas.com/` | Dois 301, passando por HTTPS sem www | Unificar em um salto quando a configuração de TLS/proxy for confirmada. |
| `https://unitedidiomas.com/` | Um 301 até HTTPS/www | Preservar a exceção do blog, que já usa canonical sem www. |
| `/cursos` | Um 301 até `/cursos/` | Preservar. |
| `/escola-ingles-united-idiomas` | Dois 301 até `/quem-somos/` | Mapear diretamente ao destino final. |
| `/cursos/curso-de-ingles-online` | Dois 301 até `/cursos/` | Mapear diretamente à oferta equivalente. |
| `/unidades/curso-de-ingles-ipiranga` | Um 301 para a Home | Direcionar à unidade correspondente em Quem Somos, conforme mapa preparado; não descartar a intenção local na Home. |
| `/index.html` | 200 duplicando a Home, com canonical para `/` | Normalizar com 301 para a rota limpa. |
| `/cursos/index.html` | 200 duplicando Cursos, com canonical para `/cursos/` | Normalizar com 301 para a rota limpa. |
| `/o-curso/curso-de-ingles-para-viagem` | 404 real, embora presente no sitemap antigo | Excluir do sitemap comercial final; revisar recuperação da página somente se houver oferta/conteúdo equivalente confirmado. |
| `/seo-auditoria-pagina-inexistente-20260918/` | 404 real, H1 “Página não encontrada!” | Resposta correta para esta URL inexistente; não foram encontradas evidências de retorno universal 200 na amostra. |

Redirecionamentos devem preservar a equivalência do conteúdo. Enviar URLs antigas sem equivalente para a Home pode produzir uma experiência inadequada e ser interpretado como soft 404; os destinos precisam ser decididos por intenção e evidência. [Orientação oficial sobre migração e redirecionamentos](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes).

## Recursos e apresentação

A amostra de sete recursos da Home retornou HTTP 200: CSS principal, JavaScript principal, runtime `preview.js`, banners institucional desktop/mobile, banner Jimmy e `bg-united-video.webp`. Não foi feito um crawl completo dos recursos públicos; a integridade do pacote local é uma verificação separada.

- `bg-united-video.webp` publicado ainda tem **1.423.198 bytes**. A versão otimizada já preparada tem 148.032 bytes; é necessário publicar o arquivo otimizado para obter a redução.
- HTML, CSS e JavaScript amostrados foram servidos com gzip. As respostas observadas não declararam `Cache-Control`; isso não prova ausência de cache intermediário ou de cache heurístico. Aplicar a política de cache proposta exige conferir a configuração real do servidor.
- Há `Last-Modified` nos arquivos estáticos amostrados. Os tempos de uma única coleta não são uma medição de experiência real dos alunos e não foram convertidos em notas de performance.
- Cada página comercial contém um loader RD e um SDK do formulário no HTML recebido. Não houve submissão de lead; a coleta não valida a chegada ao Marketing/CRM.
- O nome histórico do arquivo `preview.js` também foi encontrado em produção. O nome, sozinho, não constitui bloqueio de SEO; a versão final deve ser identificável e livre de rótulos de prévia, mantendo o comportamento dos componentes e formulários.

## Blog e páginas de confiança

A Home do blog permanece com título **“Home (blog) | Blog United Idiomas”**, idioma `pt-PT`, descrição genérica e duas H1, sendo uma vazia. O pacote WordPress preparado e o [plano editorial do acervo](wordpress/AUDITORIA-ACERVO.md) continuam pendentes de integração. Essa leitura não instalou plugins nem alterou artigos.

`/politica-de-privacidade` e `/termos-de-uso` retornaram **404 real**, sem redirecionar, com H1 “Página não encontrada!”. Não se deve adicionar links para esses caminhos como se já estivessem operacionais. A United precisa validar os documentos existentes e disponibilizá-los em rotas públicas funcionais; não foi inventado conteúdo jurídico para preencher essa lacuna. Esses resultados descrevem os dois caminhos testados, não provam inexistência de documentos em outras URLs.

## Critério de conclusão depois da publicação

1. Conferir robots final HTTP 200 como texto simples, ambos os sitemaps acessíveis e nenhum bloqueio acidental de páginas, CSS, JS ou imagens relevantes.
2. Confirmar quatro páginas finais sem rótulos de prévia, titles/descriptions/canonicals coerentes e conteúdo principal disponível no HTML.
3. Validar os redirects e o 404 real, preservar o blog e conferir a imagem otimizada no servidor.
4. Na propriedade correta do Search Console, inspecionar as quatro URLs, a canônica escolhida e os sitemaps. Isso complementa a auditoria HTTP; não é substituído por um teste que apenas imita o User-Agent do Googlebot.
5. Medir indexação, consultas, impressões, cliques, Core Web Vitals e conversões após a integração. A configuração técnica cria condições para rastreamento e descoberta; não promete posição ou prazo de indexação.

Nenhuma publicação, alteração no servidor, envio de formulário, acesso a conta privada ou alteração de DNS foi realizada por esta auditoria.
