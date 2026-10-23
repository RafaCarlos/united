# Rafael — publicação da revisão completa

Esta é a entrega vigente de 21/10/2026. Inclui o site revisado, os 186 artigos e os mecanismos RD do site atual. O envio ao Git não executa publicação. A raiz PHP existente permanece intacta nesta branch.

## Arquivos e validação

- `dist/`: arquivos públicos prontos, minificados, com imagens WebP, URLs oficiais e sitemap.
- `src/`: fonte editável, conteúdo e templates do blog. `src/blog/evidence/` contém os HTML importados necessários ao gerador.
- `publication/`: instruções de SEO, robots, cache, compressão e integrações.
- `editorial/`: guia para a equipe cadastrar novos artigos.
- `reports/`: validações e registro do teste real do formulário; não publicar esta pasta.

Nesta pasta, com Node.js 20+ e Python 3:

```sh
npm ci
npm run build
npm run test:site
npm run test:rd
npm run test:blog
npm run audit:blog
npm run manifest
python3 tools/serve.py --directory dist --port 8792
```

Abrir `http://127.0.0.1:8792/`. O servidor de revisão aplica `noindex` por cabeçalho e não deve ser usado na hospedagem pública. `preview/` é gerada pelo build e não é versionada.

## Integração na hospedagem

1. Preparar backup e conferir as regras atuais de PHP, DirectoryIndex, WordPress e CDN. Integrar os arquivos públicos de `dist/` aos caminhos abaixo; não copiar o repositório inteiro para a raiz do servidor.
2. Home em `/`; cursos em `/cursos/live-class/`, `/cursos/business/` e `/cursos/full/`; demais páginas em `/quem-somos/`, `/faq/` e `/blog/`. Os slugs dos artigos importados foram mantidos.
3. Preservar o catálogo `/cursos/`, os caminhos antigos, páginas de autor, uploads, APIs, painel WordPress e páginas fora deste escopo. Não existe um novo `dist/cursos/index.html`. Testar os links antigos `/cursos/#live-class` e `/cursos/#united-business` antes de descontinuar o catálogo. Fragmentos não são enviados ao servidor: não criar regras de redirecionamento HTTP baseadas em `#`.
4. Caso estejam ativos, atualizar os destinos dos redirects legados `/cursos-de-ingles-unitedidiomas`, `/o-melhor-curso-de-ingles` e `/cursos/curso-de-ingles-online` para `/cursos/live-class/`. Conferir as regras reais antes de aplicar; não há `.htaccess` da hospedagem versionado aqui.
5. Alinhar o blog ao domínio canônico `https://www.unitedidiomas.com`. A revisão encontrou redirecionamento do blog para o domínio sem `www`; resolver essa diferença com WordPress/proxy antes de publicar. Detalhes em `publication/SEO-PUBLICACAO.md`.
6. Mesclar `publication/robots-snippet.txt` ao robots existente, preservando regras administrativas e sitemaps anteriores. Publicar `dist/sitemap-united-pages.xml`. Nunca usar o robots de `preview/` em produção.
7. Aplicar cache e compressão conforme `publication/DESEMPENHO-E-INTEGRACAO.md`. Recursos usam hashes para renovação de cache; HTML deve revalidar.
8. Preservar um único loader da conta RD e um único container GTM. A entrega já inclui ambos, com deduplicação e execução somente no domínio oficial indexável. Não adicionar novamente o adaptador antigo de formulário nem criar uma segunda conversão manual.

## RD, WhatsApp e blog

O formulário mantém o identificador e o SDK oficiais. O único envio real autorizado em 21/10 retornou “Mensagem enviada!” pelo callback do SDK. A entrada na lista do RD, no CRM e nas automações ainda depende de conferência na conta; consultar `reports/rd-integration.json`.

O WhatsApp comercial usa o popup nativo RD quando disponível. O link direto permanece como alternativa se o widget não carregar. Atendimento de alunos, parcerias e unidades conserva os próprios destinos. O loader da conta/GTM fica desligado nas prévias; o SDK oficial do formulário ainda pode carregar recursos próprios.

O blog já está incluído para a primeira publicação. Para os próximos artigos, manter esta mesma fonte vigente e seguir `editorial/GUIA-EDITORIAL.md`; gerar e publicar apenas as diferenças revisadas. Não reinstalar um ZIP antigo sobre o site atualizado. O pacote não inclui um painel CMS nem sincronização automática com WordPress.

## Conferência após a publicação

```sh
npm run check:publication
```

Conferir Home, cursos, FAQ, blog e artigos no desktop e celular; formulário/CRM; retorno do WhatsApp; redirects, canonical, robots e sitemap. Finalizar com inspeção no Search Console e medição de PageSpeed/Core Web Vitals no servidor publicado. Os testes locais não representam uma nota de desempenho em produção ou garantia de ranking.
