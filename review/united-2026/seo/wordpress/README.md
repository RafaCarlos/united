# Ajustes opcionais do blog WordPress — 18/09/2026

**Este plugin foi preparado para revisão. Não foi instalado nem ativado no blog publicado.** O WordPress, o tema Divi e o banco do blog não estão neste repositório. O pacote comercial de `dist/` não substitui a instalação em `/blog/`.

O plugin `united-seo-review` corrige a saída pública usando filtros de WordPress e Yoast. Não altera opções, usuários, posts ou qualquer dado no banco; não cria tabelas, não executa requisições externas e não interfere no RD Station. A ativação é opcional e reversível: desativá-lo retira as correções de saída. O nome “review” identifica o pacote em revisão, não adiciona uma marca de prévia ao site.

## Evidência e comportamento preparado

O censo público de 182 posts foi ampliado com leitura editorial dos 47 artigos que repetem descrições. O índice e o artigo de IA também foram revisados em 18/09/2026. O plugin trabalha sobre o HTML gerado; as configurações antigas continuam visíveis no editor enquanto não forem corrigidas editorialmente.

| Página/campo observado | Correção do plugin |
|---|---|
| [Índice do blog](https://unitedidiomas.com/blog/): título `Home (blog) \| Blog United Idiomas` | `Dicas de inglês para viagens e trabalho \| United Idiomas`, preservando o número nas páginas de paginação. Descrição específica para o conteúdo do blog. |
| Quatro páginas amostradas: `lang="pt-PT"`, `og:locale="pt_PT"` e `inLanguage: pt-PT` | Português brasileiro na apresentação HTML, Open Graph e grafo Yoast. Idiomas diferentes de português são preservados. Não altera o idioma do painel. |
| [Artigo de IA](https://unitedidiomas.com/blog/ia-aprender-ingles-habilidades-humanas/): descrição é lista de palavras-chave | Resumo natural: “Entenda como a IA pode apoiar seus estudos de inglês e por que conversação, feedback e prática com outras pessoas continuam importantes.” O mesmo texto alimenta meta, Open Graph, Twitter e WebPage no Yoast. |
| 47 posts repetem descrições no [censo](crawl-posts-2026-09-18.json), inclusive textos de outros assuntos | Mapa local de 48 descrições específicas: os 47 casos mais o artigo de IA. Todas têm 136–165 caracteres, são únicas e resumem o conteúdo consultado. |
| Autor empresarial `United Idiomas` declarado `Person` | Somente esse nome exato vira `Organization`; pessoas reais permanecem `Person`. Mantém o `@id` opaco usado pelos vínculos de autoria e retira atributos próprios de pessoa e o avatar genérico amostrado. Não inventa equipe, formação, logo ou credenciais. |
| [Artigo sobre estudar sozinho](https://unitedidiomas.com/blog/aprender-ingles-sozinho-ou-com-professor/) contém as keywords do artigo de IA; os três artigos amostrados usam listas extensas | Omite a propriedade opcional `Article.keywords` somente nas três amostras. Não cria meta keywords nem modifica categorias ou tags do banco. |
| Três artigos apontam para a Home como oferta comercial | Acrescenta um parágrafo final contextual para Live Class; no artigo de IA também inclui United Business. Preserva conteúdo original, links, blocos Divi e CTA existente. |

Os três slugs que recebem o parágrafo contextual são `ia-aprender-ingles-habilidades-humanas`, `aprender-ingles-sozinho-ou-com-professor` e `ingles-viajar-europa-outono`. Os destinos são as âncoras atuais `https://www.unitedidiomas.com/cursos/#live-class` e `https://www.unitedidiomas.com/cursos/#united-business`; nenhuma página ou URL nova foi inventada. A ampliação para 48 descrições não reescreve o corpo desses ou de outros artigos.

O arquivo [post-descriptions.json](united-seo-review/post-descriptions.json) deve acompanhar o PHP ao instalar. Cada entrada identifica URL, descrição proposta, título consultado e tópicos que fundamentam a redação; não armazena HTML bruto. O mapa é lido localmente uma vez por requisição, sem acessar a rede. Arquivo ausente, JSON inválido ou entrada malformada mantém a descrição original do Yoast para os posts afetados. Meta, Open Graph, Twitter e WebPage usam o mesmo texto revisado.

As descrições novas evitam reproduzir como atuais ofertas históricas, regras profissionais, estatísticas e afirmações sem comprovação. Isso não corrige o conteúdo antigo do artigo: revisão factual/editorial continua necessária, especialmente em ofertas ON/Kids/Teens, reconhecimento de diplomas nos EUA, formatos de exames, legislação e referências à monarquia em 2022. Corrigir metadados não transforma esses textos em informação atualizada.

Os 11 casos de múltiplos H1 foram diagnosticados como título principal mais subtítulos no corpo, não como problema global de header/footer. O [plano por slug](PLANO-HEADINGS.md) orienta a edição pontual no Divi; nenhuma substituição automática do conteúdo foi adicionada ao plugin.

## Revisão e instalação pela equipe

1. Em homologação do **WordPress do blog**, copiar apenas a pasta `united-seo-review/` para `wp-content/plugins/`. Não copiar os testes para plugins e não substituir WordPress, tema ou plugins existentes. Também é possível compactar essa pasta como ZIP para o instalador do painel.
2. Confirmar PHP 7.4 ou superior, Yoast ativo e que a instalação corresponde ao blog em português. O código não depende de classes internas do Yoast; os filtros de metadados/schema só terão efeito quando o Yoast os executar. Sem Yoast, apenas o título WordPress, idioma HTML e parágrafos contextuais funcionam.
3. Ativar `United SEO Review` nessa homologação e limpar seu cache. Abrir o índice, sua segunda página, os três artigos com links e as URLs do mapa de descrições; conferir o **código-fonte servido** e a aparência. Verificar um artigo não abrangido e uma autoria real, se existentes.
4. Conferir os itens de aceitação abaixo. Depois da revisão, a equipe pode instalar/ativar em produção e limpar o cache correspondente. **Essa instalação não foi realizada nesta entrega.**
5. Para voltar, desativar o plugin e limpar o cache. Nenhuma restauração de banco é necessária por causa deste plugin, pois não há gravações.

Aceitação no ambiente real:

- Um único título/meta description/grafo Yoast, sem duplicação; canonicals e robots continuam sob a configuração existente.
- HTML/OG/JSON-LD coerentes em `pt-BR`/`pt_BR`, meta e schema do artigo IA com o resumo natural.
- `Article.author` e `WebPage.author` ainda apontam para um nó existente; a autoria United Idiomas é `Organization`. Datas originais não são alteradas artificialmente.
- Um parágrafo contextual por artigo abrangido, sem repetição em listagens, artigos relacionados, rascunhos, conteúdo com senha ou páginas. Os hooks não atuam em login, admin, AJAX, REST, feeds ou prévias do editor.
- Layout Divi, paginação, formulários RD, popup e links de WhatsApp mantidos. Caso o template específico não utilize `the_content` no loop principal, inserir o parágrafo pelo editor e retirar esse filtro; não forçar manipulação global do HTML.
- Validar a página publicada no teste de resultados avançados e na inspeção de URL do Search Console. Schema válido não garante resultado enriquecido nem posicionamento.

O ideal de manutenção é corrigir também os campos do Yoast e o idioma nas configurações do blog quando a equipe tiver acesso. Remover então os overrides equivalentes deste plugin, para que futuras edições não fiquem mascaradas. Se a autoria passar a uma pessoa real, preencher nome, perfil e biografia reais; não usar um nome fictício para satisfazer o schema.

## Testes desta entrega

Executados lint e **47 verificações isoladas de contrato**, com PHP 8.5.10 e PHP 7.4.33 via interpretador temporário oficial do WordPress Playground. Cobrem escopo público, idioma, títulos/paginação, autores reais preservados, referências do grafo, descrições, ausência de overrides de robots/canonical e parágrafos idempotentes. A cobertura inclui os 48 textos, a correspondência slug/URL/evidência, a igualdade entre os quatro formatos de metadados e o fallback para mapas ausentes ou inválidos. Aplicar o mapa ao censo em memória elimina as descrições repetidas nos 182 registros; **isso não significa que o blog publicado já foi atualizado**. Os testes não equivalem a uma instalação WordPress/Divi/Yoast, que depende do ambiente da equipe.

Com PHP CLI, a partir desta pasta:

```sh
php -l united-seo-review/united-seo-review.php
php tests/test-united-seo-review.php
```

## Referências oficiais usadas

- [WordPress: hook `wp`](https://developer.wordpress.org/reference/hooks/wp/) — registro após a consulta pública, fora do carregamento de login/admin.
- [WordPress: `language_attributes`](https://developer.wordpress.org/reference/hooks/language_attributes/) e [`wp_get_document_title`](https://developer.wordpress.org/reference/functions/wp_get_document_title/) — filtros de idioma e título.
- [WordPress: `the_content`](https://developer.wordpress.org/reference/hooks/the_content/) — condicionais do loop principal para não atingir outros blocos.
- [Yoast: títulos](https://developer.yoast.com/features/seo-tags/titles/api/) e [descrições](https://developer.yoast.com/features/seo-tags/descriptions/api/) — alteração por filtros, sem duplicar tags.
- [Yoast: locale Open Graph](https://developer.yoast.com/features/opengraph/api/changing-og-locale-output/) — `wpseo_locale`.
- [Yoast: Schema API](https://developer.yoast.com/features/schema/api/) e [Person](https://developer.yoast.com/features/schema/pieces/person/) — filtros de peças e grafo, mantendo referências existentes.
- [Google: autoria em Article](https://developers.google.com/search/docs/appearance/structured-data/article) — autores podem ser pessoas ou organizações, refletindo o conteúdo visível.
- [WordPress Playground: PHP para Node.js](https://developer.wordpress.org/playground/developers/local-development/php-wasm-node/) — interpretador usado apenas nos testes locais.
