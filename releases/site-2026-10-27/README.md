# Atualização do site United — 27/10/2026

Rafael: usar este pacote cumulativo. Ele **substitui o de 26/10/2026** e inclui a retirada aprovada de Osasco da página Quem somos, o botão “Quero conhecer” vermelho, as nove variantes WebP já entregues e a correção da mão no banner inicial do Live Class. O envio ao Git não publica na hospedagem.

**[Baixar o ZIP de publicação](United-Site-Ajustes-2026-10-27.zip)** · [Manifesto dos arquivos](MANIFEST.json)

## O que muda

- Corrigido o dedo extra na mão levantada da personagem de roxo no banner inicial do Live Class. Novas imagens WebP de 1672 × 941 (180 KB) e 960 × 540 (88 KB), com nomes novos para renovar o cache. O enquadramento e o layout foram preservados.

- Osasco, seu endereço e seus links de contato saem da listagem de unidades em Quem somos.
- Permanecem Cornélio Procópio, Ipiranga, Maringá, Santo Amaro e Tatuapé, numeradas de 01 a 05. Seus contatos foram preservados.
- Desktop: três cards e dois centralizados. Tablet: dois, dois e um centralizado. Celular: coluna única. Endereço e contato continuam expansíveis.
- O pacote mantém os ajustes de 26/10: CTA vermelho `#df1649`, WhatsApp verde e imagens WebP responsivas.

## Publicação

1. Fazer backup atual dos oito arquivos que serão substituídos: os seis HTML comerciais, `/contact-form.css` e `/quem-somos/authority.css`.
2. Extrair o ZIP e copiar **somente o conteúdo de `publicar/`** para a raiz pública de `https://www.unitedidiomas.com/`, respeitando os caminhos. São **19 arquivos: seis HTML, dois CSS e onze WebP**.
3. Enviar primeiro os CSS e as imagens; depois os seis HTML. A referência de Quem somos pede `/quem-somos/authority.css?v=996cf081a0ee`; o formulário usa `/contact-form.css?v=4b9c86645440`.
4. Invalidar o cache das seis páginas e dos dois CSS na hospedagem/CDN. As onze imagens novas já têm hash no nome.
5. Conferir `/quem-somos/#unidades` em desktop e celular: cinco unidades, sem Osasco, contatos abrindo e sem rolagem horizontal. Conferir também o CTA vermelho, WhatsApp verde e abertura do formulário nas páginas comerciais. Conferir o banner corrigido em `/cursos/live-class/`, inclusive após recarregar no celular. Não é necessário gerar outro lead de teste.

**Não aplicar o pacote de 26/10 depois deste:** ele recolocaria Osasco. Se a entrega de 26/10 já tiver sido aplicada por completo, este ZIP é compatível; o delta específico de unidades é somente `quem-somos/authority.css` e `quem-somos/index.html`. A correção do banner acrescenta `cursos/live-class/index.html` e as duas imagens `assets/capa-times-square-v3-*.webp`. Se a retirada de Osasco já tiver sido publicada, basta aplicar esses três arquivos do banner.

Não publicar `dist/` completo nem `dist/blog/`. Não enviar `rollback/`, `conferencia/`, manifestos ou guias à raiz pública. O WordPress, seus artigos, PHP, banco, `.htaccess`, robots e sitemap ficam fora deste ajuste. `home/assets/`, `business/assets/` e `assets/` são caminhos de imagens necessários.

## Reversão

Preferir o backup feito imediatamente antes da publicação. O ZIP também contém oito arquivos em `rollback/`: sete da captura pública de 26/10, que ainda coincidiam com o site na conferência de 27/10, e `quem-somos/authority.css` capturado em 27/10. Restaurá-los nos caminhos correspondentes e invalidar o cache reverte o pacote inteiro, inclusive a remoção de Osasco. Para reverter somente a remoção, restaurar os dois arquivos de Quem somos do backup imediatamente anterior. As onze imagens novas podem permanecer sem uso. Preservar as imagens antigas `capa-times-square-v2-*` na hospedagem, necessárias caso o HTML anterior seja restaurado.

## Validação

Build e referências passaram: 213 páginas, 18.546 referências, zero erros. As seis páginas comerciais têm zero erros e zero avisos na auditoria SEO. Os 207 avisos do acervo estático histórico do blog já existiam e não fazem parte desta publicação. Grid conferido no navegador em 1440 × 900, 900 × 900 e 390 × 844, sem rolagem horizontal; abertura e fechamento do endereço pelo teclado confirmados. Contatos das outras cinco unidades e demais seções foram preservados.

O banner corrigido foi conferido no navegador em 1440 px e 390 px, sem rolagem horizontal e carregando a versão responsiva correta. A fonte está em `review/united-site-2026-10-21/src/quem-somos/` e `src/index.html`; `dist/` foi regenerado e o HTML referencia o hash do CSS novo. Não foi feito envio de lead nem alteração no WordPress.

[Visual desktop](conferencia/unidades-desktop.png) · [Visual mobile](conferencia/unidades-mobile.png) · [Resultado da conferência](conferencia/resultado.json)

[Banner Live Class desktop](conferencia/liveclass-banner-desktop.png) · [Banner Live Class mobile](conferencia/liveclass-banner-mobile.png)
