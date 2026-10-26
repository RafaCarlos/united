# Rafael — instalar o Blog United no WordPress existente

## Preparar e conferir

Esta integração foi preparada para a instalação WordPress do blog, que permanece separada do site principal. Não substituir WordPress, banco, tema Divi, plugins ou uploads pelos arquivos estáticos da entrega anterior.

1. Fazer backup do banco e de `wp-content/`; preferir uma cópia de homologação para a primeira instalação.
2. Conferir WordPress 6.2+ e PHP 7.4+; manter uma versão de PHP com suporte no servidor. A compatibilidade mínima de sintaxe e o ambiente efetivamente testado são registrados nos relatórios.
3. Verificar se existe `index.html` estático em `/blog/` ou nas pastas de artigos que tenha precedência sobre o front controller do WordPress. Remover da publicação somente esses artefatos estáticos depois do backup, preservando `index.php`, uploads e regras do WordPress. Os novos artigos devem ser atendidos pelo WordPress.
4. Manter tema Divi e recursos que processam shortcodes antigos. O plugin não substitui o tema nem retira seus scripts/styles. Seus templates preservam os hooks dos plugins.

## Instalar e avaliar

1. Em **Plugins → Adicionar plugin → Enviar plugin**, selecionar `wordpress/releases/United-Blog-WordPress-2026-10-24.zip` deste repositório e ativar **United Blog**. Alternativa: copiar somente `united-blog/` para `wp-content/plugins/`.
2. Abrir **Configurações → Blog United**. O visual novo começa desabilitado para visitantes.
3. Confirmar o endereço do site principal e o formulário. RD/GTM começa desmarcado para evitar duplicar loaders já instalados no WordPress; ativar essa opção apenas após conferir a configuração atual. Preservar o mecanismo de consentimento existente.
4. Abrir a prévia como administrador autenticado. Ela usa `?united_blog_preview=1`, cabeçalhos sem cache e `noindex`. O cache/CDN deve respeitar cookies de autenticação, `no-store` e excluir esse parâmetro. A prévia não é um link público para aprovação.
5. Conferir índice, busca, categorias, página 2, artigo novo, artigo antigo com Divi, imagem, tabela, links internos, menu mobile, comentários e formulário RD. Não é necessário enviar outro lead para testar o layout.
6. Marcar **Aplicar ao blog para todos os visitantes**, salvar e limpar o cache do blog. Conferir novamente deslogado no desktop e celular.

O plugin atende índice de posts, front page da instalação em `/blog/`, posts, categorias, tags, autores, datas e busca de posts. Páginas comuns, painel, REST, feed e editor visual Divi conservam suas rotas. Para uma instalação WordPress fora de `/blog/` que use uma página inicial estática, configurar uma página de posts nativa em **Configurações → Leitura**.

## Conteúdo, URLs e SEO

- **Posts existentes:** não reimportar os 184 artigos do pacote antigo. O banco atual é a fonte de verdade, incluindo publicações posteriores.
- **Dois textos novos:** o botão **Adicionar os dois rascunhos** importa somente o release e a notícia da imprensa. Revisar autor, categoria, data, imagem e SEO antes de publicar. A ação não publica automaticamente e é idempotente.
- **URLs:** preservar a estrutura atual de links permanentes. Os links do novo layout vêm de `get_permalink`, URLs de termos e paginação do WordPress; não impor `/pagina/` do antigo blog estático. Se esses arquivos estáticos chegaram a ser publicados/indexados, redirecionar suas páginas de arquivo para a paginação nativa correspondente depois de conferir os endereços reais.
- **Domínio:** o blog atual responde em `unitedidiomas.com/blog/`; o menu do site principal usa `www.unitedidiomas.com`. O plugin respeita o domínio configurado no WordPress e não força mudanças de banco ou redirects. Qualquer padronização www/sem-www deve ser coordenada no servidor e no WordPress, preservando os caminhos.
- **Metadados:** Yoast, Rank Math, AIOSEO, SEOPress ou The SEO Framework, quando detectados, continuam responsáveis por SEO. Sem eles, o plugin fornece descrição, Open Graph e schema básico, com canonical singular do próprio WordPress. Conferir o código-fonte real para descartar duplicações introduzidas por outro plugin não detectado.
- **Sitemap:** manter o sitemap do WordPress/plugin SEO para artigos, categorias e autores. Substituir o antigo `sitemap-united-pages.xml` pelo arquivo de mesmo nome em `wordpress/releases/`, que contém somente as seis páginas comerciais. Assim, o sitemap estático não anuncia rascunhos nem congela o inventário do blog. Referenciar o sitemap comercial e o endereço real do sitemap WordPress no robots/Search Console conforme a hospedagem.
- **Robots:** preservar as regras administrativas existentes. A opção **Desencorajar mecanismos de busca** deve permanecer ativa em homologação e desativada no blog público quando pronto. Não copiar o robots da prévia estática para produção.

## Imagens, desempenho e RD

As capas dos dois rascunhos são WebP. Imagens existentes continuam na Biblioteca de mídia e não são substituídas em massa. O WordPress gera `srcset`/`sizes` quando há metadados disponíveis; novos tamanhos do plugin são registrados para futuros uploads. Se necessário, a equipe pode gerar apenas os tamanhos adicionais nas mídias antigas, sem apagar originais.

Usar cache de página para visitantes anônimos com invalidação ao publicar/editar posts. Nunca cachear painel, login, respostas com cookies de autenticação, prévias ou conteúdo protegido. Preservar compressão e cache de assets na hospedagem. As consultas são paginadas no servidor; a busca não baixa um JSON com todo o acervo.

O formulário usa o mesmo ID/SDK RD da entrega aprovada. A opção adicional RD/GTM é independente e começa desligada. O plugin não envia leads ao instalar/importar. Depois da ativação, conferir carregamento, consentimento e deduplicação; a confirmação de entrada no CRM/automação depende do painel RD.

## Retornar ao visual anterior

Desmarcar **Aplicar ao blog para todos os visitantes**, ou desativar o plugin, e limpar o cache. Isso restaura a apresentação do tema sem apagar posts/mídias ou reescrever links permanentes. Os rascunhos e capas criados explicitamente pelo importador permanecem como conteúdo normal do WordPress; a equipe decide seu destino no painel.

Se uma importação interrompida deixar o bloqueio `_ub26_editorial_import_lock`, confirmar primeiro que não há outro processo ativo e então remover somente essa opção para repetir a ação. Os posts já criados serão reconhecidos pelo importador.
