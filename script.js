document.addEventListener('DOMContentLoaded', () => {

    // =================================================================================
    // DADOS ESTÁTICOS (MOCKUP)
    // Substitua esta seção pela integração com o Supabase
    // =================================================================================

    let clientes = [
        { id: 1, nome: "Ana Silva", whatsapp: "5511987654321", email: "ana.silva@email.com", dataCriacao: "2025-08-01", dataVencimento: "2025-10-20", plano: 1, servidor1: 1, servidor2: null, usuario1: "ana_silva", senha1: "senha123", usuario2: "", senha2: "", statusNotificacao: false, observacoes: "Cliente VIP", codigoIndicacao: "ANA123", numeroRenovacoes: 2, bloqueado: false },
        { id: 2, nome: "Bruno Costa", whatsapp: "5521912345678", email: "bruno.costa@email.com", dataCriacao: "2025-09-10", dataVencimento: "2025-10-10", plano: 2, servidor1: 2, servidor2: null, usuario1: "bruno_costa", senha1: "senha456", usuario2: "", senha2: "", statusNotificacao: true, observacoes: "", codigoIndicacao: "BRU456", numeroRenovacoes: 1, bloqueado: false },
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
            const plano = planos.find(p => p.id === cliente.plano);
            const servidor = servidores.find(s => s.id === cliente.servidor1);

            return `
            <div class="cliente-item">
                <div class="cliente-summary" data-id="${cliente.id}">
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
                <div class="cliente-details" style="display: none;">
                    <p><strong>Email:</strong> ${cliente.email}</p>
                    <p><strong>Plano:</strong> ${plano ? plano.nome : 'N/A'}</p>
                    <p><strong>Servidor 1:</strong> ${servidor ? servidor.nome : 'N/A'}</p>
                    <p><strong>Usuário 1:</strong> ${cliente.usuario1}</p>
                    <p><strong>Senha 1:</strong> ${cliente.senha1}</p>
                    <p><strong>Status Notificação:</strong> ${cliente.statusNotificacao ? 'Notificado' : 'Pendente'}</p>
                    <p><strong>Observações:</strong> ${cliente.observacoes}</p>
                    <p><strong>Nº Renovações:</strong> ${cliente.numeroRenovacoes}</p>
                </div>
            </div>
            `;
        }).join('');
    }

    // Lógica para expandir/recolher detalhes do cliente
    clientesList.addEventListener('click', (e) => {
        if (e.target.closest('.cliente-summary')) {
             const summary = e.target.closest('.cliente-summary');
             const details = summary.nextElementSibling;
             if(details) {
                details.style.display = details.style.display === 'none' ? 'grid' : 'none';
             }
        }
        if (e.target.closest('.btn-copy')) {
            const whatsapp = e.target.closest('.btn-copy').dataset.whatsapp;
            navigator.clipboard.writeText(whatsapp).then(() => alert('Número copiado!'));
        }
    });

    function updateClienteCards() {
        const hoje = new Date();
        const clientesAtivos = clientes.filter(c => !c.bloqueado && new Date(c.dataVencimento) >= hoje);
        const vencendo = clientesAtivos.filter(c => {
            const diffTime = new Date(c.dataVencimento) - hoje;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays >= 0 && diffDays <= 7;
        });
        const vencidos = clientes.filter(c => !c.bloqueado && new Date(c.dataVencimento) < hoje);
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

        document.getElementById('total-clientes').innerText = clientes.filter(c => !c.bloqueado).length;
        document.getElementById('clientes-ativos').innerText = clientesAtivos.length;
        document.getElementById('clientes-vencendo').innerText = vencendo.length;
        document.getElementById('clientes-vencidos-recentemente').innerText = vencidosRecente.length;
        document.getElementById('clientes-vencidos-antigos').innerText = vencidosAntigo.length;
    }

    // Filtros e Pesquisa
    document.getElementById('search-clientes').addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtrados = clientes.filter(c =>
            c.nome.toLowerCase().includes(searchTerm) ||
            c.usuario1.toLowerCase().includes(searchTerm) ||
            c.whatsapp.includes(searchTerm)
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
            <div class="generic-list-item">
                 <div class="item-header">
                    <h3>${plano.nome}</h3>
                    <div>
                        <button class="btn btn-warning">Editar</button>
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


    // =================================================================================
    // FUNÇÕES DE SERVIDORES
    // =================================================================================
    const servidoresList = document.getElementById('servidores-list');

    function renderServidores() {
        servidoresList.innerHTML = servidores.map(servidor => `
            <div class="generic-list-item">
                 <div class="item-header">
                    <h3>${servidor.nome}</h3>
                    <div>
                        <button class="btn btn-warning">Editar</button>
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

});
