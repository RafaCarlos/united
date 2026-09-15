# Correção da prévia no servidor — 15/09/2026

Esta entrega corrige os caminhos de CSS, fontes, imagens, scripts e navegação para a prévia funcionar dentro de uma subpasta. O visual, o conteúdo e os controladores da prévia aprovada foram preservados.

## Aplicar ao teste informado

URL: https://www.unitedidiomas.com/review/united-2026/dist/

1. Faça uma cópia de segurança da pasta de prévia existente.
2. Use os arquivos de `review/united-2026/dist/` desta revisão do GitHub. Se usar o ZIP corrigido, extraia-o na raiz de arquivos do site: ele já contém esse caminho. Não extraia dentro de outra pasta `review/united-2026/dist/`, pois isso duplicaria o caminho.
3. Substitua os arquivos da prévia em `review/united-2026/dist/`, incluindo HTML e assets. Não copie arquivos da prévia para a raiz PHP de produção.
4. Limpe o cache da hospedagem/CDN para esse caminho, se houver, e recarregue a página sem cache. Os bundles CSS corrigidos já têm novos nomes de versão.
5. Confira Home, Cursos, Quem Somos e FAQ, além do menu e das imagens. Se a hospedagem usa regras de reescrita, arquivos e diretórios estáticos existentes devem ser servidos diretamente.

A prévia também funciona em outra subpasta, desde que toda a estrutura de `dist` seja preservada. Para abrir localmente a partir da raiz do repositório: `python3 -m http.server 8766` e acesse `http://localhost:8766/review/united-2026/dist/`.

## Limites preservados

Os formulários continuam demonstrativos e não enviam leads. A prévia mantém `noindex,nofollow`; o `robots.txt` bloqueado deve ficar dentro da prévia. Nunca substitua o robots de produção por esse arquivo.

O site oficial ainda exige a integração PHP e dos formulários reais. A liberação de indexação, metadados, robots e sitemap deve seguir `seo/production/` e `seo/INTEGRACAO.md` do pacote original, somente na integração final ao domínio oficial.

Este ZIP não modifica o PHP da raiz e não contém configurações de publicação automática. Nenhuma alteração foi aplicada ao servidor por esta tarefa.
