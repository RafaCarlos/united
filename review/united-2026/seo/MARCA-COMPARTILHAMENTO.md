# Marca no Google e no compartilhamento

Foram criadas composições separadas, com fundo azul #012858, para manter a marca visível sobre superfícies claras. O desenho foi reutilizado diretamente do PNG original, sem geração de uma nova marca ou alteração do arquivo usado pelo site.

| Arquivo em `dist/` | Uso | Dimensões | Tamanho |
|---|---|---|---:|
| `assets/brand/favicon-192.png` | Símbolo para o Google e navegadores | 192 × 192 | 10.209 bytes |
| `favicon.ico` | Alternativa para navegadores | 16, 32, 48 e 64 px | 4.749 bytes |
| `assets/brand/united-share-1200x630.png` | Cartão de compartilhamento | 1200 × 630 | 42.558 bytes |
| `assets/brand/united-logo-512.png` | Logo completa nos dados estruturados da organização | 512 × 512 | 32.940 bytes |

Todos os arquivos possuem fundo opaco. O cartão contém somente a logo original centralizada, sem frase ou slogan, com espaço para acomodar recortes de miniatura. Os diferenciais continuam nos títulos e descrições das tags de compartilhamento. O favicon usa somente o símbolo; a versão estruturada usa a logo completa, sem slogan.

## Preservação da logo do site

`assets/images/logo-united-idiomas.png` permanece com o mesmo SHA-256 `3bb63a15868f16fa05c6bd58f1fd87ceb9e319e841375c520bd2ea523ff08b36`. Os logos do cabeçalho, menu móvel e rodapé conservam referências, dimensões e estilos. A auditoria verifica essa preservação nas quatro páginas.

## Integração

As quatro páginas e seus fragmentos `seo/production/*-head.html` incluem favicon, Open Graph com dimensões/tipo/texto alternativo e cartão Twitter com imagem grande. JSON-LD aponta para a nova logo completa de 512 px. Os novos arquivos não são colocados no corpo das páginas nem adicionados a preloads.

Exportar pelo modo `production` habitual e publicar os arquivos e os metadados juntos. O exportador inclui automaticamente `assets/brand/` e o `favicon.ico` da raiz da saída. Para integração em PHP, aplicar os fragmentos correspondentes e copiar também os quatro arquivos. Não substituir a logo visível pelo cartão ou pelo favicon.

Após a publicação por Rafael, conferir respostas HTTP 200 e MIME correto, rastreabilidade da Home e do ícone e um novo compartilhamento do link no WhatsApp. O resultado nas plataformas depende da publicação e de seus caches; este pacote não comprova atualização do Google ou do WhatsApp. Pode-se solicitar novo rastreamento da Home no Search Console; o Google informa que a atualização pode levar dias ou semanas.

## Reprodução e verificação

Os arquivos estão prontos para servir; a hospedagem não precisa de Node. Para regenerar a arte, o script opcional `scripts/build-brand-assets.cjs` usa Node com `@napi-rs/canvas` 0.1.100. A biblioteca pode ser instalada somente no ambiente de desenvolvimento com `npm install --no-save --package-lock=false @napi-rs/canvas@0.1.100`.

```sh
node scripts/build-brand-assets.cjs
python3 scripts/update-seo-performance.py
python3 scripts/optimize-static-assets.py
python3 scripts/prepare-subdirectory.py
python3 scripts/inventory-images.py
python3 scripts/audit-seo-performance.py
python3 scripts/prepare-subdirectory.py --refresh-manifests
```

`seo/brand-assets.json` registra origem, dimensões, bytes e hashes. A auditoria cobre opacidade, dimensões, ICO multirresolução, referências de compartilhamento e metadados nas quatro páginas e nos quatro fragmentos de integração.

Referências: [favicon do Google](https://developers.google.com/search/docs/appearance/favicon-in-search), [logo nos dados da organização](https://developers.google.com/search/docs/appearance/structured-data/organization), [Open Graph](https://ogp.me/).
