# United Idiomas — SEO para produção · 18/09/2026

Pacote para Rafael revisar em `review/united-2026/`. Esta atualização parte do código incorporado à `main` em `933c80a`, mantém o Google Tag Manager e a integração RD, e não substitui o PHP da raiz nem publica no servidor.

## O que mudou

- `dist/` agora representa **produção**: indexação permitida, sem rótulos de prévia nas quatro páginas, canonical, títulos/descrições próprios e dados estruturados coerentes.
- Sitemap comercial com Home, Cursos, Quem Somos e FAQ. O `robots.txt` também informa o sitemap automático do blog WordPress, preservando a descoberta dos artigos.
- Contexto de curso de inglês no título principal de Cursos, links úteis na FAQ, âncoras e links de mapa para as seis unidades já exibidas.
- Imagem de fundo reduzida de 1.423.198 para 148.032 bytes, com dimensões/transparência preservadas. Layout, banners e formulários mantidos.
- Exportações separadas para produção e prévia; regras opcionais de servidor, mapa de URLs antigas e pacote WordPress para revisão.
- Censo técnico dos 182 artigos do blog e 48 descrições específicas no plugin opcional (47 duplicadas + artigo IA); orientações pontuais para os 11 artigos com H1 adicionais.

## Abrir uma prévia local

Use a exportação de prévia, que acrescenta `noindex,nofollow` a todos os HTMLs e um robots bloqueado. Escolha uma pasta nova, **fora do repositório**:

```bash
python3 scripts/export-production.py --mode preview --output /tmp/united-preview
python3 -m http.server 8080 --bind 127.0.0.1 --directory /tmp/united-preview/site
```

Abra `http://127.0.0.1:8080/`. Os caminhos relativos também funcionam em subpastas. O exportador exclui ferramentas de comparação e arquivos de desenvolvimento. `--force` só atualiza uma exportação anterior identificada deste pacote; não use como destino uma pasta com trabalho manual.

**O formulário RD pode criar leads reais mesmo na prévia.** Não houve novos envios nesta revisão de SEO.

## Preparar a produção

```bash
python3 scripts/export-production.py --mode production --output /tmp/united-production
```

`site/` contém os arquivos publicáveis. `publication/` contém instruções e o fragmento Apache opcional, que precisa ser mesclado ao servidor por Rafael. O exportador não envia arquivos e não escreve `.htaccess`. Detalhes em [INSTRUCOES-PUBLICACAO.md](seo/production/INSTRUCOES-PUBLICACAO.md) e [INTEGRACAO.md](seo/INTEGRACAO.md).

Não publique o `robots.txt` de uma **exportação de prévia** no domínio oficial. Para uma prévia pública dentro de `/review/`, use também o `X-Robots-Tag` do fragmento Apache; o robots da raiz deve continuar permitindo o rastreamento das páginas comerciais.

## Reproduzir e validar

Requer Python com `lxml` e Pillow (`requirements-review.txt`) e Node para os testes RD. A entrega estática não requer build para ser servida.

```bash
python3 scripts/update-seo-performance.py
python3 scripts/optimize-static-assets.py
python3 scripts/prepare-subdirectory.py
python3 scripts/inventory-images.py
python3 scripts/audit-seo-performance.py
python3 scripts/test-production-export.py
python3 scripts/test-production-redirects.py
node --test scripts/test-rdstation-form.cjs scripts/test-rdstation-whatsapp.cjs
python3 scripts/prepare-subdirectory.py --refresh-manifests
```

`MANIFEST.json` cobre o pacote; `MANIFEST-SERVIDOR.json` cobre `dist` e as instruções de caminhos. O inventário registra bytes, dimensões e SHA-256 das imagens, não o tráfego da primeira visita. `scripts/optimize-heavy-media.py` reproduz a compressão do fundo a partir do PNG original da raiz, sem reencodificar o WebP.

Aplique outros atualizadores de componentes somente quando houver alterações nesses componentes. Esta revisão não reexecuta `update-contact-layout.py`: preserva o HTML do banner e o GTM que Rafael modificou em `main`. Os geradores legados de prévia não são o fluxo atual; podem restaurar conteúdo antigo. Ao reutilizá-los, revise o diff e execute a validação final acima.

## Integrações preservadas

- Formulário oficial RD `form-vamos-conversar-5ba05329ea8c88b5c10d`, um embed por página, SDK oficial, retorno de sucesso na própria caixa e círculo verde; botão de envio vermelho.
- Loader `ee4f0815-8266-4fb5-ba25-416836b02312-loader.js` uma vez por página, `async`; SDK e inicializador com `defer` na ordem correta.
- WhatsApp geral `5511940040658`; Parcerias & Convênios e Seja um Franqueado exclusivamente `5511958575315`.
- Área do Aluno: `https://liveclass.app.br`. GTM `GTM-MTK74PV` preservado na Home.

Os formulários demonstrativos já foram substituídos pelo RD. Recebimento no Marketing e criação de negócio no CRM são verificações distintas; os testes desta revisão não enviam contatos. Histórico e limites em [RD-STATION.md](seo/RD-STATION.md).

## Blog, publicação e acompanhamento

O blog WordPress não está neste repositório. [seo/wordpress/](seo/wordpress/README.md) contém uma extensão opcional revisável, ainda não instalada, para os problemas verificados no HTML público. Não copie esse PHP para a raiz do site estático.

[RECOMENDACOES-CONTEUDO.md](seo/RECOMENDACOES-CONTEUDO.md) separa melhorias executadas e próximos conteúdos que exigem dados reais. Depois da publicação, conferir URLs no Search Console, enviar os dois sitemaps e medir desempenho no servidor. Arquivos tecnicamente corretos não comprovam indexação nem garantem posição no Google. Resultados e limites estão em [AUDITORIA.md](seo/AUDITORIA.md).
