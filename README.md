# United — entrega para publicação

## Blog WordPress — integração de 24/10/2026

A integração editorial está em **[wordpress/](wordpress/README.md)**. O plugin usa os posts, categorias e imagens do WordPress atual e aplica o visual aprovado, com prévia administrativa antes da ativação pública. Rafael: seguir **[INSTALACAO-RAFAEL.md](wordpress/docs/INSTALACAO-RAFAEL.md)**. A agência encontra o fluxo de publicação em **[ROTINA-EDITORIAL.md](wordpress/docs/ROTINA-EDITORIAL.md)**.

Para o blog, esta integração substitui o fluxo estático abaixo. Não sobrescrever o WordPress nem reimportar seu acervo a partir do pacote antigo. Os dois textos novos podem ser adicionados como rascunhos pelo plugin.

**Pacote instalável:** [United-Blog-WordPress-2026-10-24.zip](wordpress/releases/United-Blog-WordPress-2026-10-24.zip). O novo [sitemap das páginas comerciais](wordpress/releases/sitemap-united-pages.xml) exclui as rotas estáticas do blog; os posts continuam no sitemap dinâmico do WordPress.

**Botões do site:** `Quero conhecer` voltou ao vermelho e WhatsApp continua verde. Fonte e versão minificada estão atualizadas em `review/united-site-2026-10-21/`. Para essa correção no site já publicado, atualizar `dist/contact-form.css` e os HTMLs das seis páginas comerciais (Home, três cursos, Quem somos e FAQ), que receberam o novo hash de cache. Não copiar o diretório `dist/blog/`.

## Entrega do site de 21/10/2026

A versão completa revisada está em **[review/united-site-2026-10-21/](review/united-site-2026-10-21/)**: Home, Live Class, Business, Full, Quem somos, FAQ e blog com 186 artigos, além de SEO, WebP, minificação e integração RD Station.

Rafael: começar por **[PUBLICAR.md](review/united-site-2026-10-21/PUBLICAR.md)**. Os arquivos públicos prontos ficam em `review/united-site-2026-10-21/dist/`; a fonte editável e o processo de manutenção estão na mesma entrega.

O PHP da raiz e a entrega anterior `review/united-2026/` foram preservados. Este commit disponibiliza a revisão no Git; a integração e a publicação na hospedagem ficam com Rafael.
