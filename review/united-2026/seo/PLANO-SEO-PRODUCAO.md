# SEO de produção: execução e critérios de qualidade

Atualizado em 18/09/2026. Este plano se refere ao site oficial da United Idiomas e ao blog. O objetivo é uma operação de SEO consistente: páginas úteis, publicação tecnicamente correta, evidências pedagógicas e acompanhamento de resultados. “AAA” não é uma certificação de SEO do Google. Indexação e posições não podem ser prometidas por um pacote de código.

O código entregue no GitHub e o servidor público são estados diferentes. O aceite só deve ser registrado como publicado depois da conferência HTTP no domínio. O [diagnóstico público](VERIFICACAO-PRODUCAO-FINAL-2026-09-18.md) registra a coleta anterior às alterações desta entrega.

## 1. Concluir a publicação de produção

**Responsável:** Rafael/hospedagem. **Aceite:** evidências das URLs públicas, e não apenas testes locais.

- Publicar os HTMLs ou integrar seus conteúdos e cabeçalhos no PHP existente, preservando `/blog/`, o formulário RD, o GTM e o funcionamento das URLs atuais.
- Entregar `robots.txt` como texto na raiz do domínio, com resposta HTTP 200 e regras que permitam páginas e recursos públicos. Declarar o sitemap comercial e o índice atualizado do WordPress. Verificar as regras efetivamente servidas em `www` e sem `www`; robots é específico por host.
- Manter no sitemap comercial somente URLs canônicas existentes, com HTTP 200 e conteúdo que deva aparecer na busca. O WordPress continua responsável pelo sitemap de artigos; não substituir seu índice automático por uma lista congelada.
- Remover da apresentação pública todos os rótulos de revisão/prévia. Cópias históricas em caminhos de revisão devem ser retiradas da publicação ou excluídas da indexação pelo servidor. Não usar `Disallow` como substituto de `noindex`: um robô bloqueado não consegue ler essa diretiva. [Como o Google interpreta o noindex](https://developers.google.com/search/docs/crawling-indexing/block-indexing).
- Conferir um salto de redirecionamento por URL antiga com equivalente real, sem loops; páginas inexistentes devem responder 404/410 conforme a decisão editorial, sem entregar a Home com HTTP 200.
- Conferir os links internos do blog usando o host canônico existente, `https://unitedidiomas.com/blog/`. Uma eventual unificação do blog em `www` precisa de migração própria; não mudar seus canonicals isoladamente.

Não é necessário substituir todos os identificadores internos de CSS/JavaScript que contêm a palavra `preview` para o Google indexar. O que importa é a página servida, suas diretivas e o que a pessoa vê. Renomeações técnicas só devem ocorrer quando forem verificadas com os controladores dependentes.

## 2. Tornar as páginas comerciais mais úteis que uma coleção de palavras-chave

**Responsável:** coordenação pedagógica e marketing, com integração por Rafael. **Aceite:** cada informação confirmada pela operação e apresentada de modo visível.

| Tema e destino atual | Evidência a produzir | Critério para publicar |
|---|---|---|
| Inglês online e ao vivo — Home e `/cursos/#live-class` | Exemplo real de uma aula, como agendar, como funciona o nivelamento e quais formatos estão disponíveis. | Informações aprovadas pela coordenação; imagens e exemplos próprios, com direitos de uso. |
| Inglês em 18 meses — Live Class e FAQ | Etapas da trilha, dedicação esperada, ponto de partida e forma de avaliar a evolução. | Separar duração proposta de garantia individual de fluência. Não inventar carga horária nem equivalência de nível. |
| Conversação em inglês — Live Class e Jimmy | Uma atividade comentada e explicação da prática com professor e com IA. | Demonstrar a função real de cada recurso e seus limites; não atribuir avaliação/correção automática que o produto não oferece. |
| Inglês profissional — `/cursos/#united-business` | Situações de reunião, apresentação e negociação efetivamente trabalhadas no curso. | Conferir público, pré-requisitos, duração e condições de certificação com a equipe. |
| Instituição — `/quem-somos/` | Responsáveis pedagógicos, processo de acompanhamento e provas das afirmações institucionais. | Nomes, experiência e números verificáveis; autorização para depoimentos e casos de alunos. |
| Acesso às plataformas — FAQ | Explicação dos nomes Live Class, UNITEDON, Jimmy e United OnDemand e do que está incluído em cada contratação. | Não inferir que UNITEDON e OnDemand são o mesmo produto. Resolver termos como “acesso total” e “qualquer curso” com as condições comerciais reais. |

Uma página própria para Live Class ou Business pode ser uma evolução útil quando houver esse conteúdo completo e específico. Não criar páginas separadas para cada sinônimo (“inglês online”, “inglês ao vivo”, “conversação online”) repetindo a mesma oferta. Antes de criar novos slugs, definir como se relacionam com `/cursos/`, quais URLs antigas possuem equivalentes e quais links precisam mudar.

Organizar leitura complementar nos pontos pertinentes: artigo sobre estudo sozinho/professor junto à decisão de modalidade; artigo sobre IA junto ao Jimmy; artigo de viagem junto à prática de conversação. Usar links HTML descritivos e destinos verificados, com caminho de retorno para a oferta correspondente.

Conteúdo original, exemplos próprios e autoria clara têm mais utilidade que aumentar a repetição de termos. O Google recomenda informações que realmente ajudem o visitante a resolver sua dúvida. [Conteúdo útil e confiável](https://developers.google.com/search/docs/fundamentals/creating-helpful-content).

## 3. Tratar o blog como um acervo editorial

**Responsável:** editor e professor revisor; Rafael para apresentação WordPress. **Aceite:** revisão registrada por artigo, preservando URLs válidas.

O censo técnico cobre 182 artigos do sitemap. Foram identificados 47 artigos com descrições repetidas e 11 com hierarquia de H1 a revisar. O plugin preparado contempla 48 descrições, incluindo o artigo de IA, e ajustes de apresentação. Esses números não significam leitura e aprovação pedagógica dos 182 textos. Ver [auditoria do acervo](wordpress/AUDITORIA-ACERVO.md).

Priorizar conteúdos com impressões relevantes no Search Console, dúvidas frequentes dos alunos e alinhamento aos cursos. Para cada artigo prioritário, registrar:

1. Pergunta principal respondida e exemplos que faltam.
2. Responsável real pela redação/revisão; fontes quando houver afirmações factuais.
3. Exercício ou diálogo original, resposta comentada e contexto de uso.
4. Links para artigos complementares e para o curso pertinente.
5. Oferta, data ou informação desatualizada; revisar substancialmente antes de alterar a data de atualização.

Começar pelos três artigos já avaliados editorialmente: `aprender-ingles-sozinho-ou-com-professor`, `ia-aprender-ingles-habilidades-humanas` e `ingles-viajar-europa-outono`. Depois ampliar por intenção: rotina de estudo e conversação; inglês profissional; inglês para viagens. A pauta deve vir das perguntas reais e dos dados, sem meta artificial de quantidade de textos.

## 4. Construir presença local verificável

**Responsável:** gestores das unidades e marketing. **Aceite:** informações consistentes no site, no atendimento e no Perfil da Empresa.

As seis unidades apresentadas no pacote são Cornélio Procópio, Ipiranga, Maringá, Osasco, Santo Amaro e Tatuapé. Antes de criar páginas locais, confirmar endereço completo, atendimento presencial, horários, telefone, modalidades, fotos atuais e Perfil da Empresa verificado. Cada página precisa explicar aquela unidade, com informação que ajude alguém a visitá-la ou contratar nela.

Os dados `Place` atuais repetem informações exibidas. Só ampliar a marcação local com os dados efetivamente confirmados. Não inventar coordenadas, horários, avaliações ou unidades. Não criar páginas de cidades sem presença ou oferta comprovada. Páginas quase iguais, trocando apenas o local e levando ao mesmo destino, podem caracterizar páginas de entrada artificiais. [Políticas do Google sobre páginas de entrada](https://developers.google.com/search/docs/essentials/spam-policies#doorway-abuse).

Atualizar e responder aos Perfis da Empresa e obter avaliações espontâneas de clientes reais. Busca local considera relevância, distância e destaque; informação completa e precisa ajuda a correspondência com a pesquisa. [Orientações oficiais para busca local](https://support.google.com/business/answer/7091?hl=pt-BR).

## 5. Medir experiência e conversão depois da publicação

**Responsável:** Rafael e marketing. **Aceite:** relatório com URL, dispositivo, data e origem da medição.

Medir as quatro páginas comerciais e modelos de página do blog em mobile e desktop. A redução dos arquivos já realizada não é uma nota Lighthouse nem uma medição de usuários reais. Diagnosticar o elemento LCP, resposta inicial do servidor, JavaScript de terceiros e deslocamentos do formulário RD com base nos dados.

Como referência de experiência, buscar LCP até 2,5 s, INP até 200 ms e CLS até 0,1, avaliando o percentil 75 dos dados de campo e separando dispositivos. Resultados de laboratório servem para depuração; Core Web Vitals reais dependem do tráfego observado e não garantem posição. [Core Web Vitals no Google Search](https://developers.google.com/search/docs/appearance/core-web-vitals) e [avaliação das métricas de campo](https://web.dev/articles/defining-core-web-vitals-thresholds).

Confirmar com um teste autorizado o recebimento no RD Marketing, o encaminhamento ao CRM e a preservação da origem orgânica. Registrar conversões por página de entrada e tipo de contato, além de cliques/impressões. Uma mensagem de sucesso no formulário não comprova a etapa CRM.

## 6. Search Console como instrumento de diagnóstico

**Responsável:** proprietário da conta/domínio. **Aceite:** propriedade verificada e evidências dos relatórios.

Verificar a propriedade de domínio `unitedidiomas.com`, quando houver acesso ao DNS, ou a propriedade de prefixo correta. Usar exclusivamente o token exibido pela conta; não criar um código de verificação fictício. O erro da tentativa anterior precisa ser identificado: propriedade, sitemap e inspeção de URL são etapas distintas. O [guia de configuração](MAPA-BUSCAS-E-SEARCH-CONSOLE.md) descreve os caminhos.

Depois da publicação, enviar o sitemap comercial e o índice do WordPress, inspecionar as quatro URLs comerciais e uma amostra de artigos e conferir conteúdo renderizado, canonical escolhido e impedimentos. O teste ao vivo verifica elegibilidade e acesso naquele momento; não equivale à comprovação de indexação, e solicitar indexação não obriga o Google a indexar. [Inspeção de URL](https://support.google.com/webmasters/answer/9012289?hl=pt-BR).

Registrar antes/depois com períodos comparáveis. Separar buscas pela marca, curso online/ao vivo, conversação, negócios e unidades. Acompanhar páginas válidas indexadas, motivo de exclusões, cliques, impressões, CTR e leads qualificados. Comparar também dispositivo e sazonalidade; não atribuir toda variação a uma edição isolada.

## Dados estruturados e recursos atuais do Google

Manter `Organization`/`EducationalOrganization`, `WebSite`, `WebPage`, `BreadcrumbList` e dados de curso/local somente onde representam conteúdo verdadeiro. JSON-LD descreve conteúdo; não substitui informações visíveis, prova de qualidade ou acesso do robô. A marcação válida não garante destaque. [Políticas gerais de dados estruturados](https://developers.google.com/search/docs/appearance/structured-data/sd-policies).

Não vender FAQ como atalho para resultado expandido: o Google encerrou a exibição desse recurso em **7 de maio de 2026**. O FAQ continua útil para pessoas e para explicar a oferta. [Registro oficial de alterações de 2026](https://developers.google.com/search/updates).

O recurso **Course info** foi descontinuado em 2025; a documentação de **Course list** continua distinta e indica disponibilidade em inglês. Não criar cursos fictícios, preços ou avaliações para tentar preencher um formato de busca. [Descontinuação de recursos](https://developers.google.com/search/blog/2025/06/simplifying-search-results) e [documentação de Course list](https://developers.google.com/search/docs/appearance/structured-data/course).

Não há arquivo especial ou marcação adicional obrigatória para aparecer nas experiências de IA da busca. O mesmo trabalho de acesso, conteúdo e qualidade continua aplicável; a participação não é garantida. [Recursos de IA e seu site](https://developers.google.com/search/docs/appearance/ai-features).

## Ordem de execução e entregáveis

| Ordem | Entregável verificável | Responsável |
|---|---|---|
| 1 | Produção publicada sem rótulos de prévia; robots/sitemaps acessíveis; URLs e redirecionamentos conferidos. | Rafael/hospedagem |
| 2 | Search Console verificado; URLs inspecionadas; referência de dados orgânicos e de experiência registrada. | Proprietário do domínio + marketing |
| 3 | Condições das trilhas e plataformas esclarecidas; responsáveis e evidências pedagógicas publicados. | Coordenação + marketing |
| 4 | Correções do WordPress integradas e artigos prioritários revisados com exemplos próprios. | Editor + professor + Rafael |
| 5 | Dados das unidades verificados e páginas locais úteis, quando houver conteúdo suficiente. | Unidades + marketing |
| 6 | Revisão mensal de consultas, indexação, experiência e leads, com próximas ações baseadas nos dados. | Marketing + desenvolvimento |

Essa execução é o padrão profissional proposto para a United; não resulta de uma auditoria dos processos internos de concorrentes específicos. Publicação, contas, dados de unidades e aprovação pedagógica são dependências concretas, não etapas simuladas como concluídas pelo código.
