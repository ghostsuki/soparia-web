// --- CONFIGURAÇÃO INICIAL E DADOS ---
let estoque = JSON.parse(localStorage.getItem('soparia_estoque')) || {
    'sopa-frango': { nome: 'Sopa de Frango com Legumes', categoria: 'Sopas e Pratos', preco: 25.00, esgotado: false, imagem: 'https://via.placeholder.com/300x180/8B4513/FFFFFF?text=Sopa+Frango' },
    'sopa-carne': { nome: 'Sopa de Carne com Mandioca', categoria: 'Sopas e Pratos', preco: 28.00, esgotado: false, imagem: 'https://via.placeholder.com/300x180/A0522D/FFFFFF?text=Sopa+Carne' },
    'sopa-mocoto': { nome: 'Sopa de Mocotó Especial', categoria: 'Sopas e Pratos', preco: 35.00, esgotado: false, imagem: 'https://via.placeholder.com/300x180/B0C4DE/FFFFFF?text=Sopa+Mocotó' },
    'lasanha': { nome: 'Lasanha à Bolonhesa (Prato)', categoria: 'Sopas e Pratos', preco: 30.00, esgotado: false, imagem: 'https://via.placeholder.com/300x180/CD5C5C/FFFFFF?text=Lasanha' },
    'suco': { nome: 'Suco Natural (Laranja/Abacaxi)', categoria: 'Bebidas', preco: 8.00, esgotado: false, imagem: 'https://via.placeholder.com/300x180/FFA500/FFFFFF?text=Suco' },
    'refri': { nome: 'Refrigerante Lata (Diversos)', categoria: 'Bebidas', preco: 7.00, esgotado: false, imagem: 'https://via.placeholder.com/300x180/00CED1/FFFFFF?text=Refrigerante' },
    'torta': { nome: 'Fatia de Torta Holandesa', categoria: 'Sobremesas', preco: 12.00, esgotado: false, imagem: 'https://via.placeholder.com/300x180/D2B48C/FFFFFF?text=Torta' },
    'bolo': { nome: 'Bolo de Chocolate Vulcão', categoria: 'Sobremesas', preco: 15.00, esgotado: false, imagem: 'https://via.placeholder.com/300x180/8B4513/FFFFFF?text=Bolo' }
};

let usuarios = JSON.parse(localStorage.getItem('soparia_usuarios')) || [
    { nome: 'Administrador', email: 'adm@soparia.com', senha: '08032004', tipo: 'adm', endereco: '' }
];

let usuarioAtual = JSON.parse(localStorage.getItem('soparia_sessao')) || null;
let carrinho = [];
const TAXA_ENTREGA = 3.00;

// Elementos
const menuSection = document.getElementById('menu-content');
const listaCarrinho = document.getElementById('lista-carrinho');
const totalCarrinhoSpan = document.getElementById('total-carrinho');
const contadorCarrinhoSpan = document.getElementById('contador-carrinho');
const modalCarrinho = document.getElementById('modal-carrinho');
const modalConfirmacao = document.getElementById('modal-confirmacao');
const modalPix = document.getElementById('modal-pix');
const toastContainer = document.getElementById('toast-container');
const btnLoginPerfil = document.getElementById('btn-login-perfil');
const textoLogin = document.getElementById('texto-login');

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
        if (usuarioAtual.tipo === 'adm') {
            btnLoginPerfil.onclick = () => window.location.href = 'admin.html';
            textoLogin.textContent = "Painel Admin";
            return;
        } else {
            btnLoginPerfil.onclick = () => {
                document.getElementById('perfil-nome').textContent = usuarioAtual.nome;
                document.getElementById('perfil-email').textContent = usuarioAtual.email;
                document.getElementById('perfil-tipo').textContent = "Cliente";
                document.getElementById('perfil-endereco').value = usuarioAtual.endereco || 'Sem endereço salvo.';
                document.getElementById('modal-perfil').style.display = 'block';
            };
        }
        if (document.getElementById('email-cliente')) document.getElementById('email-cliente').value = usuarioAtual.email;
    } else {
        textoLogin.textContent = 'Entrar';
        btnLoginPerfil.onclick = () => document.getElementById('modal-login').style.display = 'block';
    }
}

function login(email, senha) {
    const user = usuarios.find(u => u.email === email && u.senha === senha);
    if (user) {
        usuarioAtual = user;
        salvarDados();
        if (user.tipo === 'adm') window.location.href = 'admin.html';
        else {
            verificarSessao();
            document.getElementById('modal-login').style.display = 'none';
            mostrarNotificacao(`Bem-vindo, ${user.nome}!`, 'sucesso');
        }
    } else {
        mostrarNotificacao('E-mail ou senha incorretos.', 'erro');
    }
}

function cadastrar(nome, email, senha, rua, num, bairro, comp) {
    if (usuarios.find(u => u.email === email)) return mostrarNotificacao('E-mail já cadastrado.', 'erro');
    if (senha.length < 8) return mostrarNotificacao('A senha deve ter no mínimo 8 caracteres.', 'erro');

    const enderecoCompleto = `${rua}, ${num} - ${bairro} ${comp ? '('+comp+')' : ''}`;
    const novoUser = { nome, email, senha, tipo: 'cliente', endereco: enderecoCompleto };
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
    const form = document.getElementById('checkout-form');
    if(form) form.reset();
    mostrarNotificacao('Você saiu da conta.', 'info');
}

// --- RENDERIZAR MENU (CORRIGIDO PARA SEÇÕES E NAVEGAÇÃO) ---
function renderizarMenu() {
    menuSection.innerHTML = '';
    const navContainer = document.getElementById('menu-nav');
    if(navContainer) navContainer.innerHTML = ''; 

    const menuAgrupado = {};
    for (const [id, item] of Object.entries(estoque)) {
        if (!menuAgrupado[item.categoria]) menuAgrupado[item.categoria] = [];
        menuAgrupado[item.categoria].push({ id, ...item });
    }

    for (const [categoria, itens] of Object.entries(menuAgrupado)) {
        // 1. Cria ID para âncora
        const catId = 'cat-' + categoria.replace(/\s+/g, '-').toLowerCase();

        // 2. Cria Botão de Navegação
        if(navContainer) {
            const btn = document.createElement('button');
            btn.className = 'cat-btn';
            btn.textContent = categoria;
            btn.onclick = () => document.getElementById(catId).scrollIntoView({ behavior: 'smooth', block: 'center' });
            navContainer.appendChild(btn);
        }

        // 3. Título
        const h3 = document.createElement('h3');
        h3.className = 'categoria-titulo';
        h3.id = catId;
        h3.textContent = categoria;
        menuSection.appendChild(h3);

        // 4. Grid da Categoria
        const grid = document.createElement('div');
        grid.className = 'menu-grid';
        menuSection.appendChild(grid);

        itens.forEach(item => {
            const card = document.createElement('div');
            card.className = 'produto-card';
            const isSoldOut = item.esgotado === true;
            
            card.innerHTML = `
                <img src="${item.imagem}" class="produto-imagem" style="${isSoldOut ? 'filter: grayscale(100%); opacity:0.7' : ''}" alt="${item.nome}">
                <div class="produto-info">
                    <div>
                        <h4 class="produto-nome">${item.nome}</h4>
                        <p class="produto-descricao">Delicioso item do nosso cardápio.</p>
                    </div>
                    <div>
                        <div class="produto-footer">
                            <span class="produto-preco">R$ ${item.preco.toFixed(2)}</span>
                            <span class="produto-estoque ${isSoldOut ? 'esgotado' : 'disponivel'}">${isSoldOut ? 'Esgotado' : 'Disponível'}</span>
                        </div>
                        <button class="adicionar-btn" data-id="${item.id}" ${isSoldOut ? 'disabled' : ''}>
                            ${isSoldOut ? 'SOLD OUT' : '➕ Adicionar'}
                        </button>
                    </div>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

// --- CARRINHO ---
function atualizarCarrinho() {
    listaCarrinho.innerHTML = '';
    const inputEntrega = document.querySelector('input[name="tipo_entrega"]:checked');
    const tipoEntrega = inputEntrega ? inputEntrega.value : 'entrega';
    let total = 0;
    let totalItens = 0;

    if (carrinho.length === 0) listaCarrinho.innerHTML = '<li style="text-align:center; padding:20px;">O carrinho está vazio.</li>';
    else {
        carrinho.forEach(item => {
            const li = document.createElement('li');
            li.className = 'carrinho-item';
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
    if (!produto || produto.esgotado) return mostrarNotificacao('Item indisponível.', 'erro');

    const itemExistente = carrinho.find(item => item.id === produtoId);
    if (itemExistente) itemExistente.quantidade++;
    else carrinho.push({ id: produtoId, nome: produto.nome, preco: produto.preco, quantidade: 1 });
    
    atualizarCarrinho();
    mostrarNotificacao(`${produto.nome} adicionado!`, 'sucesso');
}

function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    atualizarCarrinho();
}

// --- CHECKOUT ---
function iniciarProcessoCheckout(e) {
    e.preventDefault();
    if (!usuarioAtual) {
        modalCarrinho.style.display = 'none';
        document.getElementById('modal-login').style.display = 'block';
        return mostrarNotificacao('Faça login para continuar.', 'erro');
    }
    if (carrinho.length === 0) return mostrarNotificacao('Carrinho vazio!', 'info');

    const metodoPagamento = document.getElementById('metodo-pagamento').value;
    const inputEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
    const origemEndereco = document.querySelector('input[name="origem_endereco"]:checked')?.value || 'novo';

    if (inputEntrega === 'entrega' && origemEndereco === 'cadastrado') {
        if (!usuarioAtual.endereco || usuarioAtual.endereco.length < 5) {
            return mostrarNotificacao('Seu perfil não tem endereço. Escolha "Outro endereço".', 'erro');
        }
    }
    if (inputEntrega === 'entrega' && origemEndereco === 'novo') {
        if (!document.getElementById('checkout-form').checkValidity()) return mostrarNotificacao('Preencha o endereço completo.', 'erro');
    }

    if (metodoPagamento === 'pix') {
        modalCarrinho.style.display = 'none';
        modalPix.style.display = 'block';
    } else {
        finalizarPedidoReal('Dinheiro');
    }
}

function finalizarPedidoReal(metodo) {
    const inputEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
    const origem = document.querySelector('input[name="origem_endereco"]:checked')?.value || 'novo';
    let endFinal = 'Retirada no Balcão';

    if (inputEntrega === 'entrega') {
        if (origem === 'cadastrado') endFinal = usuarioAtual.endereco;
        else {
            const r = document.getElementById('endereco-rua').value;
            const n = document.getElementById('endereco-numero').value;
            const b = document.getElementById('endereco-bairro').value;
            const c = document.getElementById('endereco-complemento').value;
            endFinal = `${r}, ${n} - ${b} ${c ? '('+c+')' : ''}`;
        }
    }

    const pedido = {
        cliente: usuarioAtual.nome,
        email: usuarioAtual.email,
        itens: [...carrinho],
        total: parseFloat(totalCarrinhoSpan.textContent),
        metodo: metodo,
        endereco: endFinal,
        data: new Date().toISOString()
    };

    let pendentes = JSON.parse(localStorage.getItem('soparia_pedidos_pendentes')) || [];
    pendentes.push(pedido);
    localStorage.setItem('soparia_pedidos_pendentes', JSON.stringify(pendentes));

    carrinho = [];
    atualizarCarrinho();
    modalCarrinho.style.display = 'none';
    modalPix.style.display = 'none';
    modalConfirmacao.style.display = 'block';
    document.getElementById('checkout-form').reset();
}

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

function atualizarVisibilidadeEndereco() {
    const tipo = document.querySelector('input[name="tipo_entrega"]:checked').value;
    const grupo = document.getElementById('grupo-endereco');
    const opcaoSalvo = document.getElementById('opcao-endereco-salvo');
    const txtSalvo = document.getElementById('texto-endereco-salvo');
    const formNovo = document.getElementById('form-novo-endereco');
    const inputs = formNovo.querySelectorAll('input');

    if (tipo === 'retirada') {
        grupo.style.display = 'none';
        inputs.forEach(i => i.required = false);
        return;
    }
    grupo.style.display = 'block';

    if (usuarioAtual && usuarioAtual.endereco && usuarioAtual.endereco.length > 5) {
        opcaoSalvo.style.display = 'flex';
        txtSalvo.textContent = `Salvo: ${usuarioAtual.endereco}`;
        const usaSalvo = document.querySelector('input[name="origem_endereco"]:checked')?.value === 'cadastrado';
        
        if (usaSalvo) {
            formNovo.style.display = 'none';
            txtSalvo.style.display = 'block';
            inputs.forEach(i => i.required = false);
        } else {
            formNovo.style.display = 'flex';
            txtSalvo.style.display = 'none';
            inputs.forEach(i => i.required = true);
        }
    } else {
        opcaoSalvo.style.display = 'none';
        formNovo.style.display = 'flex';
        inputs.forEach(i => i.required = true);
    }
}

// --- EVENTOS ---
document.getElementById('form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    login(document.getElementById('login-email').value, document.getElementById('login-senha').value);
});

document.getElementById('form-cadastro').addEventListener('submit', (e) => {
    e.preventDefault();
    cadastrar(
        document.getElementById('cad-nome').value,
        document.getElementById('cad-email').value,
        document.getElementById('cad-senha').value,
        document.getElementById('cad-rua').value,
        document.getElementById('cad-numero').value,
        document.getElementById('cad-bairro').value,
        document.getElementById('cad-complemento').value
    );
});

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

document.getElementById('carrinho-btn').addEventListener('click', () => {
    modalCarrinho.style.display = 'block';
    atualizarVisibilidadeEndereco();
});
document.getElementById('btn-logout').addEventListener('click', logout);

document.querySelectorAll('.fechar-btn, .btn-voltar').forEach(btn => btn.addEventListener('click', (e) => {
    const modalId = e.currentTarget.dataset.modal;
    if(modalId) document.getElementById(modalId).style.display = 'none';
}));

window.onclick = (e) => { if (e.target.classList.contains('modal')) e.target.style.display = 'none'; };

menuSection.addEventListener('click', (e) => {
    if (e.target.classList.contains('adicionar-btn')) adicionarAoCarrinho(e.target.dataset.id);
});

listaCarrinho.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remover');
    if (btn) removerDoCarrinho(btn.dataset.id);
});

document.querySelectorAll('input[name="tipo_entrega"]').forEach(r => {
    r.addEventListener('change', () => {
        atualizarCarrinho();
        atualizarVisibilidadeEndereco();
    });
});
document.querySelectorAll('input[name="origem_endereco"]').forEach(r => r.addEventListener('change', atualizarVisibilidadeEndereco));

document.getElementById('checkout-form').addEventListener('submit', iniciarProcessoCheckout);

document.getElementById('btn-copiar-pix').addEventListener('click', () => {
    navigator.clipboard.writeText(document.getElementById('pix-code').value);
    mostrarNotificacao('Copiado!', 'sucesso');
});

document.getElementById('btn-enviar-comprovante').addEventListener('click', () => {
    if(!document.getElementById('comprovante-upload').files[0]) return mostrarNotificacao('Anexe o comprovante.', 'erro');
    finalizarPedidoReal('PIX');
});

// Carrossel
function iniciarCarrossel() {
    const slides = document.querySelectorAll('.carousel-item');
    if(slides.length === 0) return;
    let i = 0;
    setInterval(() => {
        slides[i].classList.remove('active');
        i = (i + 1) % slides.length;
        slides[i].classList.add('active');
    }, 5000);
}
document.querySelector('.hero-section').addEventListener('click', () => document.getElementById('menu').scrollIntoView({behavior:'smooth'}));

// Init
verificarSessao();
renderizarMenu();
atualizarCarrinho();
iniciarCarrossel();