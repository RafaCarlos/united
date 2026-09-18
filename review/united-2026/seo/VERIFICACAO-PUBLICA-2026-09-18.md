# Conferência pública de rastreamento e integração — 18/09/2026

**Verificação concluída em 18/09/2026 às 15h45m54s, America/Sao_Paulo (UTC−03:00).** As quatro páginas comerciais estão acessíveis por HTTP e não apresentam bloqueios de indexação no HTML ou no cabeçalho examinados. Isso indica condições técnicas favoráveis ao rastreamento; **não comprova que o Googlebot já visitou as páginas nem que elas estão indexadas**.

Esta etapa fez somente leituras públicas. Não alterou servidor, WordPress, formulários ou Git. A comparação local usa especificamente o commit `9684828520c7ae75d8d4a4f056889b5e560566fc`; alterações locais posteriores a esse commit não entram nesta comparação. A evidência detalhada está em [VERIFICACAO-PUBLICA-2026-09-18.json](VERIFICACAO-PUBLICA-2026-09-18.json).

## Páginas comerciais publicadas

| Página | HTTP | Canonical | Meta/cabeçalho noindex | Rótulo visual de prévia |
|---|---:|---|---|---|
| [Home](https://www.unitedidiomas.com/) | 200 | URL oficial da Home | Ausente | Ausente |
| [Cursos](https://www.unitedidiomas.com/cursos/) | 200 | URL oficial de Cursos | Ausente | `PRÉVIA · UNITED` |
| [Quem Somos](https://www.unitedidiomas.com/quem-somos/) | 200 | URL oficial de Quem Somos | Ausente | `PRÉVIA · UNITED` |
| [FAQ](https://www.unitedidiomas.com/faq/) | 200 | URL oficial da FAQ | Ausente | `PRÉVIA · UNITED` |

As quatro respostas não incluem meta robots nem `X-Robots-Tag`. A ausência de uma meta `index,follow` não constitui bloqueio: não é obrigatório declará-la para permitir indexação. Cada página tem uma H1. No servidor, a H1 de Cursos ainda é apenas “Live Class”; o commit comparado acrescenta o contexto “Curso de inglês online”. Os títulos, descrições e canonicals examinados correspondem aos do commit comparado.

Os rótulos de prévia são uma pendência visual; sozinhos, não impedem indexação. O pacote local comparado remove os três rótulos e declara `index,follow,max-image-preview:large` nas quatro páginas. Um loader RD, um SDK do formulário e um mount do formulário principal foram encontrados por página comercial, e o contêiner GTM da Home continua presente. Esta leitura não submeteu leads nem testou o recebimento na conta RD.

## Robots e sitemaps

| Recurso público | Resposta observada | Comparação com a preparação local |
|---|---|---|
| [Robots com www](https://www.unitedidiomas.com/robots.txt) | HTTP 404 | O pacote prepara um arquivo explícito que permite rastreamento e aponta para os sitemaps comercial e WordPress. |
| [Robots sem www](https://unitedidiomas.com/robots.txt) | HTTP 404 | Conferido separadamente porque o blog usa esse host. |
| [Sitemap da raiz](https://www.unitedidiomas.com/sitemap.xml) | HTTP 200, 186 URLs, datas declaradas de 19/03/2024 | Ainda não contém as URLs atuais `/cursos/`, `/quem-somos/` e `/faq/`. O pacote prepara o sitemap comercial de quatro rotas. |
| [Índice de sitemaps WordPress](https://unitedidiomas.com/blog/sitemap_index.xml) | HTTP 200, cinco sitemaps filhos | Continua gerado pelo WordPress/Yoast, sem substituir seus URLs pelo sitemap comercial. |
| [Sitemap de artigos](https://unitedidiomas.com/blog/post-sitemap.xml) | HTTP 200, 182 artigos | Mantém a descoberta do acervo atual do blog. |

Para o Google, uma resposta **404 em robots.txt significa ausência de restrições por esse arquivo**. Portanto, esse 404 não equivale ao antigo `Disallow: /`. As regras de robots são próprias de cada host; por isso, foram verificados `www` e o domínio sem `www`. O Google pode usar regras em cache até a próxima atualização. [Especificação oficial de robots.txt do Google](https://developers.google.com/crawling/docs/robots-txt/robots-txt-spec).

A correção preparada mantém separados o sitemap comercial de quatro URLs e o índice dinâmico do WordPress. As 186 entradas do sitemap antigo da raiz e os 182 artigos do sitemap atual são inventários distintos; não se deve somá-los como número de páginas únicas. Esta conferência não voltou a acessar individualmente as 186 entradas antigas. O censo dos 182 artigos está documentado em [wordpress/AUDITORIA-ACERVO.md](wordpress/AUDITORIA-ACERVO.md).

## Blog e conteúdo para busca

O [índice do blog](https://unitedidiomas.com/blog/) respondeu HTTP 200, com canonical no domínio sem `www` e robots permitindo indexação. Continua com título “Home (blog) | Blog United Idiomas”, descrição genérica e `lang="pt-PT"`. Foram identificadas duas H1, sendo uma vazia no HTML recebido. A existência das correções no pacote local não significa que o plugin preparado já esteja instalado.

Os termos pedidos — inglês online e ao vivo, inglês em 18 meses, conversação, Jimmy, On Demand e storytelling — já aparecem no texto HTML da Home. Cursos ainda tem apresentação textual mais limitada para alguns desses recursos. A revisão de conteúdo deve explicar como cada recurso participa da experiência de estudo, com ligações úteis entre Home, Cursos e FAQ, sem repetir uma lista de palavras em todas as páginas.

O JSON inclui presença textual das expressões por página. Esse levantamento compara frases no texto recebido pelo servidor, sem scripts; não é análise de intenção de busca, densidade ideal ou qualidade editorial. Uma expressão exata ausente não significa ausência do conceito: ele pode aparecer com outra redação, em imagem ou no texto alternativo. Não foram atribuídas notas de SEO por essa contagem.

## O que é necessário para confirmar o Google

1. Após a revisão e publicação pela equipe, conferir novamente os quatro HTMLs, robots, sitemap, canonicals, redirecionamentos e ausência dos rótulos de prévia.
2. No Search Console, usar a inspeção das quatro URLs para conferir o teste ao vivo, o último rastreamento, a permissão de indexação e a canônica escolhida. Enviar os sitemaps comercial e WordPress.
3. Consultar estatísticas de rastreamento e indexação. Logs do servidor podem complementar a evidência de visita, desde que a identidade do Googlebot seja validada; alterar somente o User-Agent de um teste não demonstra uma visita real.
4. Acompanhar consultas, impressões, cliques e leads após a integração para decidir quais conteúdos merecem aprofundamento. Disponibilidade técnica não garante posição ou indexação imediata.

O teste usou um agente de leitura identificado como `UnitedSEOReview`, não o Googlebot. Não houve acesso ao Search Console, logs do servidor, dados orgânicos ou contas privadas. O Google exige páginas acessíveis, respostas válidas e conteúdo indexável, mas atender aos requisitos não garante inclusão nos resultados. [Requisitos técnicos do Google Search](https://developers.google.com/search/docs/essentials/technical).
