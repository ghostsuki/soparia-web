// admin.js - VERSÃO INTEGRADA COM API

const API_URL = 'http://localhost:3000/api';

// 1. SEGURANÇA
const usuario = JSON.parse(localStorage.getItem('soparia_sessao'));
if (!usuario || usuario.tipo !== 'adm') {
    alert('Acesso restrito.');
    window.location.href = 'index.html';
}

// 2. NAVEGAÇÃO
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-section-view').forEach(s => s.classList.remove('active'));
        e.currentTarget.classList.add('active');
        document.getElementById(e.currentTarget.dataset.target).classList.add('active');
        atualizarViews();
    });
});

document.getElementById('btn-sair-admin').addEventListener('click', () => {
    localStorage.removeItem('soparia_sessao');
    window.location.href = 'index.html';
});

// --- FUNÇÕES DE API ---

// 1. MENU (PRODUTOS)
async function renderizarTabelaProdutos() {
    const tbody = document.getElementById('lista-produtos-admin');
    tbody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    
    try {
        const res = await fetch(`${API_URL}/produtos`);
        const produtos = await res.json();
        
        tbody.innerHTML = '';
        produtos.forEach(item => {
            const isSoldOut = Boolean(item.esgotado);
            const status = isSoldOut ? '<span class="sold-out-box">SOLD OUT</span>' : '<span style="color:green">Disponível</span>';
            
            tbody.innerHTML += `
                <tr>
                    <td><img src="${item.imagem}" width="50" height="30" style="object-fit:cover;"></td>
                    <td>${item.nome}</td>
                    <td>R$ ${parseFloat(item.preco).toFixed(2)}</td>
                    <td>${status}</td>
                    <td>
                        <button class="btn-acao btn-editar" onclick='preencherEdicao(${JSON.stringify(item)})'><i class="bi bi-pencil"></i></button>
                        <button class="btn-acao btn-excluir" onclick="deletarProduto(${item.id})"><i class="bi bi-trash"></i></button>
                    </td>
                </tr>
            `;
        });
    } catch (e) {
        console.error(e);
        tbody.innerHTML = '<tr><td colspan="5" style="color:red">Erro ao carregar produtos.</td></tr>';
    }
}

document.getElementById('btn-salvar-produto').addEventListener('click', async () => {
    const id = document.getElementById('edit-id').value;
    const produto = {
        id: id ? parseInt(id) : null,
        nome: document.getElementById('prod-nome').value,
        preco: document.getElementById('prod-preco').value,
        categoria: document.getElementById('prod-categoria').value,
        imagem: document.getElementById('prod-img').value,
        esgotado: document.getElementById('prod-soldout').checked
    };

    try {
        const res = await fetch(`${API_URL}/admin/produtos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(produto)
        });
        if (res.ok) {
            alert('Produto salvo!');
            limparForm();
            renderizarTabelaProdutos();
        } else {
            alert('Erro ao salvar.');
        }
    } catch (e) { alert('Erro de conexão.'); }
});

window.deletarProduto = async (id) => {
    if (!confirm('Excluir este item permanentemente?')) return;
    try {
        await fetch(`${API_URL}/admin/produtos/${id}`, { method: 'DELETE' });
        renderizarTabelaProdutos();
    } catch (e) { alert('Erro ao excluir.'); }
};

window.preencherEdicao = (item) => {
    document.getElementById('edit-id').value = item.id;
    document.getElementById('prod-nome').value = item.nome;
    document.getElementById('prod-preco').value = item.preco;
    document.getElementById('prod-img').value = item.imagem;
    document.getElementById('prod-soldout').checked = Boolean(item.esgotado);
    // Seleciona categoria no select (precisa mapear nome)
    const select = document.getElementById('prod-categoria');
    for (let i=0; i<select.options.length; i++) {
        if (select.options[i].text === item.categoria_nome) select.selectedIndex = i;
    }
    document.querySelector('.card-dashboard').scrollIntoView({behavior:'smooth'});
};

function limparForm() {
    document.getElementById('edit-id').value = '';
    document.getElementById('prod-nome').value = '';
    document.getElementById('prod-preco').value = '';
    document.getElementById('prod-img').value = '';
    document.getElementById('prod-soldout').checked = false;
}

// 2. PEDIDOS E NOTIFICAÇÕES
let todosPedidos = []; // Cache para dashboard

async function carregarPedidos() {
    try {
        const res = await fetch(`${API_URL}/admin/pedidos`);
        todosPedidos = await res.json();
        renderizarNotificacoes();
        renderizarDashboard();
    } catch (e) { console.error('Erro pedidos', e); }
}

function renderizarNotificacoes() {
    const container = document.getElementById('lista-pedidos-pendentes');
    // Filtra apenas os pendentes
    const pendentes = todosPedidos.filter(p => p.status === 'pendente');
    
    container.innerHTML = '';
    if (pendentes.length === 0) {
        container.innerHTML = '<p style="padding:20px; text-align:center;">Sem novos pedidos.</p>';
        return;
    }

    pendentes.forEach(p => {
        const card = document.createElement('div');
        card.className = 'card-dashboard';
        card.innerHTML = `
            <h4>Pedido #${p.id} - ${p.cliente_nome}</h4>
            <p><strong>Valor:</strong> R$ ${parseFloat(p.total).toFixed(2)} (${p.metodo_pagamento})</p>
            <p><strong>Endereço:</strong> ${p.endereco_entrega}</p>
            <small>${new Date(p.data_pedido).toLocaleString()}</small>
            <button class="btn-acao btn-aprovar" style="width:100%; margin-top:10px;" onclick="aprovarPedido(${p.id})">
                <i class="bi bi-check-circle"></i> Aprovar / Entregar
            </button>
        `;
        container.appendChild(card);
    });
}

window.aprovarPedido = async (id) => {
    try {
        await fetch(`${API_URL}/admin/pedidos/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'entregue' })
        });
        alert('Pedido marcado como entregue!');
        carregarPedidos(); // Recarrega listas
    } catch (e) { alert('Erro ao atualizar status.'); }
};

// 3. DASHBOARD
function renderizarDashboard() {
    const dataFiltro = document.getElementById('filtro-data').value;
    
    // Filtra pedidos entregues na data selecionada
    const vendas = todosPedidos.filter(p => {
        const dataP = p.data_pedido.split('T')[0];
        return p.status === 'entregue' && dataP === dataFiltro;
    });

    const total = vendas.reduce((acc, curr) => acc + parseFloat(curr.total), 0);
    
    document.getElementById('dash-total').textContent = `R$ ${total.toFixed(2)}`;
    document.getElementById('dash-qtd').textContent = vendas.length;

    const lista = document.getElementById('dash-lista-vendas');
    lista.innerHTML = '';
    vendas.forEach(v => {
        lista.innerHTML += `
            <li class="carrinho-item">
                <span>${v.cliente_nome}</span>
                <strong>R$ ${parseFloat(v.total).toFixed(2)}</strong>
            </li>`;
    });
}

document.getElementById('filtro-data').value = new Date().toISOString().split('T')[0];
document.getElementById('filtro-data').addEventListener('change', renderizarDashboard);

// 4. USUÁRIOS
async function renderizarUsuarios() {
    const tbody = document.getElementById('lista-usuarios-admin');
    try {
        const res = await fetch(`${API_URL}/admin/usuarios`);
        const users = await res.json();
        
        tbody.innerHTML = '';
        users.forEach(u => {
            tbody.innerHTML += `
                <tr>
                    <td>${u.nome}</td>
                    <td>${u.email}</td>
                    <td>${u.endereco || '-'}</td>
                    <td>${u.tipo}</td>
                </tr>`;
        });
    } catch (e) { console.error(e); }
}

// Inicialização
function atualizarViews() {
    renderizarTabelaProdutos();
    carregarPedidos();
    renderizarUsuarios();
}

atualizarViews();