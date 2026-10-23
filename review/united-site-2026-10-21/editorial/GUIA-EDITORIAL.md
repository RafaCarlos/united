# Rotina semanal do Blog United

## 1. Preparar a matéria

Uma pauta por artigo. Defina para quem escreve, a dúvida que será respondida, o título e as fontes. Entregue a matéria com introdução, subtítulos, exemplos e um fechamento útil. O título principal é cadastrado nos metadados; o corpo começa com um parágrafo e usa `h2` nos subtítulos.

O formulário em `editorial/modelos/pauta-semanal.txt` permite enviar o conteúdo à agência sem editar código. O template cuida da diagramação, do sumário e dos artigos relacionados.

## 2. Cadastrar na versão estática

A agência executa `npm run blog:novo -- slug-do-artigo "Título do artigo"`. O slug usa letras minúsculas, números e hífens; não deve repetir uma URL existente. Depois de publicado, preserve o slug; se precisar mudar, planeje o redirecionamento da URL anterior.

Edite o registro criado em `src/blog/editorial/articles.json`:

| Campo | Orientação |
| --- | --- |
| `title` | Título que o leitor verá. |
| `seoTitle` | Opcional: título para a aba e os buscadores; vazio usa `title`. |
| `excerpt` | Resumo fiel, de uma ou duas frases; aparece na listagem e na descrição. |
| `date` | Data de publicação no formato `AAAA-MM-DD`. |
| `modified` | Data da última atualização relevante, igual ou posterior à publicação. |
| `topic` | Uma das categorias abaixo. |
| `authors` | Autor ou redação responsável; não inventar credenciais. |
| `bodyFile` | Nome do HTML dentro de `src/blog/editorial/`. |
| `localImage` | Caminhos relativos à pasta `blog`, com dimensões reais das imagens. |
| `featuredImage.alt` | Descrição do que a capa mostra. |
| `imageCaption` | Legenda ou crédito quando necessário. |
| `status` | `draft`, `local-draft` ou `published`, conforme o fluxo abaixo. |

Categorias disponíveis: `aprendizado`, `carreira`, `viagens`, `tecnologia`, `united` e `materiais`. Não criar uma categoria só no registro: novas categorias exigem adaptação do template e dos filtros.

Use `draft` enquanto o texto estiver incompleto. Ele não aparece na prévia. Use `local-draft` para revisar no layout final. Use `published` após aprovação editorial; essa marca permite preparar o candidato local de produção, mas não envia arquivos ao servidor.

Não usar a data futura como agendamento: esta entrega não tem agendador. Um artigo incluído com data futura também será renderizado. Para agendar, mantenha como `draft` e publique no dia escolhido, ou integre o fluxo ao agendamento do CMS.

## 3. Preparar imagens leves

Entregar uma capa e sua versão menor, ambas WebP. Sugestão: 1200 pixels de largura para a capa e 640 para a miniatura, com a mesma proporção. O modelo usa 1200 × 675 e 640 × 360; se o arquivo tiver outras medidas, corrigir todos os valores no JSON.

Coloque os arquivos em `src/blog/assets/`, por exemplo `entrevista-em-ingles.webp` e `entrevista-em-ingles-640.webp`. Use nomes simples sem espaços. O gerador não converte nem redimensiona imagens. Exporte do editor com boa legibilidade e compressão adequada; não aumente uma imagem pequena artificialmente.

Imagens adicionais podem ser incluídas no corpo HTML com caminho `../assets/arquivo.webp`, descrição e dimensões. Não repetir a capa como a primeira imagem do texto. O exemplo está comentado em `editorial/modelos/corpo-artigo.html`.

## 4. Revisar antes de publicar

Gere a prévia com `npm run review`, inicie `npm run preview` e abra `http://127.0.0.1:8791/blog/`. Confira o artigo em desktop e celular: título, capa, subtítulos, links, autoria e data. Teste a busca por uma expressão do texto. Confira também a listagem e o sumário automático.

Os comandos validam arquivos e estrutura; a equipe ainda revisa redação, fontes, fatos e adequação das imagens. Nos textos institucionais, use os números aprovados da United e indique o período quando cabível. Ao citar imprensa, identifique o veículo, a data, o crédito e o link original; escreva um resumo próprio, sem copiar integralmente a matéria.

Após aprovação, a agência usa `published` para o novo artigo (ou uma aprovação explícita em `release.config.json`), executa `npm run build` e integra o candidato ao site. Publicar novos artigos não exige redesenhar a Home nem alterar as páginas dos cursos.

## Atualizar um artigo antigo

Os 184 artigos importados continuam em `src/blog/content-source.json`; o corpo de cada um é indicado por `privateContentEvidence.html`. Não criar uma cópia com outro slug apenas para corrigir texto. Para o release institucional, editar `src/tools/united-release.json` e `src/tools/united-release.html`. Preserve a data original e atualize `modified` quando a mudança for relevante.
