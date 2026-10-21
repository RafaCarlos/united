# United — revisão completa de 21/10/2026

Esta entrega reúne a fonte editável atual e os arquivos prontos para integração na hospedagem. Foi preparada para envio ao Git por solicitação do responsável pela United; a publicação fica com Rafael. Começar por [PUBLICAR.md](PUBLICAR.md).

## O que há no pacote

| Pasta | Uso |
| --- | --- |
| `src/` | Fonte editável: páginas, CSS, JavaScript, recursos ativos e conteúdo editorial. |
| `preview/` | Prévia local gerada pelo build, com bloqueio de indexação; não versionada no Git. |
| `dist/` | Candidato de produção com URLs oficiais, canonical, dados estruturados e sitemap. |
| `editorial/` | Guia e modelos para artigos semanais. |
| `publication/` | Integração de SEO, robots, sitemap, domínio, cache e compressão. |
| `reports/` | Resultados das verificações técnicas; não são uma nota PageSpeed. |
| `tools/` | Ferramentas de build, testes e servidor de revisão. |

São 213 páginas: Home, Live Class, Business, Full, Quem somos, FAQ, 21 páginas de listagem e 186 artigos. A fonte conserva os 184 artigos importados e os dois textos institucionais aprovados. Imagens de conteúdo usam WebP; logos vetoriais, ícones e imagens de compartilhamento podem manter SVG ou PNG quando adequado ao uso.

## Abrir a prévia pronta

Requer Python 3. Na pasta desta entrega:

```sh
python3 tools/serve.py --directory dist --port 8792
```

Abra `http://127.0.0.1:8792/`. Esse é o candidato com a organização final: Home em `/`, Live Class em `/cursos/live-class/`, Business em `/cursos/business/`, Full em `/cursos/full/`, além de `/quem-somos/`, `/faq/` e `/blog/`.

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

`npm run build` gera o blog, atualiza o cabeçalho/rodapé do blog, minifica os arquivos ativos, prepara `dist/`, valida referências e executa SEO na prévia e no candidato. Nenhum comando publica, faz commit ou push.

Edite sempre `src/`; `preview/` e `dist/` são resultados gerados. `src/navigation.json` registra as páginas locais. `release.config.json` define o domínio e as rotas de produção. Os arquivos de recursos são encontrados a partir das páginas registradas e suas referências; imagens soltas e arquivos de trabalho não entram no build.

## Blog e rotina da agência

O candidato completo já inclui o blog com os 186 artigos; ele pode ser publicado junto com as demais páginas aprovadas. O blog é estático e esta entrega não inclui painel CMS nem sincronização automática com WordPress. A equipe editorial pode preencher `editorial/modelos/pauta-semanal.txt`; a agência cadastra texto, imagem, autoria, data e fontes no template aprovado. Consulte `editorial/GUIA-EDITORIAL.md`.

```sh
npm run blog:novo -- novo-artigo "Título do novo artigo"
npm run review
npm run preview
```

O comando cria um rascunho sem sobrescrever artigos. O estado `draft` não aparece na prévia; `local-draft` aparece apenas para revisão e bloqueia a preparação de produção, a menos que tenha aprovação explícita em `release.config.json`. Os dois textos já aprovados nesta entrega estão listados nessa configuração. Para novos textos, a equipe deve aprovar o conteúdo antes de marcá-lo como `published` ou acrescentá-lo conscientemente à lista de aprovação. Esses estados não enviam arquivos ao servidor.

Uma data futura não agenda publicação. O painel WordPress atual pode continuar como fluxo editorial se a agência integrar estes templates ao CMS; essa integração é uma etapa própria, não incluída neste ZIP.

Para a rotina semanal, manter uma única fonte vigente no repositório da agência e integrar os novos textos nessa versão. Enviar apenas os arquivos públicos alterados após o build e a revisão do diff. Não reinstalar um ZIP antigo para cadastrar uma matéria: ele pode reverter correções de visual, SEO e formulário feitas nesta revisão. Um pacote editorial separado é uma ferramenta de entrega de conteúdo/modelos; antes de integrar código, conferir a data e as diferenças em relação ao repositório vigente.

## Preparar o envio ao Git e a publicação

1. Integrar em uma branch de revisão do repositório correto, mantendo a estrutura e o processo de build da agência. Revisar o diff e excluir arquivos temporários.
2. Preservar WordPress, `/wp-admin/`, `/wp-content/`, uploads, APIs e páginas que não fazem parte da entrega. Não substituir a instalação nem copiar o pacote inteiro para a raiz pública.
3. Integrar apenas os arquivos públicos de `dist/` aos caminhos aprovados. `dist/.united-release.json` é um marcador de build local: não precisa ser enviado ao servidor público.
4. Conferir os redirecionamentos existentes e resolver a inconsistência `www` do blog antes de publicar. A configuração desta entrega usa `https://www.unitedidiomas.com`; o servidor não deve redirecionar essas URLs para outro domínio canônico.
5. Integrar `publication/robots-snippet.txt` ao robots existente, preservando suas regras, e publicar `sitemap-united-pages.xml`. Não copiar o robots da prévia para produção.
6. Aplicar cache e compressão conforme `publication/DESEMPENHO-E-INTEGRACAO.md`, preservar o recebimento dos formulários e confirmar medição/consentimento.
7. Após a publicação autorizada, executar `npm run check:publication` e concluir as verificações de CRM, navegação, redirecionamentos e Search Console.

## O que ainda depende do ambiente publicado

O formulário mantém o mesmo `FORM_ID` (`form-vamos-conversar-5ba05329ea8c88b5c10d`) e SDK oficial (`https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js`) encontrados no site atual. A entrega também inclui o loader RD da conta `ee4f0815-8266-4fb5-ba25-416836b02312` e o contêiner `GTM-MTK74PV`, conferidos no DOM oficial em 21/10/2026. Não é necessário escolher um novo loader: esses identificadores já foram preservados.

`rdstation-account.js` carrega os scripts somente nos hosts oficiais `unitedidiomas.com` e `www.unitedidiomas.com`, em páginas sem `noindex`. Esse loader de conta/GTM não é injetado na prévia local nem em staging de terceiros. O SDK nativo de formulários do RD, carregado para permitir a revisão do formulário, pode buscar seus próprios recursos, inclusive gtag, também na prévia; isso não é uma promessa de ausência total de rastreamento por terceiros. Há proteção contra execução duplicada e contra reinserção dos loaders/contêiner já presentes, preservando o `dataLayer`.

`rdstation-whatsapp.js` conecta os atalhos comerciais aprovados ao popup nativo do RD, sem mover ou redimensionar o CTA. O popup usa seus próprios campos, destinos e eventos; atendimento a alunos, unidades, parcerias e fallback do formulário continuam com seus fluxos específicos. Se o widget estiver ausente ou bloqueado, o link original do WhatsApp permanece utilizável.

Os testes automatizados usam fixtures locais e não criam leads. Em 21/10/2026, um único envio real autorizado na nova Home retornou o callback de sucesso do RD e a tela “Mensagem enviada!”, com `data-rd-complete=true`. A máscara nativa de telefone foi validada antes do envio. Não foi feito outro envio pelo WhatsApp. O resultado está em `reports/rd-integration.json` e `reports/rd-native/integration-parity.json`. A entrada na lista/CRM e as automações não foram inspecionadas e continuam pendentes de confirmação humana. A agência deve conferir também automações, origem/campanha e consentimento no ambiente publicado.

Cache, Brotli/gzip, regras de CDN, robots efetivo, redirecionamentos `www`, domínio da área do aluno e funcionamento de serviços externos dependem da hospedagem e dos respectivos serviços. Não há nota PageSpeed fabricada nem garantia de ranking: a medição de Core Web Vitals e PageSpeed deve ser feita após a integração no ambiente real.
