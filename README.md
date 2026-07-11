# FISCALIZA

Plataforma de fiscalizacao parlamentar feita com React, Vite e Tailwind CSS. O objetivo e ajudar qualquer cidadao a consultar deputados e senadores com dados oficiais, linguagem simples e avisos claros de limitacao.

Regra principal do projeto: um card honesto dizendo `dado indisponivel` e melhor do que um numero bonito sem fonte.

## Como rodar

```bash
npm install
npm run dev
```

Depois abra o endereco exibido no terminal, normalmente `http://localhost:5173`.

Para validar a versao de producao:

```bash
npm test -- --run
npm run build
```

## Arquitetura atual

Esta copia do projeto e um front-end Vite com proxies para APIs oficiais:

- `/api/camara` aponta para `https://dadosabertos.camara.leg.br`
- `/api/camara-portal` aponta para `https://www.camara.leg.br`
- `/api/senado` aponta para `https://legis.senado.leg.br/dadosabertos`

Ha tambem uma integracao opcional com Supabase Free para fila de correcoes e publicacao manual de dados validados.

Camadas importantes:

- `src/services/http.js`: cache em memoria, deduplicacao de chamadas simultaneas, timeout, retry e uso identificado do ultimo dado quando a fonte oscila.
- `src/services/camaraPortal.js`: leitura do resumo e das votacoes nominais exibidas no Portal do Deputado, com cache opcional no Supabase.
- `src/services/camara.js`: adaptador seguro da Camara.
- `src/services/senado.js`: adaptador seguro do Senado.
- `src/services/benefits.js`: checagens oficiais para selo de austeridade.
- `src/services/annualSummaries.js`: cache publico de resumos anuais para medias e rankings.
- `src/lib/data-quality.js`: contrato interno de qualidade dos KPIs.
- `src/lib/legislative-logic.js`: calculos auditaveis.
- `src/adapters/parliamentarians.js`: normalizacao comum de deputados e senadores.

## Formato obrigatorio de KPI

Todo KPI exibido deve seguir este formato:

```js
{
  label: string,
  value: number | string | null,
  unit?: string,
  status: 'available' | 'unavailable' | 'partial' | 'error',
  sourceName: string,
  sourceUrl: string,
  fetchedAt: string,
  updatedAt?: string | null,
  confidenceLevel: 'high' | 'medium' | 'low',
  calculationMethod: string,
  explanationForCitizen: string,
  warnings: string[]
}
```

O componente `TrustMetricCard` mostra fonte, data da consulta, confianca, metodo de calculo e explicacao para o cidadao.

## Fontes oficiais usadas

### Camara dos Deputados

Fonte: `https://dadosabertos.camara.leg.br`

Fonte complementar de moradia: `https://www.camara.leg.br/moradia/detalhamento`

Usado no projeto:

- Lista de deputados em exercicio.
- A lista de deputados ativos usa `/api/v2/deputados` sem `idLegislatura`, para evitar contar suplentes/ex-parlamentares que passaram pela legislatura.
- Detalhes de deputado.
- Despesas CEAP por deputado e ano.
- Proposicoes por autor e ano.
- Eventos registrados do deputado.
- Discursos registrados.
- Votacoes do deputado, quando o endpoint retornar dados.
- Portal oficial de imoveis funcionais e auxilio-moradia para checar regalias de moradia.

### Senado Federal

Fonte: `https://legis.senado.leg.br/dadosabertos`

Usado no projeto:

- Lista de senadores em exercicio.
- Detalhes de senador.

Dados individuais de relatorias, votacoes, despesas e discursos do Senado ficam como indisponiveis nesta integracao quando a fonte nao retorna uma resposta confirmavel.

## KPIs implementados

### Deputados

- Total gasto no ano.
- Media mensal de gastos.
- Quantidade de despesas.
- Maior fornecedor.
- Maiores categorias de despesa.
- Evolucao mensal de gastos.
- Media nacional de gastos, quando o cache anual estiver completo.
- Media estadual de gastos, quando o cache anual estiver completo.
- Ranking nacional/estadual de gastos, quando houver pelo menos 450 deputados sincronizados no ano.
- Pagina publica `/rankings` com filtros por ano, estado, partido e busca por nome.
- Ordenacao de rankings por maiores e menores gastos.
- Recortes de ranking por categoria sensivel da CEAP, como combustivel, passagens, veiculos, hospedagem, alimentacao, divulgacao e consultorias.
- Pagina publica `/alertas` com pontos de atencao responsaveis.
- Painel de pontos de atencao dentro do perfil individual do deputado.
- Selo de austeridade verificada, concedido somente quando a CEAP nao mostra carro alugado/fretado e o portal oficial da Camara informa ausencia de imovel funcional ou auxilio-moradia.
- Painel de despesas sensiveis da CEAP, agrupando categorias como veiculos, combustivel, passagens, hospedagem, alimentacao, divulgacao e consultorias.
- Comparacao lado a lado em `/comparar`, incluindo KPIs auditaveis e recorte de despesas sensiveis por deputado.
- Proposicoes de autoria encontradas.
- Projetos legislativos por tipo seguro: PL, PLP, PEC e MPV.
- Atividades registradas.
- Discursos registrados.
- Votacoes nominais relevantes com voto registrado, priorizando a pagina oficial de votacoes do proprio deputado.
- Cobertura dos dados do perfil, que mede completude das fontes e nao desempenho parlamentar.

### Senado

- Relatorias, votacoes, despesas e discursos aparecem como indisponiveis quando a fonte individual nao e confirmada.
- O perfil ainda mostra dados cadastrais oficiais do senador.

## KPIs indisponiveis por seguranca

- Faltas em votacoes: nao e calculado sem denominador oficial de votacoes esperadas.
- Presenca parlamentar percentual: nao e calculada quando so ha eventos/votos isolados.
- Relatorias aprovadas de deputado: nao e inferida por autoria.
- Proposicoes aprovadas: nao e exibida sem confirmacao por tramitacao/votacao.
- Rankings nacionais/estaduais de gasto: ficam indisponiveis ate o admin sincronizar uma base anual com pelo menos 450 deputados.

## Cobertura dos dados do perfil

O percentual e calculado pelo FISCALIZA para informar quanto do perfil recebeu resposta rastreavel. Ele nao avalia qualidade, produtividade, ideologia ou conduta do parlamentar.

Ele verifica seis grupos com o mesmo peso:

- gastos declarados;
- propostas legislativas;
- relatorias encontradas;
- presenca oficial;
- votacoes nominais;
- discursos em Plenario.

Fonte disponivel conta como cobertura integral, resposta parcial conta como meia cobertura e dado indisponivel conta como zero. O card nao deve ser usado para comparar desempenho entre parlamentares.

## Backend gratuito opcional com Supabase

O formulario `/corrigir` funciona em dois modos:

- Sem Supabase: abre um e-mail preenchido.
- Com Supabase Free: salva a correcao na tabela `correcoes`.

Para ativar:

1. Crie um projeto gratuito em `https://supabase.com`.
2. Abra o SQL Editor.
3. Execute o arquivo `supabase/schema.sql`.
4. Copie `.env.example` para `.env.local`.
5. Preencha `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
6. No Supabase, abra Authentication > Users e crie seu usuario administrador.
7. Autorize seu e-mail:

```sql
insert into public.admin_users (email)
values ('seu-email@exemplo.com')
on conflict (email) do nothing;
```

8. Reinicie `npm run dev`.

Nunca coloque a `service_role key` no front-end. Use apenas a chave `anon public`.

## Painel admin

Rota: `/admin`

Permite:

- Ler correcoes enviadas.
- Marcar como `em_analise`.
- Recusar.
- Validar e publicar uma metrica em `metricas_validadas`.
- Sincronizar resumos anuais de despesas de deputados em `deputado_ano_resumos`.
- Sincronizar os totais publicos do Portal do Deputado em `deputado_portal_resumos`, quando a tabela atualizada estiver instalada.

Rota publica:

- `/dados-validados`
- `/rankings`
- `/alertas`
- `/meu-roteiro`
- `/pautas`

Esses dados sao revisados manualmente e ficam separados das APIs oficiais.

### Cache de rankings

No `/admin`, use `Sincronizar ano` para preencher `deputado_ano_resumos`.

Esse processo:

- busca a lista oficial de deputados;
- consulta as despesas CEAP de cada deputado no ano;
- salva total gasto, media mensal, quantidade de despesas, maior fornecedor e categorias;
- salva o detalhamento de categorias com valor e quantidade de registros;
- permite calcular media nacional, media estadual e ranking sem consultar toda a Camara em cada visita.

O ranking publico so aparece como confiavel quando a base tiver pelo menos 450 deputados sincronizados para o ano.

Na pagina `/rankings`, se a base estiver abaixo desse minimo, o site mostra aviso de base parcial e trata a lista como consulta filtrada, nao como ranking nacional definitivo.

A pagina tambem permite selecionar um recorte de categoria CEAP. Exemplo: combustivel, veiculos, passagens ou divulgacao. Nesse modo, o ranking mostra apenas deputados com valor naquela categoria, informa quanto isso representa do gasto anual e preserva a fonte original da Camara.

Se o ano foi sincronizado antes desta funcionalidade, o valor do recorte pode aparecer, mas a quantidade de registros pode ficar como `Nao informado`. Para preencher a contagem, sincronize o ano novamente no painel admin.

### Pontos de atencao

A pagina `/alertas` usa a mesma base anual para mostrar sinais que merecem leitura da fonte oficial. Ela nao acusa irregularidade.

Hoje ela destaca:

- concentracao de 40% ou mais das despesas no maior fornecedor;
- gasto acima de 50% da media da base sincronizada, somente quando ha base nacional suficiente.
- categoria sensivel com peso alto dentro das despesas do proprio parlamentar, como combustivel, veiculos, passagens, hospedagem, alimentacao, divulgacao ou consultorias.

Cada ponto exibe fonte, explicacao e metodo de calculo.

O perfil individual do deputado tambem exibe estes pontos na aba de gastos. Quando nenhum criterio e acionado, o site mostra isso explicitamente.

Os alertas por categoria sensivel usam limites minimos de valor e percentual para evitar destacar gastos pequenos. Eles continuam sendo triagem: servem para orientar a leitura da fonte oficial, nao para afirmar irregularidade.

### Selo de austeridade verificada

O selo aparece no perfil individual do deputado.

Ele e concedido somente quando as duas checagens oficiais passam:

- Despesas CEAP do ano consultado nao contem categoria de locacao ou fretamento de veiculos automotores.
- Portal oficial de Imoveis Funcionais e Auxilio-Moradia da Camara informa `Nenhum beneficio`.

Se a CEAP estiver parcial, se o portal de moradia falhar ou se a pagina oficial nao permitir conclusao clara, o selo fica como `Em analise`.

Se alguma dessas regalias for encontrada, o selo fica como `Nao concedido`. Isso nao indica irregularidade; apenas informa que o criterio do selo nao foi atendido.

### Despesas sensiveis da CEAP

Na aba de gastos do perfil, o FISCALIZA destaca categorias de maior interesse publico:

- locacao ou fretamento de veiculos automotores;
- combustiveis e lubrificantes;
- passagens aereas;
- hospedagem;
- alimentacao;
- divulgacao da atividade parlamentar;
- consultorias, pesquisas e trabalhos tecnicos.

Esse painel usa somente o campo `tipoDespesa` retornado pelos Dados Abertos da Camara. Ele mostra valor, quantidade de registros, participacao no total anual e exemplos de fornecedores retornados pela API.

O painel nao acusa irregularidade. Ele serve para orientar a leitura das notas e fornecedores.

### Comparacao lado a lado

A rota `/comparar` permite selecionar dois deputados e um ano. A tela consulta as fontes oficiais da Camara para cada parlamentar e mostra:

- projetos legislativos encontrados;
- total gasto e media mensal;
- atividades e votos nominais registrados, quando retornados pela API;
- recorte de despesas sensiveis da CEAP.

A comparacao nao define quem e melhor ou pior. Ela organiza perguntas de fiscalizacao: onde cada um declarou mais despesa, quais categorias aparecem e quais dados oficiais continuam limitados.

### Votacoes nominais relevantes

O perfil do deputado tem uma aba `Votacoes`.

O primeiro caminho e a pagina publica oficial do proprio deputado:

- `/deputados/{id}/votacoes-nominais-plenario/{ano}`

Essa pagina permite obter de uma vez o total anual mostrado pela Camara, a materia, o voto individual, a data e a presenca informada na sessao. Isso reduz centenas de chamadas por perfil.

Se o portal nao responder ou mudar de estrutura, o FISCALIZA usa como fallback os Dados Abertos da Camara:

- `/api/v2/votacoes`
- `/api/v2/votacoes/{id}/votos`
- `/arquivos/votacoes/json/votacoes-{ano}.json`, quando a API REST nao retorna votacoes
- `/arquivos/votacoesVotos/json/votacoesVotos-{ano}.json`, quando o endpoint de votos por votacao nao encontra o parlamentar
- `/arquivos/votacoesObjetos/json/votacoesObjetos-{ano}.json`, para buscar possiveis objetos oficiais da votacao
- `/arquivos/votacoesProposicoes/json/votacoesProposicoes-{ano}.json`, para buscar proposicoes afetadas pela votacao

O fallback limita a quantidade de votacoes candidatas consultadas e processa pequenos lotes para nao sobrecarregar a fonte oficial.

A tela nao tenta listar todas as votacoes do ano. Para manter o site leve e compreensivel, ela monta um recorte de votacoes relevantes por:

- prioridade para votacoes em Plenario, consultando `idOrgao=180`, porque esse e o recorte mais provavel de conter votos de qualquer deputado;
- tema de interesse publico, como seguranca publica, penas, economia, impostos, direitos, saude, educacao, meio ambiente e temas institucionais;
- PEC, PLP, MPV e urgencias;
- volume de votos;
- margem apertada entre `Sim` e `Nao`, quando a fonte fornece esses totais.

Depois o site mostra apenas os itens em que existe voto registrado. Se tanto o portal quanto a API REST retornarem vazio, os arquivos anuais oficiais continuam como ultimo fallback.

Cada card tenta traduzir a votacao para o cidadao:

- identifica PL, PEC, MPV, emenda, destaque ou requerimento quando o numero aparece nos dados oficiais;
- cruza a materia ou a descricao oficial com o cadastro local de pautas nacionais importantes em `src/lib/major-agendas.js`;
- mostra a proposicao relacionada informada pela Camara, quando existe, com link para a proposicao;
- cria um tema popular responsavel, como `seguranca publica`, `aumento ou reducao de pena`, `impostos` ou `redes sociais`, a partir de palavras encontradas na descricao oficial;
- mantem a descricao oficial visivel para auditoria;
- avisa quando nao consegue identificar o numero da materia.

O cadastro local de pautas usa estes campos:

- `apelido_pauta`
- `numero_proposicao`
- `tipo`
- `ano_pauta`
- `tema`
- `resumo_curto`
- `houve_voto_nominal`
- `observacao_voto`

Limite importante: segundo a documentacao da Camara, votos por parlamentar nao listam deputados ausentes. Por isso, ausencia de registro nao vira falta.

Outro limite importante: a propria Camara informa que os arquivos de objetos de votacao podem trazer uma ou mais proposicoes como `possivel objeto`. Principalmente no Plenario, a proposicao realmente votada pode nao ser qualquer uma delas. Por isso, o FISCALIZA exibe o tipo de vinculo: possivel objeto oficial, proposicao afetada ou materia inferida pela descricao.

### Pautas nacionais

A rota `/pautas` lista pautas de grande repercussao nacional cadastradas em `src/lib/major-agendas.js`.

Ela permite:

- buscar por apelido, tema ou numero oficial;
- filtrar por tema;
- filtrar por disponibilidade de voto nominal: `sim`, `parcial` ou `nao`;
- abrir uma busca no portal oficial da Camara pelo numero da proposicao;
- entender se o voto individual pode ser fiscalizado nos perfis.

Esse cadastro e editorial e serve para traduzir pautas populares. Ele nao substitui a fonte oficial da Camara para voto individual.

### Meu roteiro cidadao

A rota `/meu-roteiro` substitui a antiga ideia de `Meu DNA Politico`.

Ela nao calcula afinidade ideologica, nao cruza opinioes do usuario com partido e nao recomenda parlamentares. A tela gera apenas um roteiro educativo com base nas prioridades escolhidas pelo usuario:

- gastos publicos;
- pontos de atencao;
- propostas e votos;
- dados contestados e validados manualmente.

O caminho antigo `/meu-dna` continua ativo como compatibilidade, mas entrega a mesma experiencia segura de `/meu-roteiro`.

## Limitacoes conhecidas

- Esta copia ainda nao tem backend Express ativo; o papel de backend leve e feito por Vite/Vercel rewrites e Supabase opcional.
- Comparativos de media estadual/nacional exigem sincronizacao agregada para nao sobrecarregar a API oficial.
- Selo de austeridade depende do portal oficial de moradia da Camara; quando a pagina nao puder ser lida com seguranca, a conclusao fica em analise.
- Painel de despesas sensiveis depende do nome das categorias CEAP retornadas pela Camara; se a Camara mudar nomes de categorias, o agrupamento deve ser revisado.
- Senado tem integracoes individuais conservadoras: se a fonte nao for confirmada, a tela mostra indisponivel.
- A data `fetchedAt` representa o momento em que o FISCALIZA consultou ou calculou o dado.
- A leitura do Portal do Deputado depende da estrutura HTML publicada pela Camara. Se ela mudar, o parser precisa ser revisado e o site deve sinalizar o dado como indisponivel.
- Sem cache anual no Supabase, rankings e alertas usam uma amostra ao vivo de ate 27 deputados, distribuida entre UFs quando possivel. Ela nunca deve ser apresentada como ranking nacional completo.

## Checklist de producao

- Executar `npm test -- --run` e `npm run build` antes de publicar.
- Configurar `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY` na Vercel para Production e Preview.
- Executar o `supabase/schema.sql` atualizado quando houver novas tabelas ou politicas.
- Conferir `/saude`, `/rankings`, `/alertas`, um perfil de deputado, uma pauta e uma pagina `/fonte/...` na URL publicada.
- Confirmar que a cobertura do ranking informa `Base completa`, `Base parcial` ou `Amostra ao vivo` corretamente.
- Nunca publicar `service_role`, senha de admin ou arquivo `.env.local`.

## Debug comum

- Tela vazia de dados da Camara: confira se o proxy `/api/camara` esta ativo no Vite ou Vercel.
- Selo de austeridade sempre em analise: confira se o proxy `/api/camara-portal` esta ativo e se a pagina oficial de moradia da Camara responde.
- Admin nao carrega correcoes: rode `supabase/schema.sql` e confira se seu e-mail esta em `admin_users`.
- Sincronizacao termina com `0 salvos / 453 falhas`: rode novamente `supabase/schema.sql`, confirme seu e-mail em `admin_users`, saia do `/admin`, entre de novo e tente sincronizar novamente.
- Correcoes nao salvam: confira `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`.
- Build com aviso de Browserslist: e aviso de base de navegadores desatualizada, nao quebra o site.

## Politica de confiabilidade

O FISCALIZA nao deve:

- Usar `Math.random` para KPI.
- Mostrar mock como dado real.
- Chamar proposta apresentada de proposta aprovada.
- Chamar ausencia de voto de falta.
- Acusar crime.
- Exibir ranking sem metodologia e fonte.

## Correcoes de filiacao partidaria

Quando o cache local ou a API intermediaria retorna partido antigo, o FISCALIZA pode aplicar uma correcao explicita apenas com fonte oficial. Exemplo atual:

- Kim Kataguiri (`204536`): `MISSÃO`, conforme perfil oficial da Camara.

Essas correcoes ficam em `src/lib/party-corrections.js` e devem sempre apontar para uma fonte verificavel.
