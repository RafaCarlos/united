# Aplicação no domínio oficial

O conteúdo deste diretório prepara a integração; não modifica automaticamente o PHP nem a hospedagem de www.unitedidiomas.com.

1. Aplicar cada fragmento `production/*-head.html` ao head da página correspondente, removendo metadados antigos duplicados. Os quatro caminhos canônicos devem responder em HTTPS com status 200. Conferir redirects entre www/sem-www e entre variantes com/sem barra no servidor real.
2. Usar a estrutura HTML, fontes, CSS e scripts locais revisados. Desde 16/09/2026, `dist` usa o formulário oficial RD Station `lp-vamos-coversar-cbaf85f09c7f676d42c3`, pelo SDK `https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js`. O mesmo embed é movido do contato junto ao rodapé para o diálogo e devolvido ao fechar; não criar um segundo embed nem reinicializar o formulário a cada abertura.
   O envio é realizado diretamente pelo RD Station. Brasil (+55) fica fixo, sem seletor de país. Manter a página `obrigado/` e a configuração de retorno local em `rdstation-form.js`: ela evita o alerta nativo e o redirecionamento do embed para o site antigo. Os formulários demonstrativos e sua interceptação de envio foram removidos; manter `contactLead`/`contactForm` legados desativados e não conectar endpoints PHP em paralelo ao formulário RD. O PHP da raiz continua separado. Conferir campos, validação, estados de erro/sucesso e recebimento na conta RD antes de considerar a integração final validada. A configuração pública e o roteiro de teste estão em `RD-STATION.md`; esta documentação não confirma o recebimento de um lead de teste.
3. Para imagens/vídeos, seguir os mapas JSON. Os recortes aprovados não mudam. Manter `playsinline`, poster, `preload="none"` e o controlador `/media-runtime.js`; remover o controlador antigo que reintroduzia `controls`. Não carregar as duas versões.
4. **Somente no domínio oficial:** remover o meta `noindex,nofollow` da prévia; publicar `production/robots.txt` e `production/sitemap.xml` na raiz. Verificar também a ausência de `X-Robots-Tag: noindex` no servidor. Nunca copiar o `robots.txt` de `dist` para produção.
5. Ativar compressão Brotli/gzip para HTML/CSS/JS/JSON/SVG. Definir cache longo somente para arquivos versionados e invalidação para HTML. Testar respostas parciais de vídeo (Range/206), tipos MIME e conteúdo dos arquivos antes de publicar. Essas configurações dependem da hospedagem e não foram alteradas aqui.
6. Validar as quatro URLs no Search Console, enviar o sitemap e conferir a URL canônica escolhida pelo Google. Medir Lighthouse/PageSpeed na versão publicada, em mobile e desktop. Para Core Web Vitals, acompanhar o percentil 75 de usuários reais: LCP até 2,5 s, INP até 200 ms e CLS até 0,1. Não confundir uma medição de laboratório com esses dados de campo.
7. Acompanhar evolução por página e consulta, comparando impressões, cliques orgânicos e leads. Ampliar conteúdo conforme perguntas reais dos alunos, sem repetir listas de termos em todas as seções.

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
