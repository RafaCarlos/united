# Desempenho e integração na hospedagem

## Recursos e carregamento

O build minifica HTML, CSS e JavaScript, mantendo somente recursos referenciados pelas páginas registradas. As imagens de conteúdo são WebP com dimensões declaradas; as variantes responsivas permitem ao navegador escolher o tamanho adequado. Imagens fora da primeira dobra usam carregamento adiado quando apropriado. O vídeo usa poster e não baixa o arquivo completo automaticamente antes da interação.

Não reaplicar otimizações automáticas do CMS/CDN sem verificar duplicidades: combinar scripts, adiar tudo ou trocar a ordem de execução pode interferir em menus, formulário RD e vídeo. Manter o teste visual e funcional após qualquer intervenção desse tipo.

## Cache e compressão

- Ativar Brotli ou gzip para HTML, CSS, JavaScript, JSON, XML e SVG; usar `Vary: Accept-Encoding` quando a origem negociar as versões.
- Não recomprimir WebP, fontes WOFF2 e vídeo MP4 como estratégia de redução: esses formatos já são comprimidos.
- Servir os MIME types corretos e manter suporte a `Range`/`Accept-Ranges` para MP4, permitindo reprodução e busca sem baixar novamente o arquivo inteiro.
- Usar cache moderado para recursos com nomes estáveis (por exemplo, até 24 horas, conforme operação da agência), com ETag ou Last-Modified. Ao trocar um arquivo, invalidar o cache da CDN.
- Não aplicar `max-age=31536000, immutable` aos nomes estáveis desta entrega sem implementar versionamento ou nomes por hash. Isso pode manter CSS/imagens antigos no celular do visitante por um ano.
- HTML deve revalidar ou usar TTL curto de acordo com a estratégia da hospedagem. Excluir painel, sessões, formulários e respostas privadas de caches públicos indiscriminados.
- Evitar cache de página que reaproveite tokens, estado de confirmação ou dados de formulário de outro visitante.

A compactação registrada pelo build é uma simulação local de gzip, não prova de cabeçalhos ativos no servidor. Confirmar `Content-Encoding`, `Cache-Control`, `Vary`, tamanho transferido e respostas 200/206 na hospedagem real.

## Formulários e medição

A conta, o formulário e os scripts usados no site oficial foram preservados nesta entrega; os identificadores estão documentados no README. Os testes automatizados não enviam dados reais. O teste real autorizado de 21/10/2026 retornou callback de sucesso e confirmação na tela; o resultado está separado em `reports/rd-integration.json`. A lista/CRM e as automações não foram inspecionadas. Confirmar a entrada efetiva do lead no CRM, campos, origem/campanha, mensagem de sucesso, automações e comportamento no celular.

O loader RD de conta e o GTM oficiais já estão incluídos, limitados aos hosts oficiais e às páginas indexáveis, com deduplicação. O SDK de formulários pode carregar recursos próprios em uma prévia, incluindo gtag; a limitação de host não se estende automaticamente a esses recursos nativos. O mecanismo de consentimento ainda deve ser conferido no ambiente publicado. A agência deve preservar as configurações do contêiner e evitar adicionar uma segunda implementação equivalente. Não trocar tokens, contas ou IDs sem validar o ambiente e o responsável.

## Conferência depois de integrar

Conferir no mínimo Home, Live Class, Business, Full, Quem somos, FAQ, blog e um artigo em desktop e mobile. Testar navegação, menu, formulários, vídeo, busca, filtros, sumário e links de aluno/WhatsApp. Verificar ausência de erro de rede e de console, recursos quebrados, rolagem horizontal e saltos de layout.

Medir PageSpeed/Lighthouse e Core Web Vitals no domínio final, incluindo serviços de terceiros. LCP, INP e CLS dependem do dispositivo, rede e dados reais dos visitantes; o tamanho total do pacote não equivale ao peso da primeira tela. Registrar resultados observados, sem prometer nota ou ranking.
