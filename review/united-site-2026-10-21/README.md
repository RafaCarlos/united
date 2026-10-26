# United — revisão completa de 21/10/2026

> **Atualização vigente — 26/10/2026:** Rafael deve usar as [instruções de publicação](../../releases/site-2026-10-26/README.md) e o [ZIP seletivo](../../releases/site-2026-10-26/United-Site-Ajustes-2026-10-26.zip). Publicar somente os 16 arquivos de `publicar/` (seis HTML, um CSS e nove WebP). Não copiar o `dist/` completo nem `dist/blog/`: o blog ativo continua no WordPress. O pacote está preparado e conferido, ainda não aplicado à hospedagem.

Esta pasta reúne a fonte editável e o processo de manutenção do site. O build completo também conserva o blog estático como referência histórica. A publicação do ajuste atual fica com Rafael, conforme o pacote seletivo acima; [PUBLICAR.md](PUBLICAR.md) distingue esse ajuste das orientações anteriores.

## O que há no pacote

| Pasta | Uso |
| --- | --- |
| `src/` | Fonte editável: páginas, CSS, JavaScript, recursos ativos e conteúdo editorial. |
| `preview/` | Prévia local gerada pelo build, com bloqueio de indexação; não versionada no Git. |
| `dist/` | Resultado completo do build, incluindo o blog estático histórico; não copiar integralmente para a hospedagem. |
| `editorial/` | Guia e modelos do fluxo editorial estático anterior. |
| `publication/` | Integração de SEO, robots, sitemap, domínio, cache e compressão. |
| `reports/` | Resultados das verificações técnicas; não são uma nota PageSpeed. |
| `tools/` | Ferramentas de build, testes e servidor de revisão. |

O build completo contém 213 páginas: as seis comerciais, 21 listagens e 186 artigos estáticos de referência. A fonte conserva os 184 artigos importados e os dois textos institucionais aprovados; isso não define o inventário atual do WordPress. Imagens de conteúdo usam WebP; logos vetoriais, ícones e imagens de compartilhamento podem manter SVG ou PNG quando adequado ao uso.

## Abrir a prévia pronta

Requer Python 3. Na pasta desta entrega:

```sh
python3 tools/serve.py --directory dist --port 8792
```

Abra `http://127.0.0.1:8792/`. As rotas comerciais são Home em `/`, Live Class em `/cursos/live-class/`, Business em `/cursos/business/`, Full em `/cursos/full/`, além de `/quem-somos/` e `/faq/`. A rota local `/blog/` mostra a referência estática, não o WordPress publicado.

Para conferir as rotas locais originais, execute `python3 tools/serve.py --directory preview --port 8791` e abra `http://127.0.0.1:8791/home/`. Não abra os HTML por `file://`.

Os servidores locais enviam `X-Robots-Tag: noindex`, inclusive para o candidato `dist/`. Eles servem apenas à revisão e não devem ser usados como servidor público. Para um teste em celular na mesma rede, acrescente `--bind 0.0.0.0` e abra o IP local do computador com a mesma porta. Interrompa o servidor ao terminar.

## Editar e reconstruir

Requisitos: Node.js 20 ou superior, npm e Python 3. As dependências estão fixadas no lockfile; `node_modules` não é distribuído.

```sh
npm ci
npm run build
npm run test:blog
npm run test:site
npm run test:rd
npm run audit:blog
```

`npm run build` gera a referência estática do blog, atualiza seu cabeçalho/rodapé, minifica os arquivos ativos, prepara `dist/`, valida referências e executa SEO na prévia e no candidato. Nenhum comando publica, faz commit ou push. O resultado completo não é o pacote de instalação do ajuste de 26/10.

Edite sempre `src/`; `preview/` e `dist/` são resultados gerados. `src/navigation.json` registra as páginas locais. `release.config.json` define o domínio e as rotas de produção. Os arquivos de recursos são encontrados a partir das páginas registradas e suas referências; imagens soltas e arquivos de trabalho não entram no build.

## Blog WordPress e referência estática

O blog ativo é mantido em **Posts** no WordPress, conforme [ROTINA-EDITORIAL.md](../../wordpress/docs/ROTINA-EDITORIAL.md). A integração do plugin está em [wordpress/README.md](../../wordpress/README.md) e permanece separada do ajuste comercial de 26/10.

`src/blog/`, `editorial/`, o comando `blog:novo` e os estados editoriais do gerador pertencem à referência estática anterior. Não sincronizam o WordPress nem devem ser usados para substituir seus posts, banco ou uploads. Não publicar `dist/blog/` nem reinstalar uma entrega completa antiga ao cadastrar matérias.

## Preparar o envio ao Git e a publicação

1. Integrar em uma branch de revisão do repositório correto, revisar o diff e preservar alterações existentes fora do escopo. O envio ao Git não executa publicação.
2. Para a atualização de 26/10, seguir o [guia do pacote seletivo](../../releases/site-2026-10-26/README.md). Fazer backup e publicar apenas seus 16 arquivos: imagens/CSS primeiro, depois os seis HTMLs, respeitando os caminhos e invalidando o cache.
3. Preservar WordPress, `/blog/`, `/wp-admin/`, `/wp-content/`, uploads, PHP, banco, APIs e páginas fora do escopo. Este ajuste não modifica redirects, domínio canônico do blog, `.htaccess`, robots ou sitemap. Não enviar `rollback/`, `conferencia/`, `manutencao/` ou marcadores de build ao servidor público.
4. Conferir as seis páginas comerciais em desktop e celular após Rafael aplicar a atualização. As instruções de reversão e os hashes estão no pacote. As orientações anteriores de integração completa permanecem em [PUBLICAR.md](PUBLICAR.md) e não ampliam o escopo desta atualização.

## O que ainda depende do ambiente publicado

O formulário mantém o mesmo `FORM_ID` (`form-vamos-conversar-5ba05329ea8c88b5c10d`) e SDK oficial (`https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js`) encontrados no site atual. A entrega também inclui o loader RD da conta `ee4f0815-8266-4fb5-ba25-416836b02312` e o contêiner `GTM-MTK74PV`, conferidos no DOM oficial em 21/10/2026. Não é necessário escolher um novo loader: esses identificadores já foram preservados.

`rdstation-account.js` carrega os scripts somente nos hosts oficiais `unitedidiomas.com` e `www.unitedidiomas.com`, em páginas sem `noindex`. Esse loader de conta/GTM não é injetado na prévia local nem em staging de terceiros. O SDK nativo de formulários do RD, carregado para permitir a revisão do formulário, pode buscar seus próprios recursos, inclusive gtag, também na prévia; isso não é uma promessa de ausência total de rastreamento por terceiros. Há proteção contra execução duplicada e contra reinserção dos loaders/contêiner já presentes, preservando o `dataLayer`.

`rdstation-whatsapp.js` conecta os atalhos comerciais aprovados ao popup nativo do RD, sem mover ou redimensionar o CTA. O popup usa seus próprios campos, destinos e eventos; atendimento a alunos, unidades, parcerias e fallback do formulário continuam com seus fluxos específicos. Se o widget estiver ausente ou bloqueado, o link original do WhatsApp permanece utilizável.

Os testes automatizados usam fixtures locais e não criam leads. Em 21/10/2026, um único envio real autorizado na nova Home retornou o callback de sucesso do RD e a tela “Mensagem enviada!”, com `data-rd-complete=true`. A máscara nativa de telefone foi validada antes do envio. Não foi feito outro envio pelo WhatsApp. O resultado está em `reports/rd-integration.json` e `reports/rd-native/integration-parity.json`. A entrada na lista/CRM e as automações não foram inspecionadas e continuam pendentes de confirmação humana. A agência deve conferir também automações, origem/campanha e consentimento no ambiente publicado.

Cache, Brotli/gzip, regras de CDN, robots efetivo, redirecionamentos `www`, domínio da área do aluno e funcionamento de serviços externos dependem da hospedagem e dos respectivos serviços. Não há nota PageSpeed fabricada nem garantia de ranking: a medição de Core Web Vitals e PageSpeed deve ser feita após a integração no ambiente real.
