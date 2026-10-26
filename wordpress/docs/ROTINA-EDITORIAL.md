# Blog United — rotina da equipe editorial

A integração usa os posts, categorias, mídias, usuários e endereços da instalação WordPress existente. O painel continua sendo o lugar para criar e atualizar matérias; o visual novo é aplicado automaticamente às listagens e à leitura.

## Os artigos que já existem

Os 184 artigos da entrega estática foram copiados do WordPress em 11/10/2026. Eles não precisam voltar para o banco. A instalação atual pode ter recebido publicações ou correções depois dessa data: esse conteúdo permanece sendo a fonte vigente.

Não importar o acervo estático inteiro, não substituir a base de dados e não trocar os slugs dos artigos publicados. Os posts conservam autoria, datas, categorias, comentários, imagens e recursos de edição já existentes. Para artigos antigos construídos com Divi, manter os recursos que processam seus shortcodes durante a integração.

## Adicionar os dois textos novos

Na tela administrativa da integração United Blog, o botão **Adicionar os dois rascunhos** cria somente estes conteúdos:

| Texto | Endereço do artigo |
| --- | --- |
| United: aulas ao vivo, tecnologia e 18 anos de histórias com o inglês | `/blog/united-ingles-online-aulas-ao-vivo-tecnologia/` |
| United no Valor e em O Globo: conheça a Live Class 2.0 | `/blog/united-valor-o-globo-live-class-2/` |

Os textos entram como **rascunhos**, com seus parágrafos, títulos e listas em blocos nativos. As capas WebP são adicionadas à Biblioteca de mídia a partir dos arquivos do pacote, sem baixar imagens de outros sites. Texto alternativo e legenda são preservados.

O autor no WordPress é o administrador que executou a ação. A referência editorial “Redação United” e as datas propostas nos arquivos originais ficam registradas em metadados; não são criadas contas fictícias nem publicações retroativas. Antes de publicar, a equipe escolhe o autor e a data corretos. O título sugerido para SEO também fica registrado, sem sobrescrever configurações do plugin de SEO existente.

Se já existir um artigo com o mesmo identificador ou slug, inclusive na lixeira, o importador o preserva e avisa. Repetir o botão não substitui conteúdo nem duplica os dois artigos. A categoria `United Idiomas` é usada se ela já existir; caso contrário, revisar a categoria padrão antes da publicação. Os comentários ficam fechados apenas nos novos rascunhos.

Se uma capa falhar, o texto permanece salvo. A equipe pode definir a imagem destacada pela Biblioteca de mídia ou repetir a importação: ela tentará recuperar somente a capa pendente de um rascunho criado pelo próprio importador. Textos editados e posts já publicados não são sobrescritos. Uma imagem selecionada manualmente pela equipe é preservada.

## Publicar uma matéria semanal

1. Acesse **Posts → Adicionar novo** no WordPress.
2. Escreva um título específico e preencha o texto usando parágrafos, títulos de seção, listas e imagens. O título do post já é o título principal; use nível 2 para as seções.
3. Escolha uma categoria pertinente, um autor real e um slug curto. Evite alterar o slug depois da publicação.
4. Defina a **imagem destacada**. Uma imagem horizontal de aproximadamente 1200 × 675 px costuma funcionar bem; use WebP quando disponível e preencha o texto alternativo. Não repita a mesma capa no primeiro parágrafo.
5. Preencha o **resumo** com uma ou duas frases. Revise título e descrição no plugin de SEO que já estiver ativo, se houver.
6. Use a prévia para conferir leitura no desktop e no celular, links, imagens, tabelas e sumário. O sumário usa os títulos das seções do próprio artigo.
7. Publique ou agende pelo WordPress. Confira a matéria na listagem e na busca após a atualização do cache.

Não é necessário editar arquivos de template, reenviar ZIPs ou reconstruir o site para cada novo artigo. O ZIP da integração serve para instalar ou atualizar código; o conteúdo semanal é mantido no painel.

## Conferência antes de colocar o blog no ar

- Rafael deve preservar a instalação WordPress, sua Biblioteca de mídia e a estrutura de links permanentes existente.
- Conferir os dois rascunhos, especialmente autoria, data, categoria, imagem destacada e links para os cursos.
- Conferir um artigo antigo com tabela e outro com conteúdo do Divi; as páginas precisam mostrar o texto completo e os recursos já publicados.
- Confirmar que há somente uma fonte de canonical, descrição, Open Graph e dados estruturados, considerando o plugin de SEO ativo.
- Verificar que arquivos estáticos antigos de `/blog/` não estejam interceptando as rotas do WordPress.

O importador não publica textos automaticamente, não envia formulários e não altera os posts antigos.
