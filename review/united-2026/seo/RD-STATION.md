# Formulário RD Station — configuração e validação

As quatro páginas da prévia usam o formulário oficial fornecido pelo usuário. A integração foi iniciada em 16/09/2026 e posteriormente recebeu o novo ID `form-vamos-conversar-5ba05329ea8c88b5c10d`, por solicitação do usuário, mantendo `UA-42887237-1`. O envio é feito diretamente pelo RD Station; os formulários demonstrativos anteriores foram removidos e os controladores PHP legados não participam desse envio. O formulário de busca da FAQ continua independente.

## Configuração pública

| Item | Valor |
|---|---|
| ID do formulário e do elemento de montagem | `form-vamos-conversar-5ba05329ea8c88b5c10d` |
| ID do formulário gerado pelo template atual | `conversion-form-form-vamos-conversar` |
| Identificador de conversão (`conversion_identifier`) | `form-vamos-conversar` |
| SDK | `https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js` |
| Segundo argumento fornecido no embed | `UA-42887237-1` |
| Inicialização fornecida | `new RDStationForms('form-vamos-conversar-5ba05329ea8c88b5c10d', 'UA-42887237-1').createForm()` |
| Destino de conversão usado pelo SDK | `https://cta-redirect.rdstation.com/v2/conversions` |

Esses valores são configuração pública do embed, não credenciais de acesso à conta RD Station. Não há senha ou token privado a acrescentar ao repositório.

## Funcionamento e manutenção

Existe um único elemento de montagem por documento. Ele fica em `#contato`, junto ao rodapé, e é movido para o diálogo ao abrir o contato. Ao fechar, o mesmo elemento volta à posição original. A movimentação preserva os campos preenchidos e os eventos do formulário; não clonar o elemento, duplicar seu ID ou executar `createForm()` a cada abertura.

Inicializar somente após o SDK estar disponível. O gerador SEO aplica `defer` aos scripts externos; uma chamada inline imediata após esse script pode executar cedo demais. Manter a inicialização em `src/rdstation-form.js`, carregado após o SDK, sem inserir uma segunda chamada literal nas páginas.

O SDK controla o formulário e seu envio. Não interceptar o submit para exibir sucesso fictício nem reativar `contactLead`, `contactForm` ou endpoints PHP antigos em paralelo. As URLs locais permanecem compatíveis com `/review/united-2026/dist/`; a URL externa do SDK deve ser preservada pelo normalizador.

O retorno de sucesso permanece na própria caixa de contato. Para cada tentativa de envio, o controlador configura o destino do SDK com a URL atual e um fragmento temporário exclusivo daquela tentativa. O evento `hashchange` só aceita o fragmento esperado para a tentativa em andamento; depois restaura a URL anterior e mostra o cartão de confirmação. A mensagem não aparece ao clicar no botão nem por um temporizador: depende do retorno de sucesso do SDK após a resposta HTTP 200 da conversão. O envio continua sob responsabilidade do SDK oficial, sem XHR próprio, callbacks privados ou simulação positiva de criação de lead. Não há uma rota separada `obrigado/` neste fluxo.

O seletor de país está oculto por solicitação do usuário. Brasil (`BR`, +55) permanece fixo, com a máscara oficial do RD. Digitar DDD e número; não duplicar o código +55.

Para reaplicar a integração e atualizar os artefatos, seguir a sequência de manutenção do `README.md`, começando por `scripts/update-contact-layout.py` e terminando pela auditoria e atualização dos manifestos.

## Verificação e confirmação de recebimento

O formulário pode criar leads reais também na prévia. `noindex,nofollow` e o robots da prévia continuam presentes e não desativam o envio. As auditorias históricas de apresentação e integridade não comprovam recebimento no RD Station. O recebimento do formulário anterior foi confirmado pelo usuário no Marketing; o novo ID retornou sucesso indicado pelo SDK no teste abaixo, mas sua conferência na conta continua pendente.

- [ ] Abrir Home, Cursos, Quem Somos e FAQ por HTTP no caminho da prévia; conferir que o SDK carrega e há um único ID de montagem por documento.
- [ ] Abrir e fechar o diálogo por botão, Escape e controle de fechar; conferir a devolução do formulário ao contato, preservação dos campos, foco e uso por teclado no desktop e celular.
- [ ] Conferir os campos e a validação apresentados pelo RD, inclusive estados de carregamento e falha. Evitar envios repetidos durante verificações de apresentação.
- [ ] Conferir que campos inválidos, falha de rede e fragmentos sem a tentativa correspondente não exibem a confirmação. Após um envio aceito pelo SDK, conferir a mensagem na própria caixa, a restauração da URL e a ausência de alerta nativo, recarga ou navegação ao site antigo.
- [ ] Para o teste de envio autorizado, usar somente os dados aprovados para esse teste, sem copiá-los para arquivos do repositório. A página de comparação também carrega formulários reais nas suas prévias.
- [ ] Registrar a página, data/hora, resultado visível e status da requisição do teste, sem salvar dados pessoais, corpo da requisição, cookies ou tokens. Se houver captura de tela, ocultar os campos preenchidos e identificadores pessoais.
- [ ] Conferir na conta RD Station se o contato/conversão correspondente foi recebido, com o formulário e horário esperados. Registrar separadamente a confirmação de quem possui acesso à conta; uma resposta do navegador, sozinha, não comprova o recebimento.
- [ ] Enquanto não houver essa conferência, registrar o recebimento como pendente e não afirmar que o fluxo completo passou.

## Validação do novo formulário

O template público de `form-vamos-conversar-5ba05329ea8c88b5c10d` respondeu HTTP 200. Ele gera `conversion-form-form-vamos-conversar`, mantém Nome, Celular e E-mail como campos obrigatórios e usa o destino de conversão `https://cta-redirect.rdstation.com/v2/conversions`.

Em 16/09/2026, às 16h36 (America/Sao_Paulo), o teste na Home pelo Chrome confirmou o formulário gerado `conversion-form-form-vamos-conversar`. A tentativa com campos vazios foi bloqueada pelas mensagens obrigatórias. A máscara de telefone manteve +55 corretamente, sem seletor de país. O envio real com os dados já autorizados retornou sucesso indicado pelo SDK e exibiu “Mensagem enviada!” na própria caixa, mantendo a URL intacta, sem alerta nativo ou navegação. Fechar e reabrir o diálogo preservou a confirmação e o foco.

Cursos, Quem Somos e FAQ carregaram, cada uma, um único elemento de montagem do novo ID e um único formulário `conversion-form-form-vamos-conversar`, com os três campos obrigatórios. Essa conferência nas páginas internas não fez envios reais adicionais.

O status HTTP da requisição de conversão não foi capturado diretamente nesse teste. O HTTP 200 documentado acima corresponde somente ao carregamento do template e não deve ser apresentado como captura do envio. A auditoria estática verificou quatro páginas e 146 dependências; a verificação HTTP conferiu cinco páginas e 150 URLs locais, sem falhas. Os nove testes comportamentais Node também passaram.

**Pendente:** confirmar o recebimento deste novo teste na conta RD Station Marketing. A confirmação do usuário registrada no histórico abaixo refere-se ao formulário anterior e não deve ser atribuída ao novo ID. A integração com o CRM permanece sob verificação da equipe.

## Histórico de testes do formulário anterior — 16/09/2026

Às 15h53 (America/Sao_Paulo), um teste autorizado com o embed oficial isolado recebeu HTTP 200 em `POST https://cta-redirect.rdstation.com/v2/conversions`. O SDK exibiu “Obrigado!” e redirecionou para o site oficial. Nenhum dado pessoal, token ou corpo da requisição foi gravado neste pacote.

Esse teste confirmou a aceitação HTTP pelo RD. Inicialmente, o usuário ainda não havia localizado o contato após a primeira tentativa na prévia; o status HTTP dessa primeira tentativa não foi capturado. Posteriormente, o usuário confirmou o recebimento no RD Station Marketing. Essa confirmação pertence ao formulário anterior, cuja conversão era `lp-vamos-coversar`, e não comprova o recebimento pelo novo formulário.

O template fornecido pelo RD trazia `data-asset-action` apontando para `https://unitedidiomas.com/` e `thankyou_message` com “Obrigado!”. Isso provocava a volta ao site antigo e um alerta nativo que mostrava também o endereço local do navegador.

A primeira correção usou uma página local de agradecimento e esvaziou a mensagem do alerta. Um teste autorizado pela FAQ confirmou esse retorno sem alerta nativo ou navegação ao site antigo. Essa solução foi substituída pelo retorno na própria caixa a pedido do usuário; os testes dessa versão anterior não validam o fluxo atual.

Se a configuração remota do RD passar a devolver um `redirect_to` na resposta HTTP, o próprio SDK dará prioridade a ele. Conferir essa configuração na conta RD para preservar o retorno na própria caixa; não mascarar um desvio de navegação como sucesso local.

## Validação anterior do retorno na própria caixa

O retorno na própria caixa passou no Chrome em 16/09/2026, ainda com o formulário anterior. A tentativa com campos vazios exibiu as mensagens obrigatórias do RD, sem cartão de sucesso. Depois do envio autorizado, a Home manteve sua URL e o diálogo mostrou “Mensagem enviada!”, sem alerta nativo, recarga ou subpágina. Fechar e reabrir preservou a confirmação e o foco no cartão. A auditoria estática daquela versão verificou quatro páginas e 146 dependências; a verificação HTTP conferiu cinco páginas e 150 URLs locais sem falhas. Esses resultados não constituem o teste do novo ID.

O recebimento desse teste anterior no Marketing foi confirmado pelo usuário. Nenhum dado pessoal de teste deve ser incluído nos arquivos ou relatórios do pacote.

## RD Station Marketing e CRM

O usuário confirmou o recebimento do teste anterior no **RD Station Marketing**. A equipe ainda verifica sua chegada ao **RD Station CRM**. Este embed é um formulário do Marketing; a confirmação do SDK não comprova a criação de uma negociação no CRM. Para o novo formulário, localizar o teste na Base de Leads do Marketing e conferir a conversão correspondente a `form-vamos-conversar`. Verificar separadamente a integração Marketing–CRM, o gatilho de envio, o funil/etapa de destino e o responsável. Nenhuma configuração dessa integração entre contas foi alterada nesta entrega.

Referências oficiais: [Formulários do RD Station Marketing](https://developers.rdstation.com/reference/formul%C3%A1rios) e [integração Marketing–CRM](https://blog.rdstation.com/novidades-rd-station-marketing-junho-2024/). O recebimento na Base de Leads do Marketing e a criação da negociação no CRM devem ser validados separadamente.

O adaptador local também possui nove testes comportamentais em `scripts/test-rdstation-form.cjs`, executados sem rede nem dados pessoais com `node --test scripts/test-rdstation-form.cjs`. Eles cobrem correlação das tentativas, URL original, ausência de sucesso em falha/validação, confirmação única, repetição, foco e fallback do SDK.
