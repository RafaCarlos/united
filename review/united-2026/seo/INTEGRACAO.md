# Integração de SEO no domínio oficial — 18/09/2026

Esta entrega atualiza o pacote revisável no GitHub. Não publica na hospedagem, não modifica o PHP de produção da raiz e não instala nada no WordPress.

## Produção e prévia são saídas diferentes

`dist/` contém os quatro HTML comerciais preparados para produção. Desde esta revisão, o gerador aplica `index,follow,max-image-preview:large`, remove os rótulos de prévia e mantém o robots e o sitemap comerciais. Para revisão, **exportar com `--mode preview`**, que acrescenta `noindex,nofollow` e bloqueio no robots somente na cópia exportada. Não reutilizar instruções antigas que tratavam `dist` como prévia bloqueada.

Exportar com `scripts/export-production.py --mode production --output /tmp/united-production`. A saída `site/` é o conteúdo estático; `publication/` contém instruções separadas. Nenhum modo altera o servidor. Para integrar ao PHP em vez de publicar os HTMLs, usar `production/*-head.html` e aplicar o conteúdo da página correspondente sem duplicar títulos, canonical ou JSON-LD.

Antes da publicação, Rafael deve conferir o documento-raiz e preservar `/blog/`, uploads e regras PHP existentes. Fazer backup da configuração atual e mesclar o fragmento `production/apache-seo.conf`; não substituir cegamente `.htaccess`. O fragmento documenta módulos, precedência e a condição de HTTPS atrás de proxy. Regras de cache/compressão dependem da hospedagem.

## Rastreamento, sitemap e URLs antigas

Publicar `site/robots.txt` e `site/sitemap.xml` na raiz oficial. As quatro URLs canônicas são:

- `https://www.unitedidiomas.com/`
- `https://www.unitedidiomas.com/cursos/`
- `https://www.unitedidiomas.com/quem-somos/`
- `https://www.unitedidiomas.com/faq/`

O robots lista também `https://unitedidiomas.com/blog/sitemap_index.xml`, verificado com HTTP 200 em 18/09. O WordPress mantém automaticamente os seus artigos e outros sitemaps; não copiar a lista congelada de artigos para o sitemap estático. O host sem www do blog é preservado porque é o canonical atual observado. Uma migração futura do blog para www precisa de um plano próprio, não de redirecionamento global improvisado.

O antigo sitemap tinha URLs redirecionadas e 404. O novo sitemap comercial só lista as páginas atuais, sem datas de atualização fictícias. `production/redirects.json` identifica equivalentes reais para redirecionamento e casos ainda sem conteúdo equivalente. Não enviar todas as URLs antigas à Home. Páginas removidas sem substituição podem continuar retornando 404; confirmar o inventário de unidades e produtos antes de decidir 410 ou criar páginas novas.

As prévias públicas em `/review/` e a comparação interna devem responder `X-Robots-Tag: noindex, nofollow` conforme o fragmento. Não bloquear esses caminhos no robots da raiz antes de o Google conseguir ler o noindex de URLs já conhecidas. Para material restrito, autenticação é a proteção de acesso; robots/noindex não são controle de acesso. Ferramentas internas são excluídas da exportação.

## Conteúdo e dados estruturados

Títulos e descrições específicos, um H1 por página e canonicals absolutos são gerados de `metadata.json`. O texto principal de Cursos informa a modalidade; FAQ aponta para as seções de cursos. BreadcrumbList descreve a hierarquia das páginas internas.

As seis unidades ganharam âncoras estáveis, links de mapa e dados Place com o mesmo nome, endereço e telefone exibidos. Não foram inventados CEP, coordenadas, horários, avaliações ou municípios. Completar essas informações com os responsáveis antes de criar páginas locais e dados de negócio mais detalhados. Não há promessa de rich result de FAQ/curso ou de posicionamento.

## RD Station e medição

Preservar um único embed `form-vamos-conversar-5ba05329ea8c88b5c10d`, o SDK oficial e `rdstation-form.js`, nessa ordem com `defer`. Preservar o loader `ee4f0815-8266-4fb5-ba25-416836b02312-loader.js` uma vez por página, `async`, e `rdstation-whatsapp.js`. O PHP legado já inclui esse loader; não duplicá-lo quando integrar.

A confirmação de envio continua dentro da caixa, depois do sucesso indicado pelo SDK. Não reativar forms demonstrativos, endpoints PHP paralelos ou página de obrigado. O WhatsApp geral continua `5511940040658`; os dois links exclusivos do rodapé continuam `5511958575315`. O GTM adicionado por Rafael na Home foi preservado. Esta revisão não decide quais eventos ou tags devem ser ativados na conta GTM/RD.

Validar uma conversão autorizada após a publicação, conferir Marketing e depois o gatilho Marketing → CRM. Nenhum lead foi enviado nos testes de SEO. Instalar a extensão opcional do blog somente pelo fluxo WordPress descrito em `wordpress/README.md`; ela não modifica o RD nem publica conteúdo novo.

## Aceite após publicação

1. Conferir as quatro páginas com HTTP 200 e conteúdo completo, canonical correto e ausência de `noindex` tanto no HTML quanto no cabeçalho HTTP. Conferir que `/review/` continua não indexável.
2. Conferir robots, sitemap comercial e índice WordPress; testar as URLs antigas do mapa sem cadeias ou loops. Verificar que páginas inexistentes retornam 404 real, sem Home disfarçada de erro.
3. No Search Console, usar **Inspeção de URL → Testar URL publicada**. A análise inclui recursos e HTML renderizado; só ela, na propriedade correta, confirma o acesso atual do Google. Solicitar indexação das quatro páginas e enviar os dois sitemaps.
4. Verificar a URL canônica escolhida pelo Google e a evolução do relatório de indexação nos dias seguintes. A solicitação não garante indexação imediata.
5. Medir PageSpeed/Lighthouse em mobile e desktop após ativar cache/compressão; acompanhar dados reais de Core Web Vitals. Medir LCP, INP, CLS, TTFB, cliques/impressões e leads por página. Não confundir redução de arquivo com nota ou ganho orgânico já obtido.

Recomendações de conteúdo e responsáveis em `RECOMENDACOES-CONTEUDO.md`. Para reproduzir a auditoria de arquivos, seguir a sequência do README.

Referências: [sitemaps do Google](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap), [migração de URLs](https://developers.google.com/search/docs/crawling-indexing/site-move-with-url-changes), [bloqueio de indexação](https://developers.google.com/search/docs/crawling-indexing/block-indexing), [documentação Apache](https://httpd.apache.org/docs/2.4/mod/mod_headers.html).
