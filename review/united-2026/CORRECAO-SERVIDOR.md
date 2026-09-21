# Entrega de produção — 18/09/2026

A entrega atual é para o domínio oficial da United. Não publicar uma nova prévia em `/review/`. O caminho `review/united-2026/` é a organização do pacote no GitHub, não o endereço público final.

## Gerar os arquivos definitivos

Na pasta do pacote, com as dependências de `requirements-review.txt`:

```bash
python3 scripts/export-production.py --mode production --output /tmp/united-production
```

Integrar **somente o conteúdo de `site/`** à raiz HTTP correta, mantendo Home, `/cursos/`, `/quem-somos/` e `/faq/`. Não criar `/site/`, `/dist/` ou `/review/` adicionais no endereço público. O servidor precisa entregar a versão nova também quando há `index.php` anterior: Rafael deve definir a precedência e a integração sem apagar o PHP ou o blog. A cópia estática e os fragmentos `seo/production/*-head.html` são alternativas de integração; não duplicar seus metadados na mesma página.

`robots.txt` e `sitemap.xml` devem responder na raiz do domínio. Usar os arquivos da exportação de produção. O robots permite páginas, artigos e recursos de renderização; limita a administração do WordPress e lista os dois sitemaps. Não usar o robots de uma ferramenta de desenvolvimento. Regras dentro de uma subpasta não governam o domínio.

`publication/` contém instruções e o fragmento Apache para mesclagem; não é conteúdo público. Não enviar `src/`, `scripts/`, documentos internos, manifestos ou comparação visual ao servidor. O exportador não modifica hospedagem nem `.htaccess`.

## Aceite no servidor

- Conferir HTTP 200, título novo, canonical e ausência de noindex/rótulos de prévia nas quatro páginas. Validar imagens, CSS e JavaScript.
- Conferir robots em www e sem www; os dois sitemaps precisam responder XML válido. O blog permanece com canonical sem www e sitemap automático.
- Incorporar redirecionamentos pertinentes, incluindo aliases `index.html`, sem loops ou perdas de parâmetros. Rotas inexistentes retornam 404 real.
- Retirar cópias históricas públicas quando não forem necessárias; enquanto existirem, aplicar o noindex específico do servidor, sem bloquear a leitura da regra por robots.
- Invalidar caches dos arquivos substituídos e preservar RD, GTM, WhatsApp, Área do Aluno e WordPress.
- Conferir as URLs no Search Console e medir desempenho real após a publicação. Arquivos corretos não confirmam indexação ou posição.

O formulário oficial RD continua real e mostra sucesso na própria caixa. Recebimento no Marketing e criação no CRM são etapas diferentes; esta revisão não enviou contatos.

Detalhamento: [INTEGRACAO.md](seo/INTEGRACAO.md), [INSTRUCOES-PUBLICACAO.md](seo/production/INSTRUCOES-PUBLICACAO.md), [ROBOTS-RASTREAMENTO.md](seo/ROBOTS-RASTREAMENTO.md) e [PLANO-SEO-PRODUCAO.md](seo/PLANO-SEO-PRODUCAO.md).
