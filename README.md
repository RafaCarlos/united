# United — entrega para publicação

## Atualização do site principal — 27/10/2026

Rafael: começar pelas **[instruções de publicação](releases/site-2026-10-27/README.md)** e baixar o **[ZIP seletivo](releases/site-2026-10-27/United-Site-Ajustes-2026-10-27.zip)**. O pacote retira Osasco de Quem somos e organiza as cinco unidades em cards responsivos, restaura o vermelho de “Quero conhecer”, preserva o WhatsApp verde, acrescenta nove variantes WebP para três imagens e corrige a mão da personagem no banner inicial do Live Class, com duas versões WebP responsivas.

Publicar somente os **19 arquivos de `publicar/`**: seis HTML comerciais, dois CSS e onze WebP. Enviar imagens/CSS antes dos HTMLs, preservar os caminhos e invalidar o cache. O pacote inclui oito arquivos de reversão e foi preparado e conferido; ainda não foi aplicado à hospedagem.

Esta entrega é cumulativa e substitui o pacote de 26/10, que não deve ser aplicado depois dela.

O blog ativo continua no WordPress. Não publicar o `dist/` completo nem `dist/blog/`, e não enviar `rollback/`, `conferencia/` ou `manutencao/` ao servidor público. WordPress, PHP, banco, `.htaccess`, robots e sitemap ficam fora deste ajuste.

## Blog WordPress — integração de 24/10/2026

A integração editorial está em **[wordpress/](wordpress/README.md)**. O plugin usa os posts, categorias e imagens do WordPress atual e aplica o visual aprovado, com prévia administrativa antes da ativação pública. Rafael: seguir **[INSTALACAO-RAFAEL.md](wordpress/docs/INSTALACAO-RAFAEL.md)**. A agência encontra o fluxo de publicação em **[ROTINA-EDITORIAL.md](wordpress/docs/ROTINA-EDITORIAL.md)**.

Para o blog, esta integração substitui o fluxo estático abaixo. Não sobrescrever o WordPress nem reimportar seu acervo a partir do pacote antigo. Os dois textos novos podem ser adicionados como rascunhos pelo plugin.

**Pacote instalável:** [United-Blog-WordPress-2026-10-24.zip](wordpress/releases/United-Blog-WordPress-2026-10-24.zip). O novo [sitemap das páginas comerciais](wordpress/releases/sitemap-united-pages.xml) exclui as rotas estáticas do blog; os posts continuam no sitemap dinâmico do WordPress.

## Entrega do site de 21/10/2026

A fonte do site está em **[review/united-site-2026-10-21/](review/united-site-2026-10-21/)**: Home, Live Class, Business, Full, Quem somos e FAQ, além de SEO, WebP, minificação e integração RD Station. O blog estático com 186 artigos permanece apenas como referência histórica.

O processo de manutenção e as orientações anteriores estão em **[PUBLICAR.md](review/united-site-2026-10-21/PUBLICAR.md)**. Para o site já publicado, usar o ZIP seletivo de 27/10 indicado acima, sem copiar a árvore completa de `dist/`.

O PHP da raiz e a entrega anterior `review/united-2026/` foram preservados. Este commit disponibiliza a revisão no Git; a integração e a publicação na hospedagem ficam com Rafael.
