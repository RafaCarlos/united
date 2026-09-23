# Otimização local de desempenho — United — 22/09/2026

Implementação preparada a partir de `origin/main` (`2e47f7b6f23ebc2caafb9ab9e0889105a80fe4b0`), em `codex/united-performance-2026-09-22`, para o commit e o PR autorizados após as verificações. Nenhuma publicação no servidor nem envio real de formulário foi realizado nesta etapa. O conteúdo comercial, os números de WhatsApp e as artes aprovadas foram preservados.

## Situação medida no site publicado

Três execuções móveis independentes por página, Lighthouse 13.5.0, Moto G Power, rede 4G lenta e carregamento inicial. As medianas abaixo são calculadas por métrica, não correspondem a uma execução adicional.

| Página | Notas das três execuções | Mediana | LCP mediano | TBT mediano |
|---|---|---:|---:|---:|
| Home | 41 / 44 / 59 | 44 | 14,7 s | 670 ms |
| Cursos | 61 / 89 / 75 | 75 | 7,5 s | 120 ms |

O site publicado ainda precisa melhorar. A Home tem imagens pesadas e trabalho de JavaScript de terceiros; em Cursos, a primeira imagem/vídeo demorava também para ficar visível. O PDF anterior tinha apenas uma amostra e Lighthouse 13.4.1: diferenças isoladas entre as notas não provam uma regressão.

Evidências: [dados das seis medições](performance-baseline-2026-09-22.json), [Home 1](https://pagespeed.web.dev/analysis/https-www-unitedidiomas-com/a5nvzutbn2?form_factor=mobile), [Home 2](https://pagespeed.web.dev/analysis/https-www-unitedidiomas-com/s99shm06pk?form_factor=mobile), [Home 3](https://pagespeed.web.dev/analysis/https-www-unitedidiomas-com/21bg21b1ly?form_factor=mobile), [Cursos 1](https://pagespeed.web.dev/analysis/https-www-unitedidiomas-com-cursos/9eqkje1f10?form_factor=mobile), [Cursos 2](https://pagespeed.web.dev/analysis/https-www-unitedidiomas-com-cursos/wfsziudon2?form_factor=mobile), [Cursos 3](https://pagespeed.web.dev/analysis/https-www-unitedidiomas-com-cursos/vym0aw1onj?form_factor=mobile).

Os dados de campo CrUX representam 28 dias: Home INP 428 ms; Cursos INP 529 ms. Eles ainda não representam o resultado desta versão local e levam tempo para refletir uma publicação.

## Alterações locais

- 53 variantes WebP para 15 imagens existentes, sem recorte novo, alteração de texto, proporção ou transparência. As 15 versões de maior dimensão somam **3.042.425 → 1.891.798 bytes (−37,82%)**. O subconjunto inicial de 13 imagens corresponde a **2.920.151 → 1.785.660 bytes (−38,85%)**. São comparações desse conjunto de arquivos, não do tráfego total do site.
- Imagens selecionadas por `srcset`/`sizes`, considerando a ampliação causada pelos recortes do CSS. Os três cards da plataforma conservam a resolução máxima para manter nitidez e ainda ficam 87–89% menores em WebP.
- Banner institucional em 768 px: **220.638 → 103.540 bytes**. Personagens em 640 px: **379.716 → 63.616 bytes**. O navegador escolhe conforme tela e densidade; não há promessa de que todos receberão essas variantes.
- O primeiro banner permanece prioritário e disponível no HTML. Os demais usam carregamento nativo adiado; no teste móvel só foram carregados quando selecionados. No desktop o navegador pode antecipá-los. Preload e imagem têm os mesmos candidatos e tamanhos, conforme a [orientação do web.dev](https://web.dev/articles/preload-responsive-images).
- Os três SVGs de teaser reutilizam as versões otimizadas dos banners. As referências anteriores somavam **666.208 bytes**, contra **493.370 bytes** nas cópias usadas agora: diferença de **172.838 bytes** se os três recursos forem requisitados. O resultado depende de visibilidade, densidade e cache; referências no HTML não comprovam downloads adicionais.
- O fundo `bg-cursos` agora tem seleção por largura e densidade no CSS. Até 480 px, o candidato de 2× usa a variante de 768 px, **80.486 bytes**, em lugar dos **250.166 bytes** da imagem de 1924 px. A diferença potencial é de **169.680 bytes** por requisição; esta comparação de arquivos não é uma medição de tráfego da página.
- Os posters Business e United Full mantêm os mesmos quadros e dimensões: **85.040 → 73.482 bytes** em 1280×720 e **37.234 → 32.656 bytes** em 1280×424. Economia conjunta de **16.136 bytes**; SSIM 0,9847 e 0,9856. Os caminhos são definidos no HTML, sem troca posterior por JavaScript nem requisição dupla induzida pela otimização. O poster dos personagens, de 55.250 bytes, permanece original porque a nova compressão traria ganho pequeno.
- Cursos recebe preload do primeiro poster. A primeira faixa deixa de depender da animação WOW para aparecer, preservando sua composição final.
- Home, Cursos e FAQ usam um bundle sem Slick: **203.258 → 110.393 bytes (−45,69%)**, mantendo jQuery, máscara e WOW. Quem Somos mantém o bundle completo e seu carrossel de metodologia.
- CSS de animações não usadas removido por parser, preservando animações usadas, auxiliares, versões prefixadas e regras de componentes. Não houve limpeza genérica de estilos de widgets.

| Rota | CSS, bytes antes → depois | Redução CSS | JS próprio total, bytes antes → depois |
|---|---:|---:|---:|
| / | 236.822 → 169.278 | 28,5% | 238.460 → 146.816 |
| /cursos/ | 214.300 → 147.891 | 31,0% | 236.795 → 145.151 |
| /quem-somos/ | 207.926 → 138.914 | 33,2% | 236.795 → 239.386 |
| /faq/ | 207.926 → 137.200 | 34,0% | 233.237 → 141.593 |

Os números acima foram recalculados a partir dos CSS e scripts locais referenciados pelos quatro HTMLs finais, sem compressão de transporte; não são tempos de carregamento. O JS de Quem Somos cresce 2.591 bytes pelas proteções e pelo posicionamento do atalho WhatsApp; seu Slick permanece. A comparação também inclui a soma de gzip nível 9 calculado separadamente para cada arquivo em [performance-file-comparison-2026-09-22.json](performance-file-comparison-2026-09-22.json), preservando os valores anteriores e sem afirmar que a hospedagem entrega esse gzip.

## Correção encontrada no WhatsApp móvel

A versão anterior também apresentava o problema: o popup fechado do RD deixava uma camada transparente sobre a página. Além disso, o HTML herdava `position:fixed!important` desde o commit `933c80a`. A geração agora remove esse posicionamento inline; a proteção do adaptador permanece para eventuais alterações posteriores. Atribuir a origem desse estilo ao RD não seria correto.

A correção impede a camada fechada de interceptar cliques. Os campos, os endpoints, os eventos nativos e o rastreamento do RD permanecem. No ajuste final aprovado, o atalho fica fixo no celular, com **12 px de folga acima da barra “Quero conhecer”**, e continua disponível durante a rolagem. O posicionamento foi verificado em 390×844 e 320×600, incluindo rolagem real até `scrollY=2572`; não houve sobreposição entre os botões. Em desktop de 1440 px, o atalho retorna ao banner. Troca de banners e abertura/fechamento do widget foram verificadas sem enviar leads.

Validação no navegador: ambos os atalhos abrem o widget; os campos recebem foco; fechar, Escape e reabrir funcionam. O formulário principal também abre e fecha, com os campos oficiais do RD. Não houve novo envio real: recebimento em Marketing/CRM não foi reconfirmado nesta etapa.

## Cache e campanhas

O banner e o JS próprios amostrados no servidor responderam sem `Cache-Control`/`Expires`. O arquivo `seo/production/apache-seo.conf` agora prepara cache longo para imagens com hash, uma semana para JS com versão válida e vídeos, e revalidação para JS sem versão. Não aplica cache público a erros, HTML de fallback, métodos de alteração ou respostas já privadas. Blog e PHP permanecem fora dessas regras específicas.

A configuração foi validada no parser Apache em um diretório temporário; **não foi aplicada ao servidor**. Rafael precisa integrá-la à configuração real da hospedagem. CDN/proxy deve considerar a query string do JS na chave de cache. Depois é necessário conferir os cabeçalhos públicos reais.

GTM `GTM-MTK74PV` permanece na Home como no código recebido. Cursos não tem esse bootstrap no HTML. O PageSpeed observou duas URLs GA4 para `G-07FMTVV06F`; isso não prova dois eventos de conversão. Google Ads, Meta, TikTok, RD e campanhas não foram removidos ou reconfigurados. O próximo ajuste de tags depende de mapear a propriedade/contêiner com seu responsável e verificar eventos na conta.

## Verificações e limites

- Auditoria estática das quatro páginas: dependências locais, metadados, canonicals, H1, dados estruturados, sitemap, robots, carregadores RD, links de WhatsApp e versões dos scripts.
- 19 testes de exportação, 13 de rastreamento, 14 de redirecionamento/cache, 5 contratos de otimização de código e 22 de RD/WhatsApp. Mais 55 verificações comportamentais em DOM para scripts reais, sem rede nem leads.
- Rebuild estável byte a byte; teste isolado reconstruiu 68 referências com hashes antigos após simular nova codificação.
- Imagens verificadas por dimensões, SHA e transparência. Preloads correspondem aos sources e candidatos responsive existem.
- Navegador: Home em celular e desktop, troca dos três banners, menu móvel, formulário, WhatsApp, busca e expansão no FAQ, vídeos de Cursos e carrossel de Quem Somos. Sem erros de console próprios observados nesses fluxos. Sem transbordamento horizontal nas quatro rotas a 390 px e na Home a 1440 px.
- Não testado em aparelho físico/Safari. Sem nova nota PageSpeed da versão otimizada, porque ela ainda está local. Cache/compressão de produção dependem da integração posterior.

Os ganhos de peso são medidos. Ganhos finais de nota, INP, tráfego e posição orgânica ainda não são comprovados. A nota de desempenho não garante indexação nem posicionamento.

## Manutenção e próxima etapa

Dependências Python: `requirements-review.txt` (inclui tinycss2 1.4.0). O gerador JS usa esbuild 0.25.12; testes DOM usam jsdom 26.1.0, conforme [instruções do código](PERFORMANCE-CODE-REVIEW-2026-09-22.md).

Ordem de geração: `optimize-responsive-images.py` → `optimize-page-code.py --esbuild CAMINHO_DO_ESBUILD` → `update-seo-performance.py` → `optimize-static-assets.py` → `prepare-subdirectory.py` → `inventory-images.py` → auditorias/testes → `prepare-subdirectory.py --refresh-manifests`. Todos ficam em `scripts/`; manter as dependências acessíveis ao Python/Node. Não executar os geradores antigos de layout para esta atualização, pois podem substituir ajustes posteriores.

Para futuras recodificações, o pipeline resolve a família da imagem mesmo que o hash anterior tenha sido removido. Se a biblioteca Slick mudar, a geração de core falha até nova revisão de dependências.

O envio por commit e PR para revisão do Rafael foi autorizado; a publicação no servidor continua separada. Após a publicação feita por ele: repetir três medições por página nas mesmas condições, conferir cache real, validar eventos/conversões na conta e acompanhar Search Console/Core Web Vitals. A situação de Search Console e da integração Marketing → CRM depende de acesso/configuração dessas contas, não apenas do HTML.
