// script.js - VERSÃO COM INTEGRAÇÃO DE API (BACKEND)

// Configuração da API
const API_URL = 'http://localhost:3000/api';

// Estado Global
let usuarioAtual = JSON.parse(localStorage.getItem('soparia_sessao')) || null; // Sessão mantém no local para persistência rápida
let carrinho = [];
const TAXA_ENTREGA = 3.00;

// Elementos DOM
const menuSection = document.getElementById('menu-content'); // Atenção ao ID no HTML
const listaCarrinho = document.getElementById('lista-carrinho');
const totalCarrinhoSpan = document.getElementById('total-carrinho');
const contadorCarrinhoSpan = document.getElementById('contador-carrinho');
const modalCarrinho = document.getElementById('modal-carrinho');
const modalConfirmacao = document.getElementById('modal-confirmacao');
const modalPix = document.getElementById('modal-pix');
const toastContainer = document.getElementById('toast-container');
const btnLoginPerfil = document.getElementById('btn-login-perfil');
const textoLogin = document.getElementById('texto-login');

// --- 1. RENDERIZAÇÃO DO MENU (VIA API) ---
async function renderizarMenu() {
    try {
        const response = await fetch(`${API_URL}/produtos`);
        const produtos = await response.json();

        // Agrupamento por Categoria
        const menuAgrupado = {};
        produtos.forEach(item => {
            // O JOIN no SQL retorna categoria_nome, vamos usar isso
            const cat = item.categoria_nome || 'Outros'; 
            if (!menuAgrupado[cat]) menuAgrupado[cat] = [];
            menuAgrupado[cat].push(item);
        });

        // Limpa e Renderiza (igual ao anterior, mas com dados do banco)
        menuSection.innerHTML = '';
        const navContainer = document.getElementById('menu-nav');
        if(navContainer) navContainer.innerHTML = '';

        for (const [categoria, itens] of Object.entries(menuAgrupado)) {
            const catId = 'cat-' + categoria.replace(/\s+/g, '-').toLowerCase();

            // Botão Nav
            if(navContainer) {
                const btn = document.createElement('button');
                btn.className = 'cat-btn';
                btn.textContent = categoria;
                btn.onclick = () => document.getElementById(catId).scrollIntoView({ behavior: 'smooth', block: 'center' });
                navContainer.appendChild(btn);
            }

            // Título
            const h3 = document.createElement('h3');
            h3.className = 'categoria-titulo';
            h3.id = catId;
            h3.textContent = categoria;
            menuSection.appendChild(h3);

            // Grid
            const grid = document.createElement('div');
            grid.className = 'menu-grid';
            menuSection.appendChild(grid);

            itens.forEach(item => {
                const card = document.createElement('div');
                card.className = 'produto-card';
                // Converte booleano do MySQL (0 ou 1) para true/false
                const isSoldOut = Boolean(item.esgotado);
                
                card.innerHTML = `
                    <img src="${item.imagem}" class="produto-imagem" style="${isSoldOut ? 'filter: grayscale(100%); opacity:0.7' : ''}" alt="${item.nome}">
                    <div class="produto-info">
                        <div>
                            <h4 class="produto-nome">${item.nome}</h4>
                            <p class="produto-descricao">${item.descricao || 'Delicioso item do cardápio.'}</p>
                        </div>
                        <div>
                            <div class="produto-footer">
                                <span class="produto-preco">R$ ${parseFloat(item.preco).toFixed(2)}</span>
                                <span class="produto-estoque ${isSoldOut ? 'esgotado' : 'disponivel'}">${isSoldOut ? 'Esgotado' : 'Disponível'}</span>
                            </div>
                            <button class="adicionar-btn" onclick="adicionarAoCarrinho(${item.id}, '${item.nome}', ${item.preco}, ${isSoldOut})" ${isSoldOut ? 'disabled' : ''}>
                                ${isSoldOut ? 'SOLD OUT' : '➕ Adicionar'}
                            </button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    } catch (error) {
        console.error('Erro ao carregar menu:', error);
        menuSection.innerHTML = '<p style="text-align:center; color:red">Erro ao carregar cardápio. Verifique se o servidor está rodando.</p>';
    }
}

// --- 2. AUTH (VIA API) ---
async function login(email, senha) {
    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, senha })
        });
        const data = await response.json();

        if (data.success) {
            usuarioAtual = data.user;
            localStorage.setItem('soparia_sessao', JSON.stringify(usuarioAtual));
            
            if (usuarioAtual.tipo === 'adm') window.location.href = 'admin.html';
            else {
                verificarSessao();
                document.getElementById('modal-login').style.display = 'none';
                mostrarNotificacao(`Bem-vindo, ${usuarioAtual.nome.split(' ')[0]}!`, 'sucesso');
            }
        } else {
            mostrarNotificacao(data.message || 'Erro no login', 'erro');
        }
    } catch (error) {
        mostrarNotificacao('Erro de conexão com o servidor.', 'erro');
    }
}

async function cadastrar(nome, email, senha, rua, num, bairro, comp) {
    if (senha.length < 8) return mostrarNotificacao('Senha deve ter mín. 8 caracteres.', 'erro');
    
    const enderecoCompleto = `${rua}, ${num} - ${bairro} ${comp ? '('+comp+')' : ''}`;

    try {
        const response = await fetch(`${API_URL}/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nome, email, senha, endereco: enderecoCompleto })
        });
        const data = await response.json();

        if (data.success) {
            mostrarNotificacao('Conta criada! Faça login.', 'sucesso');
            // Opcional: Já logar direto
            login(email, senha);
        } else {
            mostrarNotificacao(data.message || 'Erro ao cadastrar.', 'erro');
        }
    } catch (error) {
        mostrarNotificacao('Erro de conexão.', 'erro');
    }
}

function verificarSessao() {
    if (usuarioAtual) {
        textoLogin.textContent = `Olá, ${usuarioAtual.nome.split(' ')[0]}`;
        if (usuarioAtual.tipo === 'adm') {
            btnLoginPerfil.onclick = () => window.location.href = 'admin.html';
            textoLogin.textContent = "Painel Admin";
        } else {
            btnLoginPerfil.onclick = () => {
                document.getElementById('perfil-nome').textContent = usuarioAtual.nome;
                document.getElementById('perfil-email').textContent = usuarioAtual.email;
                document.getElementById('perfil-endereco').value = usuarioAtual.endereco || '';
                document.getElementById('modal-perfil').style.display = 'block';
            };
        }
        const emailInput = document.getElementById('email-cliente');
        if(emailInput) emailInput.value = usuarioAtual.email;
    } else {
        textoLogin.textContent = 'Entrar';
        btnLoginPerfil.onclick = () => document.getElementById('modal-login').style.display = 'block';
    }
}

function logout() {
    usuarioAtual = null;
    localStorage.removeItem('soparia_sessao');
    verificarSessao();
    document.getElementById('modal-perfil').style.display = 'none';
    mostrarNotificacao('Saiu da conta.', 'info');
}

// --- 3. CARRINHO (LOCAL) ---
// O carrinho continua local até a hora de fechar a compra
function atualizarCarrinho() {
    listaCarrinho.innerHTML = '';
    const inputEntrega = document.querySelector('input[name="tipo_entrega"]:checked');
    const tipoEntrega = inputEntrega ? inputEntrega.value : 'entrega';
    let total = 0;
    let totalItens = 0;

    if (carrinho.length === 0) listaCarrinho.innerHTML = '<li style="text-align:center; padding:20px;">Vazio...</li>';
    else {
        carrinho.forEach(item => {
            const li = document.createElement('li');
            li.classList.add('carrinho-item');
            li.innerHTML = `
                <div class="item-info"><div class="item-nome">${item.quantidade}x ${item.nome}</div></div>
                <div class="item-acoes">
                    <span class="item-preco">R$ ${(item.preco * item.quantidade).toFixed(2)}</span>
                    <button class="btn-remover" onclick="removerDoCarrinho(${item.id})"><i class="bi bi-trash"></i></button>
                </div>`;
            listaCarrinho.appendChild(li);
            total += item.preco * item.quantidade;
            totalItens += item.quantidade;
        });
    }

    if (tipoEntrega === 'entrega' && total > 0) total += TAXA_ENTREGA;
    totalCarrinhoSpan.textContent = total.toFixed(2);
    if(contadorCarrinhoSpan) contadorCarrinhoSpan.textContent = totalItens;
}

// Nota: A função adicionar agora recebe parametros diretos do HTML gerado
function adicionarAoCarrinho(id, nome, preco, esgotado) {
    if (esgotado) return mostrarNotificacao('Item esgotado.', 'erro');

    const itemExistente = carrinho.find(item => item.id === id);
    if (itemExistente) itemExistente.quantidade++;
    else carrinho.push({ id, nome, preco: parseFloat(preco), quantidade: 1 });
    
    atualizarCarrinho();
    mostrarNotificacao(`${nome} adicionado!`, 'sucesso');
}

window.removerDoCarrinho = (id) => {
    carrinho = carrinho.filter(item => item.id !== id);
    atualizarCarrinho();
};

// --- 4. CHECKOUT (ENVIA PARA O BANCO) ---
async function finalizarPedidoReal(metodo) {
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

    const pedidoData = {
        usuario_id: usuarioAtual.id,
        total: parseFloat(totalCarrinhoSpan.textContent),
        metodo: metodo,
        endereco: endFinal,
        itens: carrinho
    };

    try {
        const response = await fetch(`${API_URL}/pedidos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(pedidoData)
        });
        const result = await response.json();

        if (result.success) {
            carrinho = [];
            atualizarCarrinho();
            modalCarrinho.style.display = 'none';
            modalPix.style.display = 'none';
            modalConfirmacao.style.display = 'block';
            document.getElementById('checkout-form').reset();
        } else {
            mostrarNotificacao('Erro ao processar pedido.', 'erro');
        }
    } catch (error) {
        mostrarNotificacao('Erro de conexão ao finalizar.', 'erro');
    }
}

// Listener Wrapper para Finalizar
function iniciarProcessoCheckout(e) {
    e.preventDefault();
    if (!usuarioAtual) {
        modalCarrinho.style.display = 'none';
        document.getElementById('modal-login').style.display = 'block';
        return mostrarNotificacao('Faça login para continuar.', 'erro');
    }
    if (carrinho.length === 0) return mostrarNotificacao('Carrinho vazio!', 'info');

    const metodo = document.getElementById('metodo-pagamento').value;
    if (metodo === 'pix') {
        modalCarrinho.style.display = 'none';
        modalPix.style.display = 'block';
    } else {
        finalizarPedidoReal('Dinheiro');
    }
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