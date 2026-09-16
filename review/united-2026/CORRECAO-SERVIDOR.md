# Correção da prévia no servidor — 15/09/2026

A correção de 15/09/2026 ajustou os caminhos de CSS, fontes, imagens, scripts e navegação para a prévia funcionar dentro de uma subpasta, preservando a apresentação aprovada. Esta revisão também inclui a integração do formulário oficial RD Station de 16/09/2026, descrita em `seo/RD-STATION.md`.

## Aplicar ao teste informado

URL: https://www.unitedidiomas.com/review/united-2026/dist/

1. Faça uma cópia de segurança da pasta de prévia existente.
2. Use os arquivos de `review/united-2026/dist/` desta revisão do GitHub. Se usar um ZIP desta revisão, extraia-o na raiz de arquivos do site: ele já contém esse caminho. Não extraia dentro de outra pasta `review/united-2026/dist/`, pois isso duplicaria o caminho. O ZIP anterior, apenas com a correção de caminhos de 15/09, não contém a integração RD Station.
3. Substitua os arquivos da prévia em `review/united-2026/dist/`, incluindo HTML e assets. Não copie arquivos da prévia para a raiz PHP de produção.
4. Limpe o cache da hospedagem/CDN para esse caminho, se houver, e recarregue a página sem cache. Os bundles CSS corrigidos já têm novos nomes de versão.
5. Confira Home, Cursos, Quem Somos e FAQ, além do menu e das imagens. Se a hospedagem usa regras de reescrita, arquivos e diretórios estáticos existentes devem ser servidos diretamente.

A prévia também funciona em outra subpasta, desde que toda a estrutura de `dist` seja preservada. Para abrir localmente a partir da raiz do repositório: `python3 -m http.server 8766` e acesse `http://localhost:8766/review/united-2026/dist/`.

## Limites preservados

O formulário oficial RD Station `lp-vamos-coversar-cbaf85f09c7f676d42c3` substitui os formulários demonstrativos e envia diretamente pelo RD, sem PHP legado em paralelo. Um único embed por página é movido entre o contato junto ao rodapé e o diálogo. O SDK é carregado de `https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js`.

**Os testes do formulário na prévia podem criar leads reais.** A confirmação de recebimento exige conferir a conta RD Station; esta documentação não afirma que o teste final passou. A prévia mantém `noindex,nofollow`; o `robots.txt` bloqueado deve ficar dentro da prévia. Nunca substitua o robots de produção por esse arquivo.

A integração ao site oficial ainda precisa ser revisada, mantendo o PHP de produção separado. A liberação de indexação, metadados, robots e sitemap deve seguir `seo/production/` e `seo/INTEGRACAO.md`, somente na integração final ao domínio oficial.

Esta revisão não modifica o PHP da raiz e não contém configurações de publicação automática. Nenhuma alteração foi aplicada ao servidor por esta tarefa.
