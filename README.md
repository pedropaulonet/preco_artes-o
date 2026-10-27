# Preço Artesão

Aplicativo estático para ajudar artesãos a precificar produtos com materiais, mão de obra, despesas e margem. A interface é em português brasileiro e os valores são em reais.

**Faça backup em JSON regularmente. O servidor não guarda seus cadastros.**

## Executar localmente

Não há instalação de pacotes nem compilação. É necessário um navegador moderno com JavaScript e IndexedDB habilitados.

Linux, dentro desta pasta:

```bash
python3 -m http.server 8000 --bind 127.0.0.1
```

Windows, com Python instalado, dentro desta pasta:

```powershell
py -m http.server 8000 --bind 127.0.0.1
```

Acesse **http://localhost:8000**. Evite abrir `index.html` diretamente por `file://`, pois os módulos e o Service Worker precisam de uma origem HTTP. Use sempre o mesmo endereço, porta, navegador e perfil para acessar os mesmos dados.

Também é possível hospedar os arquivos em qualquer servidor estático. Em produção, use HTTPS para habilitar o acesso offline. Não são necessários API, backend, login, CDN ou banco no servidor. Os arquivos `src/*.js` devem ser servidos com tipo MIME JavaScript.

## Primeiros passos

1. Em **Configurações**, informe nome do ateliê, remuneração, horas produtivas, despesas e produção mensal.
2. Em **Materiais e insumos**, cadastre a quantidade e o custo total de cada compra.
3. Na **Calculadora rápida**, informe os custos por unidade, tempo, embalagem, taxas e margem. Use insumos da composição ou materiais avulsos, sem duplicar custos.
4. Confira o resultado e expanda a memória de cálculo. Dê um nome e salve o produto.
5. **Exporte um backup JSON e confira se o arquivo foi baixado.**

O painel oferece um exemplo opcional com valores fictícios. Editar materiais ou configurações recalcula os produtos e mantém a última sugestão salva para comparação. Insumos usados em produtos não podem ser excluídos até remover suas referências.

## Dados e backup

Os dados são armazenados no IndexedDB, no perfil do navegador. Nada é enviado ao servidor. Navegação privada, remoção dos dados do site, troca de dispositivo ou mudança de origem podem tornar os cadastros indisponíveis. O cache offline não substitui backup.

- Exporte em **Backup e restauração → Exportar backup JSON**, ou no aviso presente em todas as telas.
- Faça backup ao encerrar o dia, antes de grandes alterações e antes de limpar ou trocar de navegador.
- Confira o arquivo na pasta de downloads e guarde uma segunda cópia em local seguro. Ele contém informações do negócio.
- Para restaurar, selecione o JSON (até 5 MB), confira a prévia e escolha **mesclar** ou **substituir**.
- Exporte e confira um backup dos dados atuais; marque a confirmação e confirme a restauração.
- Mesclar preserva as configurações atuais e atualiza cadastros com IDs coincidentes. Substituir troca todas as configurações e cadastros.

O estado total também é limitado para que os arquivos exportados possam ser restaurados dentro dos 5 MB. O JSON exportado é compacto.

O arquivo inclui identificação do aplicativo, versão do esquema, data da exportação e dados. A validação verifica estrutura, limites numéricos, IDs únicos e referências antes da gravação transacional. Não há assinatura criptográfica: um arquivo com estrutura válida não garante que os valores sejam corretos. Revise a origem do backup.

Use uma aba por vez para editar o ateliê. Uma gravação baseada em dados desatualizados é rejeitada para evitar sobrescrever alterações de outra aba; nesse caso, recarregue a página. Ao introduzir novas versões de banco, implemente migrações sem apagar dados e testes para os esquemas anteriores.

## Cálculo e limites fiscais

Dinheiro é representado em centavos inteiros e percentuais em pontos-base (100 pontos-base = 1%). Multiplicações e divisões monetárias usam `BigInt`. Custos fracionados e preço sugerido arredondam para cima; taxas sobre a venda arredondam para baixo em centavos, preservando a margem desejada.

A fórmula é `custo / (1 - taxas - encargo hipotético - margem)`, exclusivamente para percentuais efetivos lineares sobre o mesmo preço de venda. A soma deve ser menor que 100%. O preço de equilíbrio inclui custos e taxas, sem margem de lucro.

Há três modalidades gerenciais:

- **Sem estimativa tributária:** não adiciona tributos; revisar antes de vender.
- **MEI:** rateia o DAS mensal informado como custo fixo, sem criar um percentual por venda.
- **Simulação hipotética:** aplica somente o percentual efetivo informado, identificado como hipótese.

**Esta versão não implementa apuração fiscal, Simples Nacional, créditos ou regras legais por ano.** Não preenche alíquotas legais automaticamente. Para implementar o módulo tributário futuro, consulte fontes oficiais vigentes, registre fonte e período de vigência e inclua casos previamente validados. Não duplique tributos já incluídos em uma taxa efetiva.

A remuneração produtiva entra na mão de obra e não deve ser repetida nas despesas fixas. O rateio atual é por unidades previstas, e os produtos são calculados por unidade. Receitas por lote, histórico completo, canais de venda, simulador tributário e relatórios são etapas posteriores descritas em `prompt_inicial.md`.

## Uso offline e atualização

No primeiro acesso com conexão ao servidor, aguarde **Offline preparado**. Os arquivos do aplicativo ficam no cache do Service Worker; os cadastros ficam separados no IndexedDB. Depois, use o mesmo endereço e perfil mesmo sem conexão. O primeiro acesso nunca pode ser offline.

Para publicar uma atualização, altere o identificador `CACHE_NAME` em `sw.js` e publique todos os arquivos da versão juntos. Feche as abas antigas e abra novamente para ativar a atualização. Nunca apague o banco para atualizar o aplicativo. **Faça backup antes de atualizar.**

## Estrutura

- `index.html`, `styles.css`: estrutura e aparência responsiva.
- `src/app.js`, `src/ui.js`: navegação, formulários e apresentação.
- `src/pricing.js`: cálculo monetário e conversão de unidades.
- `src/model.js`: contrato dos dados, validação e mesclagem de backup.
- `src/db.js`: persistência transacional em IndexedDB, esquema versão 1.
- `sw.js`, `manifest.webmanifest`, `assets/`: recursos offline e identidade local.
- `tests/`: testes de cálculo, backup e persistência.
- `prompt_inicial.md`: especificação completa e etapas futuras.

## Testes

Com o servidor local em execução, abra **http://localhost:8000/tests/**. A página apresenta os resultados. Os testes de persistência usam um banco temporário separado e não alteram os dados do ateliê. O POST final de resultados é opcional; em servidores estáticos que não aceitam POST, os resultados continuam visíveis na página.

Em Linux com Firefox instalado, é possível executar os testes de navegador automaticamente:

```bash
python3 tests/serve.py --run
```

O comando abre um servidor temporário apenas em loopback e usa um perfil Firefox isolado. É necessário um ambiente que permita abrir portas e executar o navegador.

Para executar apenas os testes puros de cálculo e backup em ambientes Linux com Cinnamon JavaScript instalado:

```bash
cjs -m tests/tests.js
```

Essa alternativa não testa IndexedDB, interface ou Service Worker. Não há dependências JavaScript de produção.
