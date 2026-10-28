UNITED IDIOMAS — PACOTE SEO DE SERVIDOR — 28/10/2026

Estado: configuracoes preparadas localmente; NAO publicadas. Este subpacote de
servidor nao altera layout, HTML, tracking, formulario, PHP nem WordPress. O asset
JavaScript opcional abaixo foi preparado separadamente pelo trabalho de desempenho.
As configuracoes ativas da hospedagem nao foram lidas. Este pacote em Git nao
aplica as regras automaticamente na hospedagem.
Por isso estes fragmentos NAO sao um .htaccess completo pronto para substituir.

OBJETIVO E ESCOPO

Corrigir as tres rotas antigas de ingles que hoje passam por /cursos, depois
/cursos/ e terminam em 403. Para GET e HEAD, com ou sem barra final:

  /cursos-de-ingles-unitedidiomas  -> 301 /cursos/live-class/
  /o-melhor-curso-de-ingles        -> 301 /cursos/live-class/
  /cursos/curso-de-ingles-online   -> 301 /cursos/live-class/
  /cursos e /cursos/              -> 301 /#comparar-cursos

Os destinos usam https://www.unitedidiomas.com. Os tres cursos atuais
/cursos/live-class/, /cursos/business/ e /cursos/full/ ficam fora dos redirects.
O comparativo de quatro cursos ja existe na Home com id="comparar-cursos".
POST e outros metodos continuam sob as regras existentes da aplicacao.

Parametros sao preservados, inclusive escapes. Exemplo testado no Apache real:
  /cursos?utm_source=teste&token=x%23y
  -> https://www.unitedidiomas.com/?utm_source=teste&token=x%23y#comparar-cursos
A regra com query precisa vir antes da regra sem query. Copiar apenas a segunda
regra faria Apache colocar a query depois do # e inutilizaria esses parametros.

ARQUIVOS

  apache/01-redirecionamentos-raiz.conf
    Fragmento aditivo de redirects. Exige mod_rewrite ativo.
  apache/02-cache-compressao-raiz.conf
    Fragmento opcional, independente, para arquivos estaticos comerciais.
  publicar/robots.txt
    Candidato para /robots.txt: publico permitido, painel/wp-admin bloqueados
    para rastreamento e admin-ajax permitido. Nao e controle de acesso.
  publicar/sitemap.xml
    Indice raiz com o sitemap comercial.
  publicar/sitemap-united-pages.xml
    Copia byte a byte de wordpress/releases/sitemap-united-pages.xml: seis URLs.
  validacao/test_local.py e validacao/resultado-local.json
    Testes offline de conteudo e integracao com Apache local real.
  validacao/check_remote.py
    Plano e checagem publica pos-deploy usando apenas GET/HEAD, sem leads.
  rdstation-whatsapp.js
    Asset opcional preparado separadamente: ver procedimento proprio abaixo.

INSTALACAO POR QUEM ADMINISTRA A HOSPEDAGEM

1. Baixar e revisar o .htaccess REAL da raiz, /blog/.htaccess, configuracao
   VirtualHost, redirects do painel/CDN e robots.txt servido em ambos os hosts.
   Conferir regras de seguranca, autorizacao, PHP/RD, restricoes e politica de IA.
   Fazer backup datado fora da raiz publica; guardar tambem os tres arquivos
   robots/sitemap atuais, inclusive registrar quando ainda nao existem.

2. Confirmar Apache 2.4.10+ e AllowOverride FileInfo. Verificar mod_rewrite,
   mod_headers e, para compressao, mod_deflate e mod_filter. IfModule evita 500
   por modulo opcional ausente, mas nao torna a funcao ativa: o teste remoto deve
   confirmar os resultados. O pacote nao habilita modulos nem altera permissoes.

3. Mesclar 01 no .htaccess DA RAIZ acima das regras legadas de redirecionamento,
   normalizacao /cursos -> /cursos/ e front controller. Preservar a precedencia
   dos controles de seguranca/autorizacao. Resolver conflito apenas das rotas
   indicadas, inclusive Redirect/RedirectMatch e redirects no CDN/VirtualHost.
   Regras externas ao .htaccess podem vencer independentemente da ordem local.
   NAO substituir o .htaccess inteiro e NAO copiar o fragmento para /blog/.
   Nao mexer na canonicalizacao, RewriteBase ou front controller do WordPress.

4. Se for aplicar desempenho, mesclar 02 depois de comparar os headers atuais.
   Escopo: CSS/JS locais em /home, /assets e arquivos comerciais listados, 1 dia;
   imagens/fontes em /home/assets e /assets, 30 dias. Sem immutable. Os nomes
   estaveis devem ganhar nova query v=hash a cada alteracao; a CDN deve preservar
   essa query na chave do cache. Imagens/fontes trocadas sob a mesma URL exigem
   purga ou URL nova. Politicas preexistentes prevalecem, inclusive private,
   no-store e max-age menor. Nao aplicar cache a HTML, PHP, blog ou scripts RD.
   Nenhum Authorization/Set-Cookie e relaxado. Compressao negocia gzip apenas
   para tipos textuais permitidos; nao acrescenta compressao a blog, painel,
   PHP, RD ou endpoints de leads. Nao mudar as regras de seguranca existentes.

5. Copiar os tres arquivos de publicar/ para a raiz comercial apenas depois da
   revisao. Se robots.txt existir na hospedagem/CDN, MESCLAR o conteudo: manter
   grupos de bots especificos e a politica de IA existente. Este candidato nao
   inventa bloqueio/opt-out de IA nem autoriza remover grupos existentes.
   Nao usar robots de preview que contenha Disallow: / no grupo User-agent: *.
   O robots comercial nao governa o host sem www: preservar e revisar tambem o
   robots da origem do blog, sem alterar o WordPress por este pacote.

6. Rodar os testes locais e o verificador remoto, conferir logs e liberar cada
   parte separadamente se necessario. Um 301 pode ficar guardado em navegador e
   CDN: validar Location sem seguir redirect e depois o destino final com 200.
   Fazer eventual purga somente das URLs afetadas, pela operacao da hospedagem.
   Nao enviar formularios de contato reais como teste.

ASSET OPCIONAL DE WHATSAPP

O trabalho de desempenho preparou rdstation-whatsapp.js (SHA-256/12 informado:
f9479457250f). Para aplica-lo, fazer backup do /rdstation-whatsapp.js atual,
substituir SOMENTE esse arquivo na raiz e purgar /rdstation-whatsapp.js no cache
da hospedagem/CDN incluindo TODAS as variantes de query. Incluir explicitamente
/rdstation-whatsapp.js?v=3cc620082035; purgar apenas a URL sem query pode deixar
a versao antiga armazenada quando a CDN separa as chaves por query string.

A purga na CDN nao limpa o cache dos navegadores. Se o TTL anterior for alto,
fazer backup das seis HTML comerciais ATUAIS na hospedagem e alterar somente
o v=3cc620082035 para v=f9479457250f na referencia a /rdstation-whatsapp.js em
/, /cursos/live-class/, /cursos/business/, /cursos/full/, /quem-somos/ e /faq/.
Preservar todo o restante do conteudo de cada arquivo; conferir que o diff
contem exclusivamente essa troca de versao. A alternativa e aguardar o TTL
anterior expirar antes de considerar a atualizacao disponivel a todos.
Nao copiar dist/, nem enviar HTMLs inteiros de preview ou substituir todo o
site. Nao trocar handlers, payloads ou configuracoes de tracking durante essa
instalacao.
Os testes especificos de fonte/paridade pertencem ao trabalho de desempenho;
as 113 verificacoes deste subpacote cobrem configuracao de servidor e o verificador
remoto. O fragmento de cache nao aplica nova politica a scripts RD Station.

SITEMAPS E SEPARACAO DO BLOG

robots.txt anuncia duas fontes independentes:
  https://www.unitedidiomas.com/sitemap-united-pages.xml
  https://unitedidiomas.com/blog/sitemap_index.xml

/sitemap.xml aponta somente ao sitemap comercial. O indice WP e outro indice;
inclui-lo dentro do indice raiz criaria indices aninhados, rejeitados pelo
Google. Para agregar o blog futuramente seria necessario enumerar seus sitemaps
filhos (urlset), manter essa lista e configurar submissao cross-site entre www
e sem www. Este pacote evita essa dependencia e preserva o indice dinamico WP.

O sitemap comercial antigo de 213 entradas misturava paginas do blog, incluindo
20 URLs /blog/pagina/N e duas 404 na auditoria de origem. A versao proposta tem
somente as seis paginas comerciais; nao publica URLs de paginacao, redirects,
fragments ou lastmod inventado. Artigos ficam a cargo do sitemap WordPress.
Atualizar as submissoes do Search Console nas propriedades corretas depois de
validar as respostas. O script nao faz submissao nem pede indexacao.

VALIDACAO

Na raiz desta worktree:
  python3 releases/seo-config-2026-10-28/validacao/test_local.py --report releases/seo-config-2026-10-28/validacao/resultado-local.json

Requer Python 3 (biblioteca padrao) e Apache 2.4. Cria servidor isolado em
127.0.0.1 e porta efemera com arquivos temporarios; nao carrega configuracao
global do Apache, nao consulta a internet e nao toca o site. --static-only
valida apenas os arquivos e NAO comprova os redirects. O JSON informa os
resultados e a versao do Apache. Este ensaio usa regras legadas representativas,
nao a configuracao de producao ainda desconhecida.

Plano pos-deploy sem fazer requisicoes:
  python3 releases/seo-config-2026-10-28/validacao/check_remote.py

Executar apenas apos instalar o pacote:
  python3 releases/seo-config-2026-10-28/validacao/check_remote.py --run --report releases/seo-config-2026-10-28/validacao/resultado-remoto.json

O script limita HTTPS aos dois hosts United, nao segue redirects, nao executa
JavaScript, nao envia POST, nao entra no painel e nao chama APIs RD. Verifica
301 direto, query antes da ancora, as seis paginas 200/canonical/indexaveis,
ancora na Home, robots, sitemaps e amostras CSS/JS. A amostra de cache nao cobre
todos os assets: conferir manualmente uma fonte e uma imagem (max-age ate
2592000), gzip/Vary e a politica preexistente da CDN. Rever grupos de bots do
robots em seu contexto: teste textual nao equivale ao parser de cada crawler.

ACEITACAO E ROLLBACK

- Nenhuma rota indicada termina em 403/404 ou precisa de /cursos intermediario.
- Parametros originais permanecem na query, antes de #comparar-cursos.
- Cursos atuais e blog continuam sem alteracao de rota/layout/tracking.
- robots.txt e XML respondem 200, tipos corretos e sem HTML de erro.
- Sitemap comercial contem seis canonicas; indice raiz nao aninha indice WP.
- Cache somente no escopo estatico; private/no-store, seguranca e autenticacao
  permanecem. Sem novo cache de HTML, PHP, respostas de erro ou RD.
- Se houver erro: restaurar somente o bloco/arquivo alterado a partir do backup,
  revalidar e purgar os redirects/URLs afetados. Nao restaurar cegamente uma
  configuracao antiga sobre alteracoes posteriores de outros responsaveis.

Corrigir rastreamento e redirecionamentos melhora a consistencia tecnica.
Este pacote nao garante indexacao, posicao, trafego ou resultado comercial.

REFERENCIAS OFICIAIS CONSULTADAS

Apache, flags RewriteRule e preservacao de query/fragmentos:
https://httpd.apache.org/docs/2.4/rewrite/flags.html
Apache, Header setifempty e tabelas de headers:
https://httpd.apache.org/docs/2.4/mod/mod_headers.html
Apache, compressao e Vary:
https://httpd.apache.org/docs/2.4/mod/mod_deflate.html
Google, erro de indices aninhados:
https://support.google.com/webmasters/answer/7451001#zippy=%2Csitemap-parsing-errors
Google, indice e submissao cross-site:
https://developers.google.com/search/docs/crawling-indexing/sitemaps/large-sitemaps
