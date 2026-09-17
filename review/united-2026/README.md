# United Idiomas — revisão visual e SEO · 12/09/2026

Entrega para revisão de Rafael. A prévia completa está em `dist/`; não é uma atualização automática do site oficial. No GitHub, este projeto é entregue sob `review/united-2026/`, preservando o PHP e os assets de produção na raiz.

## Abrir a prévia

Desde a correção de 15/09/2026, a prévia usa caminhos relativos e funciona tanto com **dist como raiz HTTP** quanto em uma subpasta, como `/review/united-2026/dist/`. Preserve toda a estrutura de `dist` e abra por HTTP, em vez de abrir o HTML diretamente.

```bash
python3 -m http.server 8080 --directory dist
```

Abra `http://localhost:8080/`. Para celular na mesma rede, use o IP local do computador e a porta 8080. Alternativamente, `npm ci` e `npm run dev` iniciam o Vite. Não há build necessário para a entrega estática.

Para reproduzir o caminho do servidor, execute `python3 -m http.server 8766` na raiz do repositório e abra `http://localhost:8766/review/united-2026/dist/`. Consulte `CORRECAO-SERVIDOR.md` para aplicar os arquivos à prévia existente. O PHP de produção permanece separado.

Páginas: Home `/`, Live Class/Business `/cursos/`, Quem Somos `/quem-somos/`, FAQ `/faq/`. Blog, unidades e serviços externos preservam seus destinos originais.

## Estado aprovado

- Três banners com abertura por mouse, clique e teclado no desktop; imagens amplas, sem preenchimento borrado. No celular, três artes verticais, rotação a cada seis segundos, pausa e gesto de deslizar; respeita movimento reduzido e visibilidade. O rótulo visual “PRÉVIA · 3 BANNERS” foi removido; o bloqueio de indexação permanece.
- Cabeçalho transparente, Manrope local e alinhamento compartilhado. Menu móvel e Área do Aluno adaptados a telas estreitas. Business mantém seu cinza original.
- Live Class: “Você tem muito a dizer. Fale inglês.”, persona atual, ecossistema, seis diferenciais, storytelling e personagens 3D. Jimmy atualizado na home e em Cursos.
- OnDemand: imagem e texto fornecidos pelo usuário, tablet/celulares ampliados, reflexão alinhada ao rodapé da seção e efeito existente preservado.
- Business e Full compactos; depoimentos organizados; rodapé com os números fornecidos pelo usuário, um selo azul ABF 2026, Reclame Aqui e “© United 2026. Todos os direitos reservados.”.
- Contato: uma barra no celular e um botão no desktop. Além do bloco de contato, a Home possui um círculo discreto de WhatsApp na lateral do banner, próximo de “Quero conhecer”. Os dois links de WhatsApp abrem o formulário oficial do RD quando disponível; o número existente `5511940040658` permanece como destino direto de reserva. O círculo pertence ao banner e sai da tela ao rolar, sem acompanhar o botão persistente. Cinco chamadas repetitivas no corpo foram removidas; links de exploração dos cursos continuam disponíveis. A barra se recolhe no menu, diálogo e contato final.
- Atalhos laterais no desktop continuam pelo meio da home e se recolhem apenas no contato, rodapé e sobreposições. No celular ficam ocultos.
- Vídeos com poster, reprodução inline por visibilidade e botão discreto acessível de pausa/reprodução; sem painel nativo de tela cheia.

## Manutenção

`dist/` é o artefato final completo e o ponto de partida para integração. `src/` contém os componentes/estilos/controladores mantidos. `seo/css-inputs.json` registra a ordem do CSS por página; os bundles finais são gerados.

Após editar componentes, use apenas o atualizador correspondente: `update-contact-layout.py`, `update-home-navigation.py`, `update-ondemand.py`, `update-footer-copy.py`, `update-liveclass-intro.py`, `update-courses-compact.py` ou `update-benefits.py`. Finalize:

```bash
python3 scripts/update-contact-layout.py
python3 scripts/update-seo-performance.py
python3 scripts/optimize-static-assets.py
python3 scripts/prepare-subdirectory.py
python3 scripts/audit-seo-performance.py
node --test scripts/test-rdstation-form.cjs scripts/test-rdstation-whatsapp.cjs
python3 scripts/prepare-subdirectory.py --refresh-manifests
```

O atualizador de contato reaplica o embed RD Station e os controladores mantidos nas quatro páginas, sem duplicar o formulário. Também mantém uma inclusão literal do loader RD com `async` em cada página e o atalho da Home definido em `src/banner-whatsapp.html`. O normalizador converte os caminhos locais após os geradores e preserva as URLs externas. A última chamada é idempotente e atualiza `MANIFEST.json` e `MANIFEST-SERVIDOR.json` após a auditoria. `MANIFEST.json` cobre o pacote completo; `MANIFEST-SERVIDOR.json` cobre `dist` e as instruções de correção.

Requer Python, Pillow e lxml (`requirements-review.txt`). Se trocar imagens intencionalmente, atualize `scripts/inventory-images.py` antes da auditoria e confira o diff de `seo/image-inventory.json`. O inventário registra bytes, dimensões e SHA-256 de todas as imagens raster entregues, inclusive originais de referência; não representa o peso inicial da página.

Os geradores/exportadores legados (`build-preview.cjs`, `build-interior-preview.py`, `export-html.cjs`, `export-storytelling-preview.py` e os antigos `check-*.cjs`) documentam etapas anteriores. Dependem de referências ou ferramentas externas e **não são o caminho de reprodução desta entrega**. Reexecutá-los pode restaurar composições antigas. O comando de compatibilidade `update-contact-preview.cjs` agora delega ao fluxo Python mantido, sem duplicar scripts de formulário.

## Integração e limites

A integração RD Station foi iniciada em 16/09/2026. A pedido do usuário, o contato passou a usar o novo formulário oficial `form-vamos-conversar-5ba05329ea8c88b5c10d`, com o mesmo argumento `UA-42887237-1`, carregado pelo SDK `https://d335luupugsy2.cloudfront.net/js/rdstation-forms/stable/rdstation-forms.min.js`. Há um único embed por página: ele fica no contato junto ao rodapé, é movido para o diálogo ao abrir e retorna ao contato ao fechar. Os formulários demonstrativos foram substituídos; o envio é feito diretamente pelo RD Station, sem acionar os controladores PHP legados em paralelo. Brasil (+55) fica fixo, sem seletor de país. A confirmação permanece na própria caixa de contato após o sucesso indicado pelo SDK, sem subpágina de agradecimento, alerta nativo ou navegação ao site antigo.

Em 17/09/2026, foi acrescentado o loader RD solicitado, `ee4f0815-8266-4fb5-ba25-416836b02312-loader.js`, com `async`, uma vez em cada HTML comercial. Ele carrega o rastreamento e as configurações da conta RD para recursos como formulários e WhatsApp; o SDK e o inicializador do formulário continuam separados e ordenados com `defer`. O controlador `src/rdstation-whatsapp.js`, também carregado com `defer` nas quatro páginas, conecta os links do banner e do contato ao popup oficial de WhatsApp. Ele oculta apenas o botão flutuante duplicado que o loader injeta, preservando formulário, eventos, rastreamento e fechamento nativos. O desenho e os campos desse popup continuam definidos na conta RD. O loader já existe em `includes/footer.php` na produção e não deve ser duplicado na integração. Caminhos exatos e limites estão em `seo/RD-STATION.md`; sua inclusão não comprova a integração com o CRM.

A revisão de 17/09 passou na auditoria estática (quatro páginas, 147 dependências), na verificação HTTP (cinco páginas, 151 URLs locais) e nos 17 testes dos controladores RD (nove do formulário principal e oito do WhatsApp). O Chrome confirmou a rolagem do círculo com o banner, a abertura/validação/fechamento do popup RD e a apresentação em desktop, notebook e celular, sem novo envio real de formulário ou mensagem de WhatsApp. Os detalhes estão em `seo/AUDITORIA.md`.

**O formulário pode criar leads reais também na prévia.** O novo formulário foi testado no Chrome em 16/09/2026, às 16h36: campos obrigatórios bloquearam o envio vazio e o envio autorizado retornou sucesso indicado pelo SDK, com “Mensagem enviada!” na própria caixa e URL preservada. A conferência desse novo teste na conta Marketing ainda está pendente. O usuário confirmou o recebimento do teste do formulário anterior no Marketing; a equipe ainda verifica a integração com o CRM. Essa confirmação anterior não valida o recebimento pelo novo ID. Consulte `seo/RD-STATION.md` para configuração e resultados separados por formulário.

Consulte também `seo/INTEGRACAO.md`, `seo/AUDITORIA.md` e `seo/audit-results.json`. As auditorias históricas de arquivos e apresentação não validam o recebimento da nova integração RD Station. O PHP de produção permanece separado e sua publicação exige revisão da integração final.

A prévia possui `noindex,nofollow` e robots bloqueado. Os metadados, robots e sitemap para o domínio oficial ficam em `seo/production/`; não copie o bloqueio da prévia para produção. `/comparar-contato/` é ferramenta interna de revisão, fora do sitemap e da integração pública.

A auditoria confere arquivos e comportamento da prévia; não equivale a nota Lighthouse nem comprovação de indexação ou aumento de tráfego. Não foram medidos nesta revisão final Core Web Vitals reais, cache/TTFB do servidor oficial ou Safari em aparelho físico.
