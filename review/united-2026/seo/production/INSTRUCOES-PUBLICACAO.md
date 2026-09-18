# Publicar a entrega de produção da United

Esta revisão prepara arquivos para Rafael avaliar e integrar. O exportador não publica no servidor, não altera o PHP da raiz, não faz merge e não escreve no Git. Requer o Python com as dependências de `requirements-review.txt`.

## Produção

Na pasta `review/united-2026`, gerar uma cópia fora do repositório:

```bash
python scripts/export-production.py --mode production --output /private/tmp/united-production-2026-09-18
```

O conteúdo para integração fica em `/private/tmp/united-production-2026-09-18/site/`. A pasta `publication/` contém estas instruções e, quando disponível, `apache-seo.conf`; ela não deve ser copiada para a raiz pública. O arquivo `.united-export.json` registra o modo e os hashes da exportação e também fica fora da raiz pública.

O modo de produção:

- exige páginas comerciais sem diretivas `noindex`, `nofollow` ou `none` e falha se alguma reaparecer na origem;
- remove os rótulos visuais `.preview-mark` e elementos explicitamente marcados `data-preview-only` na cópia;
- usa `robots.txt` e os arquivos `sitemap*.xml` de `seo/production/`; valida acesso a páginas/recursos, exceção AJAX e descoberta dos dois sitemaps;
- exige canonical correto, títulos próprios, pt-BR, um H1 e exatamente as quatro páginas do sitemap comercial em `urlset`; recusa HTML de rascunho fora do inventário;
- exclui a rota de comparação, arquivos ocultos, mapas de código e artefatos de depuração;
- preserva o HTML funcional, scripts RD, formulários, GTM, links de WhatsApp e Área do Aluno;
- verifica links e recursos locais de HTML e CSS, inclusive nas rotas internas, e interrompe a exportação se um recurso faltar ou sair da raiz da cópia.

Nomes como `preview.js`, `contact-preview.js` e classes de layout que contêm `preview` continuam existindo porque fazem parte do funcionamento do site. Não apagar esses recursos por causa do nome.

O conteúdo de `dist` é a origem comercial. Se um gerador antigo recolocar `noindex`, corrigir o gerador e regenerar a origem antes de exportar. O exportador de produção não remove silenciosamente esse bloqueio: a recusa evita publicar um pacote cuja configuração está ambígua.

## Ferramenta de desenvolvimento — não é a entrega de produção

Gerar uma cópia separada, também fora do repositório:

```bash
python scripts/export-production.py --mode preview --output /private/tmp/united-preview-2026-09-18
python -m http.server 8768 --bind 127.0.0.1 --directory /private/tmp/united-preview-2026-09-18/site
```

A prévia recebe `noindex,nofollow` em todos os HTML e `Disallow: /` no `robots.txt`. Não leva sitemap nem fragmento Apache de produção. Servir apenas `site/`. Esses bloqueios de buscadores não são controle de acesso; para uma prévia pública reservada, proteger o ambiente por autenticação no servidor. Os formulários RD continuam reais: a prévia não simula envios nem desliga a conta Marketing.

O modo é sempre obrigatório. Não é permitido exportar para dentro do repositório, para a própria fonte, para seus diretórios pais nem através de links simbólicos. Uma saída existente é recusada. `--force` só substitui uma exportação anterior identificada deste mesmo pacote, após validar toda a nova cópia; arquivos alheios adicionados à saída impedem a substituição. Não usar a pasta da hospedagem como saída do exportador.

## Integração manual pelo responsável da hospedagem

1. Revisar o PR e manter backup do site e da configuração atual. A cópia estática cobre Home, Cursos, Quem Somos e FAQ. Preservar blog, conteúdo antigo relevante, PHP e demais serviços existentes; não substituir toda a raiz por uma pasta vazia seguida desta cópia.
2. Integrar os arquivos de `site/` ao destino correto, mantendo caminhos e ativos correspondentes. Não enviar `publication/`, `.united-export.json`, `src/` nem `scripts/` para a raiz pública.
3. Analisar `publication/apache-seo.conf` quando presente e incorporar somente as regras compatíveis à configuração existente. O exportador nunca gera nem sobrescreve `.htaccess`. Verificar a precedência entre `index.php` e `index.html`, as regras antigas e os módulos disponíveis no Apache. Em Nginx, traduzir e testar as regras na configuração própria do servidor.
4. Conferir uma única inclusão do loader RD por página renderizada. O PHP existente pode já incluir esse loader em `includes/footer.php`. Preservar um embed de contato por página, seus adaptadores e os destinos separados de WhatsApp. Testar os eventos no navegador e confirmar uma conversão autorizada no RD Marketing; o encaminhamento ao CRM exige a integração configurada na conta.
5. Verificar no endereço publicado as quatro páginas com HTTP 200, canonicals corretos, ausência de `noindex` no HTML e de `X-Robots-Tag: noindex` na resposta. Conferir `robots.txt`, todos os sitemaps e cada redirecionamento aprovado; rotas sem substituto não devem redirecionar genericamente para a Home.
6. Confirmar que a hospedagem serve os arquivos novos, invalidar caches necessários e testar navegação, formulário, WhatsApp, Área do Aluno e imagens em celular e computador.
7. Somente após essas verificações, enviar o sitemap ao Search Console e inspecionar as quatro URLs. O pacote prepara o rastreamento e a indexação; não consegue confirmar sozinho quando o Google voltará a rastrear, qual canônica escolherá ou a posição das páginas.

## Testes locais do exportador

```bash
python scripts/test-production-export.py
```

Os testes usam cópias temporárias, validam separação de ambientes, links internos, integridade dos controles RD, recusa de caminhos perigosos e preservação de uma exportação anterior quando a nova falha. Não acessam a rede nem enviam leads.
