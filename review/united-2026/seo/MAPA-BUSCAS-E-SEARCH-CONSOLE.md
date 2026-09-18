# Intenção de busca e Search Console — 18/09/2026

## Conteúdo entregue para revisão

O pedido de inglês online e ao vivo, inglês em 18 meses e conversação foi aplicado em títulos e texto visível. A modernidade da United é explicada por recursos reais: professores ao vivo, storytelling, Jimmy 24/7 e conteúdos sob demanda. Não foram inventados volumes de busca, provas de superioridade, funções de IA ou garantias de fluência.

| Página | Título HTML preparado | Intenção e conteúdo |
|---|---|---|
| / | Inglês online e ao vivo: trilha de 18 meses \| United Idiomas | Inglês online e ao vivo; trilha de 18 meses; recursos para prática. |
| /cursos/ | Cursos de inglês: Live Class e Business \| United Idiomas | Escolha entre Live Class e Business; aulas, duração e inglês no trabalho. |
| /quem-somos/ | Escola de inglês United Idiomas \| Quem somos | Instituição, metodologia comunicativa e unidades híbridas. |
| /faq/ | Inglês em 18 meses e conversação: dúvidas \| United Idiomas | Dúvidas sobre 18 meses, conversação, Jimmy e OnDemand opcional. |

O H1 da Home agora apresenta “Inglês online. Aulas ao vivo. Fale inglês.” nas três linhas do desenho existente. Sua descrição e a chamada de duração tornam clara a oferta. A duração de 18 meses é apresentada como trilha; o FAQ esclarece a relação com nível inicial, frequência e dedicação. A página Cursos mantém Live Class no H1, com o contexto “Curso de inglês online e ao vivo”, e introduz o Business no primeiro parágrafo.

“Conversação em inglês” foi usada naturalmente nas explicações de prática e Jimmy. O Jimmy é apresentado como IA para conversar entre as aulas, sem atribuir correção automática de pronúncia ou avaliações não demonstradas. O OnDemand aparece como opcional na seção dedicada, no cartão, em Cursos e no FAQ.

O FAQ passou de 20 para 22 perguntas. As novas respostas explicam o Jimmy e a prática entre aulas, com links para os recursos existentes. Títulos, descrições, Open Graph e dados WebPage ficam coerentes entre si. O conteúdo comercial principal está no HTML servido, sem depender do RD ou de JavaScript para existir.

Para manutenção, **seo/metadata.json** controla os títulos e descrições, e **seo/content.json** controla estes textos e as cinco perguntas mantidas pelo passo SEO. `update-seo-performance.py` é a aplicação final depois de qualquer atualizador de componente; ele reaplica o texto sobre modelos históricos. Não editar apenas `dist` nem contar com geradores antigos como fonte da versão atual.

O Google considera título, texto principal e links para formar o resultado e pode escolher outra apresentação. Não colocar uma lista de todas as palavras em cada título. Referências: [títulos](https://developers.google.com/search/docs/appearance/title-link) e [conteúdo útil](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## O que está publicado e o que ainda depende de integração

A verificação pública de 18/09 às 15h45 está em [VERIFICACAO-PUBLICA-2026-09-18.md](VERIFICACAO-PUBLICA-2026-09-18.md). Quatro páginas responderam 200, com conteúdo textual, canonical esperado e sem noindex em HTML/cabeçalhos. O robots respondeu 404 e não cria restrição por esse arquivo. Ainda há rótulos de prévia em três páginas e o sitemap raiz antigo não inclui Cursos, Quem Somos e FAQ. O WordPress mantém seu sitemap automático com 182 artigos.

Esses resultados não comprovam visita do Googlebot, indexação ou posição. As melhorias do PR, inclusive os novos títulos deste complemento, só chegam ao domínio quando Rafael publicar a integração. O PR não foi mesclado nem houve alteração na hospedagem.

## Search Console: separar cadastro de rastreamento

Não conseguir configurar o Search Console não impede, por si só, a presença orgânica. A ferramenta serve para acompanhar e diagnosticar. [Explicação do Google](https://support.google.com/webmasters/answer/9128668?hl=pt-BR).

O erro exato da tentativa anterior ainda não foi informado. Portanto, não é possível atribuí-lo a verificação de propriedade, sitemap ou indexação. Para este site, a propriedade **Domínio `unitedidiomas.com`** é útil porque abrange o comercial com www e o blog sem www.

1. **Se a falha foi verificar a propriedade:** usar o registro TXT de verificação fornecido pelo Search Console dessa conta. O responsável pelo DNS adiciona o valor específico e mantém os registros existentes. Nenhum token foi criado ou adicionado por esta revisão. Sem acesso ao DNS, propriedades de prefixo de URL são uma alternativa, mas www e blog sem www precisam de cobertura adequada. [Métodos oficiais de verificação](https://support.google.com/webmasters/answer/9008080?hl=pt-BR).
2. **Se a falha foi enviar sitemap:** depois de publicar o pacote, abrir e enviar `https://www.unitedidiomas.com/sitemap.xml` e `https://unitedidiomas.com/blog/sitemap_index.xml` na propriedade correspondente. Confirmar XML válido/HTTP 200 e nenhuma página de erro. Não enviar endereços localhost ou `/review/`.
3. **Se a falha foi solicitar indexação:** inspecionar as quatro URLs oficiais, usar “Testar URL publicada” e ler o motivo exibido antes de repetir. Conferir HTTP, recursos, robots/noindex e canonical. Solicitação aceita não garante inclusão imediata.

Os dois sitemaps também ficam declarados no robots de produção do pacote, facilitando descoberta fora do painel. A inclusão é uma indicação ao Google, não garantia de rastreamento. [Documentação de sitemaps](https://developers.google.com/search/docs/crawling-indexing/sitemaps/build-sitemap).

Depois da publicação, usar dados reais por página/consulta para decidir novos conteúdos. Acompanhar impressões, cliques, posição e conversões; medir desempenho móvel no servidor. Sem acesso à propriedade, não é possível conferir esses resultados. [Requisitos técnicos de indexação](https://developers.google.com/search/docs/essentials/technical).
