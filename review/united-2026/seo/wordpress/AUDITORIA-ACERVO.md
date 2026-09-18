# Auditoria técnica do acervo do blog — 18/09/2026

**Atualização da entrega, após este censo:** as 47 descrições duplicadas abaixo já têm substituições específicas preparadas no [mapa local do plugin](united-seo-review/post-descriptions.json), somadas à descrição do artigo de IA (48 textos). Elas foram conferidas com o conteúdo público e testadas, mas não foram instaladas no blog. As 11 hierarquias de H1 têm [diagnóstico e plano por artigo](PLANO-HEADINGS.md), ainda dependentes de edição no WordPress. Os resultados abaixo preservam o estado público observado antes dessas correções locais; recomendações de preparar descrições referem-se à etapa anterior ao mapa.

Foram verificadas **todas as 182 URLs únicas** presentes no [sitemap público de artigos](https://unitedidiomas.com/blog/post-sitemap.xml), das 15h33m30s às 15h33m52s de 18/09/2026, no fuso America/Sao_Paulo. A quantidade encontrada substitui a estimativa anterior de 138 artigos. A lista não continha entradas repetidas e nenhuma URL foi omitida pelo limite de 200.

A coleta fez apenas GETs públicos, com quatro conexões simultâneas, timeout de 12 segundos e uma nova tentativa reservada às falhas. Não houve falhas nem necessidade de novas tentativas. Não houve login, envio de formulário ou alteração no WordPress. A leitura ficou limitada aos artigos listados; categorias, páginas, paginação e URLs fora desse sitemap não fazem parte deste censo.

[O inventário JSON](crawl-posts-2026-09-18.json) registra, por URL, resposta HTTP, destino final, título, descrição, canonical, robots em HTML/cabeçalhos, idioma declarado, quantidade de H1, quantidade de tags e alertas. Não armazena o corpo completo dos artigos.

## Resultado observado na versão publicada

| Verificação | Resultado |
|---|---:|
| Artigos com HTTP 200 | 182 de 182 |
| Redirecionamentos de artigos durante a coleta | 0 |
| Título presente, uma única tag e sem repetição entre artigos | 182 de 182 |
| Meta description presente, uma única tag | 182 de 182 |
| Canonical presente, único e igual à URL final | 182 de 182 |
| Artigos com noindex em meta ou cabeçalho HTTP | 0 |
| Artigos com uma única H1 | 171 |
| Artigos com duas a seis H1 | 11 |
| Artigos com description repetida em outro artigo | 47, distribuídos em 7 grupos |
| Idioma declarado no HTML | `pt-PT` em todos os 182 |

Os artigos responderam sem bloqueio de indexação no HTML/cabeçalhos avaliados. Isso **não confirma que o Google os indexou**, não mede posições ou tráfego e não substitui a inspeção no Search Console. Os canonicals do acervo usam `https://unitedidiomas.com/blog/`, sem `www`; essa configuração foi preservada na proposta de integração, sem migração automática de URLs.

## Descrições que precisam de revisão

Uma descrição genérica da escola aparece em **34 artigos**. O inventário identifica o grupo completo. O primeiro passo é gerar ou editar uma descrição específica que resuma cada artigo, preservando metadados editoriais úteis já existentes.

Os **13 artigos restantes** pertencem a seis grupos com descrições específicas repetidas. Eles não devem ser tratados apenas pela regra de substituição da descrição genérica: exigem revisar o campo SEO de cada artigo e compará-lo ao conteúdo. A tabela agrupa somente as duplicações detectadas; não atribui automaticamente erro editorial a todos os integrantes.

| Tema da descrição compartilhada | Artigos do grupo |
|---|---|
| Inglês para economistas | [Economistas](https://unitedidiomas.com/blog/ingles-para-economistas/), [TOEFL](https://unitedidiomas.com/blog/voce-sabe-como-o-toefl-funciona/), [Costumes brasileiros](https://unitedidiomas.com/blog/10-costumes-brasileiros-que-estrangeiros-acham-esquisitos/) |
| Inglês na área de marketing | [Começar 2023 aprendendo inglês](https://unitedidiomas.com/blog/sete-motivos-para-voce-comecar-2023-aprendendo-ingles-com-a-united-idiomas/), [Vocabulário de marketing](https://unitedidiomas.com/blog/vocabulario-de-ingles-para-a-area-de-marketing/) |
| Guia de inglês para viagens | [Guia rápido](https://unitedidiomas.com/blog/guia-rapido-de-ingles-para-viagens/), [Aurora boreal](https://unitedidiomas.com/blog/guia-basico-de-ingles-para-viajantes-aurora-boreal/) |
| Motivos para escolher a escola | [Cinco motivos](https://unitedidiomas.com/blog/cinco-motivos-united-idiomas/), [Gírias em inglês](https://unitedidiomas.com/blog/principais-girias-ingles/) |
| Inglês no ambiente de trabalho | [Inglês no trabalho](https://unitedidiomas.com/blog/ingles-no-trabalho/), [Inglês corporativo](https://unitedidiomas.com/blog/ingles-corporativo/) |
| Conversas profissionais em inglês | [Conversação profissional](https://unitedidiomas.com/blog/ingles-conversacao-profissional/), [Dificuldades de gramática](https://unitedidiomas.com/blog/dificuldades-gramatica-ingles/) |

Não foi aplicada regra de qualidade baseada apenas na quantidade de caracteres. Descrições repetidas reduzem a especificidade dos metadados, mas esta constatação não demonstra, sozinha, penalização ou perda de tráfego. O Google pode gerar o trecho exibido na busca a partir do próprio conteúdo.

## Hierarquia de títulos

Estes artigos contêm múltiplas H1 no HTML recebido:

| Artigo | Quantidade de H1 |
|---|---:|
| [Uso de preposições](https://unitedidiomas.com/blog/uso-de-preposicoes-em-ingles/) | 5 |
| [Home office global](https://unitedidiomas.com/blog/ingles-para-home-office-global/) | 4 |
| [Entrevista em inglês](https://unitedidiomas.com/blog/como-se-preparar-para-entrevista-em-ingles/) | 2 |
| [Estude inglês e decole sua carreira](https://unitedidiomas.com/blog/estude-ingles-na-united-e-decole-sua-carreira/) | 3 |
| [Mardi Gras](https://unitedidiomas.com/blog/carnaval-nos-estados-unidos-mardi-gras/) | 5 |
| [Pós-graduação no Reino Unido](https://unitedidiomas.com/blog/pos-graduacao-internacional-no-reino-unido/) | 3 |
| [Autoras internacionais](https://unitedidiomas.com/blog/conheca-5-autoras-internacionais-para-ler-em-ingles/) | 6 |
| [Verbo to be](https://unitedidiomas.com/blog/entenda-o-verbo-to-be/) | 5 |
| [Aurora boreal](https://unitedidiomas.com/blog/guia-basico-de-ingles-para-viajantes-aurora-boreal/) | 2 |
| [Como se preparar para intercâmbio](https://unitedidiomas.com/blog/intercambio-o-que-e-preciso-e-como-se-preparar/) | 6 |
| [Intercâmbio au pair](https://unitedidiomas.com/blog/intercambio-au-pair-o-que-e-e-como-funciona/) | 3 |

Revisar no editor se títulos de subseções foram marcados como H1 e aplicar H2/H3 conforme a estrutura real. A contagem é um alerta de organização semântica; não prova penalização nem justifica substituir automaticamente todas as H1 sem ler a estrutura do artigo.

## Idioma e sequência de trabalho

O HTML declara `pt-PT` em todos os artigos. A revisão proposta para o WordPress ajusta a declaração para `pt-BR`, coerente com o público e o português brasileiro do site. Trata-se de correção semântica e de acessibilidade; não deve ser apresentada como garantia de posicionamento geográfico nas buscas.

Este censo amplia a amostra inicial de três artigos utilizada na primeira versão do plugin. Os ajustes globais de idioma são distintos das intervenções editoriais pontuais. A existência desta auditoria não significa que todas as 47 descrições ou as 11 hierarquias de H1 tenham sido corrigidas; conferir o escopo efetivo da versão entregue no [README do plugin](README.md). Nenhuma dessas alterações foi instalada por esta coleta.

1. Revisar o plugin opcional e instalá-lo primeiro em ambiente de teste, conforme o README desta pasta. O crawl representa o site anterior à eventual instalação; não comprova que as correções locais já foram publicadas.
2. Preparar e conferir, nos 34 artigos do grupo genérico, descrições que resumam o conteúdo de cada página. Revisar individualmente os outros seis grupos de descrições duplicadas.
3. Corrigir, no editor, a hierarquia dos 11 artigos indicados e conferir o resultado no navegador. Não regravar o acervo em massa somente a partir desta contagem.
4. Repetir a coleta após a integração e comparar títulos, descrições, canonicals, idioma e cabeçalhos. Preservar as URLs públicas existentes e a atualização automática do sitemap Yoast.
5. No Search Console, conferir os sitemaps comercial e do blog, páginas excluídas, canônica escolhida e consultas com impressões. Priorizar revisões editoriais posteriores usando esses dados e as perguntas dos alunos.

## Limites desta auditoria

Esta é uma verificação técnica do **HTML entregue pelo servidor**, não uma revisão editorial individual dos 182 textos, uma avaliação de qualidade das respostas, uma renderização JavaScript ou um teste de Core Web Vitals. Não foram medidos resultados orgânicos, links externos, intenção de busca, canibalização, reputação ou conversões. As URLs fora do sitemap de posts precisam de inventário próprio.

Um sitemap facilita a descoberta, mas sua submissão não garante rastreamento ou indexação. A confirmação permanece no Search Console e no acompanhamento do site publicado. [Documentação do Google sobre sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).
