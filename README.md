- Pedro Henrique dos Santos Cardoso - RM: 563268
- Gabriel Gibin Leoncio – RM: 565462
- Rafael do Nascimento Silva – RM: 566263
- Rai Augusto Ribeiro – RM: 562870
- Guilherme Morais de Assis - RM: 564198
- Lucas Werpp Franco - RM: 556044

#  GreenSense

## Monitoramento da vegetação ao longo das rodovias

O GreenSense é uma aplicação web desenvolvida para monitorar trechos rodoviários e identificar a vegetação que pode representar risco à segurança viária.

A solução combina:

- localização dos trechos usando Nominatim/OpenStreetMap;
- dados climáticos em tempo real usando Open-Meteo;
- classificação automática da vegetação por altura;
- indicação da ação recomendada para cada ponto monitorado.

---

##  Objetivo da aplicação

A solução foi pensada para analisar a vegetação que cresce próximo às rodovias e indicar quando a vegetação exige acompanhamento ou intervenção. O sistema permite visualizar, para cada ponto monitorado:

- rodovia;
- trecho;
- município;
- localização geográfica;
- altura da vegetação;
- classificação;
- ação recomendada;
- clima atual;
- risco climático.

---

##  Regra de classificação da vegetação

A regra de negócio foi definida de forma coerente com o cenário rodoviário.

### Limites de altura:

- Normal: até 20 cm
- Atenção: acima de 20 cm até 30 cm
- Risco: acima de 30 cm até 35 cm
- Crítico: 35 cm ou mais

### Critério crítico

A vegetação com 35 cm ou mais será classificada como Crítica e exigirá intervenção imediata.

---

## Tabela de classificação

| Altura da vegetação | Classificação | Ação recomendada |
|---|---|---|
| Até 20 cm | Normal | Manter o monitoramento de rotina. |
| Acima de 20 cm até 30 cm | Atenção | Agendar uma inspeção preventiva. |
| Acima de 30 cm até 35 cm | Risco | Programar intervenção antes do limite crítico. |
| 35 cm ou mais | Crítico | Realizar intervenção imediata. |

---

##  Como a lógica foi implementada

A lógica foi organizada em funções JavaScript, conforme os requisitos da atividade.

### Principais funções:

- `classificarVegetacao(altura)`
- `buscarTrechosRodoviarios(callback)`
- `obterDadosClimaticos(latitude, longitude, callback)`
- `obterDadosDosPontos(pontos, indiceAtual)`
- `exibirDashboard(pontos)`
- `criarCard(ponto)`
- `calcularRisco(clima)`

### Estruturas utilizadas:

- `forEach()` para percorrer os pontos e aplicar a renderização
- condicionais para definir a faixa de risco da vegetação
- criação dinâmica de elementos HTML
- atualização visual do dashboard

---

##  APIs utilizadas

- Nominatim/OpenStreetMap

- Open-Meteo

---

##  Estrutura do projeto

```text
Sprint2-APPLICATION-DEVELOPMENT/
│
├── index.html
├── css/
│   └── style.css
├── js/
│   └── main.js
├── README.md
