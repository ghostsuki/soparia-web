// --- CONFIGURAÇÃO INICIAL E DADOS ---

// Carrega Estoque (Sincronizado com Admin)
let estoque = JSON.parse(localStorage.getItem('soparia_estoque')) || {
    'sopa-frango': { nome: 'Sopa de Frango com Legumes', categoria: 'Sopas e Pratos', preco: 25.00, esgotado: false, imagem: 'assets/sopa1.jpg' },
    'sopa-carne': { nome: 'Sopa de Carne com Mandioca', categoria: 'Sopas e Pratos', preco: 28.00, esgotado: false, imagem: 'assets/sopa2.jpg' },
    'sopa-mocoto': { nome: 'Sopa de Mocotó Especial', categoria: 'Sopas e Pratos', preco: 35.00, esgotado: false, imagem: 'assets/sopa3.jpg' },
    'lasanha': { nome: 'Lasanha à Bolonhesa (Prato)', categoria: 'Sopas e Pratos', preco: 30.00, esgotado: false, imagem: 'assets/lasanha.jpg' },
    'suco': { nome: 'Suco Natural (Laranja/Abacaxi)', categoria: 'Bebidas', preco: 8.00, esgotado: false, imagem: 'assets/suco.jpg' },
    'refri': { nome: 'Refrigerante Lata (Diversos)', categoria: 'Bebidas', preco: 7.00, esgotado: false, imagem: 'assets/refri.jpg' },
    'torta': { nome: 'Fatia de Torta Holandesa', categoria: 'Sobremesas', preco: 12.00, esgotado: false, imagem: 'assets/torta.jpg' },
    'bolo': { nome: 'Bolo de Chocolate Vulcão', categoria: 'Sobremesas', preco: 15.00, esgotado: false, imagem: 'assets/bolo.jpg' }
};

// Dados de Usuários
let usuarios = JSON.parse(localStorage.getItem('soparia_usuarios')) || [
    { nome: 'Administrador', email: 'adm@soparia.com', senha: '08032004', tipo: 'adm', endereco: '' }
];

let usuarioAtual = JSON.parse(localStorage.getItem('soparia_sessao')) || null;
let carrinho = [];
const TAXA_ENTREGA = 3.00;

// Seleção de Elementos do DOM
const menuSection = document.getElementById('menu');
const listaCarrinho = document.getElementById('lista-carrinho');
const totalCarrinhoSpan = document.getElementById('total-carrinho');
const contadorCarrinhoSpan = document.getElementById('contador-carrinho');
const modalCarrinho = document.getElementById('modal-carrinho');
const modalConfirmacao = document.getElementById('modal-confirmacao');
const modalPix = document.getElementById('modal-pix');
const toastContainer = document.getElementById('toast-container');
const btnLoginPerfil = document.getElementById('btn-login-perfil');
const textoLogin = document.getElementById('texto-login');

// --- FUNÇÕES DE SISTEMA (AUTH/DADOS) ---

function salvarDados() {
    localStorage.setItem('soparia_estoque', JSON.stringify(estoque));
    localStorage.setItem('soparia_usuarios', JSON.stringify(usuarios));
    if (usuarioAtual) localStorage.setItem('soparia_sessao', JSON.stringify(usuarioAtual));
    else localStorage.removeItem('soparia_sessao');
}

function verificarSessao() {
    if (usuarioAtual) {
        textoLogin.textContent = `Olá, ${usuarioAtual.nome.split(' ')[0]}`;
        
        // Se for ADM, redireciona o comportamento do botão
        if (usuarioAtual.tipo === 'adm') {
            btnLoginPerfil.onclick = () => window.location.href = 'admin.html';
            textoLogin.textContent = "Painel Admin";
            return;
        } else {
            // Se for cliente, abre modal de perfil
            btnLoginPerfil.onclick = () => {
                document.getElementById('perfil-nome').textContent = usuarioAtual.nome;
                document.getElementById('perfil-email').textContent = usuarioAtual.email;
                document.getElementById('perfil-tipo').textContent = "Cliente";
                document.getElementById('perfil-endereco').value = usuarioAtual.endereco || '';
                document.getElementById('modal-perfil').style.display = 'block';
            };
        }
        
        // Preenche e-mail no checkout se existir o campo
        const inputEmail = document.getElementById('email-cliente');
        if (inputEmail) inputEmail.value = usuarioAtual.email;
        
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
        
        if (user.tipo === 'adm') {
            window.location.href = 'admin.html';
        } else {
            verificarSessao();
            document.getElementById('modal-login').style.display = 'none';
            mostrarNotificacao(`Bem-vindo, ${user.nome}!`, 'sucesso');
        }
    } else {
        mostrarNotificacao('E-mail ou senha incorretos.', 'erro');
    }
}

function cadastrar(nome, email, senha, endereco) {
    if (usuarios.find(u => u.email === email)) {
        return mostrarNotificacao('E-mail já cadastrado.', 'erro');
    }
    if (senha.length < 8) {
        return mostrarNotificacao('A senha deve ter no mínimo 8 caracteres.', 'erro');
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
    
    // Limpa campos
    const formCheckout = document.getElementById('checkout-form');
    if(formCheckout) formCheckout.reset();
    
    mostrarNotificacao('Você saiu da conta.', 'info');
}

// --- RENDERIZAÇÃO DO MENU ---

function renderizarMenu() {
    // Agrupa por categoria
    const menuAgrupado = {};
    for (const [id, item] of Object.entries(estoque)) {
        if (!menuAgrupado[item.categoria]) menuAgrupado[item.categoria] = [];
        menuAgrupado[item.categoria].push({ id, ...item });
    }

    menuSection.innerHTML = '';
    const container = document.createElement('div');
    container.classList.add('container');
    menuSection.appendChild(container);
    
    // Título Principal
    const h2 = document.createElement('h2');
    h2.className = 'section-titulo';
    h2.innerHTML = '<i class="bi bi-list-stars"></i> Nosso Menu';
    container.appendChild(h2);

    for (const [categoria, itens] of Object.entries(menuAgrupado)) {
        const h3 = document.createElement('h3');
        h3.className = 'categoria-titulo';
        h3.textContent = categoria;
        container.appendChild(h3);

        const grid = document.createElement('div');
        grid.classList.add('menu-grid');
        container.appendChild(grid);

        itens.forEach(item => {
            const card = document.createElement('div');
            card.classList.add('produto-card');
            
            // Lógica "Sold Out"
            const isSoldOut = item.esgotado === true;
            const btnTexto = isSoldOut ? 'SOLD OUT' : '➕ Adicionar';
            const classeStatus = isSoldOut ? 'esgotado' : 'disponivel';
            const statusTexto = isSoldOut ? 'Esgotado' : 'Disponível';
            
            card.innerHTML = `
                <img src="${item.imagem}" class="produto-imagem" style="${isSoldOut ? 'filter: grayscale(100%);' : ''}" alt="${item.nome}">
                <div class="produto-info">
                    <h4 class="produto-nome">${item.nome}</h4>
                    <p class="produto-descricao">Delicioso item feito com carinho.</p>
                    <div class="produto-footer">
                        <span class="produto-preco">R$ ${item.preco.toFixed(2)}</span>
                        <span class="produto-estoque ${classeStatus}">${statusTexto}</span>
                    </div>
                    <button class="adicionar-btn" data-id="${item.id}" ${isSoldOut ? 'disabled' : ''}>
                        ${btnTexto}
                    </button>
                </div>
            `;
            grid.appendChild(card);
        });
    }
}

// --- CARRINHO E CHECKOUT ---

function atualizarCarrinho() {
    listaCarrinho.innerHTML = '';
    
    // Verifica tipo de entrega selecionado no form
    const inputEntrega = document.querySelector('input[name="tipo_entrega"]:checked');
    const tipoEntrega = inputEntrega ? inputEntrega.value : 'entrega';
    
    let total = 0;
    let totalItens = 0;

    if (carrinho.length === 0) {
        listaCarrinho.innerHTML = '<li style="text-align:center; padding:20px;">O carrinho está vazio.</li>';
    } else {
        carrinho.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('carrinho-item');
            li.innerHTML = `
                <div class="item-info">
                    <div class="item-nome">${item.quantidade}x ${item.nome}</div>
                </div>
                <div class="item-acoes">
                    <span class="item-preco">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                    <button class="btn-remover" data-id="${item.id}"><i class="bi bi-trash"></i></button>
                </div>`;
            listaCarrinho.appendChild(li);
            
            total += item.preco * item.quantidade;
            totalItens += item.quantidade;
        });
    }

    // Adiciona taxa se for entrega e tiver itens
    if (tipoEntrega === 'entrega' && total > 0) {
        total += TAXA_ENTREGA;
    }

    totalCarrinhoSpan.textContent = total.toFixed(2);
    contadorCarrinhoSpan.textContent = totalItens;
}

function adicionarAoCarrinho(produtoId) {
    const produto = estoque[produtoId];
    
    // Verifica se existe e se não está esgotado
    if (!produto || produto.esgotado) {
        return mostrarNotificacao('Item indisponível no momento.', 'erro');
    }

    const itemExistente = carrinho.find(item => item.id === produtoId);
    
    if (itemExistente) {
        itemExistente.quantidade++;
    } else {
        carrinho.push({ 
            id: produtoId, 
            nome: produto.nome, 
            preco: produto.preco, 
            quantidade: 1 
        });
    }
    
    atualizarCarrinho();
    mostrarNotificacao(`${produto.nome} adicionado!`, 'sucesso');
}

function removerDoCarrinho(produtoId) {
    carrinho = carrinho.filter(item => item.id !== produtoId);
    atualizarCarrinho();
}

function iniciarProcessoCheckout(e) {
    e.preventDefault();
    
    // 1. Bloqueio de Login
    if (!usuarioAtual) {
        modalCarrinho.style.display = 'none';
        document.getElementById('modal-login').style.display = 'block';
        return mostrarNotificacao('Faça login para finalizar a compra.', 'erro');
    }

    // 2. Carrinho Vazio
    if (carrinho.length === 0) {
        return mostrarNotificacao('Seu carrinho está vazio!', 'info');
    }

    // 3. Método de Pagamento (Define fluxo)
    const metodoPagamento = document.getElementById('metodo-pagamento').value;
    
    if (!metodoPagamento) {
        return mostrarNotificacao('Selecione um método de pagamento.', 'erro');
    }

    // Validação de Endereço (se for entrega)
    const inputEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
    const origemEndereco = document.querySelector('input[name="origem_endereco"]:checked')?.value || 'novo';

    // Se escolheu endereço cadastrado, valida se existe
    if (inputEntrega === 'entrega' && origemEndereco === 'cadastrado') {
        if (!usuarioAtual.endereco || usuarioAtual.endereco.trim() === '') {
            mostrarNotificacao('Perfil sem endereço. Escolha "Outro endereço".', 'erro');
            return;
        }
    }

    // Validação do FormHTML (apenas se for novo endereço)
    if (inputEntrega === 'entrega' && origemEndereco === 'novo') {
        if (!document.getElementById('checkout-form').checkValidity()) {
            return mostrarNotificacao('Preencha o endereço completo.', 'erro');
        }
    }

    // FLUXO: PIX (Abre modal especial)
    if (metodoPagamento === 'pix') {
        modalCarrinho.style.display = 'none';
        modalPix.style.display = 'block';
        return;
    }

    // FLUXO: DINHEIRO (Finaliza direto)
    finalizarPedidoReal('Dinheiro');
}

function finalizarPedidoReal(metodoPagamento) {
    // Captura dados do endereço para salvar no pedido
    const inputEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
    const origemEndereco = document.querySelector('input[name="origem_endereco"]:checked')?.value || 'novo';
    
    let enderecoFinal = 'Retirada no Balcão';
    
    if (inputEntrega === 'entrega') {
        if (origemEndereco === 'cadastrado') {
            enderecoFinal = usuarioAtual.endereco;
        } else {
            const rua = document.getElementById('endereco-rua').value;
            const numero = document.getElementById('endereco-numero').value;
            const bairro = document.getElementById('endereco-bairro').value;
            const comp = document.getElementById('endereco-complemento').value;
            enderecoFinal = `${rua}, ${numero} - ${bairro} ${comp ? '('+comp+')' : ''}`;
        }
    }

    // Objeto do Pedido
    const pedido = {
        cliente: usuarioAtual.nome,
        email: usuarioAtual.email,
        itens: [...carrinho], // Cópia do array
        total: parseFloat(totalCarrinhoSpan.textContent),
        metodo: metodoPagamento,
        endereco: enderecoFinal,
        data: new Date().toISOString()
    };

    // Salva em "Pedidos Pendentes" (Simulando envio pro servidor)
    let pendentes = JSON.parse(localStorage.getItem('soparia_pedidos_pendentes')) || [];
    pendentes.push(pedido);
    localStorage.setItem('soparia_pedidos_pendentes', JSON.stringify(pendentes));

    // Reset total
    carrinho = [];
    atualizarCarrinho();
    
    // Fecha modais
    modalCarrinho.style.display = 'none';
    modalPix.style.display = 'none';
    
    // Abre confirmação
    modalConfirmacao.style.display = 'block';
    
    // Limpa form
    document.getElementById('checkout-form').reset();
}

// --- HELPERS E UI ---

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
    const tipoEntrega = document.querySelector('input[name="tipo_entrega"]:checked').value;
    const divGrupo = document.getElementById('grupo-endereco');
    const divOpcaoSalvo = document.getElementById('opcao-endereco-salvo');
    const txtEnderecoSalvo = document.getElementById('texto-endereco-salvo');
    const divFormNovo = document.getElementById('form-novo-endereco');
    
    const inputsEndereco = [
        document.getElementById('endereco-rua'),
        document.getElementById('endereco-numero'),
        document.getElementById('endereco-bairro')
    ];

    if (tipoEntrega === 'retirada') {
        divGrupo.style.display = 'none';
        inputsEndereco.forEach(i => i.required = false);
        return;
    }

    divGrupo.style.display = 'block';

    // Verifica se usuário tem endereço salvo
    if (usuarioAtual && usuarioAtual.endereco) {
        divOpcaoSalvo.style.display = 'flex';
        txtEnderecoSalvo.textContent = `Salvo: ${usuarioAtual.endereco}`;
        
        // Vê qual radio "origem" está marcado
        const usaSalvo = document.querySelector('input[name="origem_endereco"]:checked')?.value === 'cadastrado';
        
        if (usaSalvo) {
            divFormNovo.style.display = 'none';
            txtEnderecoSalvo.style.display = 'block';
            inputsEndereco.forEach(i => i.required = false);
        } else {
            divFormNovo.style.display = 'flex';
            txtEnderecoSalvo.style.display = 'none';
            inputsEndereco.forEach(i => i.required = true);
        }
    } else {
        // Se não tem salvo, esconde a opção e força manual
        divOpcaoSalvo.style.display = 'none';
        divFormNovo.style.display = 'flex';
        inputsEndereco.forEach(i => i.required = true);
    }
}

// --- EVENT LISTENERS (CRUCIAL: NÃO REMOVA NADA DAQUI) ---

// 1. Auth Forms
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
        document.getElementById('cad-endereco').value
    );
});

// 2. Tabs Auth
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

// 3. Botões Carrinho/Perfil
document.getElementById('carrinho-btn').addEventListener('click', () => {
    modalCarrinho.style.display = 'block';
    atualizarVisibilidadeEndereco();
});

document.getElementById('btn-logout').addEventListener('click', logout);

document.getElementById('btn-atualizar-perfil').addEventListener('click', () => {
    if(usuarioAtual) {
        usuarioAtual.endereco = document.getElementById('perfil-endereco').value;
        const idx = usuarios.findIndex(u => u.email === usuarioAtual.email);
        if(idx !== -1) usuarios[idx] = usuarioAtual;
        salvarDados();
        mostrarNotificacao('Endereço atualizado!', 'sucesso');
    }
});

// 4. Fechar Modais
document.querySelectorAll('.fechar-btn, .btn-voltar').forEach(btn => {
    btn.addEventListener('click', (e) => {
        const modalId = e.currentTarget.dataset.modal;
        if(modalId) document.getElementById(modalId).style.display = 'none';
    });
});

window.onclick = (e) => {
    if (e.target.classList.contains('modal')) e.target.style.display = 'none';
};

// 5. Botões "Adicionar" do Menu (Delegação de Evento)
menuSection.addEventListener('click', (e) => {
    if (e.target.classList.contains('adicionar-btn')) {
        adicionarAoCarrinho(e.target.dataset.id);
    }
});

// 6. Botões "Remover" do Carrinho (Delegação)
listaCarrinho.addEventListener('click', (e) => {
    const btn = e.target.closest('.btn-remover');
    if (btn) {
        removerDoCarrinho(btn.dataset.id);
    }
});

// 7. Controle do Formulário Checkout (Endereço)
document.querySelectorAll('input[name="tipo_entrega"]').forEach(r => {
    r.addEventListener('change', () => {
        atualizarCarrinho();
        atualizarVisibilidadeEndereco();
    });
});

document.querySelectorAll('input[name="origem_endereco"]').forEach(r => {
    r.addEventListener('change', atualizarVisibilidadeEndereco);
});

document.getElementById('checkout-form').addEventListener('submit', iniciarProcessoCheckout);

// 8. PIX: Copiar e Enviar Comprovante
document.getElementById('btn-copiar-pix').addEventListener('click', () => {
    const codigo = document.getElementById('pix-code');
    codigo.select();
    navigator.clipboard.writeText(codigo.value);
    mostrarNotificacao('Código copiado!', 'sucesso');
});

document.getElementById('btn-enviar-comprovante').addEventListener('click', () => {
    const file = document.getElementById('comprovante-upload').files[0];
    if(!file) return mostrarNotificacao('Anexe o comprovante.', 'erro');
    
    // Finaliza com método PIX
    finalizarPedidoReal('PIX');
});

// 9. Carrossel
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

// 10. Scroll Suave Banner
document.querySelector('.hero-section').addEventListener('click', () => {
    document.getElementById('menu').scrollIntoView({ behavior: 'smooth' });
});

// INICIALIZAÇÃO
verificarSessao();
renderizarMenu();
atualizarCarrinho();
iniciarCarrossel();