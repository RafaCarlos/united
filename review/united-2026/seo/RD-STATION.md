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

Para reaplicar a integração e atualizar os artefatos, seguir a sequência de manutenção do `README.md`, começando por `scripts/update-contact-layout.py` e terminando pela auditoria e atualização dos manifestos.

## Verificação e confirmação de recebimento

O formulário pode criar leads reais também na prévia. `noindex,nofollow` e o robots da prévia continuam presentes e não desativam o envio. As auditorias históricas de apresentação e integridade não comprovam recebimento no RD Station. O recebimento na conta ainda está pendente de confirmação.

- [ ] Abrir Home, Cursos, Quem Somos e FAQ por HTTP no caminho da prévia; conferir que o SDK carrega e há um único ID de montagem por documento.
- [ ] Abrir e fechar o diálogo por botão, Escape e controle de fechar; conferir a devolução do formulário ao contato, preservação dos campos, foco e uso por teclado no desktop e celular.
- [ ] Conferir os campos e a validação apresentados pelo RD, inclusive estados de carregamento e falha. Evitar envios repetidos durante verificações de apresentação.
- [ ] Para o teste de envio autorizado, usar somente os dados aprovados para esse teste, sem copiá-los para arquivos do repositório. A página de comparação também carrega formulários reais nas suas prévias.
- [ ] Registrar a página, data/hora, resultado visível e status da requisição do teste, sem salvar dados pessoais, corpo da requisição, cookies ou tokens. Se houver captura de tela, ocultar os campos preenchidos e identificadores pessoais.
- [ ] Conferir na conta RD Station se o contato/conversão correspondente foi recebido, com o formulário e horário esperados. Registrar separadamente a confirmação de quem possui acesso à conta; uma resposta do navegador, sozinha, não comprova o recebimento.
- [ ] Enquanto não houver essa conferência, registrar o recebimento como pendente e não afirmar que o fluxo completo passou.

## Resultado do teste de 16/09/2026

Às 15h53 (America/Sao_Paulo), um teste autorizado com o embed oficial isolado recebeu HTTP 200 em `POST https://cta-redirect.rdstation.com/v2/conversions`. O SDK exibiu “Obrigado!” e redirecionou para o site oficial. Nenhum dado pessoal, token ou corpo da requisição foi gravado neste pacote.

Esse teste confirma a aceitação HTTP pelo RD, mas não a presença do lead na conta. O usuário informou que ainda não havia localizado o contato após a primeira tentativa na prévia. O status HTTP dessa primeira tentativa não foi capturado. A conferência posterior ao teste isolado continua pendente. Buscar pelo e-mail autorizado e conferir o histórico de conversões do formulário `lp-vamos-coversar`, inclusive se o contato já existir. Verificar na conta a propriedade/publicação do formulário caso a conversão não apareça.

O template fornecido pelo RD trazia `data-asset-action` apontando para `https://unitedidiomas.com/` e `thankyou_message` com “Obrigado!”. Isso provocava a volta ao site antigo e um alerta nativo que mostrava também o endereço local do navegador.

A prévia agora configura o retorno para `obrigado/`, relativo à pasta do inicializador, e esvazia a mensagem do alerta. O SDK continua responsável pelo envio: ele segue esse retorno somente no ramo de conversão bem-sucedida. A página de agradecimento não contém formulário nem dados de contato. Se a configuração remota do RD passar a devolver um `redirect_to` na resposta HTTP, o próprio SDK dará prioridade a ele; manter esse destino alinhado à integração final na conta RD.

O seletor de país está oculto por solicitação do usuário. Brasil (`BR`, +55) permanece fixo, com a máscara oficial do RD. Digitar DDD e número; não duplicar o código +55.

## Retorno corrigido: validação final

O teste autorizado no formulário da FAQ terminou em `/review/united-2026/dist/obrigado/`, com a mensagem “Obrigado pelo contato!” e um link para voltar à Home da prévia. Não houve alerta nativo nem redirecionamento ao site antigo. O campo de telefone estava com Brasil fixo e sem seletor. Os campos e o resultado visual foram conferidos no navegador; nenhum contato de teste foi incluído nos arquivos.

A auditoria estática verificou 147 dependências sem erros. A verificação HTTP conferiu as seis páginas (quatro comerciais, comparação interna e agradecimento) e 150 URLs locais sem falhas. O teste isolado anterior recebeu HTTP 200; o teste final confirma também o retorno usado pela integração. A confirmação na conta RD continua sendo uma etapa separada.
