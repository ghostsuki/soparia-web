// admin.js
const API_URL = '/api';

const usuario = JSON.parse(localStorage.getItem('soparia_sessao'));
if (!usuario || usuario.tipo !== 'adm') { alert('Acesso restrito.'); window.location.href = 'index.html'; }

document.querySelectorAll('.nav-btn').forEach(btn => { btn.addEventListener('click', (e) => { document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active')); document.querySelectorAll('.admin-section-view').forEach(s => s.classList.remove('active')); e.currentTarget.classList.add('active'); document.getElementById(e.currentTarget.dataset.target).classList.add('active'); atualizarViews(); }); });
document.getElementById('btn-sair-admin').addEventListener('click', () => { localStorage.removeItem('soparia_sessao'); window.location.href = 'index.html'; });

async function renderizarTabelaProdutos() {
    const tbody = document.getElementById('lista-produtos-admin');
    tbody.innerHTML = '<tr><td colspan="5">Carregando...</td></tr>';
    try {
        const res = await fetch(`${API_URL}/produtos`);
        const produtos = await res.json();
        tbody.innerHTML = '';
        produtos.forEach(item => {
            const isSoldOut = Boolean(item.esgotado);
            tbody.innerHTML += `<tr><td><img src="${item.imagem}" width="50"></td><td>${item.nome}</td><td>R$ ${parseFloat(item.preco).toFixed(2)}</td><td>${isSoldOut ? 'SOLD OUT' : 'Disponível'}</td><td><button class="btn-acao btn-editar" onclick='preencherEdicao(${JSON.stringify(item)})'>✏️</button><button class="btn-acao btn-excluir" onclick="deletarProduto(${item.id})">🗑️</button></td></tr>`;
        });
    } catch (e) { tbody.innerHTML = '<tr><td colspan="5">Erro.</td></tr>'; }
}

document.getElementById('btn-salvar-produto').addEventListener('click', async () => {
    const id = document.getElementById('edit-id').value;
    const produto = { id: id ? parseInt(id) : null, nome: document.getElementById('prod-nome').value, preco: document.getElementById('prod-preco').value, categoria: document.getElementById('prod-categoria').value, imagem: document.getElementById('prod-img').value, esgotado: document.getElementById('prod-soldout').checked };
    try { await fetch(`${API_URL}/admin/produtos`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(produto) }); alert('Salvo!'); limparForm(); renderizarTabelaProdutos(); } catch (e) { alert('Erro.'); }
});

window.deletarProduto = async (id) => { if(confirm('Excluir?')) { await fetch(`${API_URL}/admin/produtos/${id}`, { method: 'DELETE' }); renderizarTabelaProdutos(); } };
window.preencherEdicao = (item) => { document.getElementById('edit-id').value = item.id; document.getElementById('prod-nome').value = item.nome; document.getElementById('prod-preco').value = item.preco; document.getElementById('prod-img').value = item.imagem; document.getElementById('prod-soldout').checked = Boolean(item.esgotado); const select = document.getElementById('prod-categoria'); for(let i=0; i<select.options.length; i++) if(select.options[i].text === item.categoria_nome) select.selectedIndex = i; };
function limparForm() { document.getElementById('edit-id').value = ''; document.getElementById('prod-nome').value = ''; document.getElementById('prod-preco').value = ''; document.getElementById('prod-img').value = ''; document.getElementById('prod-soldout').checked = false; }

let todosPedidos = [];
async function carregarPedidos() { try { const res = await fetch(`${API_URL}/admin/pedidos`); todosPedidos = await res.json(); renderizarNotificacoes(); renderizarDashboard(); } catch (e) {} }

function renderizarNotificacoes() {
    const container = document.getElementById('lista-pedidos-pendentes');
    const pendentes = todosPedidos.filter(p => p.status === 'pendente');
    container.innerHTML = pendentes.length === 0 ? '<p>Sem novos pedidos.</p>' : '';
    pendentes.forEach(p => { container.innerHTML += `<div class="card-dashboard"><h4>Pedido #${p.id} - ${p.cliente_nome}</h4><p>R$ ${parseFloat(p.total).toFixed(2)} (${p.metodo_pagamento})</p><p>${p.endereco_entrega}</p><button class="btn-acao btn-aprovar" onclick="aprovarPedido(${p.id})">Aprovar</button></div>`; });
}
window.aprovarPedido = async (id) => { await fetch(`${API_URL}/admin/pedidos/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: 'entregue' }) }); alert('Aprovado!'); carregarPedidos(); };

function renderizarDashboard() {
    const filtro = document.getElementById('filtro-data').value;
    const vendas = todosPedidos.filter(p => p.status === 'entregue' && p.data_pedido.startsWith(filtro));
    document.getElementById('dash-total').textContent = `R$ ${vendas.reduce((acc, c) => acc + parseFloat(c.total), 0).toFixed(2)}`;
    document.getElementById('dash-qtd').textContent = vendas.length;
    document.getElementById('dash-lista-vendas').innerHTML = vendas.map(v => `<li class="carrinho-item"><span>${v.cliente_nome}</span><strong>R$ ${parseFloat(v.total).toFixed(2)}</strong></li>`).join('');
}
document.getElementById('filtro-data').value = new Date().toISOString().split('T')[0];
document.getElementById('filtro-data').addEventListener('change', renderizarDashboard);

async function renderizarUsuarios() {
    const tbody = document.getElementById('lista-usuarios-admin');
    const res = await fetch(`${API_URL}/admin/usuarios`);
    const users = await res.json();
    tbody.innerHTML = users.map(u => `<tr><td>${u.nome}</td><td>${u.email}</td><td>${u.endereco || '-'}</td><td>${u.tipo}</td></tr>`).join('');
}
function atualizarViews() { renderizarTabelaProdutos(); carregarPedidos(); renderizarUsuarios(); }
atualizarViews();