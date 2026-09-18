# Publicação em subpasta — instruções atualizadas em 18/09/2026

A correção de caminhos relativos continua válida: CSS, scripts, imagens e navegação local funcionam na raiz HTTP ou numa subpasta. O repositório mantém exatamente `review/united-2026/`, sem duplicar esse caminho.

Desde a revisão de SEO de 18/09, **dist é o artefato de produção**. Para colocar uma prévia em `https://www.unitedidiomas.com/review/united-2026/dist/`, primeiro gerar uma cópia protegida:

```bash
python3 scripts/export-production.py --mode preview --output /tmp/united-preview
```

Após revisão e backup da prévia anterior, o conteúdo de `/tmp/united-preview/site/` é o que deve ocupar a pasta `review/united-2026/dist/` do servidor. Copiar o conteúdo dessa pasta uma única vez: não criar `dist/site/` ou outro `review/united-2026/` aninhado. Não substituir o PHP da raiz. Esta documentação não executa a publicação.

O exportador acrescenta `noindex,nofollow` aos HTMLs da cópia, exclui comparação/debug e não altera a fonte. Em uma prévia dentro do mesmo domínio, o `robots.txt` da subpasta não controla robôs: aplicar também o `X-Robots-Tag` de `seo/production/apache-seo.conf`, mesclando à configuração existente. Não copiar o robots bloqueado da prévia para a raiz oficial. O Google precisa poder rastrear uma URL já conhecida para ler o noindex.

Para abrir localmente:

```bash
python3 -m http.server 8768 --bind 127.0.0.1 --directory /tmp/united-preview/site
```

Abrir `http://127.0.0.1:8768/`. Conferir Home, Cursos, Quem Somos, FAQ e os respectivos arquivos, sem 404. Invalidar o cache da hospedagem quando houver arquivos substituídos na mesma URL. Preservar o blog e quaisquer dados fora da pasta da prévia.

**O formulário RD pode criar leads reais na prévia.** A versão atual usa o embed `form-vamos-conversar-5ba05329ea8c88b5c10d`, o SDK oficial e o loader `ee4f0815-8266-4fb5-ba25-416836b02312-loader.js`. A confirmação aparece dentro da própria caixa após o sucesso indicado pelo SDK. Recebimento no Marketing e criação de negócio no CRM precisam ser conferidos nas respectivas contas; não foram enviados leads nesta revisão de SEO.

Para produção, usar `--mode production` e seguir `seo/INTEGRACAO.md` e `seo/production/INSTRUCOES-PUBLICACAO.md`. Metadados, sitemap e regras de servidor atuais estão em `seo/production/`.
