// GREENSENSE - Monitoramento da Vegetação ao Longo das Rodovias
//
// Nominatim/OpenStreetMap:
// - Localização dos trechos rodoviários.
//
// Open-Meteo:
// - Dados climáticos atuais das coordenadas encontradas.
//
// JavaScript:
// - Classificação da altura da vegetação.
// - Atualização dinâmica do dashboard.

document.addEventListener('DOMContentLoaded', function() {
    var loadBtn = document.getElementById('loadBtn');
    var refreshBtn = document.getElementById('refreshBtn');
    var dashboardGrid = document.getElementById('dashboard-grid');
    var loadingIndicator = document.getElementById('loadingIndicator');
    var errorMessage = document.getElementById('errorMessage');

    var monitoredPoints = [];

    /*
     * Faixas de classificação da vegetação próxima às rodovias.
     *
     * A regra principal do cenário é:
     * 35 cm ou mais = intervenção imediata.
     *
     * Os valores são armazenados em metros:
     * 20 cm = 0.20 m
     * 30 cm = 0.30 m
     * 35 cm = 0.35 m
     */
    var faixasVegetacao = [
        {
            classificacao: 'Normal',
            acao: 'Manter o monitoramento de rotina.',
            classeCss: 'vegetacao-normal',
            emoji: '✅'
        },
        {
            classificacao: 'Atenção',
            acao: 'Agendar uma inspeção preventiva.',
            classeCss: 'vegetacao-atencao',
            emoji: '⚠️'
        },
        {
            classificacao: 'Risco',
            acao: 'Programar intervenção antes do limite crítico.',
            classeCss: 'vegetacao-risco',
            emoji: '🟠'
        },
        {
            classificacao: 'Crítico',
            acao: 'Realizar intervenção imediata na vegetação.',
            classeCss: 'vegetacao-critico',
            emoji: '🚨'
        }
    ];

    /*
     * As APIs utilizadas no projeto não fornecem diretamente
     * a altura da vegetação.
     *
     * Estes valores representam leituras demonstrativas em metros
     * e foram definidos para testar todas as classificações:
     *
     * - abaixo de 20 cm: Normal;
     * - de 20 cm até abaixo de 30 cm: Atenção;
     * - de 30 cm até abaixo de 35 cm: Risco;
     * - 35 cm ou mais: Crítico.
     */
    var alturasVegetacao = [
        0.10,
        0.20,
        0.25,
        0.30,
        0.32,
        0.34,
        0.35,
        0.40,
        0.18,
        0.33
    ];

    /*
     * Trechos rodoviários usados como consultas ao Nominatim.
     *
     * A API continua sendo utilizada para obter a localização,
     * latitude e longitude de cada trecho.
     */
    var trechosRodoviarios = [
        {
            rodovia: 'BR-116',
            trecho: 'Km 72',
            municipio: 'Teresópolis - RJ',
            busca: 'BR-116, Teresópolis, Rio de Janeiro, Brasil'
        },
        {
            rodovia: 'BR-116',
            trecho: 'Km 95',
            municipio: 'Duque de Caxias - RJ',
            busca: 'BR-116, Duque de Caxias, Rio de Janeiro, Brasil'
        },
        {
            rodovia: 'BR-101',
            trecho: 'Km 285',
            municipio: 'Itaboraí - RJ',
            busca: 'BR-101, Itaboraí, Rio de Janeiro, Brasil'
        },
        {
            rodovia: 'BR-101',
            trecho: 'Km 390',
            municipio: 'Angra dos Reis - RJ',
            busca: 'BR-101, Angra dos Reis, Rio de Janeiro, Brasil'
        },
        {
            rodovia: 'BR-040',
            trecho: 'Km 45',
            municipio: 'Petrópolis - RJ',
            busca: 'BR-040, Petrópolis, Rio de Janeiro, Brasil'
        },
        {
            rodovia: 'BR-381',
            trecho: 'Km 480',
            municipio: 'Contagem - MG',
            busca: 'BR-381, Contagem, Minas Gerais, Brasil'
        },
        {
            rodovia: 'SP-055',
            trecho: 'Km 160',
            municipio: 'Ubatuba - SP',
            busca: 'SP-055, Ubatuba, São Paulo, Brasil'
        },
        {
            rodovia: 'BR-116',
            trecho: 'Km 290',
            municipio: 'São José dos Campos - SP',
            busca: 'BR-116, São José dos Campos, São Paulo, Brasil'
        },
        {
            rodovia: 'BR-116',
            trecho: 'Km 350',
            municipio: 'Resende - RJ',
            busca: 'BR-116, Resende, Rio de Janeiro, Brasil'
        },
        {
            rodovia: 'BR-101',
            trecho: 'Km 170',
            municipio: 'São José - SC',
            busca: 'BR-101, São José, Santa Catarina, Brasil'
        }
    ];

    if (loadBtn) {
        loadBtn.addEventListener('click', iniciarMonitoramento);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', atualizarDados);
    }

    /*
     * Classifica automaticamente a vegetação conforme sua altura.
     */
    function classificarVegetacao(altura) {
        var alturaNumerica = Number(altura);

        if (!Number.isFinite(alturaNumerica) || alturaNumerica < 0) {
            return {
                classificacao: 'Indisponível',
                acao: 'Verificar a medição da vegetação.',
                classeCss: 'vegetacao-indisponivel',
                emoji: '❔'
            };
        }

        /*
         * Estruturas condicionais utilizadas para determinar
         * a situação de cada trecho rodoviário.
         */
        if (alturaNumerica < 0.20) {
            return faixasVegetacao[0];
        }

        if (alturaNumerica < 0.30) {
            return faixasVegetacao[1];
        }

        if (alturaNumerica < 0.35) {
            return faixasVegetacao[2];
        }

        return faixasVegetacao[3];
    }

    /*
     * Retorna uma altura demonstrativa para cada ponto.
     */
    function obterAlturaVegetacao(indice) {
        return alturasVegetacao[
            indice % alturasVegetacao.length
        ];
    }

    /*
     * Inicia o carregamento dos trechos rodoviários.
     */
    function iniciarMonitoramento() {
        mostrarCarregamento(true);
        limparErros();

        monitoredPoints = [];

        buscarTrechosRodoviarios(function(pontos) {
            if (pontos.length === 0) {
                mostrarErro(
                    'Nenhum trecho rodoviário foi localizado pela API.'
                );

                mostrarCarregamento(false);
                return;
            }

            obterDadosDosPontos(pontos, 0);
        });
    }

    /*
     * Consulta o Nominatim/OpenStreetMap para localizar
     * os trechos rodoviários.
     */
    function buscarTrechosRodoviarios(callback) {
        var pontosEncontrados = [];
        var indiceBusca = 0;

        function executarBusca() {
            if (indiceBusca >= trechosRodoviarios.length) {
                callback(pontosEncontrados);
                return;
            }

            var trechoAtual = trechosRodoviarios[indiceBusca];

            var url =
                'https://nominatim.openstreetmap.org/search?' +
                'q=' +
                encodeURIComponent(trechoAtual.busca) +
                '&format=json' +
                '&limit=1' +
                '&addressdetails=1';

            fetch(url)
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error(
                            'Erro HTTP na API de localização: ' +
                            response.status
                        );
                    }

                    return response.json();
                })
                .then(function(dados) {
                    if (
                        dados.length > 0 &&
                        dados[0].lat &&
                        dados[0].lon
                    ) {
                        pontosEncontrados.push({
                            rodovia: trechoAtual.rodovia,
                            trecho: trechoAtual.trecho,
                            municipio: trechoAtual.municipio,
                            nomeApi: dados[0].display_name,
                            lat: parseFloat(dados[0].lat),
                            lon: parseFloat(dados[0].lon),
                            alturaVegetacao:
                                obterAlturaVegetacao(
                                    pontosEncontrados.length
                                )
                        });
                    }

                    indiceBusca++;

                    /*
                     * Intervalo entre chamadas ao Nominatim para
                     * evitar muitas requisições consecutivas.
                     */
                    setTimeout(executarBusca, 1000);
                })
                .catch(function(erro) {
                    console.warn(
                        'Falha ao localizar o trecho ' +
                        trechoAtual.busca +
                        ':',
                        erro
                    );

                    indiceBusca++;

                    setTimeout(executarBusca, 1000);
                });
        }

        executarBusca();
    }

    /*
     * Consulta a API Open-Meteo para obter os dados climáticos
     * atuais das coordenadas retornadas pelo Nominatim.
     */
    function obterDadosClimaticos(latitude, longitude, callback) {
        var url =
            'https://api.open-meteo.com/v1/forecast?' +
            'latitude=' +
            latitude +
            '&longitude=' +
            longitude +
            '&current=' +
            'temperature_2m,' +
            'relative_humidity_2m,' +
            'precipitation,' +
            'wind_speed_10m,' +
            'uv_index' +
            '&timezone=auto';

        fetch(url)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error(
                        'Erro HTTP na API climática: ' +
                        response.status
                    );
                }

                return response.json();
            })
            .then(function(dados) {
                if (!dados.current) {
                    throw new Error(
                        'A API não retornou dados climáticos atuais.'
                    );
                }

                var clima = {
                    temperatura: dados.current.temperature_2m,
                    umidade: dados.current.relative_humidity_2m,
                    precipitacao: dados.current.precipitation,
                    velocidadeVento: dados.current.wind_speed_10m,
                    indiceUV: dados.current.uv_index
                };

                callback(clima);
            })
            .catch(function(erro) {
                mostrarErro(
                    'Erro ao obter dados climáticos de um trecho: ' +
                    erro.message
                );

                callback(null);
            });
    }

    /*
     * Obtém os dados climáticos de todos os pontos,
     * mantendo o processamento sequencial.
     */
    function obterDadosDosPontos(pontos, indiceAtual) {
        if (indiceAtual >= pontos.length) {
            exibirDashboard(monitoredPoints);
            finalizarCarregamento();
            return;
        }

        var pontoAtual = pontos[indiceAtual];

        obterDadosClimaticos(
            pontoAtual.lat,
            pontoAtual.lon,
            function(clima) {
                if (clima !== null) {
                    monitoredPoints.push({
                        rodovia: pontoAtual.rodovia,
                        trecho: pontoAtual.trecho,
                        municipio: pontoAtual.municipio,
                        nomeApi: pontoAtual.nomeApi,
                        lat: pontoAtual.lat,
                        lon: pontoAtual.lon,
                        alturaVegetacao:
                            pontoAtual.alturaVegetacao,
                        clima: clima
                    });
                }

                setTimeout(function() {
                    obterDadosDosPontos(
                        pontos,
                        indiceAtual + 1
                    );
                }, 500);
            }
        );
    }

    /*
     * Percorre os dados utilizando forEach()
     * e atualiza o dashboard dinamicamente.
     */
    function exibirDashboard(pontos) {
        if (!dashboardGrid) {
            return;
        }

        dashboardGrid.innerHTML = '';

        if (pontos.length === 0) {
            mostrarErro(
                'Nenhum dado foi carregado para os trechos rodoviários.'
            );

            return;
        }

        pontos.forEach(function(ponto) {
            var card = criarCard(ponto);
            dashboardGrid.appendChild(card);
        });
    }

    /*
     * Cria dinamicamente o card de um trecho rodoviário.
     */
    function criarCard(ponto) {
        var card = document.createElement('div');
        card.className = 'card';

        var classificacaoVegetacao =
            classificarVegetacao(
                ponto.alturaVegetacao
            );

        var riscoClimatico =
            calcularRisco(ponto.clima);

        var alturaEmCentimetros =
            ponto.alturaVegetacao * 100;

        card.innerHTML =
            '<div class="card-title">' +
                '🛣️ ' +
                ponto.rodovia +
            '</div>' +

            '<div class="card-coordinates">' +
                '<strong>Trecho:</strong> ' +
                ponto.trecho +
                '<br>' +
                '<strong>Município:</strong> ' +
                ponto.municipio +
                '<br>' +
                'Latitude: ' +
                ponto.lat.toFixed(4) +
                ' | Longitude: ' +
                ponto.lon.toFixed(4) +
            '</div>' +

            '<div class="vegetation-status ' +
                classificacaoVegetacao.classeCss +
            '">' +
                '<strong>' +
                    classificacaoVegetacao.emoji +
                    ' Vegetação: ' +
                    classificacaoVegetacao.classificacao +
                '</strong>' +

                '<span>' +
                    '<strong>Altura:</strong> ' +
                    alturaEmCentimetros.toFixed(0) +
                    ' cm' +
                '</span>' +

                '<span>' +
                    '<strong>Ação recomendada:</strong> ' +
                    classificacaoVegetacao.acao +
                '</span>' +
            '</div>' +

            '<div class="weather-data">' +
                criarItemClimatico(
                    '🌡️ Temperatura',
                    ponto.clima.temperatura.toFixed(1) +
                    '°C'
                ) +

                criarItemClimatico(
                    '💧 Umidade',
                    ponto.clima.umidade +
                    '%'
                ) +

                criarItemClimatico(
                    '🌧️ Precipitação',
                    ponto.clima.precipitacao.toFixed(2) +
                    ' mm'
                ) +

                criarItemClimatico(
                    '💨 Velocidade do Vento',
                    ponto.clima.velocidadeVento.toFixed(1) +
                    ' km/h'
                ) +

                criarItemClimatico(
                    '☀️ Índice UV',
                    ponto.clima.indiceUV.toFixed(1)
                ) +
            '</div>' +

            '<div class="risk-status ' +
                riscoClimatico.classe +
            '">' +
                riscoClimatico.emoji +
                ' ' +
                riscoClimatico.texto +
            '</div>';

        return card;
    }

    /*
     * Cria um item visual para os dados climáticos.
     */
    function criarItemClimatico(rotulo, valor) {
        return (
            '<div class="weather-item">' +
                '<span class="weather-label">' +
                    rotulo +
                '</span>' +
                '<span class="weather-value">' +
                    valor +
                '</span>' +
            '</div>'
        );
    }

    /*
     * Calcula o risco climático do trecho.
     * Essa regra é independente da classificação da vegetação.
     */
    function calcularRisco(clima) {
        var riscoPontos = 0;

        if (clima.temperatura > 30) {
            riscoPontos += 2;
        }

        if (clima.temperatura > 35) {
            riscoPontos += 2;
        }

        if (clima.umidade < 40) {
            riscoPontos += 2;
        }

        if (clima.umidade < 20) {
            riscoPontos += 2;
        }

        if (clima.velocidadeVento > 20) {
            riscoPontos += 2;
        }

        if (clima.velocidadeVento > 30) {
            riscoPontos += 2;
        }

        if (clima.precipitacao < 1) {
            riscoPontos += 1;
        }

        if (riscoPontos <= 3) {
            return {
                classe: 'risk-low',
                texto: 'Risco Climático Baixo',
                emoji: '✅'
            };
        }

        if (riscoPontos <= 6) {
            return {
                classe: 'risk-medium',
                texto: 'Risco Climático Moderado',
                emoji: '⚠️'
            };
        }

        return {
            classe: 'risk-high',
            texto: 'Risco Climático Alto',
            emoji: '🚨'
        };
    }

    /*
     * Atualiza os dados climáticos mantendo os mesmos
     * trechos e as mesmas alturas de vegetação.
     */
    function atualizarDados() {
        mostrarCarregamento(true);
        limparErros();

        var pontosParaAtualizar =
            monitoredPoints.slice();

        if (pontosParaAtualizar.length === 0) {
            mostrarCarregamento(false);
            mostrarErro(
                'Carregue os dados antes de tentar atualizar.'
            );
            return;
        }

        monitoredPoints = [];

        atualizarPontosSequencial(
            pontosParaAtualizar,
            0
        );
    }

    /*
     * Atualiza os dados climáticos de cada trecho
     * sem consultar novamente o Nominatim.
     */
    function atualizarPontosSequencial(pontos, indice) {
        if (indice >= pontos.length) {
            exibirDashboard(monitoredPoints);
            finalizarCarregamento();
            return;
        }

        var pontoAtual = pontos[indice];

        obterDadosClimaticos(
            pontoAtual.lat,
            pontoAtual.lon,
            function(novoClima) {
                if (novoClima !== null) {
                    monitoredPoints.push({
                        rodovia: pontoAtual.rodovia,
                        trecho: pontoAtual.trecho,
                        municipio: pontoAtual.municipio,
                        nomeApi: pontoAtual.nomeApi,
                        lat: pontoAtual.lat,
                        lon: pontoAtual.lon,
                        alturaVegetacao:
                            pontoAtual.alturaVegetacao,
                        clima: novoClima
                    });
                }

                setTimeout(function() {
                    atualizarPontosSequencial(
                        pontos,
                        indice + 1
                    );
                }, 500);
            }
        );
    }

    /*
     * Finaliza o estado visual de carregamento.
     */
    function finalizarCarregamento() {
        mostrarCarregamento(false);

        if (loadBtn) {
            loadBtn.style.display = 'none';
        }

        if (refreshBtn) {
            refreshBtn.style.display = 'inline-block';
        }
    }

    function mostrarCarregamento(visivel) {
        if (loadingIndicator) {
            loadingIndicator.style.display =
                visivel ? 'block' : 'none';
        }
    }

    function mostrarErro(mensagem) {
        if (errorMessage) {
            errorMessage.textContent = mensagem;
            errorMessage.style.display = 'block';
        }
    }

    function limparErros() {
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }
    }
});