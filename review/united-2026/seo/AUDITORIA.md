# SEO e desempenho — revisão de 12/09/2026

Escopo: as quatro páginas da prévia privada. Esta revisão não significa que o domínio oficial recebeu alterações e não atribui uma nota Lighthouse, uma posição no Google ou um aumento de tráfego.

## Alterações concluídas

- Títulos e descrições próprios para Home, Cursos, Quem Somos e FAQ; canonical para as respectivas URLs oficiais; Open Graph e dados estruturados de organização, site, página e cursos.
- Uma H1 por página. A chamada aprovada da home foi preservada e passou a ter semântica de título principal. Conteúdo indexável em HTML e texto contextual sobre curso de inglês online.
- Inglês em 18 meses, curso de inglês, escola de inglês e curso online de inglês distribuídos conforme a intenção de cada página. “Melhor curso” aparece em uma pergunta útil sobre escolha, sem afirmação de superioridade não comprovada nem metatag de palavras-chave.
- FAQ ampliado para 20 perguntas; revisão das condições de Full/Business, evolução e certificação opcional TOEIC. Índice, busca e abertura por link direto incluem as três novas perguntas.
- IDs de gradientes SVG duplicados corrigidos; versões de cache de todos os scripts locais atualizadas.
- Imagens WebP, fontes Manrope WOFF2, dimensões declaradas, imagens secundárias com carregamento adiado, banner inicial prioritário e arquivos diferentes para os recortes desktop/celular.
- CSS reunido por página na ordem original, reduzindo 10–15 solicitações de estilos para uma por página. Scripts externos ao HTML carregam com `defer`, na ordem existente.
- Vídeos locais otimizados com poster, carregamento por visibilidade, reprodução silenciosa dentro da página e pausa fora da tela. Removidos os controles nativos grandes e a abertura automática em tela cheia; um botão discreto mantém reprodução/pausa acessível. Movimento reduzido e economia de dados desativam a reprodução automática.

## Reduções verificadas nos arquivos

| Grupo de arquivos | Antes | Depois | Redução |
|---|---:|---:|---:|
| Seis artes dos banners | 11.026 MB | 1.397 MB | 87,33% |
| Seis vídeos antes remotos | 211.630 MB | 7.931 MB | 96,25% |
| Três ilustrações internas antes remotas | 4.818 MB | 0.482 MB | 90,00% |
| Fontes locais | 0.194 MB | 0.061 MB | 68,74% |

MB decimal; os totais representam os arquivos, não o tráfego da primeira visita. O carregamento adiado impede que todos os vídeos sejam solicitados na abertura. As artes mantêm dimensões, recorte e composição, com compressão WebP com perdas; os vídeos mantêm duração visual, quadros, taxa de quadros e proporção de exibição. A fonte mantém os glifos originais. Detalhamento em `image-optimization.json`, `video-optimization.json`, `font-optimization.json` e `audit-results.json`.

## Validação

O verificador estático percorre as quatro páginas, dependências locais, links e fragmentos internos, títulos, descrições, dados estruturados, dimensões, fontes, vídeos e versões de cache. Foram conferidos visualmente os banners e vídeos em desktop e em quadros de 390/320 px no Chrome. A reprodução manual, pausa ao sair da tela, pesquisa por “18 meses” e link direto da nova pergunta do FAQ foram exercitados.

Não houve teste em aparelho físico/iOS. A tentativa de consulta ao PageSpeed Insights do domínio oficial retornou HTTP 429 por quota excedida; **nenhuma nota foi obtida**. Core Web Vitals de usuários reais, TTFB e regras de cache/compressão do servidor oficial não foram medidos nesta etapa.

## Próxima etapa para impacto orgânico

Integrar o código revisado ao site oficial, preservar os formulários e rotas reais, aplicar os metadados de `production/`, liberar a indexação somente no domínio definitivo e enviar seu sitemap ao Search Console. Depois medir as páginas publicadas em mobile/desktop, acompanhar impressões, cliques e contatos e corrigir os gargalos restantes do servidor. A prévia permanece privada e bloqueada para indexação para não competir com o site oficial.

As recomendações seguem o [guia de SEO do Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), a documentação de [snippets](https://developers.google.com/search/docs/appearance/snippet) e [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals), além das orientações de [carregamento adiado de vídeos](https://web.dev/articles/lazy-loading-video). Metadados ajudam a descrever as páginas; o Google pode escolher outros títulos e trechos. Boas métricas técnicas não garantem posicionamento.

## Fechamento para revisão no GitHub

A verificação final inclui integridade, dimensões e SHA-256 de todas as imagens raster em `image-inventory.json`, incluindo o OnDemand novo. Esse inventário é distinto da comparação de compressão: não atribui um tamanho original fictício a imagens já recebidas em WebP. Os arquivos de OnDemand (1672 × 941), persona Live Class (1536 × 1024), storytelling (1672 × 941) e Jimmy (1122 × 1402) têm nomes descritivos, textos alternativos contextuais e dimensões explícitas. Imagens fora da abertura usam carregamento adiado e decodificação assíncrona. O subtítulo dos temas Business foi ajustado de H4 para H3 preservando o estilo.

O pacote no GitHub é isolado do PHP publicado. Os formulários ainda exigem integração real e a indexação deve ser liberada apenas no domínio oficial. A revisão de imagens segue a [documentação do Google Imagens](https://developers.google.com/search/docs/appearance/google-images); alt descreve o conteúdo e não repete listas de palavras-chave.

No fechamento, o Chrome foi usado para conferir o OnDemand ampliado, atalhos laterais visíveis no meio da home, abertura do menu e formulário no quadro móvel de 390 px, além dos cabeçalhos e carregamento de imagens das quatro páginas. O relatório estático fechou com quatro páginas, 145 dependências e 171 imagens raster inventariadas, sem erros. A revisão final não enviou dados dos formulários.
