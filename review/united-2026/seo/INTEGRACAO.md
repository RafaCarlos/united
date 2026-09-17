# Aplicação no domínio oficial

O conteúdo deste diretório prepara a integração; não modifica automaticamente o PHP nem a hospedagem de www.unitedidiomas.com.

1. Aplicar cada fragmento `production/*-head.html` ao head da página correspondente, removendo metadados antigos duplicados. Os quatro caminhos canônicos devem responder em HTTPS com status 200. Conferir redirects entre www/sem-www e entre variantes com/sem barra no servidor real.
2. Usar a estrutura HTML, fontes, CSS e scripts locais revisados. A integração RD Station foi iniciada em 16/09/2026; o formulário atual é `form-vamos-conversar-5ba05329ea8c88b5c10d`, substituído a pedido do usuário, com o mesmo argumento `UA-42887237-1` e o SDK `https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js`. O mesmo embed é movido do contato junto ao rodapé para o diálogo e devolvido ao fechar; não criar um segundo embed nem reinicializar o formulário a cada abertura.
   O envio é realizado diretamente pelo RD Station. Brasil (+55) fica fixo, sem seletor de país. Manter a configuração de retorno em `rdstation-form.js`: a cada tentativa, o destino conserva a URL atual e acrescenta um fragmento temporário exclusivo. O SDK segue esse destino no seu fluxo de sucesso; o controlador confere a tentativa, restaura a URL e mostra a confirmação na própria caixa. Não há página `obrigado/`, alerta nativo nem navegação ao site antigo nesse fluxo. Não substituir o envio do SDK por uma requisição própria ou chamar callbacks privados do RD. Os formulários demonstrativos e sua interceptação de envio foram removidos; manter `contactLead`/`contactForm` legados desativados e não conectar endpoints PHP em paralelo ao formulário RD. O PHP da raiz continua separado. O teste do novo ID em 16/09/2026, às 16h36, validou os campos obrigatórios, a máscara +55 sem seletor e o sucesso indicado pelo SDK na própria caixa, com URL preservada. Um novo envio autorizado na Home pelo Chrome em 17/09/2026, às 11h09 (America/Sao_Paulo), também mostrou “Mensagem enviada!” na própria caixa e preservou a URL. O status HTTP das conversões desses testes não foi capturado diretamente; o recebimento do novo formulário na conta Marketing continua pendente. O usuário confirmou o recebimento do teste anterior no Marketing, e a equipe ainda verifica o CRM. Este embed cadastra conversões no Marketing; a criação de negociação no CRM depende da integração entre os produtos e do gatilho configurado. A configuração pública e os resultados separados por formulário estão em `RD-STATION.md`.
3. Para imagens/vídeos, seguir os mapas JSON. Os recortes aprovados não mudam. Manter `playsinline`, poster, `preload="none"` e o controlador `/media-runtime.js`; remover o controlador antigo que reintroduzia `controls`. Não carregar as duas versões.
4. **Somente no domínio oficial:** remover o meta `noindex,nofollow` da prévia; publicar `production/robots.txt` e `production/sitemap.xml` na raiz. Verificar também a ausência de `X-Robots-Tag: noindex` no servidor. Nunca copiar o `robots.txt` de `dist` para produção.
5. Ativar compressão Brotli/gzip para HTML/CSS/JS/JSON/SVG. Definir cache longo somente para arquivos versionados e invalidação para HTML. Testar respostas parciais de vídeo (Range/206), tipos MIME e conteúdo dos arquivos antes de publicar. Essas configurações dependem da hospedagem e não foram alteradas aqui.
6. Validar as quatro URLs no Search Console, enviar o sitemap e conferir a URL canônica escolhida pelo Google. Medir Lighthouse/PageSpeed na versão publicada, em mobile e desktop. Para Core Web Vitals, acompanhar o percentil 75 de usuários reais: LCP até 2,5 s, INP até 200 ms e CLS até 0,1. Não confundir uma medição de laboratório com esses dados de campo.
7. Acompanhar evolução por página e consulta, comparando impressões, cliques orgânicos e leads. Ampliar conteúdo conforme perguntas reais dos alunos, sem repetir listas de termos em todas as seções.

## Contato no banner e loader RD — 17/09/2026

Preservar o círculo de WhatsApp definido em `src/banner-whatsapp.html`. Ele fica na lateral do banner da Home, próximo de “Quero conhecer”, com posicionamento absoluto dentro do banner; sai da tela ao rolar. O botão de contato continua com seu comportamento persistente. A remoção do rótulo visual “PRÉVIA · 3 BANNERS” não remove o `noindex,nofollow` nem autoriza a indexação da prévia.

Manter `rdstation-whatsapp.js`, gerado a partir de `src/rdstation-whatsapp.js`, com `defer` nas quatro páginas. Ele conecta tanto o atalho do banner quanto o link em `#contato` ao formulário oficial de WhatsApp do RD, acionando o próprio botão nativo. Somente esse botão flutuante duplicado fica oculto; a estrutura do popup, o formulário, os eventos, o rastreamento e o fechamento permanecem nativos. O desenho e os campos continuam definidos na conta RD, sem redesenho local. Se o loader ou o widget não estiverem disponíveis, os links conservam o destino direto para o número existente `5511940040658`.

No rodapé das quatro páginas, manter “Parcerias & Convênios” e “Seja um Franqueado” exclusivamente como links diretos para [WhatsApp +55 11 95857-5315](https://wa.me/5511958575315), sem acordeão nem popup RD. O atualizador `scripts/update-footer-copy.py` conserva esses destinos. Preservar o WhatsApp geral do banner/contato/RD em `5511940040658` e o contato Head Office; esta alteração não inclui teste de envio de mensagem.

O loader `https://d335luupugsy2.cloudfront.net/js/loader-scripts/ee4f0815-8266-4fb5-ba25-416836b02312-loader.js` aparece literalmente uma vez em cada um dos quatro HTML comerciais, com `async`. Essa é uma exceção à aplicação de `defer`: o SDK do formulário e `rdstation-form.js` mantêm `defer` e sua ordem. O loader carrega rastreamento e configurações da conta RD; não substitui o elemento de montagem, o SDK ou o inicializador do formulário de contato.

Na integração ao PHP oficial, conferir `includes/footer.php`, que já contém o mesmo loader. Manter apenas uma inclusão por página renderizada, reaproveitando a existente em produção. A presença do loader ou a abertura do popup de WhatsApp não confirma recebimento de leads nem criação de negociações no CRM; essas verificações continuam separadas. A revisão permanece no pacote, sem publicação no servidor nem alteração do PHP de produção.

A verificação de 17/09 confirmou um loader com `async` e um embed por página, o adaptador de WhatsApp ativo nas quatro páginas e a abertura do popup pelo banner e pelo contato da FAQ. A abertura, a validação sem preenchimento e o fechamento foram conferidos no Chrome, inclusive em celular, sem envio pelo WhatsApp. O formulário principal preservou seus três campos, validação e apresentação. A auditoria estática, a verificação HTTP e os 17 testes Node (nove do formulário principal e oito do WhatsApp) passaram; isso não substitui a conferência de recebimento na conta RD.

## Reaplicar as melhorias na prévia

Após qualquer gerador legado ou alteração visual em `dist`, executar, nesta ordem:

```bash
python scripts/update-contact-layout.py
python scripts/update-seo-performance.py
python scripts/optimize-static-assets.py
python scripts/prepare-subdirectory.py
python scripts/audit-seo-performance.py
python scripts/prepare-subdirectory.py --refresh-manifests
```

A normalização final mantém a prévia compatível com subpastas, inclusive `/review/united-2026/dist/`. A última chamada atualiza os manifestos após a auditoria. As URLs oficiais nos metadados de produção são preservadas.

Requer Python com `lxml` e `Pillow`. `dist` é o artefato completo e pode ser servido sem build. Os geradores antigos dependem de materiais de referência; não são necessários para servir nem para reaplicar esta etapa final. Os arquivos em `src` relacionados a esta revisão são a fonte dos controladores e estilos; `seo/css-inputs.json` conserva a ordem original dos estilos. Os geradores não submetem formulários nem ativam indexação. O formulário RD usado no navegador pode criar leads reais na prévia, mesmo com `noindex,nofollow` e robots bloqueado.
