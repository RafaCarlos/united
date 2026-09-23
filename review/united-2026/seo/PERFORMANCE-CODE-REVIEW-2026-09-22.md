# Dependências de CSS e JavaScript — 22/09/2026

Revisão estática da cópia local anterior às otimizações desta rodada. Não representa medição de Lighthouse, cobertura do navegador ou confirmação de recebimento de leads. Nenhuma tag ou integração foi removida nesta revisão.

## JavaScript efetivamente utilizado

O arquivo `dist/assets/js/dist/scripts.js` tem 203.258 bytes (53.619 bytes em uma simulação gzip nível 9). O tamanho transferido depende da compressão aplicada pela hospedagem. Sua composição foi conferida por correspondência dos trechos com os arquivos originais:

| Componente | Bytes sem compressão | Dependência atual |
| --- | ---: | --- |
| jQuery 3.1.1 | 86.709 | `structure` mantém navegação por âncoras, FAQ e acordeão do rodapé; os ajustes de dados do RD também consultam jQuery. |
| jquery.mask | 6.113 | Não há chamada do código atual nem `data-mask` no HTML estático das quatro páginas. Os formulários antigos foram substituídos por inicializadores vazios. Confirmar o componente dinâmico do RD antes da remoção definitiva. |
| Slick | 88.955 | Apenas o carrossel `.carousel-methodology`, em Quem Somos. |
| WOW | 8.415 | 11 elementos na Home, 31 em Cursos e 12 em Quem Somos; nenhum no FAQ. |
| detect-mobile | 2.211 | `structure` consulta `jQuery.browser.mobile` para âncoras; o ramo do antigo `.masonry` não encontra mais elementos. |

O trecho antigo de carregamento de vídeos já é apenas um comentário: a execução pertence a `src/media-runtime.js`.

As quatro páginas não possuem `.carousel-steps`, `.carousel-mb`, `.carousel-vitrine` ou `.masonry`. Os benefícios da Home usam `src/benefits.js`; os depoimentos das quatro páginas usam `src/site-refinement.js`. Ambos implementam navegação nativa por rolagem, sem Slick.

### Reduções com escopo controlável

1. Separar Slick para carregar somente em Quem Somos. É necessário também condicionar ou retirar as inicializações sem alvo de `structure.init`; retirar apenas o arquivo quebraria essas chamadas. Preservar gesto, botões, quantidade de cartões e adaptação móvel do carrossel de metodologia.
2. `src/responsive-home.js` atua somente nos carrosséis antigos, ausentes nas quatro páginas. É candidato à retirada das referências atuais; a decisão não equivale à remoção de `src/responsive-home.css`, que possui regras globais de imagem ainda úteis.
3. Condicionar WOW à existência de `.wow`. No FAQ não há animação que dependa dele. Nas outras páginas preservar as animações aprovadas.
4. Usar minificação de JavaScript baseada em parser, preservando os avisos de licença. Slick e `structure` contêm bastante formatação. Não realizar substituições por expressão regular no JavaScript inteiro.
5. Retirar `jquery.mask` somente depois de verificar que o campo de telefone dinâmico continua com máscara e validação do próprio RD. O código próprio não chama esse plugin; o estado carregado pelo fornecedor não é completamente descrito pelo HTML estático.

Não remover jQuery nesta rodada sem substituir e testar os comportamentos ainda ligados a ele. Não remover GA4/GTM/RD para melhorar artificialmente uma nota.

Referências: `scripts/build-preview.cjs:82` contém a lista original dos plugins; `dist/assets/js/dist/scripts.js:3056` inicia a implementação vigente de `structure`; `src/rdstation-form.js:43`, `:70` e `:84` mantêm o ajuste do comportamento do RD; `src/shared-header.js:20` intercepta os comandos antigos do menu.

## CSS

| Arquivo inicial | Bytes sem compressão | gzip nível 9, simulado |
| --- | ---: | ---: |
| Base `style.css` | 162.270 | 18.800 |
| Home | 236.822 | 33.509 |
| Cursos | 214.300 | 28.936 |
| Quem Somos | 207.926 | 27.723 |
| FAQ | 207.926 | 27.723 |

`scripts/optimize-static-assets.py:75–94` concatena as fontes em ordem; ainda não aplica minificação. `seo/css-inputs.json` registra 17 fontes na Home, 13 em Cursos e 11 em cada uma das outras páginas. A base já é compacta, mas contém uma coleção extensa de animações.

O bloco de animações entre o aviso de Animate.css e a primeira regra geral de `body` soma **77.953 bytes**, incluindo animações próprias acrescentadas ao tema. Corresponde a quase metade da base. A revisão das classes atuais encontra estas animações utilizadas:

| Página | Animações presentes |
| --- | --- |
| Home | `fadeIn`, `fadeInTopLeft`, `rotateInDownLeft`, `slideInRight`, `zoomIn`, `zoomPlat` |
| Cursos | `bounceInDown`, `fadeIn`, `fadeInLeft`, `fadeInRight`, `fadeInUp`, `imgFull`, `slideInLeft`, `slideInRight`, `zoomPlat` |
| Quem Somos | `ball`, `fadeIn`, `fadeInRightBig`, `heightCorda`, `slideInRight`, `zoomIn` |
| FAQ | Nenhuma |

Uma redução segura é manter uma lista explícita dessas animações, com todas as suas regras auxiliares, propriedades personalizadas, versões prefixadas de keyframes e regra dinâmica `.animated` adicionada pelo WOW. Isso exige análise estrutural do CSS e revisão visual; uma busca de classes no DOM inicial, sozinha, não autoriza purgar CSS genérico.

Preservar integralmente as regras de estados dinâmicos do menu, diálogo, RD, Select2, erros, confirmação, foco e movimento reduzido. Há classes que só surgem após interação ou após o carregamento de scripts externos.

## Critérios de validação

- Comparar bytes originais, bytes minificados e transferência HTTP efetiva; não confundir tamanho bruto com economia em rede.
- Conferir Home e Cursos em desktop/celular, incluindo banners, benefícios e depoimentos.
- Conferir todos os cartões do carrossel de metodologia de Quem Somos.
- Testar abertura/fechamento e foco do menu, diálogo de contato e acordeão do rodapé.
- Testar busca, abertura e links diretos do FAQ.
- Conferir carregamento, telefone e validação do RD sem enviar contatos nesta etapa.
- Medir antes/depois sob as mesmas condições. Redução de bytes isoladamente não garante uma nota ou um LCP específico.

## Implementação local desta rodada

Foi acrescentado `scripts/optimize-page-code.py`, sem modificar o bundle de origem. O comando gera `dist/assets/js/dist/scripts-core.js` para Home, Cursos e FAQ. jQuery, a máscara de telefone, WOW, detecção móvel, navegação, FAQ e acordeão permanecem. Os cinco inicializadores antigos de carrossel agora verificam tanto a presença de elementos quanto a disponibilidade do plugin. Quem Somos continua usando o bundle completo original com Slick. As referências a `responsive-home.js` devem ser omitidas nas rotas que usam o core.

O core passou de **203.258 para 110.393 bytes**; a simulação gzip passou de **53.619 para 39.184 bytes**. O relatório verificável está em `seo/page-code-optimization.json`. A retirada de `jquery.mask` não foi aplicada.

A função importável `optimize_animations(css_text, used_classes)` retorna `(texto, relatório)`. Ela delimita a coleção pelo aviso de Animate.css e a regra seguinte de `body`, lê a estrutura com tinycss2, preserva seletores desconhecidos/complexos e mantém keyframes referenciados inclusive fora dessa coleção. Não remove regras gerais ou de fornecedores. Aplicada à base de 162.270 bytes, resulta em 92.762 bytes na Home, 94.849 em Cursos, 92.246 em Quem Somos e 90.532 no FAQ, antes da minificação posterior da página. Esses números descrevem a base CSS, não a soma dos arquivos da página.

Validação: **55 verificações comportamentais** executam jQuery e os bundles reais no jsdom para as quatro páginas. Incluem menu, acordeão, busca/abertura do FAQ, ausência de exceção quando falta Slick, seletor sem alvo e a inicialização do carrossel real de Quem Somos. **Cinco testes Python**, incluindo subcasos para as quatro páginas, verificam preservação de animações usadas, regras de movimento reduzido, seletores de widgets, referências externas a keyframes e recusa a transformar uma versão desconhecida do fornecedor. Isso complementa, sem substituir, a conferência visual no navegador.

### Dependências e manutenção

Dependências de build fixadas: `tinycss2==1.4.0`, `webencodings==0.6.1` e `esbuild@0.25.12`. O teste de DOM usa `jsdom@26.1.0`; os testes Python usam `lxml`, já presente no ambiente do projeto. Não são carregadas pelo site e não foram instaladas globalmente. Os comandos abaixo usam um diretório temporário fora do pacote:

```sh
python3 -m pip install --target /private/tmp/united-code-tools/python tinycss2==1.4.0 webencodings==0.6.1
npm install --prefix /private/tmp/united-code-tools --no-audit --no-fund esbuild@0.25.12 jsdom@26.1.0
python3 scripts/optimize-page-code.py --esbuild /private/tmp/united-code-tools/node_modules/.bin/esbuild
PYTHONPATH=/private/tmp/united-code-tools/python python3 scripts/test-page-code.py
node scripts/test-page-code.cjs
```

Neste ambiente foi usado o Python que já contém lxml em `/Users/eduardo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3` e o Node em `/Users/eduardo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`. Em outra máquina, selecionar ambientes equivalentes; não inserir esses caminhos pessoais no HTML. `UNITED_CODE_TOOLS` permite indicar outro diretório de dependências no teste JS; `--esbuild` ou `UNITED_ESBUILD` indicam o minificador no build.

Se o bloco original de Slick ou suas chamadas mudarem, o gerador falha explicitamente. Revisar as novas dependências antes de atualizar o hash esperado, sem contornar a validação.

## Regressões de interface verificadas durante a comparação

A conferência no navegador encontrou problemas do WhatsApp também na versão de referência, sem o core otimizado: no celular, o painel RD fechado interceptava cliques; o atalho próprio recebia posicionamento inline fixo, contrário à posição aprovada dentro do banner. Portanto, a presença desses problemas na comparação não foi atribuída à retirada de Slick.

O ajuste de posição em `src/rdstation-whatsapp.js` e sua cópia em `dist/rdstation-whatsapp.js` protege **apenas** `position:absolute!important` e `z-index:9!important` de `.banner-whatsapp`. Não altera offsets responsivos, tamanho, URL, formulário, outro link, controle nativo RD ou eventos de envio. Um observador somente do atributo `style` restaura essas duas propriedades quando são reescritas; compara valor e prioridade antes de escrever, evitando um ciclo causado pelas próprias alterações. Funciona mesmo antes da chegada do widget, preservando o link direto como alternativa.

O carregador público, o popup e a integração 2.0 do RD foram inspecionados em 22/09. A conferência posterior do histórico comprovou que o estilo inline já foi introduzido no HTML pelo commit `933c80a`, de 18/09. O gerador de SEO agora o remove para que o CSS responsivo controle a posição mesmo antes do JavaScript. Não há evidência de que essa alteração tenha sido inserida pelo RD. O listener oficial de abertura do popup usa clique nativo e troca da classe `floating-button--close`, sem depender de Slick. A proteção do botão não substitui esse comportamento nem simula uma conversão.

`scripts/test-rdstation-whatsapp.cjs` passa **10 testes**: os oito contratos anteriores e dois casos que verificam alterações iniciais/tardias de estilo, preservação das propriedades restantes e dos controles nativos, ausência de ciclo do observador, abertura, fechamento e reabertura. Nenhum contato foi enviado.
