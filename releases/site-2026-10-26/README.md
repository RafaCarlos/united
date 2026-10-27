# Atualização do site United — 26/10/2026

> **Histórico:** substituído pelo [pacote cumulativo de 27/10](../site-2026-10-27/README.md), que também retira Osasco. Não aplicar este pacote antigo depois da atualização de 27/10.

Rafael: esta entrega atualiza o **site principal já publicado**. O envio ao Git não publica na hospedagem.

**[Baixar o ZIP de publicação](United-Site-Ajustes-2026-10-26.zip)** · 622.723 bytes (~608 KiB). As instruções completas também estão em [LEIA-ME-RAFAEL.txt](LEIA-ME-RAFAEL.txt).

## Alterações

- Botão fixo “Quero conhecer” vermelho `#df1649`, hover `#c3133f` e texto branco; WhatsApp mantém `#25d366`.
- Nove variantes WebP para três imagens: painel da Home, Jimmy no Live Class e negociação no Business. O navegador seleciona a resolução; os originais permanecem disponíveis para telas de maior densidade.
- Layout, textos, URLs, campos e mecanismo de envio do RD Station preservados.

## Publicação

1. Fazer backup dos sete arquivos atuais que serão substituídos. O ZIP contém uma cópia pública capturada em 26/10/2026 às 14h28, horário de São Paulo; preservar uma nova cópia se houve alterações posteriores.
2. Extrair o ZIP. Subir primeiro as imagens e `contact-form.css` de `publicar/` para a raiz pública de `https://www.unitedidiomas.com/`, mantendo os caminhos.
3. Subir os seis HTMLs de `publicar/`: Home, Live Class, Business, Full, Quem somos e FAQ. Copiar o conteúdo dessa pasta, não a pasta `publicar` inteira.
4. Invalidar o cache dessas páginas e de `/contact-form.css`. O HTML pede `contact-form.css?v=4b9c86645440`; as imagens novas têm hash no nome.
5. Conferir as seis páginas no desktop e celular, o botão vermelho, o WhatsApp verde e a abertura/fechamento do formulário. Não é necessário gerar outro lead de teste para essa alteração visual.

São **16 arquivos de publicação: 6 HTML + 1 CSS + 9 WebP**, listados com SHA-256 no [MANIFEST.json](MANIFEST.json). `home/assets/`, `business/assets/` e `assets/` são caminhos de imagens necessários mesmo com as páginas na raiz e em `/cursos/`.

**Não publicar o `dist/` completo nem `dist/blog/`.** O blog WordPress permanece ativo e independente. Não subir as pastas `rollback/`, `conferencia/` e `manutencao/` ao diretório público; não substituir WordPress, PHP, banco, `.htaccess`, robots ou sitemap neste ajuste.

## Reversão

Restaurar apenas os sete arquivos da pasta `rollback/` do ZIP nos mesmos caminhos e invalidar seu cache. As nove imagens novas podem permanecer sem uso. Não há migração de banco nem alteração do WordPress.

## Verificações

- Build e validação: 213 páginas e 18.546 referências, sem erros; o escopo de publicação continua limitado às seis páginas comerciais.
- As seis páginas comerciais passaram na auditoria técnica de SEO sem erros ou avisos; canonical, indexação e dados estruturados foram preservados.
- Testes de interação e RD Station passaram com fixtures locais: zero solicitações externas e zero leads enviados nesses testes.
- Revisão no navegador em 390 × 844 e 1280 × 800: botões corretos e sem rolagem horizontal nas seis páginas. O formulário da Home abriu/fechou com Nome, Celular e Email.
- A comparação com a cópia pública confirmou apenas a nova versão do CSS e os atributos responsivos de três imagens nos HTMLs.
- As variantes selecionadas são de 20,7% a 76,5% menores que os originais. O ganho total depende da tela, densidade e imagens exibidas; não representa uma nota de PageSpeed.

Resultados em [conferencia/](conferencia/). O inventário HTTP completo e a cópia pública estão dentro do ZIP.

As respostas públicas verificadas tinham gzip, mas não traziam `Cache-Control`/`Expires` explícitos para o navegador. O LEIA-ME inclui recomendações para integrar o cache à configuração atual da hospedagem. Essa configuração não foi aplicada pelo pacote.

## Manutenção do código

As alterações já estão aplicadas em `review/united-site-2026-10-21/src/` e geradas em `dist/`. O patch dentro do ZIP é destinado somente a outro checkout compatível que ainda não tenha os ajustes; não reaplicá-lo nesta branch.

Após alterações futuras, executar na pasta `review/united-site-2026-10-21/`:

```sh
npm run build
npm run test:site
npm run test:rd
```

O build ainda gera um blog estático histórico para referência. Isso não autoriza sua publicação sobre o WordPress. Selecionar apenas os arquivos comerciais alterados.

SHA-256 do ZIP:

```text
b0c18d43314ba0cbb022a3c758831c64216982ff3135eab45667c80e3386c10a
```
