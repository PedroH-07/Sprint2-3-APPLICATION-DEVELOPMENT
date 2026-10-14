// GreenSense: processamento e priorização da vegetação rodoviária.

document.addEventListener('DOMContentLoaded', function () {
    var loadBtn = document.getElementById('loadBtn');
    var refreshBtn = document.getElementById('refreshBtn');
    var vegetationForm = document.getElementById('vegetationForm');
    var conditionFilter = document.getElementById('conditionFilter');

    var dashboardGrid = document.getElementById('dashboard-grid');
    var loadingIndicator = document.getElementById('loadingIndicator');
    var errorMessage = document.getElementById('errorMessage');

    var totalPoints = document.getElementById('totalPoints');
    var monitoradoPoints = document.getElementById('monitoradoPoints');
    var atencaoPoints = document.getElementById('atencaoPoints');
    var programadaPoints = document.getElementById('programadaPoints');
    var prioritariaPoints = document.getElementById('prioritariaPoints');

    var monitoredPoints = [];

    /*
     * As alturas estão em centímetros.
     * O limite de 35 cm representa intervenção prioritária.
     */
    var alturasDemonstrativas = [
        10,
        20,
        25,
        30,
        32,
        34,
        35,
        40,
        18,
        33
    ];

    var faixasVegetacao = [
        {
            limite: 20,
            classificacao: 'Monitorado',
            chave: 'monitorado',
            prioridade: 1,
            acao: 'Manter o acompanhamento de rotina.',
            classeCss: 'condicao-monitorado',
            emoji: 'OK'
        },
        {
            limite: 30,
            classificacao: 'Atenção',
            chave: 'atencao',
            prioridade: 2,
            acao: 'Agendar uma inspeção preventiva.',
            classeCss: 'condicao-atencao',
            emoji: 'ATENÇÃO'
        },
        {
            limite: 35,
            classificacao: 'Intervenção Programada',
            chave: 'programada',
            prioridade: 3,
            acao: 'Programar manutenção em curto prazo.',
            classeCss: 'condicao-programada',
            emoji: 'PROGRAMAR'
        },
        {
            limite: Infinity,
            classificacao: 'Intervenção Prioritária',
            chave: 'prioritaria',
            prioridade: 4,
            acao: 'Realizar intervenção imediata.',
            classeCss: 'condicao-prioritaria',
            emoji: 'PRIORIDADE'
        }
    ];

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

    if (vegetationForm) {
        vegetationForm.addEventListener('submit', adicionarPonto);
    }

    if (conditionFilter) {
        conditionFilter.addEventListener('change', renderizarDashboard);
    }

    function iniciarMonitoramento() {
        mostrarCarregamento(true);
        limparErro();
        monitoredPoints = [];

        buscarTrechosRodoviarios(function (pontos) {
            if (pontos.length === 0) {
                mostrarErro(
                    'Nenhum trecho rodoviário foi localizado.'
                );
                mostrarCarregamento(false);
                return;
            }

            carregarClimaDosPontos(pontos, 0);
        });
    }

    function buscarTrechosRodoviarios(callback) {
        var pontosEncontrados = [];
        var indice = 0;

        function executarBusca() {
            if (indice >= trechosRodoviarios.length) {
                callback(pontosEncontrados);
                return;
            }

            var trecho = trechosRodoviarios[indice];

            buscarLocalizacao(
                trecho.busca,
                function (localizacao) {
                    if (localizacao) {
                        pontosEncontrados.push({
                            rodovia: trecho.rodovia,
                            trecho: trecho.trecho,
                            municipio: trecho.municipio,
                            nomeApi: localizacao.nome,
                            lat: localizacao.lat,
                            lon: localizacao.lon,
                            alturaCm: alturasDemonstrativas[
                                pontosEncontrados.length %
                                alturasDemonstrativas.length
                            ]
                        });
                    }

                    indice++;
                    setTimeout(executarBusca, 1000);
                }
            );
        }

        executarBusca();
    }

    function buscarLocalizacao(consulta, callback) {
        var url =
            'https://nominatim.openstreetmap.org/search?' +
            'q=' + encodeURIComponent(consulta) +
            '&format=json' +
            '&limit=1' +
            '&addressdetails=1';

        fetch(url)
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(
                        'Erro na localização: ' + response.status
                    );
                }

                return response.json();
            })
            .then(function (dados) {
                if (
                    dados.length === 0 ||
                    !dados[0].lat ||
                    !dados[0].lon
                ) {
                    callback(null);
                    return;
                }

                callback({
                    nome: dados[0].display_name,
                    lat: parseFloat(dados[0].lat),
                    lon: parseFloat(dados[0].lon)
                });
            })
            .catch(function (erro) {
                console.warn(
                    'Não foi possível localizar "' +
                    consulta +
                    '":',
                    erro
                );

                callback(null);
            });
    }

    function carregarClimaDosPontos(pontos, indice) {
        if (indice >= pontos.length) {
            finalizarCarregamento();
            renderizarDashboard();
            return;
        }

        var ponto = pontos[indice];

        obterDadosClimaticos(
            ponto.lat,
            ponto.lon,
            function (clima) {
                if (clima) {
                    ponto.clima = clima;
                    monitoredPoints.push(ponto);
                }

                setTimeout(function () {
                    carregarClimaDosPontos(pontos, indice + 1);
                }, 500);
            }
        );
    }

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
            .then(function (response) {
                if (!response.ok) {
                    throw new Error(
                        'Erro climático: ' + response.status
                    );
                }

                return response.json();
            })
            .then(function (dados) {
                if (!dados.current) {
                    throw new Error(
                        'A API não retornou dados atuais.'
                    );
                }

                callback({
                    temperatura: dados.current.temperature_2m,
                    umidade: dados.current.relative_humidity_2m,
                    precipitacao: dados.current.precipitation,
                    velocidadeVento: dados.current.wind_speed_10m,
                    indiceUV: dados.current.uv_index
                });
            })
            .catch(function (erro) {
                mostrarErro(
                    'Não foi possível obter o clima de um ponto: ' +
                    erro.message
                );

                callback(null);
            });
    }

    function adicionarPonto(event) {
        event.preventDefault();

        var rodovia = document.getElementById(
            'rodoviaInput'
        ).value.trim();

        var trecho = document.getElementById(
            'trechoInput'
        ).value.trim();

        var municipio = document.getElementById(
            'municipioInput'
        ).value.trim();

        var alturaCm = Number(
            document.getElementById('alturaInput').value
        );

        if (
            !rodovia ||
            !trecho ||
            !municipio ||
            !Number.isFinite(alturaCm) ||
            alturaCm < 0
        ) {
            mostrarErro(
                'Preencha todos os campos com valores válidos.'
            );
            return;
        }

        mostrarCarregamento(true);
        limparErro();

        var consulta = rodovia + ', ' + municipio;

        buscarLocalizacao(
            consulta,
            function (localizacao) {
                if (!localizacao) {
                    mostrarErro(
                        'O trecho informado não foi localizado pelo Nominatim.'
                    );
                    mostrarCarregamento(false);
                    return;
                }

                obterDadosClimaticos(
                    localizacao.lat,
                    localizacao.lon,
                    function (clima) {
                        if (!clima) {
                            mostrarCarregamento(false);
                            return;
                        }

                        monitoredPoints.push({
                            rodovia: rodovia,
                            trecho: trecho,
                            municipio: municipio,
                            nomeApi: localizacao.nome,
                            lat: localizacao.lat,
                            lon: localizacao.lon,
                            alturaCm: alturaCm,
                            clima: clima
                        });

                        vegetationForm.reset();
                        finalizarCarregamento();
                        renderizarDashboard();
                    }
                );
            }
        );
    }

    function processarPonto(ponto) {
        var resultado = classificarVegetacao(
            ponto.alturaCm
        );

        return {
            rodovia: ponto.rodovia,
            trecho: ponto.trecho,
            municipio: ponto.municipio,
            nomeApi: ponto.nomeApi,
            lat: ponto.lat,
            lon: ponto.lon,
            alturaCm: ponto.alturaCm,
            clima: ponto.clima,
            classificacao: resultado.classificacao,
            chave: resultado.chave,
            prioridade: resultado.prioridade,
            acao: resultado.acao,
            classeCss: resultado.classeCss,
            emoji: resultado.emoji
        };
    }

    function classificarVegetacao(alturaCm) {
        if (!Number.isFinite(alturaCm) || alturaCm < 0) {
            return {
                classificacao: 'Indisponível',
                chave: 'indisponivel',
                prioridade: 0,
                acao: 'Verificar a medição da vegetação.',
                classeCss: 'condicao-indisponivel',
                emoji: 'INDISPONÍVEL'
            };
        }

        if (alturaCm < 20) {
            return faixasVegetacao[0];
        }

        if (alturaCm < 30) {
            return faixasVegetacao[1];
        }

        if (alturaCm < 35) {
            return faixasVegetacao[2];
        }

        return faixasVegetacao[3];
    }

    function renderizarDashboard() {
        if (!dashboardGrid) {
            return;
        }

        var pontosProcessados = monitoredPoints.map(
            processarPonto
        );

        pontosProcessados.sort(function (a, b) {
            return b.prioridade - a.prioridade;
        });

        atualizarResumo(pontosProcessados);

        var filtro = conditionFilter
            ? conditionFilter.value
            : 'todas';

        var pontosFiltrados = pontosProcessados.filter(
            function (ponto) {
                return filtro === 'todas' ||
                    ponto.chave === filtro;
            }
        );

        dashboardGrid.innerHTML = '';

        if (pontosFiltrados.length === 0) {
            dashboardGrid.innerHTML =
                '<div class="empty-state">' +
                'Nenhum ponto corresponde ao filtro selecionado.' +
                '</div>';
            return;
        }

        pontosFiltrados.forEach(function (ponto) {
            dashboardGrid.appendChild(criarCard(ponto));
        });
    }

    function atualizarResumo(pontos) {
        var contadores = {
            monitorado: 0,
            atencao: 0,
            programada: 0,
            prioritaria: 0
        };

        pontos.forEach(function (ponto) {
            if (contadores[ponto.chave] !== undefined) {
                contadores[ponto.chave]++;
            }
        });

        totalPoints.textContent = pontos.length;
        monitoradoPoints.textContent = contadores.monitorado;
        atencaoPoints.textContent = contadores.atencao;
        programadaPoints.textContent = contadores.programada;
        prioritariaPoints.textContent = contadores.prioritaria;
    }

    function criarCard(ponto) {
        var card = document.createElement('article');

        card.className = 'card';

        if (ponto.prioridade === 4) {
            card.classList.add('card-prioridade-alta');
        }

        var riscoClimatico = calcularRisco(ponto.clima);

        var avisoPrioridade = ponto.prioridade === 4
            ? '<span class="priority-badge priority-critical">' +
            'ATENDER PRIMEIRO</span>'
            : '';

        card.innerHTML =
            '<div class="card-title">' +
            escapeHTML(ponto.rodovia) +
            '</div>' +

            '<div class="card-coordinates">' +
            '<strong>Trecho:</strong> ' +
            escapeHTML(ponto.trecho) +
            '<br>' +
            '<strong>Município:</strong> ' +
            escapeHTML(ponto.municipio) +
            '<br>' +
            'Latitude: ' +
            ponto.lat.toFixed(4) +
            ' | Longitude: ' +
            ponto.lon.toFixed(4) +
            '</div>' +

            '<div class="condition-status ' +
            ponto.classeCss +
            '">' +
            '<strong>' +
            ponto.emoji +
            ' ' +
            escapeHTML(ponto.classificacao) +
            '</strong>' +

            '<span>' +
            '<strong>Altura:</strong> ' +
            ponto.alturaCm.toFixed(0) +
            ' cm' +
            '</span>' +

            '<span>' +
            '<strong>Prioridade:</strong> ' +
            ponto.prioridade +
            '</span>' +

            '<span>' +
            '<strong>Ação:</strong> ' +
            escapeHTML(ponto.acao) +
            '</span>' +

            avisoPrioridade +
            '</div>' +

            '<div class="weather-data">' +
            criarItemClimatico(
                'Temperatura',
                ponto.clima.temperatura.toFixed(1) +
                ' °C'
            ) +

            criarItemClimatico(
                'Umidade',
                ponto.clima.umidade +
                '%'
            ) +

            criarItemClimatico(
                'Precipitação',
                ponto.clima.precipitacao.toFixed(2) +
                ' mm'
            ) +

            criarItemClimatico(
                'Velocidade do vento',
                ponto.clima.velocidadeVento.toFixed(1) +
                ' km/h'
            ) +

            criarItemClimatico(
                'Índice UV',
                ponto.clima.indiceUV.toFixed(1)
            ) +
            '</div>' +

            '<div class="risk-status ' +
            riscoClimatico.classe +
            '">' +
            riscoClimatico.texto +
            '</div>';

        return card;
    }

    function criarItemClimatico(rotulo, valor) {
        return (
            '<div class="weather-item">' +
            '<span class="weather-label">' +
            escapeHTML(rotulo) +
            '</span>' +
            '<span class="weather-value">' +
            escapeHTML(valor) +
            '</span>' +
            '</div>'
        );
    }

    function calcularRisco(clima) {
        var pontos = 0;

        if (clima.temperatura > 30) {
            pontos += 2;
        }

        if (clima.temperatura > 35) {
            pontos += 2;
        }

        if (clima.umidade < 40) {
            pontos += 2;
        }

        if (clima.umidade < 20) {
            pontos += 2;
        }

        if (clima.velocidadeVento > 20) {
            pontos += 2;
        }

        if (clima.velocidadeVento > 30) {
            pontos += 2;
        }

        if (clima.precipitacao < 1) {
            pontos += 1;
        }

        if (pontos <= 3) {
            return {
                classe: 'risk-low',
                texto: 'Risco climático baixo'
            };
        }

        if (pontos <= 6) {
            return {
                classe: 'risk-medium',
                texto: 'Risco climático moderado'
            };
        }

        return {
            classe: 'risk-high',
            texto: 'Risco climático alto'
        };
    }

    function atualizarDados() {
        if (monitoredPoints.length === 0) {
            mostrarErro(
                'Carregue ou cadastre pelo menos um ponto antes de atualizar.'
            );
            return;
        }

        mostrarCarregamento(true);
        limparErro();

        atualizarClimaDosPontos(
            monitoredPoints.slice(),
            0
        );
    }

    function atualizarClimaDosPontos(pontos, indice) {
        if (indice >= pontos.length) {
            finalizarCarregamento();
            renderizarDashboard();
            return;
        }

        var ponto = pontos[indice];

        obterDadosClimaticos(
            ponto.lat,
            ponto.lon,
            function (clima) {
                if (clima) {
                    ponto.clima = clima;
                }

                setTimeout(function () {
                    atualizarClimaDosPontos(
                        pontos,
                        indice + 1
                    );
                }, 500);
            }
        );
    }

    function escapeHTML(valor) {
        return String(valor)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    function mostrarCarregamento(visivel) {
        loadingIndicator.style.display =
            visivel ? 'block' : 'none';

        if (loadBtn) {
            loadBtn.disabled = visivel;
        }

        if (refreshBtn) {
            refreshBtn.disabled = visivel;
        }

        var addPointBtn = document.getElementById(
            'addPointBtn'
        );

        if (addPointBtn) {
            addPointBtn.disabled = visivel;
        }
    }

    function finalizarCarregamento() {
        mostrarCarregamento(false);

        if (loadBtn) {
            loadBtn.style.display = 'none';
        }

        if (refreshBtn) {
            refreshBtn.style.display = 'inline-block';
        }
    }

    function mostrarErro(mensagem) {
        errorMessage.textContent = mensagem;
        errorMessage.style.display = 'block';
    }

    function limparErro() {
        errorMessage.textContent = '';
        errorMessage.style.display = 'none';
    }
});