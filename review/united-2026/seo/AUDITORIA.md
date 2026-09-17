# SEO e desempenho — revisão de 12/09/2026

## WhatsApp no banner e loader RD — 17/09/2026

A Home recebeu um círculo discreto de WhatsApp na lateral do banner, próximo de “Quero conhecer”. O componente mantido em `src/banner-whatsapp.html` fica posicionado dentro do banner e sai da tela com a rolagem; não é fixo. O rótulo visual “PRÉVIA · 3 BANNERS” foi removido, preservando o `noindex,nofollow` e o robots da prévia.

O loader solicitado `ee4f0815-8266-4fb5-ba25-416836b02312-loader.js` foi incluído literalmente uma vez em cada HTML comercial, com `async`. SDK e inicializador do formulário permanecem independentes, com `defer` na ordem existente. O loader já está em `includes/footer.php` no PHP de produção; sua integração final deve evitar duplicação. A inclusão carrega as configurações da conta RD e não comprova integração com o CRM.

Durante a conferência no navegador, o loader injetou um botão flutuante de WhatsApp sobre “Quero conhecer”. O controlador `src/rdstation-whatsapp.js`, carregado com `defer` nas quatro páginas, oculta somente esse botão duplicado e permite abrir o formulário oficial pelo atalho do banner ou pelo link em `#contato`, acionando o botão nativo do RD. Estrutura, formulário, eventos, rastreamento e fechamento do popup são preservados; o desenho e os campos continuam definidos na conta RD. Sem loader ou widget disponível, o destino direto para `5511940040658` permanece como alternativa.

No ajuste do rodapé de 17/09, “Parcerias & Convênios” e “Seja um Franqueado” passaram a apontar exclusivamente para [WhatsApp +55 11 95857-5315](https://wa.me/5511958575315) nas quatro páginas, como links diretos, sem acordeão nem popup RD. O WhatsApp geral do banner/contato/RD (`5511940040658`) e Head Office foram preservados. Não houve teste de envio de mensagem para esses dois links.

A auditoria estática verificou quatro páginas e 147 dependências, com zero erros; a verificação HTTP percorreu cinco páginas e 151 URLs locais, sem falhas. Os 17 testes Node passaram: nove do formulário principal e oito do adaptador WhatsApp. O pente-fino encontrou e corrigiu o estado preso após o RD remover seu popup e acrescentou fechamento por Escape, circulação do foco com Tab e retorno ao atalho. Também corrigiu o gerador de cabeçalho para normalizar links antes de copiar às páginas internas e remover scripts repetidos em caminhos relativos; duas execuções sobre uma cópia isolada produziram páginas idênticas.

No Chrome, foram conferidos desktop com largura de 1512 px, notebook em 1366 × 768 px e celular em 390 × 844 px. O círculo de WhatsApp mede 46 × 46 px e tem posicionamento absoluto dentro do banner; o rótulo de prévia não aparece na Home. Ao rolar 1039 px, o círculo saiu da área visível (posição vertical −406 px), enquanto “Quero conhecer” permaneceu disponível (693 px); o botão flutuante duplicado do RD ficou oculto.

O clique no círculo abriu o popup oficial do RD. A tentativa vazia foi bloqueada com três mensagens obrigatórias e o fechamento devolveu o foco. No celular, o popup abriu e fechou sem rolagem horizontal. Cursos, Quem Somos e FAQ mantiveram, cada uma, um loader com `async`, um embed e o adaptador ativo; o link do contato da FAQ também abriu o popup. O formulário principal de “Quero conhecer” preservou seus três campos, validação e apresentação vermelha.

O teclado dos três banners, o menu móvel, o contato aberto pelo menu e a busca da FAQ (resultado válido e ausência de resultados) foram conferidos. As quatro páginas também passaram sem rolagem horizontal em 320 px; não foram encontrados links internos/fragmentos quebrados nem IDs duplicados.

Não houve novo envio real de formulário nem mensagem de WhatsApp nesta revisão. Os resultados de envio de 16/09 abaixo são históricos e não comprovam recebimento de um contato de WhatsApp. O trabalho permanece isolado no pacote, sem publicar no servidor nem alterar o PHP da raiz.

## Formulário RD Station atual — troca solicitada pelo usuário

As quatro páginas usam agora o embed oficial `form-vamos-conversar-5ba05329ea8c88b5c10d`, fornecido em substituição ao formulário anterior, com o mesmo argumento `UA-42887237-1`. O template público respondeu HTTP 200, gera `conversion-form-form-vamos-conversar` e mantém Nome, Celular e E-mail obrigatórios, com conversão pelo endpoint `https://cta-redirect.rdstation.com/v2/conversions`.

O envio e a validação ficam a cargo do SDK RD. Um único formulário é compartilhado entre o contato inline e o diálogo; Brasil (+55) permanece fixo, sem seletor de país. A busca da FAQ e o `noindex,nofollow` da prévia foram preservados. O controlador configura o destino do SDK com a URL atual e um fragmento temporário exclusivo por tentativa. Após o retorno de sucesso do SDK, `hashchange` confere a tentativa correspondente, restaura a URL e apresenta a mensagem na própria caixa. Não há envio por XHR próprio, uso de callbacks privados nem sucesso simulado.

O novo formulário foi testado na Home pelo Chrome em 16/09/2026, às 16h36 (America/Sao_Paulo). O DOM confirmou `conversion-form-form-vamos-conversar`; campos vazios foram bloqueados pela validação obrigatória e a máscara +55 funcionou sem seletor de país. O envio autorizado retornou sucesso indicado pelo SDK, com “Mensagem enviada!” na própria caixa, URL intacta e ausência de alerta ou navegação. Fechar e reabrir preservou a confirmação e o foco. Cursos, Quem Somos e FAQ carregaram cada uma um único elemento de montagem e um único formulário com o novo ID, contendo os três campos obrigatórios, sem envios reais adicionais. O status HTTP da conversão não foi capturado diretamente nesse teste. A auditoria estática passou com quatro páginas e 146 dependências; a verificação HTTP percorreu cinco páginas e 150 URLs locais sem falhas; os nove testes comportamentais Node passaram. O recebimento desse novo teste na conta Marketing ainda está pendente, e a equipe verifica separadamente o CRM.

## Histórico da integração RD Station — 16/09/2026

Com o formulário anterior, a auditoria estática passou com quatro páginas e 146 dependências; a verificação HTTP percorreu cinco páginas e 150 URLs locais sem erros. No Chrome, campos vazios mostraram validação sem confirmação falsa; o envio autorizado exibiu “Mensagem enviada!” no próprio diálogo, conservando a URL da Home. Fechar e reabrir manteve a confirmação e o foco acessível. O usuário confirmou posteriormente o recebimento no RD Station Marketing; a equipe ainda verifica o CRM. Essas validações pertencem ao formulário substituído e não comprovam o envio pelo novo ID.

Também foram verificadas a unicidade do embed anterior, a ordem de carregamento do SDK/inicializador, a remoção dos formulários legados e a preservação da busca. A pesquisa da FAQ por “18 meses” funcionou no navegador. O SDK oficial isolado respondeu HTTP 200 e “Obrigado!” no teste autorizado das 15h53 (America/Sao_Paulo). Uma correção intermediária confirmou o retorno pela FAQ para uma página local de agradecimento, sem alerta nativo ou navegação ao site antigo; essa página foi substituída pelo retorno na própria caixa. Detalhes e limites em `RD-STATION.md`.

As observações abaixo são o histórico das revisões anteriores, inclusive as referências a formulários demonstrativos e ausência de envio naquela data. Não houve publicação no servidor nem alteração no PHP da raiz nesta integração.

## Correção de caminhos — 15/09/2026

A prévia no endereço `/review/united-2026/dist/` procurava CSS e scripts na raiz do domínio. Os caminhos locais em cinco HTML e cinco CSS foram convertidos para relativos; os quatro bundles CSS receberam novos nomes de versão. Os arquivos JavaScript externos, imagens, vídeos, conteúdo, regras visuais, metadados e bloqueio de indexação foram preservados.

O teste local no mesmo subdiretório verificou cinco páginas (incluindo a comparação interna de contato) e 149 endereços HTTP de arquivos e links, sem falhas. A Home e Cursos foram conferidas visualmente, e a navegação de Cursos para FAQ manteve a pasta da prévia. Isso não representa uma nova medição de Lighthouse ou de desempenho do servidor. As medições e observações abaixo permanecem como histórico da revisão de 12/09.

Escopo: as quatro páginas da prévia privada. Esta revisão não significa que o domínio oficial recebeu alterações e não atribui uma nota Lighthouse, uma posição no Google ou um aumento de tráfego.

## Alterações concluídas

- Títulos e descrições próprios para Home, Cursos, Quem Somos e FAQ; canonical para as respectivas URLs oficiais; Open Graph e dados estruturados de organização, site, página e cursos.
- Uma H1 por página. A chamada aprovada da home foi preservada e passou a ter semântica de título principal. Conteúdo indexável em HTML e texto contextual sobre curso de inglês online.
- Inglês em 18 meses, curso de inglês, escola de inglês e curso online de inglês distribuídos conforme a intenção de cada página. “Melhor curso” aparece em uma pergunta útil sobre escolha, sem afirmação de superioridade não comprovada nem metatag de palavras-chave.
- FAQ ampliado para 20 perguntas; revisão das condições de Full/Business, evolução e certificação opcional TOEIC. Índice, busca e abertura por link direto incluem as três novas perguntas.
- IDs de gradientes SVG duplicados corrigidos; versões de cache de todos os scripts locais atualizadas.
- Imagens WebP, fontes Manrope WOFF2, dimensões declaradas, imagens secundárias com carregamento adiado, banner inicial prioritário e arquivos diferentes para os recortes desktop/celular.
- CSS reunido por página na ordem original, reduzindo 10–15 solicitações de estilos para uma por página. SDK do formulário e controladores carregam com `defer`, na ordem existente; o loader da conta RD acrescentado em 17/09 mantém `async`.
- Vídeos locais otimizados com poster, carregamento por visibilidade, reprodução silenciosa dentro da página e pausa fora da tela. Removidos os controles nativos grandes e a abertura automática em tela cheia; um botão discreto mantém reprodução/pausa acessível. Movimento reduzido e economia de dados desativam a reprodução automática.

## Reduções verificadas nos arquivos

| Grupo de arquivos | Antes | Depois | Redução |
|---|---:|---:|---:|
| Seis artes dos banners | 11.026 MB | 1.397 MB | 87,33% |
| Seis vídeos antes remotos | 211.630 MB | 7.931 MB | 96,25% |
| Três ilustrações internas antes remotas | 4.818 MB | 0.482 MB | 90,00% |
| Fontes locais | 0.194 MB | 0.061 MB | 68,74% |

MB decimal; os totais representam os arquivos, não o tráfego da primeira visita. O carregamento adiado impede que todos os vídeos sejam solicitados na abertura. As artes mantêm dimensões, recorte e composição, com compressão WebP com perdas; os vídeos mantêm duração visual, quadros, taxa de quadros e proporção de exibição. A fonte mantém os glifos originais. Detalhamento em `image-optimization.json`, `video-optimization.json`, `font-optimization.json` e `audit-results.json`.

## Validação

O verificador estático percorre as quatro páginas, dependências locais, links e fragmentos internos, títulos, descrições, dados estruturados, dimensões, fontes, vídeos e versões de cache. Foram conferidos visualmente os banners e vídeos em desktop e em quadros de 390/320 px no Chrome. A reprodução manual, pausa ao sair da tela, pesquisa por “18 meses” e link direto da nova pergunta do FAQ foram exercitados.

Não houve teste em aparelho físico/iOS. A tentativa de consulta ao PageSpeed Insights do domínio oficial retornou HTTP 429 por quota excedida; **nenhuma nota foi obtida**. Core Web Vitals de usuários reais, TTFB e regras de cache/compressão do servidor oficial não foram medidos nesta etapa.

## Próxima etapa para impacto orgânico

Integrar o código revisado ao site oficial, preservar os formulários e rotas reais, aplicar os metadados de `production/`, liberar a indexação somente no domínio definitivo e enviar seu sitemap ao Search Console. Depois medir as páginas publicadas em mobile/desktop, acompanhar impressões, cliques e contatos e corrigir os gargalos restantes do servidor. A prévia permanece privada e bloqueada para indexação para não competir com o site oficial.

As recomendações seguem o [guia de SEO do Google](https://developers.google.com/search/docs/fundamentals/seo-starter-guide), a documentação de [snippets](https://developers.google.com/search/docs/appearance/snippet) e [Core Web Vitals](https://developers.google.com/search/docs/appearance/core-web-vitals), além das orientações de [carregamento adiado de vídeos](https://web.dev/articles/lazy-loading-video). Metadados ajudam a descrever as páginas; o Google pode escolher outros títulos e trechos. Boas métricas técnicas não garantem posicionamento.

## Fechamento para revisão no GitHub

A verificação final inclui integridade, dimensões e SHA-256 de todas as imagens raster em `image-inventory.json`, incluindo o OnDemand novo. Esse inventário é distinto da comparação de compressão: não atribui um tamanho original fictício a imagens já recebidas em WebP. Os arquivos de OnDemand (1672 × 941), persona Live Class (1536 × 1024), storytelling (1672 × 941) e Jimmy (1122 × 1402) têm nomes descritivos, textos alternativos contextuais e dimensões explícitas. Imagens fora da abertura usam carregamento adiado e decodificação assíncrona. O subtítulo dos temas Business foi ajustado de H4 para H3 preservando o estilo.

O pacote no GitHub é isolado do PHP publicado. Os formulários ainda exigem integração real e a indexação deve ser liberada apenas no domínio oficial. A revisão de imagens segue a [documentação do Google Imagens](https://developers.google.com/search/docs/appearance/google-images); alt descreve o conteúdo e não repete listas de palavras-chave.

No fechamento, o Chrome foi usado para conferir o OnDemand ampliado, atalhos laterais visíveis no meio da home, abertura do menu e formulário no quadro móvel de 390 px, além dos cabeçalhos e carregamento de imagens das quatro páginas. O relatório estático fechou com quatro páginas, 145 dependências e 171 imagens raster inventariadas, sem erros. A revisão final não enviou dados dos formulários.
