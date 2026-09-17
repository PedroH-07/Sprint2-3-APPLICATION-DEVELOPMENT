#  GreenSense

## Monitoramento Ambiental da Mata Atlântica

O **GreenSense** é um dashboard web desenvolvido para acompanhar condições ambientais de pontos monitorados da Mata Atlântica.

A aplicação apresenta dados climáticos e classifica a altura da vegetação em diferentes níveis de atenção, indicando a ação recomendada para cada situação.

---

##  Objetivo do projeto

O objetivo do GreenSense é facilitar a visualização de informações ambientais e apoiar a identificação de locais que podem precisar de acompanhamento ou intervenção.

Para cada ponto monitorado, o sistema apresenta:

- Localização;
- Coordenadas geográficas;
- Altura da vegetação;
- Classificação da vegetação;
- Ação recomendada;
- Temperatura;
- Umidade;
- Precipitação;
- Velocidade do vento;
- Índice UV;
- Risco climático.

---

##  Funcionalidades

- Busca de pontos da Mata Atlântica utilizando o OpenStreetMap;
- Consulta de dados climáticos atuais utilizando o Open-Meteo;
- Criação dinâmica dos cards do dashboard;
- Classificação automática da vegetação conforme sua altura;
- Indicação da ação recomendada;
- Identificação visual por cores;
- Atualização dos dados climáticos;
- Tratamento de erros e carregamento;
- Layout responsivo para computadores, tablets e celulares.

---

##  Tecnologias utilizadas

- HTML5;
- CSS3;
- JavaScript;
- API Nominatim/OpenStreetMap;
- API Open-Meteo.

Não foram utilizados frameworks ou bibliotecas externas.

---

##  Estrutura do projeto

```text
Sprint2-APPLICATION-DEVELOPMENT/
│
├── index.html
│
├── css/
│   └── style.css
│
├── js/
│   └── main.js
│
└── README.md
```

---

##  Classificação da vegetação

A classificação utiliza a altura estimada da vegetação em metros.

As faixas foram definidas considerando que o aumento da altura pode indicar maior necessidade de monitoramento e manutenção.

| Altura da vegetação | Classificação | Ação recomendada |
|---|---|---|
| Até 1,20 m | Normal | Manter o monitoramento de rotina. |
| Acima de 1,20 m até 1,80 m | Atenção | Agendar uma inspeção preventiva. |
| Acima de 1,80 m até 2,50 m | Risco | Programar intervenção em curto prazo. |
| Acima de 2,50 m | Crítico | Realizar intervenção imediata. |

### Exemplos de classificação

| Altura | Resultado |
|---:|---|
| 0,95 m | Normal |
| 1,20 m | Normal |
| 1,45 m | Atenção |
| 1,80 m | Atenção |
| 2,10 m | Risco |
| 2,50 m | Risco |
| 2,85 m | Crítico |

### Regras dos limites

Os limites são avaliados da seguinte forma:

- `altura <= 1.20`: Normal;
- `altura <= 1.80`: Atenção;
- `altura <= 2.50`: Risco;
- `altura > 2.50`: Crítico.

Valores negativos ou inválidos são tratados como **Indisponíveis**, solicitando a verificação da medição.

---

##  Dados da vegetação

As APIs utilizadas no projeto fornecem informações de localização e clima, mas não fornecem a altura da vegetação dos pontos monitorados.

Por esse motivo, o projeto utiliza um conjunto de alturas simuladas e determinísticas no arquivo `js/main.js`:

```javascript
var alturasVegetacaoSimuladas = [
    0.95,
    1.20,
    1.45,
    1.80,
    2.10,
    2.50,
    2.85,
    1.05,
    1.65,
    2.30
];
```

Esses valores foram definidos para demonstrar as quatro classificações exigidas:

- Normal;
- Atenção;
- Risco;
- Crítico.

Em uma versão futura, essas alturas poderão ser substituídas por dados reais vindos de sensores, banco de dados ou uma API específica de monitoramento da vegetação.

---

##  Funcionamento do JavaScript

O arquivo `js/main.js` organiza o processamento por meio de funções.

### Principais funções

#### `classificarVegetacao(altura)`

Recebe a altura da vegetação e retorna um objeto contendo:

- classificação;
- ação recomendada;
- classe CSS;
- emoji de identificação.

#### `obterAlturaVegetacao(indice)`

Obtém uma altura simulada para cada ponto monitorado.

#### `buscarPontosMatAtlantica(callback)`

Consulta o Nominatim/OpenStreetMap para encontrar localidades da Mata Atlântica.

#### `obterDadosClimaticos(latitude, longitude, callback)`

Consulta a API Open-Meteo para obter os dados climáticos atuais.

#### `exibirDashboard(pontos)`

Limpa o dashboard e percorre os pontos utilizando `forEach()` para criar os cards dinamicamente.

#### `criarCard(ponto)`

Cria os elementos HTML de cada ponto monitorado, mostrando localização, altura, classificação, ação recomendada e dados climáticos.

#### `calcularRisco(clima)`

Calcula o risco climático com base na temperatura, umidade, precipitação e velocidade do vento.

---

##  Identificação visual

A classificação da vegetação utiliza classes CSS específicas:

| Classe CSS | Classificação | Cor predominante |
|---|---|---|
| `.vegetacao-normal` | Normal | Verde |
| `.vegetacao-atencao` | Atenção | Amarelo |
| `.vegetacao-risco` | Risco | Laranja |
| `.vegetacao-critico` | Crítico | Vermelho |
| `.vegetacao-indisponivel` | Indisponível | Cinza |

O risco climático possui classes independentes:

- `.risk-low`;
- `.risk-medium`;
- `.risk-high`.

Dessa forma, a aplicação diferencia o nível da vegetação do risco climático.

---

##  Como executar o projeto

1. Clone ou baixe o repositório:

```bash
git clone https://github.com/PedroH-07/Sprint2-APPLICATION-DEVELOPMENT.git
```

2. Entre na pasta do projeto:

```bash
cd Sprint2-APPLICATION-DEVELOPMENT
```

3. Abra o arquivo `index.html` em um navegador.

Também é possível utilizar uma extensão como **Live Server** no Visual Studio Code para executar o projeto localmente.

---

##  APIs utilizadas

### Nominatim/OpenStreetMap

Utilizada para localizar parques e áreas da Mata Atlântica e obter suas coordenadas geográficas.

### Open-Meteo

Utilizada para consultar dados climáticos atuais, como:

- Temperatura;
- Umidade relativa do ar;
- Precipitação;
- Velocidade do vento;
- Índice UV.

As APIs são acessadas diretamente pelo JavaScript utilizando `fetch()`.

----------------------------------------------------
- Pedro Henrique dos Santos Cardoso - RM: 563268
- Gabriel Gibin Leoncio – RM: 565462
- Rafael do Nascimento Silva – RM: 566263
- Rai Augusto Ribeiro – RM: 562870
- Guilherme Morais de Assis - RM: 564198
- Lucas Werpp Franco - RM: 556044
