# PROJETO: PREÇO ARTESÃO
## Calculadora de Precificação para Artesãos — Reforma Tributária 2027–2033

### 1. Objetivo

Desenvolver uma aplicação web local, moderna, responsiva, gratuita e totalmente offline para ajudar artesãos, produtores independentes, MEIs e pequenas lojas a calcular corretamente o preço de venda de seus produtos.

A aplicação deve considerar:

- Custos de materiais e insumos.
- Mão de obra.
- Tempo de fabricação.
- Despesas fixas e variáveis.
- Embalagens.
- Perdas e desperdícios.
- Taxas de cartão e plataformas de venda.
- Comissões.
- Tributos conforme enquadramento.
- Mudanças da Reforma Tributária brasileira a partir de 2027.
- Margem de lucro desejada.
- Preços diferenciados por canal de venda.
- Simulações para os anos de 2026 a 2033.

O foco é oferecer uma ferramenta extremamente simples de utilizar, mas tecnicamente completa.

O usuário não deve precisar entender contabilidade para utilizar a calculadora.

**Princípio central: simplicidade na interface, precisão no mecanismo de cálculo.**

### 2. Arquitetura e tecnologias

Utilizar preferencialmente:

- HTML5 semântico.
- CSS moderno com variáveis.
- JavaScript ou TypeScript.
- IndexedDB como banco de dados local do navegador.
- Biblioteca Dexie.js, opcional, para facilitar o acesso ao IndexedDB.
- PWA para utilização offline.
- Service Worker para armazenamento dos recursos da aplicação.
- Design responsivo para computadores, tablets e celulares.
- Interface totalmente em português brasileiro.
- Formatação monetária em reais (BRL).

Não utilizar:

- Backend obrigatório.
- Serviços de nuvem.
- Login ou autenticação online.
- APIs pagas.
- Telemetria.
- Bibliotecas desnecessariamente pesadas.

O projeto deve poder ser executado localmente pelo navegador utilizando um servidor HTTP local simples, inclusive em Linux.

O aplicativo deve funcionar offline após a instalação dos arquivos necessários.

Utilizar dependências locais ou armazenadas em cache. Não depender de CDN em tempo de execução.

Armazenar valores financeiros em centavos inteiros ou representação decimal exata, evitando erros de precisão por números de ponto flutuante.

### 3. Organização da interface

Criar um menu lateral com as seções:

1. Painel inicial
2. Calculadora rápida
3. Produtos
4. Materiais e insumos
5. Receitas e composição
6. Despesas
7. Canais de venda
8. Simulador tributário
9. Relatórios
10. Configurações
11. Backup e restauração
12. Ajuda

Em telas pequenas, utilizar navegação compacta.

A interface deve apresentar somente os recursos necessários para a operação atual.

Campos avançados devem ficar recolhidos por padrão.

### 4. Configuração inicial — Assistente

No primeiro acesso, apresentar um assistente com cinco etapas:

**Etapa 1 — Identificação**

- Nome da loja ou ateliê.
- Nome do responsável.
- CPF ou CNPJ, opcional conforme enquadramento.
- Nome fantasia.
- Município.
- Estado (UF).
- CNAE principal e atividades secundárias, quando aplicável.
- Contato e endereço comercial opcionais.

**Etapa 2 — Enquadramento tributário**

Permitir selecionar:

- Pessoa física não enquadrada como nanoempreendedor.
- Nanoempreendedor, quando legalmente elegível.
- MEI.
- Microempresa do Simples Nacional.
- Empresa de Pequeno Porte do Simples Nacional.
- Lucro Presumido.
- Lucro Real.

Se for MEI, solicitar valor do DAS mensal.

Se for Simples Nacional, solicitar informações para determinação da alíquota efetiva, como atividade, anexo, receita bruta acumulada em 12 meses (RBT12) e segregação de receitas, quando aplicável.

Permitir selecionar recolhimento de IBS/CBS dentro do Simples ou pelo regime regular, conforme legislação e período de vigência.

**Etapa 3 — Custos do negócio**

Solicitar:

- Despesa fixa mensal estimada.
- Horas produtivas mensais.
- Remuneração mensal desejada pelo artesão.
- Produção ou faturamento esperado.
- Percentual médio de perdas.
- Reserva para imprevistos.

**Etapa 4 — Comercialização**

- Canal de venda principal.
- Taxa de cartão.
- Comissão de marketplace.
- Taxa fixa por pedido.
- Custos de embalagem.
- Frete subsidiado.
- Percentual esperado de devoluções.

**Etapa 5 — Lucro**

- Margem líquida desejada.
- Margem mínima aceitável.
- Política de arredondamento dos preços.
- Forma preferida de rateio das despesas fixas.

Ao concluir, salvar todas as configurações no IndexedDB.

Os valores informados inicialmente devem ser editáveis posteriormente.

### 5. Cadastro de materiais e insumos

Criar cadastro independente para matérias-primas.

Campos:

- Código.
- Nome.
- Categoria.
- Fornecedor.
- Unidade de medida: unidade, grama, quilograma, mililitro, litro, metro, centímetro etc.
- Quantidade adquirida.
- Preço total de compra.
- Frete de aquisição.
- Custos adicionais da compra.
- Descontos recebidos.
- Impostos não recuperáveis incorporados ao custo.
- Créditos tributários recuperáveis, quando aplicáveis.
- Percentual de perda.
- Custo unitário calculado.
- Data da última compra.
- Observações.

Exemplo:

Compra de 1 kg de cera por R$ 40,00.

Utilização de 150 g para fabricar uma vela.

O aplicativo deverá calcular automaticamente o consumo correspondente, considerando a unidade, as conversões e as perdas.

Permitir que o usuário atualize o preço do insumo sem precisar editar cada produto.

Quando um material tiver seu custo alterado, recalcular os produtos que o utilizam, sem apagar o histórico dos preços anteriores.

### 6. Cadastro e configuração de produtos

Criar cadastro completo com:

**Identificação**

- Código interno/SKU.
- Nome.
- Descrição.
- Categoria.
- Foto opcional.
- Tipo: produto próprio, revenda, kit ou serviço.
- NCM, quando aplicável.
- Unidade de venda.
- Tempo de fabricação.
- Produção por lote.
- Data de criação.
- Status: ativo ou inativo.

**Composição**

Permitir adicionar múltiplos materiais à receita do produto.

Para cada material:

- Insumo.
- Quantidade utilizada.
- Unidade.
- Percentual de desperdício específico, se necessário.
- Custo calculado.

Permitir receitas por lote, como 12 sabonetes fabricados conjuntamente, com divisão correta dos custos compartilhados.

**Custos adicionais**

- Embalagem.
- Etiqueta.
- Energia específica.
- Gás.
- Água.
- Insumos descartáveis.
- Mão de obra.
- Serviços terceirizados.
- Custos de personalização.
- Outros custos.

**Configurações comerciais**

- Margem de lucro específica.
- Margem mínima.
- Canais habilitados.
- Descontos permitidos.
- Preço atual praticado.
- Arredondamento.
- Preço mínimo recomendado.
- Preço sugerido.

O usuário deve poder substituir valores herdados das configurações gerais por valores específicos do produto.

### 7. Mão de obra

Criar um mecanismo simples de cálculo do custo do trabalho.

Solicitar:

- Remuneração mensal pretendida.
- Horas produtivas mensais.
- Encargos e custos adicionais, se aplicáveis.

Calcular o custo de uma hora produtiva.

Para cada produto, considerar o tempo realmente dedicado à fabricação.

Exemplo:

Remuneração desejada: R$ 2.400 por mês.

Horas produtivas: 120 horas.

Custo de mão de obra: R$ 20 por hora.

Produto com 45 minutos de fabricação: R$ 15 de mão de obra.

Evitar contar duas vezes a remuneração do artesão, distinguindo pró-labore, mão de obra produtiva e lucro empresarial.

### 8. Despesas fixas e rateio

Permitir registrar:

- Aluguel.
- Energia.
- Água.
- Internet.
- Contabilidade.
- Software.
- Telefone.
- Manutenção.
- Transporte administrativo.
- Marketing.
- Pró-labore administrativo, quando aplicável.
- Depreciação dos equipamentos.
- Outras despesas.

Permitir selecionar o critério de distribuição:

1. Rateio por unidades produzidas.
2. Rateio por horas produtivas.
3. Rateio por participação no faturamento.
4. Rateio manual.

Exibir claramente qual método foi selecionado.

Ao utilizar faturamento projetado para rateio, evitar fórmulas circulares e indicar as premissas da projeção.

Permitir trabalhar com cenário conservador, normal e otimista.

### 9. Configuração tributária — Reforma 2027–2033

Este é um dos módulos mais importantes do aplicativo.

Criar um mecanismo tributário independente dos demais componentes, com regras versionadas por ano e período de vigência.

**Normas de referência**

- Emenda Constitucional nº 132/2023.
- Lei Complementar nº 214/2025, com alterações posteriores.
- Lei Complementar nº 227/2026.
- Lei Complementar nº 123/2006 e regulamentação do Simples Nacional.
- Resoluções CGSN aplicáveis, inclusive as alterações publicadas em 2026.
- Normas federais, estaduais e municipais pertinentes.

Consultar as versões vigentes das normas antes de implementar valores tributários.

**Regras fundamentais**

1. Não presumir que todos os artesãos recolhem IBS e CBS diretamente.
2. Não aplicar alíquotas genéricas do regime regular ao MEI.
3. Não adicionar IBS/CBS novamente quando já estiverem compreendidos na alíquota do Simples.
4. Distinguir nanoempreendedor elegível de pessoa física comum.
5. Não confundir faturamento com lucro.
6. Não confundir alíquota nominal e efetiva.
7. Não confundir tributo destacado e custo tributário efetivo.
8. Distinguir imposto recuperável de imposto incorporado ao custo.
9. Considerar o período da operação, os tributos substituídos e as regras de transição.
10. Não assumir que a mesma alíquota se aplica a todos os produtos, operações e destinos.
11. Não inventar alíquotas ou benefícios não confirmados.
12. Indicar quando uma regra depende de revisão contábil.

**Configuração do MEI**

Cadastrar:

- Valor do DAS mensal.
- Atividade tributária.
- Faturamento acumulado.
- Limite anual conforme legislação vigente.
- Alerta de aproximação do limite.
- Custo mensal do DAS distribuído para fins gerenciais.

O DAS deve ser tratado como custo fixo estimado de gestão para precificação, e não como uma alíquota adicional fictícia sobre cada venda.

**Nanoempreendedor**

Verificar os requisitos legais para o enquadramento.

Quando aplicável, considerar a não incidência de IBS/CBS prevista para esse enquadramento.

Não presumir dispensa de todos os demais tributos ou obrigações.

**Simples Nacional**

Implementar:

- Seleção do anexo aplicável.
- Faixas de receita.
- Receita acumulada nos últimos 12 meses.
- Alíquota nominal.
- Parcela a deduzir.
- Alíquota efetiva.
- Segregação por atividade ou receita.
- Regras específicas de IBS/CBS.
- Simulação de recolhimento pelo regime regular quando cabível.
- Comparação entre regimes, com explicação das hipóteses.

**Regimes regulares**

Permitir configurar:

- CBS.
- IBS.
- ICMS e ISS durante a transição.
- Tributos adicionais realmente aplicáveis.
- Créditos fiscais recuperáveis.
- Benefícios, reduções e tratamentos diferenciados previstos na legislação.
- Alíquotas por período, localidade e classificação do produto.

A incidência do Imposto Seletivo deve depender de enquadramento legal do produto, nunca ser aplicada indistintamente ao artesanato.

**Calendário da Reforma**

Permitir selecionar o exercício:

- 2026: fase de testes.
- 2027 e 2028: início da CBS e IBS transitório.
- 2029 a 2032: transição gradual de ICMS/ISS para IBS.
- 2033: regime integral previsto.

As tabelas e regras deverão possuir:

- Identificador.
- Tributo.
- Regime.
- Data inicial.
- Data final.
- Alíquota ou fórmula.
- Base de cálculo.
- Fonte legal.
- Data da última revisão.
- Status de validação.

Não preencher lacunas normativas com números inventados.

### 10. Motor de precificação

O cálculo deverá separar:

**A. Custo direto**

- Materiais.
- Mão de obra.
- Embalagens.
- Energia específica.
- Outros gastos de fabricação.

**B. Custo indireto**

- Rateio das despesas fixas.
- Depreciação.
- Outros custos indiretos.

**C. Custos de venda**

- Comissão percentual.
- Taxas de pagamento.
- Taxas fixas por pedido.
- Frete arcado pelo vendedor.
- Custos adicionais por canal.
- Tributos efetivos incidentes sobre a operação.

**D. Resultado**

- Custo total unitário.
- Preço de equilíbrio.
- Preço mínimo parametrizado.
- Preço sugerido.
- Margem de contribuição.
- Lucro operacional estimado.
- Margem líquida sobre vendas.
- Markup sobre custo.
- Percentual efetivo de custos e tributos.

Implementar um motor que calcule corretamente taxas percentuais incidentes sobre o preço final.

Para o cenário simplificado em que todos os percentuais incidem sobre o mesmo preço de venda e os tributos são representáveis por uma taxa efetiva linear, utilizar:

Preço = Custo / (1 - Taxas - Tributos - Margem)

Onde:

- Custo: soma dos custos monetários apropriados por unidade.
- Taxas: fração do preço destinada a comissões e taxas variáveis.
- Tributos: fração do preço correspondente à carga efetiva aplicável.
- Margem: lucro desejado como fração do preço de venda.

A fórmula só pode ser aplicada quando seus pressupostos forem válidos.

Para cálculos com bases tributárias diferentes, créditos, faixas progressivas, arredondamentos, incidência por dentro/por fora ou encargos fixos, implementar um solucionador numérico verificável.

Nunca misturar porcentagem de markup sobre custo com margem sobre faturamento.

Bloquear cálculos inviáveis quando os percentuais consumirem 100% ou mais da receita.

Exibir sempre a memória de cálculo.

### 11. Calculadora rápida

Criar uma tela principal para precificação sem necessidade de cadastrar todos os insumos.

Campos essenciais:

- Nome do produto.
- Custo dos materiais.
- Tempo de produção.
- Mão de obra.
- Embalagem.
- Outras despesas.
- Canal de venda.
- Margem desejada.

O aplicativo preencherá automaticamente os demais parâmetros já configurados.

Botão principal:

**CALCULAR PREÇO DE VENDA**

Mostrar imediatamente:

- Custo total.
- Preço mínimo.
- Preço sugerido.
- Lucro estimado.
- Margem real.

Permitir salvar esse cálculo como produto.

### 12. Exibição visual do resultado

Criar um painel visual fácil de entender.

Exemplo ilustrativo, sem representar alíquotas tributárias legais:

Produto: Vela artesanal.

| Componente | Valor |
|---|---:|
| Materiais | R$ 18,00 |
| Mão de obra | R$ 12,00 |
| Embalagem | R$ 3,00 |
| Despesas rateadas | R$ 4,00 |
| Custo unitário | R$ 37,00 |

Simulação com taxas comerciais de 5%, encargo tributário efetivo hipotético de 4% e margem líquida desejada de 25%:

- Preço de venda sugerido: R$ 56,06.
- Taxas comerciais estimadas: R$ 2,80.
- Tributos estimados: R$ 2,24.
- Lucro estimado: R$ 14,02.

Apresentar um gráfico simples com a composição do preço.

O usuário deve poder expandir a memória de cálculo.

### 13. Canais de venda

Cadastrar canais independentes:

- Loja física.
- Feira de artesanato.
- Instagram/WhatsApp.
- Site próprio.
- Marketplace.
- Atacado.
- Consignação.
- Encomendas personalizadas.

Cada canal deverá possuir:

- Comissão percentual.
- Tarifa fixa.
- Taxa de pagamento.
- Despesas adicionais.
- Política de frete.
- Margem desejada.
- Política de desconto.

O mesmo produto poderá ter preços diferentes conforme o canal.

Não presumir que taxas de marketplace sejam iguais para todos os produtos ou vendedores.

### 14. Simulador de preços e margem

Criar controles interativos para alterar:

- Margem de lucro.
- Custo dos materiais.
- Custo da mão de obra.
- Taxa de comissão.
- Volume de produção.
- Tributos.
- Preço praticado.

Os resultados devem ser recalculados imediatamente.

Incluir as funções:

**Preço por lucro desejado:** descobrir quanto cobrar para obter determinada margem.

**Lucro pelo preço informado:** descobrir quanto sobra ao vender por determinado preço.

**Desconto máximo:** calcular o desconto possível sem ultrapassar a margem mínima configurada.

**Simulação tributária:** comparar o impacto de regras fiscais em diferentes anos.

**Preço atacado:** simular quantidade, descontos e custos variáveis por lote.

### 15. Comparação tributária 2026 × 2027 × 2033

Criar uma tela para comparar os preços estimados entre diferentes anos.

Mostrar:

- Ano.
- Regime tributário.
- Tributos efetivos aplicáveis.
- Custo dos materiais.
- Créditos considerados.
- Preço mínimo.
- Preço sugerido.
- Lucro.
- Diferença percentual.

Permitir manter custos iguais para isolar o efeito tributário.

Exibir claramente quando uma comparação for apenas hipotética por ausência de informações fiscais confirmadas.

Não considerar automaticamente aumento de imposto apenas porque a reforma foi implementada.

### 16. Relatórios

Implementar relatórios locais:

- Lista de produtos e preços.
- Produtos com menor margem.
- Produtos com maior margem.
- Composição de custos.
- Histórico de reajustes.
- Simulação por canal.
- Comparação tributária por ano.
- Lista de materiais utilizados.
- Custos por categoria.
- Preços sugeridos para impressão.
- Necessidade de reajuste após aumento de insumos.

Permitir exportar CSV e gerar uma página de impressão organizada, que poderá ser salva como PDF pelo navegador.

### 17. Banco de dados IndexedDB

Organizar o banco em coleções ou tabelas lógicas:

- lojas
- configuracoes
- configuracoes_tributarias
- regras_tributarias
- categorias
- fornecedores
- insumos
- historico_precos_insumos
- produtos
- receitas
- receita_itens
- despesas
- canais_venda
- precos_por_canal
- simulacoes
- historico_precificacao
- configuracoes_backup

Utilizar identificadores estáveis e relacionamentos consistentes.

Adicionar versionamento do esquema do banco.

Implementar migrações sem excluir registros existentes.

Todas as operações deverão ser assíncronas, com tratamento adequado de erros.

### 18. Backup e restauração

Criar:

- Exportação completa em JSON.
- Importação de backup JSON.
- Validação da estrutura.
- Versão do esquema.
- Data do backup.
- Identificação da loja.
- Verificação de integridade.
- Proteção contra importação acidental.
- Opção de mesclar ou substituir dados, com prévia das alterações.

Nenhuma atualização da aplicação poderá apagar o banco automaticamente.

Informar que o IndexedDB pertence ao perfil do navegador e pode ser perdido se os dados do site forem removidos.

Oferecer lembretes periódicos dentro da própria aplicação para realizar backups, sem depender de serviços externos.

### 19. Configurações gerais

Criar tela com abas:

**Loja**
- Identificação, documentos, contato e localização.

**Financeiro**
- Remuneração, despesas fixas, horas produtivas e métodos de rateio.

**Tributário**
- Regime, exercício, parâmetros legais, alíquotas e créditos.

**Precificação**
- Margens, arredondamentos, reservas e valores padrão.

**Canais**
- Taxas e custos de comercialização.

**Aparência**
- Tema claro, escuro e automático.
- Ajuste de densidade da interface.
- Formatação de moeda.

**Dados**
- Backup, importação, exportação e manutenção do banco.

As configurações gerais devem ser herdadas automaticamente por novos produtos, salvo quando houver substituição explícita.

### 20. Experiência do usuário

O aplicativo deve parecer uma ferramenta comercial profissional, e não uma planilha complicada.

Diretrizes:

- Interface limpa.
- Poucas cores.
- Tipografia legível.
- Grandes valores monetários nos resultados.
- Botões claros.
- Ajuda contextual.
- Mensagens em linguagem simples.
- Poucos campos obrigatórios.
- Campos avançados opcionais.
- Salvamento automático.
- Aviso quando houver dados não salvos.
- Compatibilidade com teclado.
- Acessibilidade.
- Modo escuro.

Explicar conceitos como margem, markup, custo fixo e alíquota efetiva usando exemplos curtos.

Nunca apresentar uma estimativa como imposto definitivamente devido.

### 21. Segurança e privacidade

Os dados devem permanecer localmente no navegador.

Não transmitir CPF, CNPJ, informações financeiras ou cadastro de produtos para serviços externos.

Não adicionar rastreadores.

Validar todos os campos e arquivos importados.

Não executar scripts contidos em backups.

Evitar armazenamento desnecessário de dados pessoais.

Implementar tratamento de erros de armazenamento e limites de quota do navegador.

### 22. Testes obrigatórios

Criar testes automatizados para:

- Conversão de unidades.
- Consumo fracionado de insumos.
- Receitas por lote.
- Alteração de custo de materiais.
- Cálculo de mão de obra.
- Rateio de despesas.
- Margem versus markup.
- Preço de equilíbrio.
- Taxas incidentes sobre o preço de venda.
- Tarifas fixas.
- Regime MEI sem tributação percentual fictícia.
- Simples Nacional sem duplicação de IBS/CBS.
- Cálculo por período tributário.
- Créditos fiscais somente quando permitidos.
- Mudança de enquadramento.
- Descontos.
- Cálculos inviáveis.
- Precisão decimal e arredondamentos.
- Backup e restauração.
- Migração de esquema.
- Funcionamento offline.

Para regras tributárias complexas, utilizar casos de teste com resultados previamente validados por fontes oficiais ou profissional contábil.

### 23. Dados demonstrativos

No primeiro acesso, oferecer a opção de carregar dados de demonstração de um ateliê fictício.

Criar exemplos de:

- Vela aromática.
- Sabonete artesanal.
- Bolsa de crochê.
- Colar artesanal.
- Peça decorativa.

Incluir materiais, receitas, custos e canais comerciais.

Os valores serão fictícios e explicitamente identificados como demonstração.

Não preencher automaticamente alíquotas legais não confirmadas.

### 24. Documentação

Criar README.md contendo:

- Objetivo do projeto.
- Tecnologias.
- Estrutura de arquivos.
- Como executar no Linux.
- Como executar no Windows.
- Como usar offline.
- Como realizar backups.
- Como restaurar dados.
- Como atualizar regras tributárias.
- Limitações e cuidados fiscais.

Adicionar um guia simples de uso para artesãos sem conhecimentos técnicos.

### 25. Critérios de entrega

O aplicativo somente estará concluído quando:

1. Funcionar localmente sem backend.
2. Persistir os dados corretamente no IndexedDB.
3. Permitir cadastrar uma loja e suas configurações.
4. Permitir cadastrar insumos e produtos.
5. Calcular preços com memória de cálculo verificável.
6. Aplicar as regras do enquadramento tributário escolhido.
7. Simular cenários tributários por ano.
8. Permitir diferentes preços por canal.
9. Exportar e importar backups válidos.
10. Funcionar offline.
11. Possuir testes automatizados.
12. Ser responsivo e simples para o público leigo.

### 26. Estratégia de implementação

Desenvolver em etapas funcionais:

**Fase 1 — MVP operacional**
- Interface principal.
- Banco IndexedDB.
- Configurações da loja.
- Cadastro de insumos.
- Cadastro de produtos.
- Motor de precificação.
- Calculadora rápida.
- Backup JSON.

**Fase 2 — Controle de custos**
- Receitas por lote.
- Custos indiretos.
- Canais de venda.
- Histórico de preços.
- Relatórios.

**Fase 3 — Reforma Tributária**
- Motor tributário versionado.
- Configuração dos regimes.
- Simulação entre exercícios.
- Memória de cálculo tributário.
- Comparação de cenários.

**Fase 4 — Refinamento**
- Experiência mobile.
- PWA offline.
- Acessibilidade.
- Testes.
- Documentação.

Entregar código-fonte completo, funcional, organizado e comentado quando necessário.

Não entregar somente protótipos visuais.

Evitar soluções excessivamente complexas, mantendo uma arquitetura modular, legível e de fácil manutenção.

**Objetivo final: permitir que qualquer artesão cadastre seus custos, selecione o enquadramento tributário e descubra quanto precisa cobrar para vender seu produto com lucro, sem depender de planilhas ou serviços online.**

