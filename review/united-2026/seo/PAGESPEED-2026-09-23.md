# Revisão de desempenho e cores de 23/09/2026

Pacote aprovado para revisão de Rafael no GitHub, na branch `codex/united-cwv-2026-09-23`. Sem merge ou alteração no servidor. Base: origin/main `97265d0`, que incorporou o PR #6; os recursos públicos consultados correspondem ao pacote anterior `6f0ed4f`. Todas as alterações ficam em `review/united-2026/`, preservando o PHP da raiz.

## Relatório que orientou o trabalho

[PageSpeed de 23/09, 11:44 BRT](https://pagespeed.web.dev/analysis/https-unitedidiomas-com/16d8uxo9sj?form_factor=mobile), Lighthouse 13.5.0.

| Métrica de laboratório | Mobile | Desktop |
|---|---:|---:|
| Desempenho | 45 | 60 |
| LCP | 12,356 s | 1,888 s |
| TBT | 697 ms | 1.637 ms |
| CLS | 0 | 0,002 |
| SEO | 85 | 85 |
| Navegação agêntica | 1/2 | 1/2 |

O histórico dos últimos 28 dias reprova INP mobile (434 ms) e CLS desktop (0,36). Não é uma medição isolada da publicação de hoje; resultados locais não atualizam esse histórico.

## Correções implementadas

- Banners desktop: geometria inicial alinhada ao cálculo final; medidas lidas antes de alterar o DOM; resize agrupado por quadro; troca por clique/teclado, sem expansão ao apenas passar o mouse.
- Imagens: candidatas WebP de 680 px para retratos e 768 px para storytelling; compressão revisada preservando originais e transparência. As 15 imagens selecionadas, em dimensão máxima, passam de 1.891.798 para 1.793.724 bytes. Isso não é o peso total de uma visita.
- Teasers exclusivos de desktop: picture com condição de largura dentro do SVG mantém os recortes/gradientes. No mobile, o fallback é inline; três retratos de 1122 px deixam de ser solicitados (~493 KB). Não depende de JavaScript para escolher a mídia.
- Vídeos abaixo da dobra usam loading=lazy nativo, incluindo pôster em navegadores compatíveis. Primeiros vídeos visíveis de Cursos e Quem Somos continuam eager. Sem mudança de fonte, frame ou proporção.
- Scripts próprios de menu, contato, WhatsApp e vídeo executam antes do SDK remoto RD; o inicializador do formulário continua depois do SDK. Loader async e tags de marketing permanecem.
- Navegação agêntica: grupos de banners deixam de usar article com papel incompatível; popup fechado RD fica inerte e fora da árvore acessível; os dois campos antispam readonly são ocultos, preservando nome, tipo, valor e serialização.
- SEO: link do RD para alunos ganha texto descritivo; controle oculto de país deixa de apresentar um falso link javascript. País BR e máscara do telefone mantidos.
- Contraste dos indicadores de depoimentos aumenta de 4,40:1 para 5,01:1. Ícone WhatsApp usa vetor existente, sem pixelização.
- Reset mínimo de margem/padding entregue no head para estabelecer a origem do layout antes do CSS externo.
- Cores aprovadas: Área do Aluno no cabeçalho/menu móvel e botões WhatsApp usam verde #25D366, com texto #0B2947 e ícones escuros. Hover #20BD5A; contraste de texto de 7,44:1 no estado normal e 5,97:1 no hover. Destinos preservados; o atalho móvel continua fixo 12 px acima da barra Quero conhecer. Formulário principal mantém o envio vermelho.

## Pendências da publicação e das contas

1. O servidor respondeu sem Cache-Control/Expires nos recursos próprios auditados. Gzip está ativo. Rafael precisa aplicar/mesclar e validar as regras de cache já fornecidas em seo/production/apache-seo.conf, sem substituir o .htaccess existente. HTML revalida; assets com hash usam cache longo; preservar políticas private/no-store e regras do WordPress.
2. No relatório público, GTM/Google tags, Facebook, RD, TikTok e Clarity concentram o custo de CPU. Inventariar tags e gatilhos com os responsáveis, preservar atribuição e testar cada mudança. Dois downloads do mesmo ID GA4 com URLs diferentes não provam duplicação de eventos.
3. A chamada externa event.getblue.io/js/blue-tag.min.js falhou tanto no PSI como localmente. Identificar sua origem/dono e corrigir ou retirar a integração na conta responsável após validar sua necessidade. Não mascarar erros no site.
4. Após a publicação futura, repetir três medições frias por dispositivo no domínio HTTPS, usar a mediana e validar conversão RD real. Conferir PageSpeed/Search Console ao longo da janela de campo. Não prometer aprovação de Core Web Vitals imediata.

## Limites dos ensaios locais

Os JSONs de diagnóstico ficam fora do repositório, em performance-evidence-2026-09-23. Lighthouse local 13.4.1, computador e servidor HTTP local diferem do PSI 13.5.0: sem gzip/cache do Apache, cookies do perfil, aviso de IndexedDB e tags dependentes do domínio. Não comparar a nota local com a pública como se fosse ganho de produção. Nenhum lead foi enviado nesta revisão.

## Validação concluída

Lighthouse local após as mudanças de desempenho, antes do ajuste posterior de cores (uma amostra por dispositivo; não é resultado de produção):

| Perfil | Desempenho | LCP | TBT | CLS | Acessibilidade | SEO | Agêntica |
|---|---:|---:|---:|---:|---:|---:|---:|
| mobile | 71 | 4.905 s | 311 ms | 0.000 | 100 | 100 | 2/2 |
| desktop | 97 | 1.199 s | 0 ms | 0.001 | 100 | 100 | 2/2 |

Práticas recomendadas locais: 54, com falhas de terceiro HTTP Blue, cookies externos e painel de problemas. O servidor público HTTPS teve 92 no relatório fornecido; a origem do Blue ainda precisa ser corrigida. Não apresentar somente os resultados verdes como se toda a auditoria estivesse aprovada. O mobile permanece abaixo da meta de excelência.

- Auditoria estática: quatro páginas, 190 dependências próprias, nenhum erro.
- Nesta revisão passaram 55 testes Python, 26 testes de RD, 5 de banners e 55 verificações comportamentais das quatro páginas. Sintaxe Apache validada sem iniciar servidor.
- No Chrome: formulário RD abre com campos Nome/Celular/Email; BR preservado; controles antispam fora da navegação, sem mudança de serialização; popup WhatsApp abre/fecha e restaura foco; menu móvel e FAQ funcionam; carrossel institucional inicializa; vídeos e controles operam. Nenhum envio de lead real.
- Mobile 390×844: atalho WhatsApp fixo, 12px acima da barra Quero conhecer após rolagem.
- Desktop 1440×900: imagens e recortes dos banners preservados; troca por clique/teclado.
- Trace/requisições da rodada móvel final: zero solicitações de retratos1122w; nenhum CLS reportado.
- Os manifestos são atualizados após a validação final; exportação separada em modo production mantém index,follow, sitemap e robots comerciais.
- Conferência final anterior ao envio ao GitHub: suítes Python/Node e auditoria estática reexecutadas após o ajuste de cores; manifestos e exportação de produção verificados novamente. Cores e espaço do atalho móvel conferidos no Chrome; este ajuste visual não recebeu uma nova rodada Lighthouse.

[Plano de terceiros e validação da captação](TERCEIROS-2026-09-23.md).
