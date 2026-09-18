# Correção pontual dos headings de 11 posts

**Diagnóstico realizado em 18/09/2026; alteração no editor ainda não aplicada.** Os 11 artigos sinalizados no censo foram reconferidos no HTML público. Em todos, há **um H1 principal do título em `.et_post_meta_wrapper` e H1 adicionais dentro de `.entry-content`**. Nenhum H1 adicional vem do header, footer ou menu global do tema.

A evidência por URL, com quantidade e caminhos DOM, está em [h1-structure-2026-09-18.json](h1-structure-2026-09-18.json). Esse achado indica uma hierarquia editorial a organizar; não comprova penalização pelo Google e não é motivo para mudar títulos globais do Divi.

| Artigo (slug sob `/blog/`) | H1 do título | H1 no corpo | Plano no editor do post |
|---|---:|---:|---|
| `uso-de-preposicoes-em-ingles` | 1 | 4 | Usar H2 na explicação inicial e nas seções sobre at, in e on. Conferir se exemplos subordinados permanecem em H3 ou parágrafos. |
| `ingles-para-home-office-global` | 1 | 3 | Definição do trabalho remoto global, vantagens e preparação devem ser seções H2 do artigo. |
| `como-se-preparar-para-entrevista-em-ingles` | 1 | 1 | Rebaixar o título interno de preparação para H2; manter o título principal do post em H1. |
| `estude-ingles-na-united-e-decole-sua-carreira` | 1 | 2 | Tratar proposta da escola e aplicação na carreira como H2. Revisar o contexto editorial de 2024 antes de atualizar datas ou ofertas. |
| `carnaval-nos-estados-unidos-mardi-gras` | 1 | 4 | Organizar características da festa, história, comparação com o Brasil e conclusão comercial como seções H2. |
| `pos-graduacao-internacional-no-reino-unido` | 1 | 2 | Trocar os dois títulos internos por H2; se o primeiro apenas repetir o título da página, avaliar transformá-lo em introdução. |
| `conheca-5-autoras-internacionais-para-ler-em-ingles` | 1 | 5 | Cada perfil literário deve ter H2, subordinado ao título do post; nomes das obras dentro desses perfis podem usar H3. |
| `entenda-o-verbo-to-be` | 1 | 4 | Usar H2 em definição, uso, exemplos e dificuldades. Preservar a distinção visual dos exemplos em inglês. |
| `guia-basico-de-ingles-para-viajantes-aurora-boreal` | 1 | 1 | A seção introdutória de observação do fenômeno deve ser H2; revisar a sequência dos tópicos de vocabulário. |
| `intercambio-o-que-e-preciso-e-como-se-preparar` | 1 | 5 | Organizar benefícios, destinos, documentação, bagagem e idioma em H2; verificar validade das informações antes de revisar o texto. |
| `intercambio-au-pair-o-que-e-e-como-funciona` | 1 | 2 | Definição do programa e expressões úteis devem ser H2, mantendo os subtópicos em níveis subsequentes. |

**Procedimento para Rafael/editor:** abrir somente os posts listados em homologação; preservar o H1 principal gerado pelo template; alterar o nível dos headings nos blocos do conteúdo; conferir a hierarquia completa e o resultado visual em celular e desktop. O estilo pode ser mantido pelas opções do próprio módulo, sem manter uma tag H1 incorreta apenas pelo tamanho da fonte.

Depois da publicação, conferir o HTML servido e os links com fragmentos, se houver, além de limpar o cache. Não alterar slugs nem datas só para sinalizar atualização. O plugin deste pacote não transforma tags no conteúdo e não usa substituição global de HTML: a correção depende de acesso ao editor e revisão do layout real.
