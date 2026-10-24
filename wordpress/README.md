# Blog United integrado ao WordPress

Esta entrega conecta o layout aprovado à instalação WordPress existente em `/blog/`. Posts, busca, categorias, paginação, datas, imagens, autores e comentários vêm do próprio WordPress. Novas publicações e alterações entram no site pelo painel, sem gerar HTML nem reenviar o pacote estático.

O pacote é um **plugin de apresentação**, e não uma troca de tema ou de banco de dados. O tema Divi continua ativo para processar os artigos antigos. O plugin utiliza `wp_head`, `wp_footer`, o loop e os filtros de conteúdo do WordPress, mantendo os plugins existentes. Instalar o plugin não muda a apresentação dos visitantes: o novo visual só é habilitado pela configuração administrativa.

## Arquivos

- `united-blog/`: plugin instalável; o ZIP deve conter esta pasta na raiz.
- `docs/INSTALACAO-RAFAEL.md`: ativação, rotas, SEO, cache, RD e retorno ao visual anterior.
- `docs/ROTINA-EDITORIAL.md`: publicação semanal e importação opcional dos dois textos novos.
- `tests/`: validação em WordPress real local com Playground; não copiar para plugins.
- `reports/`: resultados dos testes; não copiar para a hospedagem.
- `releases/United-Blog-WordPress-2026-10-24.zip`: pacote pronto para instalar pelo painel.
- `releases/sitemap-united-pages.xml`: sitemap apenas das seis páginas comerciais, para substituir o sitemap estático antigo; os artigos ficam no sitemap nativo do WordPress/plugin SEO.

O plugin não importa o acervo antigo. Os artigos já publicados — inclusive os adicionados após a entrega estática — permanecem na instalação vigente. O botão administrativo de importação cria apenas os dois textos novos como rascunhos editáveis, com capas WebP. Repetir a ação não duplica nem substitui artigos existentes.

## Uso pela equipe

1. Instalar o ZIP em **Plugins → Adicionar plugin → Enviar plugin** e ativar.
2. Abrir **Configurações → Blog United** e usar **Abrir prévia do novo blog**.
3. Depois da conferência no WordPress real, marcar **Aplicar ao blog para todos os visitantes**.
4. Manter os próximos conteúdos em **Posts → Adicionar novo**. Título, texto, resumo, categoria e imagem destacada alimentam o layout automaticamente.

O envio ao Git não instala nem ativa código na hospedagem. A versão de WordPress/PHP, os plugins ativos, Divi e o cache de produção devem ser conferidos pelo administrador responsável. Resultados locais são registrados em `reports/`; não são uma nota de PageSpeed em produção.

O botão `Quero conhecer` também foi restaurado para vermelho nas fontes e na distribuição do site comercial. Atualizar `contact-form.css` e os seis HTMLs comerciais com seus novos hashes de cache; preservar o blog WordPress. As instruções históricas de publicação estática do blog deixam de se aplicar.

Para reconstruir o pacote após editar código, executar `npm run build:assets` e `python3 tools/package-release.py` nesta pasta. Os arquivos `.min.css` e `.min.js` são usados no front-end; `SCRIPT_DEBUG` permite carregar as fontes para depuração.

## Reproduzir os testes locais

Usar Node 24.18+ e npm 11.16+, conforme os requisitos do runtime oficial. Na pasta `wordpress/`, o primeiro terminal instala as dependências de teste e inicia um WordPress descartável:

```sh
npm ci --ignore-scripts
UB26_CONTROL_TOKEN_FILE=/tmp/united-wordpress-control-token npm run test:server
```

O servidor roda em `http://127.0.0.1:8794`, com controle de testes restrito a `127.0.0.1:8795`. Aguardar `UNITED_RUNTIME_READY`. Em outro terminal, na mesma pasta, executar com o **mesmo caminho de token**:

Para manter outra prévia aberta, definir `UB26_HTTP_PORT=8796 UB26_CONTROL_PORT=8797` tanto no servidor quanto em `npm test`, com um token separado; as portas precisam ser diferentes e estar entre 1024 e 65535, sempre em loopback.

```sh
UB26_CONTROL_TOKEN_FILE=/tmp/united-wordpress-control-token npm test
npm run lint:php
npm run lint:php:current
npm run test:image-urls
```

Sem a variável, ambos os scripts usam `os.tmpdir()/united-wordpress-control-token`. O servidor grava o token com permissão `0600`; as credenciais aleatórias do administrador local ficam em `<caminho-do-token>.runtime.json`, também `0600`. Para uma senha de teste escolhida pela equipe, definir `UB26_TEST_PASSWORD` ao iniciar o servidor. Não utilizar credenciais de produção nem copiar esses arquivos temporários para a entrega.

A versão padrão é WordPress 7.1.3 com PHP 8.3; `UB26_WP_VERSION` e `UB26_PHP_VERSION` permitem testar outra combinação. O lint utiliza PHP 7.4 e 8.3 reais, somente para análise de sintaxe. O primeiro uso precisa de acesso à rede para baixar o WordPress. O banco é descartável e a suíte cria posts de teste, sem submeter formulários externos. O resultado fica em `reports/integration.json`; `Ctrl+C` encerra o servidor.

## Referências técnicas

- [Templates WordPress](https://developer.wordpress.org/reference/hooks/template_include/)
- [Conteúdo e filtros nativos](https://developer.wordpress.org/reference/functions/the_content/)
- [Imagens responsivas nativas](https://developer.wordpress.org/reference/functions/wp_get_attachment_image/)
- [WordPress Playground](https://developer.wordpress.org/playground/developers/local-development/wp-playground-cli/)
