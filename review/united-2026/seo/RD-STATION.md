# Formulário RD Station — integração de 16/09/2026

As quatro páginas da prévia usam o formulário oficial fornecido pelo usuário. O envio é feito diretamente pelo RD Station; os formulários demonstrativos anteriores foram removidos e os controladores PHP legados não participam desse envio. O formulário de busca da FAQ continua independente.

## Configuração pública

| Item | Valor |
|---|---|
| ID do formulário e do elemento de montagem | `lp-vamos-coversar-cbaf85f09c7f676d42c3` |
| SDK | `https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js` |
| Segundo argumento fornecido no embed | `UA-42887237-1` |
| Inicialização fornecida | `new RDStationForms('lp-vamos-coversar-cbaf85f09c7f676d42c3', 'UA-42887237-1').createForm()` |

Esses valores são configuração pública do embed, não credenciais de acesso à conta RD Station. Não há senha ou token privado a acrescentar ao repositório.

## Funcionamento e manutenção

Existe um único elemento de montagem por documento. Ele fica em `#contato`, junto ao rodapé, e é movido para o diálogo ao abrir o contato. Ao fechar, o mesmo elemento volta à posição original. A movimentação preserva os campos preenchidos e os eventos do formulário; não clonar o elemento, duplicar seu ID ou executar `createForm()` a cada abertura.

Inicializar somente após o SDK estar disponível. O gerador SEO aplica `defer` aos scripts externos; uma chamada inline imediata após esse script pode executar cedo demais. Manter a inicialização em `src/rdstation-form.js`, carregado após o SDK, sem inserir uma segunda chamada literal nas páginas.

O SDK controla o formulário e seu envio. Não interceptar o submit para exibir sucesso fictício nem reativar `contactLead`, `contactForm` ou endpoints PHP antigos em paralelo. As URLs locais permanecem compatíveis com `/review/united-2026/dist/`; a URL externa do SDK deve ser preservada pelo normalizador.

O retorno de sucesso permanece na própria caixa de contato. Para cada tentativa de envio, o controlador configura o destino do SDK com a URL atual e um fragmento temporário exclusivo daquela tentativa. O evento `hashchange` só aceita o fragmento esperado para a tentativa em andamento; depois restaura a URL anterior e mostra o cartão de confirmação. A mensagem não aparece ao clicar no botão nem por um temporizador: depende do retorno de sucesso do SDK após a resposta HTTP 200 da conversão. O envio continua sob responsabilidade do SDK oficial, sem XHR próprio, callbacks privados ou simulação positiva de criação de lead. Não há uma rota separada `obrigado/` neste fluxo.

O seletor de país está oculto por solicitação do usuário. Brasil (`BR`, +55) permanece fixo, com a máscara oficial do RD. Digitar DDD e número; não duplicar o código +55.

Para reaplicar a integração e atualizar os artefatos, seguir a sequência de manutenção do `README.md`, começando por `scripts/update-contact-layout.py` e terminando pela auditoria e atualização dos manifestos.

## Verificação e confirmação de recebimento

O formulário pode criar leads reais também na prévia. `noindex,nofollow` e o robots da prévia continuam presentes e não desativam o envio. As auditorias históricas de apresentação e integridade não comprovam recebimento no RD Station. O recebimento na conta ainda está pendente de confirmação.

- [ ] Abrir Home, Cursos, Quem Somos e FAQ por HTTP no caminho da prévia; conferir que o SDK carrega e há um único ID de montagem por documento.
- [ ] Abrir e fechar o diálogo por botão, Escape e controle de fechar; conferir a devolução do formulário ao contato, preservação dos campos, foco e uso por teclado no desktop e celular.
- [ ] Conferir os campos e a validação apresentados pelo RD, inclusive estados de carregamento e falha. Evitar envios repetidos durante verificações de apresentação.
- [ ] Conferir que campos inválidos, falha de rede e fragmentos sem a tentativa correspondente não exibem a confirmação. Após um envio aceito pelo SDK, conferir a mensagem na própria caixa, a restauração da URL e a ausência de alerta nativo, recarga ou navegação ao site antigo.
- [ ] Para o teste de envio autorizado, usar somente os dados aprovados para esse teste, sem copiá-los para arquivos do repositório. A página de comparação também carrega formulários reais nas suas prévias.
- [ ] Registrar a página, data/hora, resultado visível e status da requisição do teste, sem salvar dados pessoais, corpo da requisição, cookies ou tokens. Se houver captura de tela, ocultar os campos preenchidos e identificadores pessoais.
- [ ] Conferir na conta RD Station se o contato/conversão correspondente foi recebido, com o formulário e horário esperados. Registrar separadamente a confirmação de quem possui acesso à conta; uma resposta do navegador, sozinha, não comprova o recebimento.
- [ ] Enquanto não houver essa conferência, registrar o recebimento como pendente e não afirmar que o fluxo completo passou.

## Histórico de testes de 16/09/2026

Às 15h53 (America/Sao_Paulo), um teste autorizado com o embed oficial isolado recebeu HTTP 200 em `POST https://cta-redirect.rdstation.com/v2/conversions`. O SDK exibiu “Obrigado!” e redirecionou para o site oficial. Nenhum dado pessoal, token ou corpo da requisição foi gravado neste pacote.

Esse teste confirma a aceitação HTTP pelo RD, mas não a presença do lead na conta. O usuário informou que ainda não havia localizado o contato após a primeira tentativa na prévia. O status HTTP dessa primeira tentativa não foi capturado. A conferência posterior ao teste isolado continua pendente. Buscar pelo e-mail autorizado e conferir o histórico de conversões do formulário `lp-vamos-coversar`, inclusive se o contato já existir. Verificar na conta a propriedade/publicação do formulário caso a conversão não apareça.

O template fornecido pelo RD trazia `data-asset-action` apontando para `https://unitedidiomas.com/` e `thankyou_message` com “Obrigado!”. Isso provocava a volta ao site antigo e um alerta nativo que mostrava também o endereço local do navegador.

A primeira correção usou uma página local de agradecimento e esvaziou a mensagem do alerta. Um teste autorizado pela FAQ confirmou esse retorno sem alerta nativo ou navegação ao site antigo. Essa solução foi substituída pelo retorno na própria caixa a pedido do usuário; os testes dessa versão anterior não validam o fluxo atual.

Se a configuração remota do RD passar a devolver um `redirect_to` na resposta HTTP, o próprio SDK dará prioridade a ele. Conferir essa configuração na conta RD para preservar o retorno na própria caixa; não mascarar um desvio de navegação como sucesso local.

## Estado atual da validação

O retorno na própria caixa passou no Chrome em 16/09/2026. A tentativa com campos vazios exibiu as mensagens obrigatórias do RD, sem cartão de sucesso. Depois do envio autorizado, a Home manteve sua URL e o diálogo mostrou “Mensagem enviada!”, sem alerta nativo, recarga ou subpágina. Fechar e reabrir preservou a confirmação e o foco no cartão. A auditoria estática verificou quatro páginas e 146 dependências; a verificação HTTP conferiu cinco páginas e 150 URLs locais sem falhas. Os resultados históricos anteriores permanecem separados deste teste.

A confirmação de recebimento na conta RD continua pendente e é uma etapa separada da validação do navegador. Nenhum dado pessoal de teste deve ser incluído nos arquivos ou relatórios do pacote.

## RD Station Marketing e CRM

O usuário informou que procurou o teste no **RD Station CRM**. Este embed é um formulário do **RD Station Marketing**; a confirmação do SDK não comprova a criação de uma negociação no CRM. Primeiro localizar o e-mail de teste na Base de Leads do Marketing e conferir a conversão `lp-vamos-coversar`. Se estiver lá, verificar a integração Marketing–CRM, o gatilho de envio, o funil/etapa de destino e o responsável. Nenhuma configuração dessa integração entre contas foi alterada nesta entrega.

Referências oficiais: [Formulários do RD Station Marketing](https://developers.rdstation.com/reference/formul%C3%A1rios) e [integração Marketing–CRM](https://blog.rdstation.com/novidades-rd-station-marketing-junho-2024/). O recebimento na Base de Leads do Marketing e a criação da negociação no CRM devem ser validados separadamente.

O adaptador local também possui nove testes comportamentais em `scripts/test-rdstation-form.cjs`, executados sem rede nem dados pessoais com `node --test scripts/test-rdstation-form.cjs`. Eles cobrem correlação das tentativas, URL original, ausência de sucesso em falha/validação, confirmação única, repetição, foco e fallback do SDK.
