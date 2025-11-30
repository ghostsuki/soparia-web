// --- CONFIGURAÇÃO INICIAL E ESTOQUE ---
// Tenta carregar do localStorage, se não existir, usa o padrão
let estoque = JSON.parse(localStorage.getItem('soparia_estoque')) || {
    'sopa-frango': { nome: 'Sopa de Frango com Legumes', categoria: 'Sopas e Pratos', preco: 25.00, estoque: 15, imagem: 'https://via.placeholder.com/300x180/8B4513/FFFFFF?text=Sopa+Frango' },
    'sopa-carne': { nome: 'Sopa de Carne com Mandioca', categoria: 'Sopas e Pratos', preco: 28.00, estoque: 10, imagem: 'https://via.placeholder.com/300x180/A0522D/FFFFFF?text=Sopa+Carne' },
    'sopa-mocoto': { nome: 'Sopa de Mocotó Especial', categoria: 'Sopas e Pratos', preco: 35.00, estoque: 5, imagem: 'https://via.placeholder.com/300x180/B0C4DE/FFFFFF?text=Sopa+Mocotó' },
    'lasanha': { nome: 'Lasanha à Bolonhesa (Prato)', categoria: 'Sopas e Pratos', preco: 30.00, estoque: 8, imagem: 'https://via.placeholder.com/300x180/CD5C5C/FFFFFF?text=Lasanha' },
    'suco': { nome: 'Suco Natural (Laranja/Abacaxi)', categoria: 'Bebidas', preco: 8.00, estoque: 25, imagem: 'https://via.placeholder.com/300x180/FFA500/FFFFFF?text=Suco' },
    'refri': { nome: 'Refrigerante Lata (Diversos)', categoria: 'Bebidas', preco: 7.00, estoque: 30, imagem: 'https://via.placeholder.com/300x180/00CED1/FFFFFF?text=Refrigerante' },
    'torta': { nome: 'Fatia de Torta Holandesa', categoria: 'Sobremesas', preco: 12.00, estoque: 12, imagem: 'https://via.placeholder.com/300x180/D2B48C/FFFFFF?text=Torta' },
    'bolo': { nome: 'Bolo de Chocolate Vulcão', categoria: 'Sobremesas', preco: 15.00, estoque: 9, imagem: 'https://via.placeholder.com/300x180/8B4513/FFFFFF?text=Bolo' },
};

// Dados de Usuários (Simulação de Banco)
let usuarios = JSON.parse(localStorage.getItem('soparia_usuarios')) || [
    { nome: 'Administrador', email: 'adm@soparia.com', senha: '08032004', tipo: 'adm', endereco: '' }
];

let usuarioAtual = JSON.parse(localStorage.getItem('soparia_sessao')) || null;
let carrinho = [];
const TAXA_ENTREGA = 3.00;

// Elementos DOM
const menuSection = document.getElementById('menu');
const listaCarrinho = document.getElementById('lista-carrinho');
const totalCarrinhoSpan = document.getElementById('total-carrinho');
const contadorCarrinhoSpan = document.getElementById('contador-carrinho');
const modalCarrinho = document.getElementById('modal-carrinho');
const modalConfirmacao = document.getElementById('modal-confirmacao');
const modalPix = document.getElementById('modal-pix'); // NOVO
const toastContainer = document.getElementById('toast-container');
const btnLoginPerfil = document.getElementById('btn-login-perfil');
const textoLogin = document.getElementById('texto-login');
const adminPanel = document.getElementById('admin-panel');

// --- SISTEMA DE USUÁRIOS ---

function salvarDados() {
    localStorage.setItem('soparia_estoque', JSON.stringify(estoque));
    localStorage.setItem('soparia_usuarios', JSON.stringify(usuarios));
    if (usuarioAtual) localStorage.setItem('soparia_sessao', JSON.stringify(usuarioAtual));
    else localStorage.removeItem('soparia_sessao');
}

function verificarSessao() {
    if (usuarioAtual) {
        textoLogin.textContent = `Olá, ${usuarioAtual.nome.split(' ')[0]}`;
        // Se for ADM, mostra painel
        if (usuarioAtual.tipo === 'adm') {
            adminPanel.classList.remove('hidden');
            renderizarPainelAdmin();
        } else {
            adminPanel.classList.add('hidden');
        }
        
        // Preenche dados no checkout automaticamente
        if (document.getElementById('email-cliente')) {
            document.getElementById('email-cliente').value = usuarioAtual.email;
        }
    } else {
        textoLogin.textContent = 'Entrar';
        adminPanel.classList.add('hidden');
    }
}

function login(email, senha) {
    const user = usuarios.find(u => u.email === email && u.senha === senha);
    if (user) {
        usuarioAtual = user;
        salvarDados();
        verificarSessao();
        document.getElementById('modal-login').style.display = 'none';
        mostrarNotificacao(`Bem-vindo, ${user.nome}!`, 'sucesso');
    } else {
        mostrarNotificacao('Email ou senha incorretos.', 'erro');
    }
}

function cadastrar(nome, email, senha, endereco) {
    if (usuarios.find(u => u.email === email)) {
        mostrarNotificacao('Email já cadastrado.', 'erro');
        return;
    }
    // Validação de senha mínima
    if (senha.length < 8) {
        mostrarNotificacao('A senha deve ter no mínimo 8 caracteres.', 'erro');
        return;
    }
    const novoUser = { nome, email, senha, tipo: 'cliente', endereco };
    usuarios.push(novoUser);
    usuarioAtual = novoUser;
    salvarDados();
    verificarSessao();
    document.getElementById('modal-login').style.display = 'none';
    mostrarNotificacao('Conta criada com sucesso!', 'sucesso');
}

function logout() {
    usuarioAtual = null;
    salvarDados();
    verificarSessao();
    document.getElementById('modal-perfil').style.display = 'none';
    document.getElementById('checkout-form').reset();
    mostrarNotificacao('Você saiu da conta.', 'info');
}

// --- PAINEL ADMINISTRATIVO ---

function renderizarPainelAdmin() {
    const grid = document.getElementById('admin-grid');
    grid.innerHTML = '';
    
    for (const [id, item] of Object.entries(estoque)) {
        const div = document.createElement('div');
        div.className = 'admin-card';
        div.innerHTML = `
            <h4>${item.nome}</h4>
            <label>Preço (R$)</label>
            <input type="number" step="0.01" value="${item.preco}" data-id="${id}" data-field="preco">
            <label>Estoque (Qtd)</label>
            <input type="number" value="${item.estoque}" data-id="${id}" data-field="estoque">
            <label>URL Imagem</label>
            <input type="text" value="${item.imagem}" data-id="${id}" data-field="imagem">
        `;
        grid.appendChild(div);
    }
}

document.getElementById('btn-salvar-estoque').addEventListener('click', () => {
    const inputs = document.querySelectorAll('.admin-card input');
    inputs.forEach(input => {
        const id = input.dataset.id;
        const field = input.dataset.field;
        let valor = input.value;
        
        if (field === 'preco' || field === 'estoque') {
            valor = parseFloat(valor);
        }
        
        if (estoque[id]) {
            estoque[id][field] = valor;
        }
    });
    
    salvarDados();
    renderizarMenu(); // Atualiza a vitrine
    mostrarNotificacao('Estoque e preços atualizados!', 'sucesso');
});

// --- RENDERIZAÇÃO DO MENU (Mantido) ---

function renderizarMenu() {
    const menuAgrupado = {};
    for (const [id, item] of Object.entries(estoque)) {
        if (!menuAgrupado[item.categoria]) menuAgrupado[item.categoria] = [];
        menuAgrupado[item.categoria].push({ id, ...item });
    }

    menuSection.innerHTML = ''; 
    const container = document.createElement('div');
    container.classList.add('container');
    menuSection.appendChild(container);

    const tituloPrincipal = document.createElement('h2');
    tituloPrincipal.className = 'section-titulo';
    tituloPrincipal.innerHTML = '<i class="bi bi-list-stars"></i> Nosso Menu Quentinho';
    container.appendChild(tituloPrincipal);

    for (const [categoria, itens] of Object.entries(menuAgrupado)) {
        const catTitle = document.createElement('h3');
        catTitle.className = 'categoria-titulo';
        catTitle.textContent = categoria;
        container.appendChild(catTitle);

        const grid = document.createElement('div');
        grid.classList.add('menu-grid');
        container.appendChild(grid);

        itens.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('produto-card');
            const estoqueTexto = item.estoque > 0 ? `Estoque: ${item.estoque}` : '**ESGOTAADO**';
            const desabilitado = item.estoque === 0;

            card.innerHTML = `
                <img src="${item.imagem}" alt="${item.nome}" class="produto-imagem">
                <div class="produto-info">
                    <h4 class="produto-nome">${item.nome}</h4>
                    <p class="produto-descricao">${item.descricao || 'Delicioso prato do nosso menu.'}</p>
                    <div class="produto-footer">
                        <span class="produto-preco">R$ ${item.preco.toFixed(2)}</span>
                        <span class="produto-estoque ${desabilitado ? 'esgotado' : 'disponivel'}">${estoqueTexto}</span>
                    </div>
                    <button class="adicionar-btn" data-id="${item.id}" ${desabilitado ? 'disabled' : ''}>
                        ${item.estoque > 0 ? '➕ Adicionar' : 'Indisponível'}
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

// --- LÓGICA DO CARRINHO (Mantido com melhorias) ---

function atualizarCarrinho() {
    listaCarrinho.innerHTML = '';
    const inputEntrega = document.querySelector('input[name="tipo_entrega"]:checked');
    const tipoEntrega = inputEntrega ? inputEntrega.value : 'entrega';
    let total = 0;
    let totalItens = 0;

    if (carrinho.length === 0) listaCarrinho.innerHTML = '<li>O carrinho está vazio.</li>';
    else {
        carrinho.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('carrinho-item');
            li.innerHTML = `
                <div class="item-info"><div class="item-nome">${item.quantidade}x ${item.nome}</div></div>
                <div class="item-acoes">
                    <span class="item-preco">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                    <button class="btn-remover" data-id="${item.id}"><i class="bi bi-trash"></i></button>
                </div>`;
            listaCarrinho.appendChild(li);
            total += item.preco * item.quantidade;
            totalItens += item.quantidade;
        });
    }

    if (tipoEntrega === 'entrega' && total > 0) total += TAXA_ENTREGA;
    totalCarrinhoSpan.textContent = total.toFixed(2);
    contadorCarrinhoSpan.textContent = totalItens;
}

function adicionarAoCarrinho(produtoId) {
    const produto = estoque[produtoId];
    if (!produto || produto.estoque <= 0) return mostrarNotificacao('Item fora de estoque!', 'erro');

    const itemExistente = carrinho.find(item => item.id === produtoId);
    if (itemExistente) {
        if (produto.estoque > itemExistente.quantidade) itemExistente.quantidade++;
        else return mostrarNotificacao('Limite de estoque atingido!', 'erro');
    } else {
        carrinho.push({ id: produtoId, nome: produto.nome, preco: produto.preco, quantidade: 1 });
    }
    atualizarCarrinho();
    mostrarNotificacao(`${produto.nome} adicionado!`, 'sucesso');
}

function finalizarCompra(e) {
    e.preventDefault();
    
    // 1. VERIFICAÇÃO DE LOGIN OBRIGATÓRIA
    if (!usuarioAtual) {
        mostrarNotificacao('Faça login ou cadastre-se para finalizar.', 'erro');
        // Fecha o carrinho e abre o login
        modalCarrinho.style.display = 'none';
        document.getElementById('modal-login').style.display = 'block';
        return;
    }
    
    if (carrinho.length === 0) return mostrarNotificacao('Carrinho vazio!', 'info');
    
    // Validação de Endereço (Separado)
    const inputEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
    const metodoPagamento = document.getElementById('metodo-pagamento').value;
    const origemEndereco = document.querySelector('input[name="origem_endereco"]:checked')?.value || 'novo';
    
    const rua = document.getElementById('endereco-rua').value;
    const numero = document.getElementById('endereco-numero').value;
    const bairro = document.getElementById('endereco-bairro').value;
    const complemento = document.getElementById('endereco-complemento').value;

    // Se escolheu endereço cadastrado, valida se ele existe
    if (inputEntrega === 'entrega' && origemEndereco === 'cadastrado') {
        if (!usuarioAtual.endereco || usuarioAtual.endereco.trim() === '') {
            mostrarNotificacao('Seu perfil não tem endereço salvo. Escolha "Outro endereço".', 'erro');
            return;
        }
    }

    // SE FOR PIX, ABRE O MODAL ESPECÍFICO E PARA A EXECUÇÃO AQUI
    if (metodoPagamento === 'pix') {
        if (inputEntrega === 'entrega' && origemEndereco === 'novo' && !document.getElementById('checkout-form').checkValidity()) {
            return mostrarNotificacao('Preencha os dados de entrega antes.', 'erro');
        }
        modalCarrinho.style.display = 'none';
        modalPix.style.display = 'block';
        return;
    }

    if (inputEntrega === 'entrega' && origemEndereco === 'novo' && !document.getElementById('checkout-form').checkValidity()) {
        return mostrarNotificacao('Preencha os campos obrigatórios.', 'erro');
    }

    // Baixa no Estoque
    let vendaSucesso = true;
    for (const item of carrinho) {
        if (estoque[item.id].estoque < item.quantidade) {
            mostrarNotificacao(`Estoque insuficiente: ${item.nome}`, 'erro');
            vendaSucesso = false;
            break;
        }
    }

    if (vendaSucesso) {
        for (const item of carrinho) {
            estoque[item.id].estoque -= item.quantidade;
        }
        salvarDados(); // Salva o novo estoque
        
        let enderecoFinal = 'Retirada no Balcão';
        
        if (inputEntrega === 'entrega') {
            if (origemEndereco === 'cadastrado') {
                enderecoFinal = usuarioAtual.endereco; // Usa do perfil
            } else {
                enderecoFinal = `${rua}, ${numero} - ${bairro} ${complemento ? '('+complemento+')' : ''}`;
            }
        }
            
        console.log(`PEDIDO REALIZADO: Cliente: ${document.getElementById('email-cliente').value}, Endereço: ${enderecoFinal}`);
        
        carrinho = [];
        atualizarCarrinho();
        renderizarMenu();
        
        modalCarrinho.style.display = 'none';
        modalConfirmacao.style.display = 'block';
        document.getElementById('checkout-form').reset();
        
        // Mantém email se logado
        if(usuarioAtual) document.getElementById('email-cliente').value = usuarioAtual.email;
    }
}

// --- LÓGICA DO PIX E COMPROVANTE (NOVO) ---

document.getElementById('btn-copiar-pix').addEventListener('click', () => {
    const codigo = document.getElementById('pix-code');
    codigo.select();
    document.execCommand('copy'); // Fallback antigo mas funciona bem
    navigator.clipboard.writeText(codigo.value); // Moderno
    mostrarNotificacao('Código PIX copiado!', 'sucesso');
});

document.getElementById('btn-enviar-comprovante').addEventListener('click', () => {
    const fileInput = document.getElementById('comprovante-upload');
    
    if (fileInput.files.length === 0) {
        mostrarNotificacao('Por favor, anexe o comprovante.', 'erro');
        return;
    }

    // Simula o processo de finalização após envio do comprovante
    // Aqui você processaria a baixa de estoque igual ao finalizarCompra
    for (const item of carrinho) {
        if(estoque[item.id]) estoque[item.id].estoque -= item.quantidade;
    }
    salvarDados();

    carrinho = [];
    atualizarCarrinho();
    renderizarMenu();
    
    modalPix.style.display = 'none';
    modalConfirmacao.style.display = 'block';
    document.getElementById('checkout-form').reset();
    fileInput.value = ''; // Limpa o arquivo
});

// --- UI HELPERS ---
function mostrarNotificacao(msg, tipo = 'sucesso') {
    const icones = { sucesso: 'bi-check-circle-fill', erro: 'bi-x-circle-fill', info: 'bi-info-circle-fill' };
    const toast = document.createElement('div');
    toast.className = `toast ${tipo}`;
    toast.innerHTML = `<i class="bi ${icones[tipo]}"></i><span>${msg}</span>`;
    toastContainer.appendChild(toast);
    setTimeout(() => {
        toast.style.animation = 'fadeOutRight 0.5s forwards';
        toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
}

// --- EVENT LISTENERS ---

// Toggle Login/Perfil
btnLoginPerfil.addEventListener('click', () => {
    if (usuarioAtual) {
        // Preenche modal perfil
        document.getElementById('perfil-nome').textContent = usuarioAtual.nome;
        document.getElementById('perfil-email').textContent = usuarioAtual.email;
        document.getElementById('perfil-tipo').textContent = usuarioAtual.tipo === 'adm' ? 'Administrador' : 'Cliente';
        document.getElementById('perfil-endereco').value = usuarioAtual.endereco || '';
        document.getElementById('modal-perfil').style.display = 'block';
    } else {
        document.getElementById('modal-login').style.display = 'block';
    }
});

// Tabs Login/Cadastro
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        e.target.classList.add('active');
        const tab = e.target.dataset.tab;
        if(tab === 'login') document.getElementById('form-login').classList.add('active');
        else document.getElementById('form-cadastro').classList.add('active');
    });
});

// Submit Login
document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    login(document.getElementById('login-email').value, document.getElementById('login-senha').value);
});

// Submit Cadastro
document.getElementById('form-cadastro').addEventListener('submit', (e) => {
    e.preventDefault();
    cadastrar(
        document.getElementById('cad-nome').value,
        document.getElementById('cad-email').value,
        document.getElementById('cad-senha').value,
        document.getElementById('cad-endereco').value
    );
});

// Logout e Atualizar Perfil
document.getElementById('btn-logout').addEventListener('click', logout);
document.getElementById('btn-atualizar-perfil').addEventListener('click', () => {
    usuarioAtual.endereco = document.getElementById('perfil-endereco').value;
    // Atualiza no array principal
    const idx = usuarios.findIndex(u => u.email === usuarioAtual.email);
    if(idx !== -1) usuarios[idx] = usuarioAtual;
    salvarDados();
    mostrarNotificacao('Perfil atualizado!', 'sucesso');
});

// Eventos Globais (Modais, Menu, Checkout)
document.getElementById('carrinho-btn').addEventListener('click', () => {
    modalCarrinho.style.display = 'block';
    atualizarVisibilidadeEndereco();
});
document.querySelectorAll('.fechar-btn, .btn-voltar').forEach(btn => btn.addEventListener('click', (e) => {
    const modalId = e.currentTarget.dataset.modal;
    if(modalId) document.getElementById(modalId).style.display = 'none';
}));

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
};

document.querySelector('.hero-section').addEventListener('click', () => document.getElementById('menu').scrollIntoView({ behavior: 'smooth' }));

menuSection.addEventListener('click', (e) => {
    if (e.target.classList.contains('adicionar-btn')) adicionarAoCarrinho(e.target.dataset.id);
});

listaCarrinho.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remover');
    if (btn) {
        carrinho = carrinho.filter(i => i.id !== btn.dataset.id);
        atualizarCarrinho();
    }
});

// Controle de Endereço (Entrega/Retirada)
const inputsEndereco = [document.getElementById('endereco-rua'), document.getElementById('endereco-numero'), document.getElementById('endereco-bairro')];

// Lógica para Alternar Endereço (Salvo vs Novo)
const radiosOrigemEndereco = document.querySelectorAll('input[name="origem_endereco"]');
const divFormNovoEndereco = document.getElementById('form-novo-endereco');
const txtEnderecoSalvo = document.getElementById('texto-endereco-salvo');
const divOpcaoEnderecoSalvo = document.getElementById('opcao-endereco-salvo');

function atualizarVisibilidadeEndereco() {
    const tipoEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
    
    // Se for retirada, esconde tudo
    if (tipoEntrega === 'retirada') {
        document.getElementById('grupo-endereco').style.display = 'none';
        return;
    }

    document.getElementById('grupo-endereco').style.display = 'block';

    // Verifica se tem usuário e endereço salvo
    if (usuarioAtual && usuarioAtual.endereco) {
        divOpcaoEnderecoSalvo.style.display = 'flex';
        txtEnderecoSalvo.textContent = `Salvo: ${usuarioAtual.endereco}`;
        
        const usaSalvo = document.querySelector('input[name="origem_endereco"]:checked').value === 'cadastrado';
        
        if (usaSalvo) {
            divFormNovoEndereco.style.display = 'none';
            txtEnderecoSalvo.style.display = 'block';
            inputsEndereco.forEach(i => i.required = false);
        } else {
            divFormNovoEndereco.style.display = 'flex'; // grid/flex
            txtEnderecoSalvo.style.display = 'none';
            inputsEndereco.forEach(i => i.required = true);
        }
    } else {
        divOpcaoEnderecoSalvo.style.display = 'none';
        divFormNovoEndereco.style.display = 'flex';
        inputsEndereco.forEach(i => i.required = true);
    }
}

radiosOrigemEndereco.forEach(r => r.addEventListener('change', atualizarVisibilidadeEndereco));
document.querySelectorAll('input[name="tipo_entrega"]').forEach(r => {
    r.addEventListener('change', () => {
        atualizarCarrinho();
        atualizarVisibilidadeEndereco();
    });
});

document.getElementById('checkout-form').addEventListener('submit', finalizarCompra);

function iniciarCarrossel() {
    const slides = document.querySelectorAll('.carousel-item');
    if(!slides.length) return;
    let i = 0;
    setInterval(() => {
        slides[i].classList.remove('active');
        i = (i + 1) % slides.length;
        slides[i].classList.add('active');
    }, 5000);
}

// INICIALIZAÇÃO
verificarSessao();
renderizarMenu();
atualizarCarrinho();
iniciarCarrossel();