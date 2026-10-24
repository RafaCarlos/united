=== United Blog ===
Requires at least: 6.2
Requires PHP: 7.4
Stable tag: 1.0.2
License: GPLv2 or later

Layout editorial United conectado aos posts e à Biblioteca de mídia do WordPress.

== Desempenho ==
CSS e JavaScript são entregues minificados em produção, com fontes legíveis no
pacote para manutenção. SCRIPT_DEBUG carrega as fontes durante a depuração.
As imagens incluídas são WebP e as imagens destacadas usam os tamanhos nativos
do WordPress, com srcset e carregamento adiado fora dos destaques principais.

== Instalação ==
1. Fazer backup e instalar primeiro em homologação.
2. Enviar o ZIP em Plugins > Adicionar plugin > Enviar plugin e ativar.
3. Abrir Configurações > Blog United e usar a prévia administrativa.
4. Conferir artigos antigos, menu, mídia, SEO, cache e formulário no WordPress real.
5. Habilitar o layout para visitantes quando aprovado e limpar o cache.

O plugin mantém o tema atual, os posts, as mídias e os links permanentes.
A instalação não altera o layout público automaticamente nem publica textos.
O botão de importação adiciona apenas dois artigos novos como rascunhos.

== Rotina editorial ==
Usar Posts > Adicionar novo. Preencher título, texto, resumo, categoria e imagem
destacada. Visualizar e publicar ou agendar pelo WordPress. Os novos artigos
aparecem automaticamente na listagem, busca e categorias do blog.

== Retorno ao layout anterior ==
Desabilitar o layout em Configurações > Blog United ou desativar este plugin.
Posts e mídias permanecem no WordPress. Limpar o cache após a mudança.

== Documentação completa ==
No repositório RafaCarlos/united, pasta wordpress/docs/:
- INSTALACAO-RAFAEL.md
- ROTINA-EDITORIAL.md

Não substituir a instalação WordPress pelo blog HTML da entrega anterior.
