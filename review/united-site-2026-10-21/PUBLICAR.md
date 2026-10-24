# Rafael — publicação da revisão completa

> **Atualização de 24/10/2026 — blog em WordPress:** para a entrega atual, seguir primeiro [wordpress/README.md](../../wordpress/README.md) e [INSTALACAO-RAFAEL.md](../../wordpress/docs/INSTALACAO-RAFAEL.md). Não publicar `dist/blog/` sobre o WordPress. O fluxo estático de blog descrito abaixo é histórico. O sitemap comercial sem artigos estáticos está em `wordpress/releases/sitemap-united-pages.xml`; os artigos usam o sitemap do WordPress/plugin SEO. O endereço canônico do blog deve continuar sendo o configurado no WordPress, sem forçar troca de domínio durante esta instalação.

Esta pasta contém a entrega de 21/10/2026, incluindo o site revisado, o acervo estático de referência e os mecanismos RD. A atualização do blog de 24/10 usa o WordPress conforme indicado acima. O envio ao Git não executa publicação. A raiz PHP existente permanece intacta nesta branch.

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
2. Home em `/`; cursos em `/cursos/live-class/`, `/cursos/business/` e `/cursos/full/`; demais páginas comerciais em `/quem-somos/` e `/faq/`. Preservar `/blog/` no WordPress e instalar o plugin da entrega de 24/10; não copiar `dist/blog/` para a hospedagem.
3. Preservar o catálogo `/cursos/`, os caminhos antigos, páginas de autor, uploads, APIs, painel WordPress e páginas fora deste escopo. Não existe um novo `dist/cursos/index.html`. Testar os links antigos `/cursos/#live-class` e `/cursos/#united-business` antes de descontinuar o catálogo. Fragmentos não são enviados ao servidor: não criar regras de redirecionamento HTTP baseadas em `#`.
4. Caso estejam ativos, atualizar os destinos dos redirects legados `/cursos-de-ingles-unitedidiomas`, `/o-melhor-curso-de-ingles` e `/cursos/curso-de-ingles-online` para `/cursos/live-class/`. Conferir as regras reais antes de aplicar; não há `.htaccess` da hospedagem versionado aqui.
5. Respeitar o endereço canônico configurado no WordPress, que atualmente responde sem `www`. Não forçar mudança de domínio/banco durante a instalação do plugin; qualquer padronização futura deve ser coordenada com os redirects do servidor.
6. Preservar o robots existente e suas regras administrativas. Para a entrega com WordPress, publicar `wordpress/releases/sitemap-united-pages.xml` como `/sitemap-united-pages.xml`, em vez da versão estática desta pasta que inclui o blog. Referenciar também o sitemap real do WordPress/plugin SEO. Nunca usar o robots de `preview/` em produção.
7. Aplicar cache e compressão conforme `publication/DESEMPENHO-E-INTEGRACAO.md`. Recursos usam hashes para renovação de cache; HTML deve revalidar.
8. Preservar um único loader da conta RD e um único container GTM. A entrega já inclui ambos, com deduplicação e execução somente no domínio oficial indexável. Não adicionar novamente o adaptador antigo de formulário nem criar uma segunda conversão manual.

## RD, WhatsApp e blog

O formulário mantém o identificador e o SDK oficiais. O único envio real autorizado em 21/10 retornou “Mensagem enviada!” pelo callback do SDK. A entrada na lista do RD, no CRM e nas automações ainda depende de conferência na conta; consultar `reports/rd-integration.json`.

O WhatsApp comercial usa o popup nativo RD quando disponível. O link direto permanece como alternativa se o widget não carregar. Atendimento de alunos, parcerias e unidades conserva os próprios destinos. O loader da conta/GTM fica desligado nas prévias; o SDK oficial do formulário ainda pode carregar recursos próprios.

O blog desta pasta permanece como referência estática. A manutenção semanal passa a ser feita em **Posts** no WordPress, seguindo `wordpress/docs/ROTINA-EDITORIAL.md`. Instalar o plugin da entrega de 24/10 para usar o layout aprovado; não gerar nem substituir arquivos HTML do blog a cada matéria.

## Conferência após a publicação

```sh
npm run check:publication
```

Conferir Home, cursos, FAQ, blog e artigos no desktop e celular; formulário/CRM; retorno do WhatsApp; redirects, canonical, robots e sitemap. Finalizar com inspeção no Search Console e medição de PageSpeed/Core Web Vitals no servidor publicado. Os testes locais não representam uma nota de desempenho em produção ou garantia de ranking.
