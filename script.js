document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // DADOS ESTÁTICOS (MOCKUP)
    // Substitua esta seção pela integração com o Supabase
    // =================================================================================

    let clientes = [
        { id: 1, nome: "Ana Silva", whatsapp: "5511987654321", email: "ana.silva@email.com", dataCriacao: "2025-08-01", dataVencimento: "2025-10-20", plano: 1, servidor1: 1, servidor2: null, usuario1: "ana_silva", senha1: "senha123", usuario2: "", senha2: "", statusNotificacao: false, observacoes: "Cliente VIP", codigoIndicacao: "ANA123", numeroRenovacoes: 2, bloqueado: false },
        { id: 2, nome: "Bruno Costa", whatsapp: "5521912345678", email: "bruno.costa@email.com", dataCriacao: "2025-09-10", dataVencimento: "2025-11-10", plano: 2, servidor1: 2, servidor2: null, usuario1: "bruno_costa", senha1: "senha456", usuario2: "", senha2: "", statusNotificacao: true, observacoes: "", codigoIndicacao: "BRU456", numeroRenovacoes: 1, bloqueado: false },
        { id: 3, nome: "Carla Dias", whatsapp: "5531988887777", email: "carla.dias@email.com", dataCriacao: "2025-07-15", dataVencimento: "2025-09-15", plano: 3, servidor1: 3, servidor2: null, usuario1: "carla_d", senha1: "senha789", usuario2: "", senha2: "", statusNotificacao: false, observacoes: "Pagamento pendente", codigoIndicacao: "CAR789", numeroRenovacoes: 3, bloqueado: false },
        { id: 4, nome: "Daniel Alves", whatsapp: "5541999998888", email: "daniel.alves@email.com", dataCriacao: "2025-06-20", dataVencimento: "2025-08-20", plano: 1, servidor1: 1, servidor2: null, usuario1: "daniel_a", senha1: "senha101", usuario2: "", senha2: "", statusNotificacao: true, observacoes: "", codigoIndicacao: "DAN101", numeroRenovacoes: 4, bloqueado: true },
        { id: 5, nome: "Eduarda Lima", whatsapp: "5551977776666", email: "eduarda.lima@email.com", dataCriacao: "2025-09-01", dataVencimento: "2025-10-01", plano: 2, servidor1: 2, servidor2: null, usuario1: "edu_lima", senha1: "senha202", usuario2: "", senha2: "", statusNotificacao: false, observacoes: "", codigoIndicacao: "EDU202", numeroRenovacoes: 1, bloqueado: false },
        { id: 6, nome: "Fábio Souza", whatsapp: "5561966665555", email: "fabio.souza@email.com", dataCriacao: "2025-09-12", dataVencimento: "2025-10-12", plano: 3, servidor1: 3, servidor2: null, usuario1: "fabio_s", senha1: "senha303", usuario2: "", senha2: "", statusNotificacao: true, observacoes: "Indicado por Ana Silva", codigoIndicacao: "FAB303", numeroRenovacoes: 0, bloqueado: false },
        { id: 7, nome: "Gabriela Faria", whatsapp: "5571955554444", email: "gabriela.faria@email.com", dataCriacao: "2025-08-25", dataVencimento: "2025-09-25", plano: 1, servidor1: 1, servidor2: null, usuario1: "gabi_f", senha1: "senha404", usuario2: "", senha2: "", statusNotificacao: false, observacoes: "", codigoIndicacao: "GAB404", numeroRenovacoes: 1, bloqueado: false },
        { id: 8, nome: "Hugo Martins", whatsapp: "5581944443333", email: "hugo.martins@email.com", dataCriacao: "2025-05-30", dataVencimento: "2025-07-30", plano: 2, servidor1: 2, servidor2: null, usuario1: "hugo_m", senha1: "senha505", usuario2: "", senha2: "", statusNotificacao: true, observacoes: "", codigoIndicacao: "HUG505", numeroRenovacoes: 5, bloqueado: false },
        { id: 9, nome: "Isabela Rocha", whatsapp: "5591933332222", email: "isabela.rocha@email.com", dataCriacao: "2025-09-18", dataVencimento: "2025-10-18", plano: 3, servidor1: 3, servidor2: null, usuario1: "isa_rocha", senha1: "senha606", usuario2: "", senha2: "", statusNotificacao: false, observacoes: "Primeiro mês", codigoIndicacao: "ISA606", numeroRenovacoes: 0, bloqueado: false },
        { id: 10, nome: "João Pereira", whatsapp: "5511922221111", email: "joao.pereira@email.com", dataCriacao: "2025-04-01", dataVencimento: "2025-05-01", plano: 1, servidor1: 1, servidor2: null, usuario1: "joao_p", senha1: "senha707", usuario2: "", senha2: "", statusNotificacao: true, observacoes: "Cliente antigo", codigoIndicacao: "JOA707", numeroRenovacoes: 6, bloqueado: false },
    ];

    let servidores = [
        { id: 1, nome: "Servidor Principal", URL1: "http://sv1.url1.com", URL2: "http://sv1.url2.com", App1: "App_A", App2: "App_B" },
        { id: 2, nome: "Servidor Secundário", URL1: "http://sv2.url1.com", URL2: "http://sv2.url2.com", App1: "App_C", App2: "App_D" },
        { id: 3, nome: "Servidor de Testes", URL1: "http://sv3.url1.com", URL2: "http://sv3.url2.com", App1: "App_E", App2: "App_F" }
    ];

    let planos = [
        { id: 1, nome: "Básico", pontos: 1, valor: 25.00, validade: 1, linkCartao: "http://link.cartao/basico", chavePIX: "pix_basico" },
        { id: 2, nome: "Padrão", pontos: 2, valor: 35.00, validade: 1, linkCartao: "http://link.cartao/padrao", chavePIX: "pix_padrao" },
        { id: 3, nome: "Premium", pontos: 4, valor: 50.00, validade: 1, linkCartao: "http://link.cartao/premium", chavePIX: "pix_premium" }
    ];

    // =================================================================================
    // CONFIGURAÇÃO DO SUPABASE (COMENTADO)
    // =================================================================================
    /*
    const SUPABASE_URL = 'SEU_URL_SUPABASE';
    const SUPABASE_KEY = 'SUA_CHAVE_SUPABASE';
    const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

    async function fetchClientes() {
        const { data, error } = await supabase.from('clientes').select('*');
        if (error) console.error('Erro ao buscar clientes:', error);
        else clientes = data;
    }
    // Crie funções similares para fetchServidores, fetchPlanos, addCliente, updateCliente, etc.
    */

    // =================================================================================
    // LÓGICA DE LOGIN
    // =================================================================================
    const loginPage = document.getElementById('login-page');
    const dashboardPage = document.getElementById('dashboard-page');
    const loginForm = document.getElementById('login-form');
    const togglePassword = document.getElementById('togglePassword');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        // Lógica de autenticação simples (substituir pela do Supabase)
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        if (username === 'admin' && password === 'admin') {
            loginPage.style.display = 'none';
            dashboardPage.style.display = 'flex';
            renderClientes(); // Renderiza a view default
        } else {
            alert('Usuário ou senha inválidos!');
        }
    });

    togglePassword.addEventListener('click', function () {
        const passwordInput = document.getElementById('password');
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        this.classList.toggle('fa-eye-slash');
    });

    // =================================================================================
    // NAVEGAÇÃO DO DASHBOARD
    // =================================================================================
    const navLinks = document.querySelectorAll('.nav-link');
    const views = document.querySelectorAll('.view');

    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const viewName = link.getAttribute('data-view');

            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');

            views.forEach(view => {
                view.style.display = view.id === `${viewName}-view` ? 'block' : 'none';
            });

            // Renderiza o conteúdo da view selecionada
            if (viewName === 'clientes') renderClientes();
            if (viewName === 'planos') renderPlanos();
            if (viewName === 'servidores') renderServidores();
        });
    });

    // =================================================================================
    // FUNÇÕES DE CLIENTES
    // =================================================================================
    const clientesList = document.getElementById('clientes-list');

    function renderClientes(filteredClientes = null) {
        const clientesParaRenderizar = filteredClientes || clientes.filter(c => !c.bloqueado);
        updateClienteCards();

        clientesList.innerHTML = clientesParaRenderizar.map(cliente => {
            return `
            <div class="cliente-item" data-id="${cliente.id}">
                <div class="cliente-summary">
                    <div class="cliente-info-left">
                        <strong>${cliente.nome}</strong>
                        <span>(Vence em: ${new Date(cliente.dataVencimento).toLocaleDateString()})</span>
                        <p>${cliente.whatsapp} <button class="btn-copy" data-whatsapp="${cliente.whatsapp}"><i class="fas fa-copy"></i></button></p>
                    </div>
                    <div class="cliente-actions">
                        <button class="btn btn-success"><i class="fab fa-whatsapp"></i> Notificar</button>
                        <button class="btn btn-primary">Renovar</button>
                        <button class="btn btn-warning">Editar</button>
                        <button class="btn btn-danger">Bloquear</button>
                    </div>
                </div>
                <div class="cliente-details">
                    </div>
                <div class="cliente-expand-area">
                    <i class="fas fa-chevron-down"></i>
                </div>
            </div>`;
        }).join('');
    }

    clientesList.addEventListener('click', (e) => {
        // Ação de copiar WhatsApp
        if (e.target.closest('.btn-copy')) {
            const whatsapp = e.target.closest('.btn-copy').dataset.whatsapp;
            navigator.clipboard.writeText(whatsapp).then(() => alert('Número copiado!'));
        }
        
        // Ação de expandir/recolher
        if (e.target.closest('.cliente-expand-area')) {
            const expandArea = e.target.closest('.cliente-expand-area');
            const details = expandArea.previousElementSibling;
            const icon = expandArea.querySelector('i');
            const clienteItem = expandArea.closest('.cliente-item');
            const clienteId = parseInt(clienteItem.dataset.id);

            const isExpanded = details.classList.toggle('expanded');
            
            if (isExpanded) {
                // Se está expandindo, busca os dados e preenche
                const cliente = clientes.find(c => c.id === clienteId);
                const plano = planos.find(p => p.id === cliente.plano);
                const servidor = servidores.find(s => s.id === cliente.servidor1);

                details.innerHTML = `
                    <p><strong>Email:</strong> ${cliente.email}</p>
                    <p><strong>Plano:</strong> ${plano ? plano.nome : 'N/A'}</p>
                    <p><strong>Servidor 1:</strong> ${servidor ? servidor.nome : 'N/A'}</p>
                    <p><strong>Usuário 1:</strong> ${cliente.usuario1}</p>
                    <p><strong>Senha 1:</strong> ${cliente.senha1}</p>
                    <p><strong>Status Notificação:</strong> ${cliente.statusNotificacao ? 'Notificado' : 'Pendente'}</p>
                    <p><strong>Observações:</strong> ${cliente.observacoes}</p>
                    <p><strong>Nº Renovações:</strong> ${cliente.numeroRenovacoes}</p>
                `;
                icon.classList.replace('fa-chevron-down', 'fa-chevron-up');
            } else {
                // Se está recolhendo, limpa o conteúdo e reseta o ícone
                details.innerHTML = '';
                icon.classList.replace('fa-chevron-up', 'fa-chevron-down');
            }
        }
    });
    
    function updateClienteCards() {
        const hoje = new Date();
        const clientesNaoBloqueados = clientes.filter(c => !c.bloqueado);

        const clientesAtivos = clientesNaoBloqueados.filter(c => new Date(c.dataVencimento) >= hoje);
        const vencendo = clientesAtivos.filter(c => {
            const diffTime = new Date(c.dataVencimento) - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        });
        const vencidos = clientesNaoBloqueados.filter(c => new Date(c.dataVencimento) < hoje);
        const vencidosRecente = vencidos.filter(c => {
            const diffTime = hoje - new Date(c.dataVencimento);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 30;
        });
         const vencidosAntigo = vencidos.filter(c => {
            const diffTime = hoje - new Date(c.dataVencimento);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays > 30;
        });

        document.getElementById('total-clientes').innerText = clientesNaoBloqueados.length;
        document.getElementById('clientes-ativos').innerText = clientesAtivos.length;
        document.getElementById('clientes-vencendo').innerText = vencendo.length;
        document.getElementById('clientes-vencidos-recentemente').innerText = vencidosRecente.length;
        document.getElementById('clientes-vencidos-antigos').innerText = vencidosAntigo.length;
    }

    document.getElementById('search-clientes').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtrados = clientes.filter(c => !c.bloqueado &&
            (c.nome.toLowerCase().includes(searchTerm) ||
            c.usuario1.toLowerCase().includes(searchTerm) ||
            c.whatsapp.includes(searchTerm))
        );
        renderClientes(filtrados);
    });

     document.getElementById('toggle-notificados').addEventListener('change', (e) => {
        if (e.target.checked) {
            const naoNotificados = clientes.filter(c => !c.statusNotificacao && !c.bloqueado);
            renderClientes(naoNotificados);
        } else {
            renderClientes();
        }
    });

    // =================================================================================
    // FUNÇÕES DE PLANOS
    // =================================================================================
    const planosList = document.getElementById('planos-list');

    function renderPlanos() {
        planosList.innerHTML = planos.map(plano => `
            <div class="generic-list-item" data-id="${plano.id}">
                 <div class="item-header">
                    <h3>${plano.nome}</h3>
                    <div class="item-actions">
                        <button class="btn btn-warning btn-edit">Editar</button>
                    </div>
                 </div>
                 <div class="item-content">
                    <p><strong>Pontos:</strong> ${plano.pontos}</p>
                    <p><strong>Valor:</strong> R$ ${plano.valor.toFixed(2)}</p>
                    <p><strong>Validade (meses):</strong> ${plano.validade}</p>
                    <p><strong>Link Cartão:</strong> ${plano.linkCartao}</p>
                    <p><strong>Chave PIX:</strong> ${plano.chavePIX}</p>
                 </div>
            </div>
        `).join('');
    }
    
    planosList.addEventListener('click', (e) => {
        const item = e.target.closest('.generic-list-item');
        if (!item) return;

        const planoId = parseInt(item.dataset.id);
        const plano = planos.find(p => p.id === planoId);

        if (e.target.classList.contains('btn-edit')) {
            item.querySelector('.item-header h3').innerHTML = `<input type="text" value="${plano.nome}" data-field="nome" class="edit-header-input">`;
            item.querySelector('.item-content').innerHTML = `
                <div><label>Pontos:</label><input type="number" value="${plano.pontos}" data-field="pontos"></div>
                <div><label>Valor:</label><input type="number" step="0.01" value="${plano.valor}" data-field="valor"></div>
                <div><label>Validade:</label><input type="number" value="${plano.validade}" data-field="validade"></div>
                <div><label>Link Cartão:</label><input type="text" value="${plano.linkCartao}" data-field="linkCartao"></div>
                <div><label>Chave PIX:</label><input type="text" value="${plano.chavePIX}" data-field="chavePIX"></div>
            `;
            item.querySelector('.item-actions').innerHTML = `
                <button class="btn btn-secondary btn-cancel">Cancelar</button>
                <button class="btn btn-success btn-save">Salvar</button>
            `;
        }
        
        if (e.target.classList.contains('btn-save')) {
            const inputs = item.querySelectorAll('input');
            inputs.forEach(input => {
                const field = input.dataset.field;
                const value = (input.type === 'number') ? parseFloat(input.value) : input.value;
                plano[field] = value;
            });
            renderPlanos();
        }
        
        if (e.target.classList.contains('btn-cancel')) {
            renderPlanos();
        }
    });


    // =================================================================================
    // FUNÇÕES DE SERVIDORES
    // =================================================================================
    const servidoresList = document.getElementById('servidores-list');

    function renderServidores() {
        servidoresList.innerHTML = servidores.map(servidor => `
            <div class="generic-list-item" data-id="${servidor.id}">
                 <div class="item-header">
                    <h3>${servidor.nome}</h3>
                    <div class="item-actions">
                        <button class="btn btn-warning btn-edit">Editar</button>
                    </div>
                 </div>
                 <div class="item-content">
                    <p><strong>URL 1:</strong> ${servidor.URL1}</p>
                    <p><strong>URL 2:</strong> ${servidor.URL2}</p>
                    <p><strong>App 1:</strong> ${servidor.App1}</p>
                    <p><strong>App 2:</strong> ${servidor.App2}</p>
                 </div>
            </div>
        `).join('');
    }
    
    servidoresList.addEventListener('click', (e) => {
        const item = e.target.closest('.generic-list-item');
        if (!item) return;

        const servidorId = parseInt(item.dataset.id);
        const servidor = servidores.find(s => s.id === servidorId);
        
        if (e.target.classList.contains('btn-edit')) {
            item.querySelector('.item-header h3').innerHTML = `<input type="text" value="${servidor.nome}" data-field="nome" class="edit-header-input">`;
            item.querySelector('.item-content').innerHTML = `
                <div><label>URL 1:</label><input type="text" value="${servidor.URL1}" data-field="URL1"></div>
                <div><label>URL 2:</label><input type="text" value="${servidor.URL2}" data-field="URL2"></div>
                <div><label>App 1:</label><input type="text" value="${servidor.App1}" data-field="App1"></div>
                <div><label>App 2:</label><input type="text" value="${servidor.App2}" data-field="App2"></div>
            `;
            item.querySelector('.item-actions').innerHTML = `
                <button class="btn btn-secondary btn-cancel">Cancelar</button>
                <button class="btn btn-success btn-save">Salvar</button>
            `;
        }

        if (e.target.classList.contains('btn-save')) {
            const inputs = item.querySelectorAll('input');
            inputs.forEach(input => {
                servidor[input.dataset.field] = input.value;
            });
            renderServidores();
        }

        if (e.target.classList.contains('btn-cancel')) {
            renderServidores();
        }
    });

    // =================================================================================
    // LÓGICA DOS MODAIS
    // =================================================================================
    const planoModal = document.getElementById('plano-modal');
    const servidorModal = document.getElementById('servidor-modal');
    const planoForm = document.getElementById('plano-form');
    const servidorForm = document.getElementById('servidor-form');

    document.getElementById('add-plano-btn').addEventListener('click', () => {
        planoForm.reset();
        document.getElementById('plano-id').value = '';
        document.getElementById('plano-modal-title').innerText = 'Adicionar Novo Plano';
        planoModal.style.display = 'flex';
    });

    document.getElementById('add-servidor-btn').addEventListener('click', () => {
        servidorForm.reset();
        document.getElementById('servidor-id').value = '';
        document.getElementById('servidor-modal-title').innerText = 'Adicionar Novo Servidor';
        servidorModal.style.display = 'flex';
    });
    
    document.getElementById('cancel-plano-btn').addEventListener('click', () => planoModal.style.display = 'none');
    document.getElementById('cancel-servidor-btn').addEventListener('click', () => servidorModal.style.display = 'none');
    
    planoForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newPlano = {
            id: Date.now(), // ID simples para mockup. No Supabase, isso seria gerado pelo DB.
            nome: document.getElementById('plano-nome').value,
            pontos: parseInt(document.getElementById('plano-pontos').value),
            valor: parseFloat(document.getElementById('plano-valor').value),
            validade: parseInt(document.getElementById('plano-validade').value),
            linkCartao: document.getElementById('plano-linkCartao').value,
            chavePIX: document.getElementById('plano-chavePIX').value,
        };
        planos.push(newPlano);
        renderPlanos();
        planoModal.style.display = 'none';
    });
    
    servidorForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newServidor = {
            id: Date.now(),
            nome: document.getElementById('servidor-nome').value,
            URL1: document.getElementById('servidor-url1').value,
            URL2: document.getElementById('servidor-url2').value,
            App1: document.getElementById('servidor-app1').value,
            App2: document.getElementById('servidor-app2').value,
        };
        servidores.push(newServidor);
        renderServidores();
        servidorModal.style.display = 'none';
    });

    // Chamada inicial para renderizar a view default (Clientes) ao carregar o dashboard
    renderClientes();
});
