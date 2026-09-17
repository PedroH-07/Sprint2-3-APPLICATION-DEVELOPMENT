// GREENSENSE - Monitoramento Ambiental da Mata Atlântica
// Integração com Nominatim/OpenStreetMap e Open-Meteo
// Classificação da vegetação por altura

document.addEventListener('DOMContentLoaded', function() {
    // Elementos principais da interface
    var loadBtn = document.getElementById('loadBtn');
    var refreshBtn = document.getElementById('refreshBtn');
    var dashboardGrid = document.getElementById('dashboard-grid');
    var loadingIndicator = document.getElementById('loadingIndicator');
    var errorMessage = document.getElementById('errorMessage');

    // Dados processados que serão exibidos no dashboard
    var monitoredPoints = [];

    /*
     * Faixas utilizadas para classificar a altura da vegetação.
     *
     * Normal: até 1,20 m
     * Atenção: acima de 1,20 m até 1,80 m
     * Risco: acima de 1,80 m até 2,50 m
     * Crítico: acima de 2,50 m
     */
    var faixasVegetacao = [
        {
            limiteMaximo: 1.20,
            classificacao: 'Normal',
            acao: 'Manter o monitoramento de rotina.',
            classeCss: 'vegetacao-normal',
            emoji: '✅'
        },
        {
            limiteMaximo: 1.80,
            classificacao: 'Atenção',
            acao: 'Agendar uma inspeção preventiva.',
            classeCss: 'vegetacao-atencao',
            emoji: '⚠️'
        },
        {
            limiteMaximo: 2.50,
            classificacao: 'Risco',
            acao: 'Programar intervenção em curto prazo.',
            classeCss: 'vegetacao-risco',
            emoji: '🟠'
        },
        {
            limiteMaximo: Infinity,
            classificacao: 'Crítico',
            acao: 'Realizar intervenção imediata.',
            classeCss: 'vegetacao-critico',
            emoji: '🚨'
        }
    ];

    /*
     * As APIs utilizadas não fornecem a altura da vegetação.
     * Por isso, são utilizados valores simulados e determinísticos
     * para demonstrar todas as classificações exigidas no projeto.
     */
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

    // Eventos dos botões
    if (loadBtn) {
        loadBtn.addEventListener('click', iniciarMonitoramento);
    }

    if (refreshBtn) {
        refreshBtn.addEventListener('click', atualizarDados);
    }

    /*
     * Classifica a vegetação conforme a altura informada.
     */
    function classificarVegetacao(altura) {
        var alturaNumerica = Number(altura);

        // Trata valores inválidos ou negativos
        if (!Number.isFinite(alturaNumerica) || alturaNumerica < 0) {
            return {
                classificacao: 'Indisponível',
                acao: 'Verificar a medição da vegetação.',
                classeCss: 'vegetacao-indisponivel',
                emoji: '❔'
            };
        }

        var classificacaoEncontrada = null;

        /*
         * Percorre o array de faixas até encontrar o limite
         * correspondente à altura do ponto monitorado.
         */
        faixasVegetacao.forEach(function(faixa) {
            if (!classificacaoEncontrada &&
                alturaNumerica <= faixa.limiteMaximo) {
                classificacaoEncontrada = faixa;
            }
        });

        return classificacaoEncontrada;
    }

    /*
     * Retorna uma altura simulada para cada ponto.
     * O operador % permite reutilizar os valores se necessário.
     */
    function obterAlturaVegetacao(indice) {
        return alturasVegetacaoSimuladas[
            indice % alturasVegetacaoSimuladas.length
        ];
    }

    /*
     * Inicia o fluxo principal de coleta de dados.
     */
    function iniciarMonitoramento() {
        mostrarCarregamento(true);
        limparErros();

        buscarPontosMatAtlantica(function(pontos) {
            if (pontos.length === 0) {
                mostrarErro('Nenhum ponto encontrado. Tente novamente.');
                mostrarCarregamento(false);
                return;
            }

            monitoredPoints = [];
            obterDadosDosPontos(pontos, 0);
        });
    }

    /*
     * Consulta o OpenStreetMap para obter latitude e longitude
     * dos locais monitorados.
     */
    function buscarPontosMatAtlantica(callback) {
        var buscas = [
            'https://nominatim.openstreetmap.org/search?q=Parque+Nacional+de+Itatiaia&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Nacional+da+Serra+dos+Orgaos&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Estadual+da+Serra+do+Mar&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Nacional+da+Tijuca&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Nacional+do+Iguacu&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Reserva+Biologica+de+Una&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Estadual+da+Cantareira&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Nacional+da+Serra+da+Bocaina&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Nacional+do+Caparao&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Nacional+do+Monte+Pascoal&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Estadual+Intervales&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Estadual+da+Serra+do+Tabuleiro&format=json&limit=1',
            'https://nominatim.openstreetmap.org/search?q=Parque+Nacional+de+Superagui&format=json&limit=1'
        ];

        var pontosFiltrados = [];
        var buscaAtual = 0;

        // Executa as buscas sequencialmente para respeitar a API.
        function executarBusca() {
            if (pontosFiltrados.length >= 10 ||
                buscaAtual >= buscas.length) {
                callback(pontosFiltrados.slice(0, 10));
                return;
            }

            fetch(buscas[buscaAtual])
                .then(function(response) {
                    if (!response.ok) {
                        throw new Error('Erro HTTP: ' + response.status);
                    }

                    return response.json();
                })
                .then(function(dados) {
                    // Evita localidades duplicadas.
                    dados.forEach(function(ponto) {
                        if (pontosFiltrados.length >= 10) {
                            return;
                        }

                        if (!ponto.lat || !ponto.lon) {
                            return;
                        }

                        var pontoDuplicado = pontosFiltrados.some(function(
                            pontoExistente
                        ) {
                            return pontoExistente.display_name ===
                                ponto.display_name;
                        });

                        if (!pontoDuplicado) {
                            pontosFiltrados.push(ponto);
                        }
                    });

                    buscaAtual++;

                    // Intervalo para evitar excesso de requisições.
                    setTimeout(executarBusca, 1000);
                })
                .catch(function(erro) {
                    console.warn(
                        'Falha na busca ' +
                        buscaAtual +
                        ', pulando para a próxima:',
                        erro
                    );

                    buscaAtual++;

                    setTimeout(executarBusca, 1000);
                });
        }

        executarBusca();
    }

    /*
     * Consulta os dados climáticos de cada ponto de forma sequencial.
     */
    function obterDadosDosPontos(pontos, indiceAtual) {
        if (indiceAtual >= pontos.length) {
            exibirDashboard(monitoredPoints);
            mostrarCarregamento(false);

            if (loadBtn) {
                loadBtn.style.display = 'none';
            }

            if (refreshBtn) {
                refreshBtn.style.display = 'inline-block';
            }

            return;
        }

        var pontoAtual = pontos[indiceAtual];

        obterDadosClimaticos(
            parseFloat(pontoAtual.lat),
            parseFloat(pontoAtual.lon),
            function(clima) {
                if (clima !== null) {
                    var nomeCompleto =
                        pontoAtual.display_name ||
                        pontoAtual.name ||
                        'Ponto sem nome';

                    var nomeCurto = nomeCompleto
                        .split(',')[0]
                        .trim();

                    monitoredPoints.push({
                        nome: nomeCurto,
                        lat: parseFloat(pontoAtual.lat),
                        lon: parseFloat(pontoAtual.lon),

                        // Altura simulada para atender à atividade.
                        alturaVegetacao: obterAlturaVegetacao(indiceAtual),

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
     * Busca as condições meteorológicas atuais usando a API Open-Meteo.
     */
    function obterDadosClimaticos(latitude, longitude, callback) {
        var url =
            'https://api.open-meteo.com/v1/forecast?' +
            'latitude=' + latitude +
            '&longitude=' + longitude +
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
                    throw new Error('Erro HTTP: ' + response.status);
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
                    'Erro ao obter dados climáticos de um ponto: ' +
                    erro.message
                );

                callback(null);
            });
    }

    /*
     * Limpa e recria os cards do dashboard.
     * O forEach atende ao requisito de percorrer os dados com JavaScript.
     */
    function exibirDashboard(pontos) {
        if (!dashboardGrid) {
            return;
        }

        dashboardGrid.innerHTML = '';

        if (pontos.length === 0) {
            mostrarErro(
                'Não foi possível carregar dados para os pontos monitorados.'
            );

            return;
        }

        pontos.forEach(function(ponto) {
            var card = criarCard(ponto);
            dashboardGrid.appendChild(card);
        });
    }

    /*
     * Cria dinamicamente o card de cada ponto monitorado.
     */
    function criarCard(ponto) {
        var card = document.createElement('div');
        card.className = 'card';

        var risco = calcularRisco(ponto.clima);
        var vegetacao = classificarVegetacao(
            ponto.alturaVegetacao
        );

        card.innerHTML =
            '<div class="card-title">' +
                '📍 ' + ponto.nome +
            '</div>' +

            '<div class="card-coordinates">' +
                'Lat: ' + ponto.lat.toFixed(4) +
                ' | Lon: ' + ponto.lon.toFixed(4) +
            '</div>' +

            '<div class="vegetation-status ' +
                vegetacao.classeCss +
            '">' +
                '<strong>' +
                    vegetacao.emoji +
                    ' Vegetação: ' +
                    vegetacao.classificacao +
                '</strong>' +

                '<span>' +
                    '<strong>Altura:</strong> ' +
                    ponto.alturaVegetacao.toFixed(2) +
                    ' m' +
                '</span>' +

                '<span>' +
                    '<strong>Ação recomendada:</strong> ' +
                    vegetacao.acao +
                '</span>' +
            '</div>' +

            '<div class="weather-data">' +
                '<div class="weather-item">' +
                    '<span class="weather-label">' +
                        '🌡️ Temperatura' +
                    '</span>' +

                    '<span class="weather-value">' +
                        ponto.clima.temperatura.toFixed(1) +
                        '°C' +
                    '</span>' +
                '</div>' +

                '<div class="weather-item">' +
                    '<span class="weather-label">' +
                        '💧 Umidade' +
                    '</span>' +

                    '<span class="weather-value">' +
                        ponto.clima.umidade +
                        '%' +
                    '</span>' +
                '</div>' +

                '<div class="weather-item">' +
                    '<span class="weather-label">' +
                        '🌧️ Precipitação' +
                    '</span>' +

                    '<span class="weather-value">' +
                        ponto.clima.precipitacao.toFixed(2) +
                        ' mm' +
                    '</span>' +
                '</div>' +

                '<div class="weather-item">' +
                    '<span class="weather-label">' +
                        '💨 Velocidade do Vento' +
                    '</span>' +

                    '<span class="weather-value">' +
                        ponto.clima.velocidadeVento.toFixed(1) +
                        ' km/h' +
                    '</span>' +
                '</div>' +

                '<div class="weather-item">' +
                    '<span class="weather-label">' +
                        '☀️ Índice UV' +
                    '</span>' +

                    '<span class="weather-value">' +
                        ponto.clima.indiceUV.toFixed(1) +
                    '</span>' +
                '</div>' +
            '</div>' +

            '<div class="risk-status ' +
                risco.classe +
            '">' +
                risco.emoji +
                ' ' +
                risco.texto +
            '</div>';

        return card;
    }

    /*
     * Calcula o risco climático com base nas condições atuais.
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
     * Atualiza apenas os dados climáticos, mantendo a altura
     * da vegetação associada a cada local.
     */
    function atualizarDados() {
        mostrarCarregamento(true);
        limparErros();

        var pontosParaAtualizar = monitoredPoints.slice();
        monitoredPoints = [];

        atualizarPontosSequencial(pontosParaAtualizar, 0);
    }

    function atualizarPontosSequencial(pontos, indice) {
        if (indice >= pontos.length) {
            exibirDashboard(monitoredPoints);
            mostrarCarregamento(false);
            return;
        }

        var pontoAtual = pontos[indice];

        obterDadosClimaticos(
            pontoAtual.lat,
            pontoAtual.lon,
            function(novoClima) {
                if (novoClima !== null) {
                    monitoredPoints.push({
                        nome: pontoAtual.nome,
                        lat: pontoAtual.lat,
                        lon: pontoAtual.lon,
                        alturaVegetacao: pontoAtual.alturaVegetacao,
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
     * Controla a exibição do indicador de carregamento.
     */
    function mostrarCarregamento(visivel) {
        if (loadingIndicator) {
            loadingIndicator.style.display =
                visivel ? 'block' : 'none';
        }
    }

    /*
     * Exibe uma mensagem de erro na interface.
     */
    function mostrarErro(mensagem) {
        if (errorMessage) {
            errorMessage.textContent = mensagem;
            errorMessage.style.display = 'block';
        }
    }

    /*
     * Limpa as mensagens de erro.
     */
    function limparErros() {
        if (errorMessage) {
            errorMessage.textContent = '';
            errorMessage.style.display = 'none';
        }
    }
});