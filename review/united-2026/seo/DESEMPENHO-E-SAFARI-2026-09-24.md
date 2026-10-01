# Desempenho da Home e retorno do WhatsApp — 24/09/2026

## Estado e objetivo

Rodada local em validação, ainda sem commit/push desta atualização nem publicação no servidor. O usuário pediu desempenho mínimo de **80 no celular e no computador**, mantendo as demais métricas bem posicionadas, e relatou desconfiguração ao voltar do WhatsApp no Safari do iPhone. O envio ao GitHub fica condicionado à conferência do conjunto. Não houve envios reais de formulários ou mensagens de WhatsApp nesta rodada.

O trabalho mantém o desenho aprovado, os destinos dos links, a logo, os formulários reais, o GTM e o loader da conta RD. O candidato atingiu a meta de desempenho nas medições locais abaixo, mas **o conjunto ainda não está liberado para envio**: boas práticas continua com pendências externas e não houve validação no Safari de um iPhone físico nem nova medição pública desta versão.

## Mudanças da versão candidata

### CSS da Home

`scripts/home-critical-css.py`, chamado pelo otimizador de arquivos estáticos, extrai uma seleção conservadora de estilos essenciais e a coloca no `style#united-home-critical`. Ela contempla cabeçalho, todos os estados dos banners, menu móvel, primeira seção de conteúdo e controles de contato/RD que podem abrir imediatamente. Regras responsivas e fontes necessárias são preservadas. A seleção não depende de cobertura de uma única tela.

O bloco crítico tem aproximadamente 51 KB, ou 10 KB com gzip, nesta geração. O arquivo completo continua disponível, com todas as regras na ordem original, e começa a baixar durante a leitura do HTML através de `media="print"`; seu `onload` aplica `media="all"`. Uma alternativa em `noscript` mantém os estilos completos com JavaScript desativado. Não se usa temporizador para esconder recursos da medição. Os números exatos de bytes ficam em `css-optimization.json` e podem mudar nas gerações seguintes.

### Formulário principal RD

O HTML inicial carrega o adaptador local com `defer`, mas não baixa antecipadamente o SDK remoto do formulário incorporado. `src/rdstation-form.js` conserva a URL oficial e inicializa uma única instância quando há intenção de contato, proximidade da área de contato, foco ou `#contato`. A abertura do diálogo emite `united:rd-form-request` antes de mover o mesmo elemento; fechar e reabrir conserva o formulário e os campos.

O timeout de 20 segundos começa nessa solicitação e cobre SDK e template. Falha mostra a alternativa real de recarga; retorno tardio pode recuperar o formulário. A mensagem de sucesso continua dependendo do fluxo de submissão do SDK e de sua confirmação correlacionada. Não existe sucesso por clique ou por tempo decorrido.

O loader da conta RD mantém sua tag `async` e seu comportamento de rastreamento/WhatsApp. GTM e demais tags não foram removidos nem adiados. A inicialização é imediata caso outro integrador já tenha instalado o SDK ou o navegador não tenha `IntersectionObserver`. Essa compatibilidade não deve ser usada para recolocar o SDK antecipado na entrega.

### Safari, redimensionamento e controles

Os campos editáveis do popup WhatsApp tinham 14 px no navegador examinado; a regra móvel/ponteiro de toque agora aplica 16 px, verificados no navegador de teste. O site mantém o zoom manual habilitado. A geometria dos banners segue o viewport de layout, para não tratar a redução temporária do viewport visual durante foco/teclado como uma nova largura da arte.

Os controladores cancelam medidas pendentes quando a página é suspensa e recalculam após restauração (`pageshow`), retorno à visibilidade, orientação e mudanças do viewport. O atalho de WhatsApp mantém a posição acima da altura real da barra “Quero conhecer”, com 12 px de separação e área segura. Ao sair para outro aplicativo, um campo do popup que ainda esteja focado perde o foco sem apagar os dados. A seta decorativa de “Quero conhecer” foi retirada.

Essas mudanças e os testes automatizados cobrem as condições conhecidas de foco, suspensão e restauração. **Não houve teste final em um iPhone físico com Safari nesta rodada.** Não afirmar que o problema relatado foi reproduzido e resolvido nesse aparelho apenas com testes de computador.

## Evidências e limites

O [PageSpeed público fornecido em 24/09](https://pagespeed.web.dev/analysis/https-unitedidiomas-com/377g6zpmt3?form_factor=mobile) registrou desempenho **57 no celular e 57 no computador**, com boas práticas **96**. A cópia de referência do mesmo conteúdo publicada anteriormente, servida localmente por HTTP com gzip para comparação, mediu **83 no celular e 98 no computador**, com boas práticas **54 no ambiente local**.

Essas notas não são equivalentes: origem, rede, servidor, protocolo e comportamento dos scripts externos diferem. A referência local é a versão anterior às mudanças candidatas e serve para comparação no mesmo ambiente. Não é evidência de que o site público já passou de 80 nem de que as mudanças desta rodada produziram aquelas notas. O resultado final do candidato deverá ser comparado com a referência em condições equivalentes; diferenças de uma execução individual podem conter variação de laboratório.

### Medição final do candidato

Medições de 24/09/2026, Lighthouse **13.5.0** (mesma versão do relatório público), Chrome isolado, carregamento frio, integrações externas reais ativas e servidor HTTP local com gzip. URL: `http://127.0.0.1:8782/`. Foram feitas três execuções sequenciais por perfil, sem execução concorrente de auditorias. A referência local 83/98 acima foi medida com Lighthouse 13.4.1; não atribuir a diferença inteira a ganho do código nem comparar essas notas com o PSI público como se fossem equivalentes.

| Resultado local | Mobile | Desktop |
|---|---:|---:|
| Desempenho — três execuções | 84 / 84 / 88 | 98 / 97 / 97 |
| Desempenho — mediana | **84** | **97** |
| Acessibilidade | 100 | 100 |
| SEO | 100 | 100 |
| Boas práticas | **54** | **54** |
| Navegação agêntica aplicável | 2/2 | 2/2 |
| FCP — mediana | 1,06 s | 0,28 s |
| LCP — mediana | 3,54 s | 1,19 s |
| TBT — mediana | 273 ms | 0 ms |
| CLS — todas as execuções | 0 | 0 |

Os dois itens aplicáveis de navegação agêntica passaram; cinco são não aplicáveis. O LCP móvel ainda supera 2,5 s no laboratório. Portanto cumprir 80 não significa ter todas as métricas de experiência excelentes nem aprovação dos Core Web Vitals de campo.

As seis execuções finais não solicitaram o SDK do formulário principal antes de intenção de contato nem a imagem decorativa de desktop `bg-united-video.webp` no mobile. O erro de console registrado continua no endpoint Blue, sem erro de script próprio identificado nessas execuções. Boas práticas local inclui a solicitação HTTP Blue, cookies de terceiros e ocorrências no painel de problemas; essas condições diferem da origem HTTPS pública, que teve 96 no relatório de referência.

Relatórios brutos ficam fora do pacote, em `performance-evidence-2026-09-24/current-13_5-*.json`, com consolidação em `measurement-summary.json`. Não foram enviados ao GitHub; contêm URLs de telemetria dos testes e são evidências de diagnóstico local.

### Revisão de boas práticas em HTTPS

Após a dúvida sobre a nota 54, a auditoria foi repetida em HTTPS com Lighthouse 13.5.0 e o mesmo Chrome 153.0.8010.54. O site publicado, a referência local anterior e o candidato local receberam **73**, com as mesmas três falhas: cookies de terceiros, Issues de cookies e erro de carregamento da Blue. O uso de HTTPS passou nos três. Nos relatórios anteriores em HTTP, referência e candidato também tinham a mesma nota 54; portanto não há evidência de regressão de boas práticas causada por esta alteração.

O certificado temporário local foi aceito apenas pelo processo isolado de medição, pela impressão da chave pública, sem alterar a confiança do sistema. Nenhuma tag, cookie ou auditoria foi bloqueada. Uma falha transitória de conexões do servidor HTTPS de diagnóstico foi corrigida antes da repetição final; no resultado final o único erro de console é da Blue.

No relatório PageSpeed fornecido, cookies e Issues passaram e apenas a Blue falhou, resultando em 96. O ambiente público de medição usa Chromium 153.0.8010.36/Linux; a razão exata da diferença de avisos de cookies não foi isolada. **Não comparar 96 e 54 como uma queda provocada pelo código, nem apresentar 73 como nova medição do PageSpeed.**

As consultas DNS aos resolvedores Google e Cloudflare retornaram NXDOMAIN para `event.getblue.io`. A conta GTM aberta no navegador não tem acesso visível ao container da United. A correção externa, a revisão dos cookies e o acesso necessário estão detalhados em [BOAS-PRATICAS-GTM-2026-09-24.md](BOAS-PRATICAS-GTM-2026-09-24.md). Ainda não houve alteração de tags nem envio ao GitHub.

### Verificações funcionais concluídas

- 49 testes do conjunto RD/banners passaram, incluindo carregamento por demanda, instância única, erros, retorno tardio, confirmação de envio e restauração dos componentes.
- 13 testes de CSS crítico passaram.
- 19 testes de exportação e 13 de rastreamento passaram.
- 55 verificações comportamentais passaram.
- Os campos do popup WhatsApp apresentaram 16 px no navegador de teste.
- No Chrome, foram conferidas larguras de 320, 390, 844 e 1440 px, sem rolagem horizontal na versão completa; abertura/fechamento do menu e formulários, rolagem e volta de navegação mantiveram um único WhatsApp e a distância de 12 px acima da barra móvel.
- A abertura de contato carregou um único SDK e um formulário real, sem envio. O adaptador permaneceu ocioso antes de intenção de contato.
- A comparação visual somente com CSS crítico versus completo confirmou cabeçalho, logo e geometria do hero iguais em 390 e 1440 px. Uma regressão intermediária de posicionamento do Jimmy e download decorativo foi detectada e corrigida antes da medição final.

Esses grupos descrevem suas respectivas execuções; não somar como se todos representassem testes independentes. Fixtures de SDK e de envio verificam lógica sem criar leads reais. Abrir um formulário ou passar um teste automatizado não comprova recebimento na base RD Marketing nem transferência ao CRM.

## Pendências externas preservadas

A integração Blue continua apresentando problema: no ambiente local há questões de carregamento por HTTP e cookies; o relatório público anterior apontou falha de conexão na URL HTTPS do fornecedor. A nota de boas práticas 54 local não deve ser ocultada nem confundida com os 96 públicos. É preciso identificar e corrigir a integração na origem; não remover tags ou mascarar mensagens do navegador apenas para elevar uma nota.

A origem foi confirmada por leitura do JavaScript público do container `GTM-MTK74PV`, versão de recurso 69 em 24/09: tag de HTML personalizado com ID público **68**, `setPageType: visit`, disparo `gtm.js` e caminho `/`. Ela inclui `//event.getblue.io/js/blue-tag.min.js`; o endereço herda HTTP local ou HTTPS público. Rafael/equipe de campanhas deve localizar `getblue.io` ou `blue_q` no container e validar a integração com o fornecedor. Trocar apenas o protocolo não resolve a falha já observada em HTTPS. Outras cinco tags Blue têm gatilhos distintos; não foi comprovado que todas disparam na Home.

Google/GTM e outras plataformas de campanha continuam participando do custo de JavaScript. A presença de duas URLs da biblioteca GA4 não comprova duplicação de eventos. A revisão de configuração na conta deve preservar atribuição, consentimento e conversões. Detalhes anteriores estão em [TERCEIROS-2026-09-23.md](TERCEIROS-2026-09-23.md).

Cache e compressão dependem da configuração aplicada na hospedagem por Rafael. A evolução dos Core Web Vitals de campo também considera histórico de visitas e deve ser acompanhada separadamente da nota de laboratório.

## Critérios antes do envio e após publicação

1. Consolidar as medições do candidato no celular e computador, verificar a meta de 80 e revisar também acessibilidade, boas práticas, SEO e estabilidade visual. Não considerar somente a nota de desempenho.
2. Conferir Home e páginas internas, banners, menu, rotação, zoom manual e ausência de rolagem horizontal. Verificar o WhatsApp acima da barra de contato durante a rolagem.
3. No Safari de um iPhone físico, abrir o popup WhatsApp, focar e sair dos campos, fechar o popup, alternar para o aplicativo e voltar, girar a tela e percorrer a página. O layout deve se manter ajustado e os controles utilizáveis. Não é necessário enviar uma mensagem para verificar o retorno entre aplicativos.
4. Conferir carregamento tardio e falha do RD, abrir/fechar/reabrir o diálogo, acesso direto por `#contato` e formulário inline. Fazer eventual conversão real somente com dados autorizados e conferir Marketing e CRM separadamente.
5. Revisar o diff e atualizar os inventários/manifestos no fluxo de entrega somente após concluir a revisão. Nenhum teste local publica no servidor.
6. Depois da publicação feita por Rafael, testar novamente o domínio público em mobile e desktop, confirmar os arquivos entregues, cache e erros externos. Registrar o resultado público sem substituir o relatório por uma medição local mais favorável.

Integração atual em [INTEGRACAO.md](INTEGRACAO.md) e funcionamento do formulário em [RD-STATION.md](RD-STATION.md). As seções datadas de 16 a 23/09 nos demais documentos permanecem como histórico.
