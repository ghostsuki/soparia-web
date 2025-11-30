// admin.js

// 1. VERIFICAÇÃO DE SEGURANÇA
const usuario = JSON.parse(localStorage.getItem('soparia_sessao'));
if (!usuario || usuario.tipo !== 'adm') {
    alert('Acesso negado. Faça login como administrador.');
    window.location.href = 'index.html';
}

// 2. CARREGAMENTO DE DADOS
let estoque = JSON.parse(localStorage.getItem('soparia_estoque')) || {};
let pedidosPendentes = JSON.parse(localStorage.getItem('soparia_pedidos_pendentes')) || [];
let historicoVendas = JSON.parse(localStorage.getItem('soparia_historico_vendas')) || [];
let usuarios = JSON.parse(localStorage.getItem('soparia_usuarios')) || [];

// 3. NAVEGAÇÃO (TABS DA SIDEBAR)
document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
        // Remove classe ativa de todos
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.admin-section-view').forEach(s => s.classList.remove('active'));
        
        // Ativa o clicado
        e.currentTarget.classList.add('active'); // Use currentTarget para pegar o botão, não o ícone
        const targetId = e.currentTarget.dataset.target;
        document.getElementById(targetId).classList.add('active');
        
        atualizarViews();
    });
});

document.getElementById('btn-sair-admin').addEventListener('click', () => {
    localStorage.removeItem('soparia_sessao');
    window.location.href = 'index.html';
});

// --- SEÇÃO 1: GESTÃO DE MENU ---

function renderizarTabelaProdutos() {
    const tbody = document.getElementById('lista-produtos-admin');
    tbody.innerHTML = '';
    
    for (const [id, item] of Object.entries(estoque)) {
        const tr = document.createElement('tr');
        const status = item.esgotado ? '<span class="sold-out-box">SOLD OUT</span>' : '<span style="color:green">Disponível</span>';
        
        tr.innerHTML = `
            <td><img src="${item.imagem}" width="50" height="30" style="object-fit:cover; border-radius:4px;"></td>
            <td>${item.nome}</td>
            <td>R$ ${item.preco.toFixed(2)}</td>
            <td>${status}</td>
            <td>
                <button class="btn-acao btn-editar" onclick="editarProduto('${id}')"><i class="bi bi-pencil"></i></button>
                <button class="btn-acao btn-excluir" onclick="removerProduto('${id}')"><i class="bi bi-trash"></i></button>
            </td>
        `;
        tbody.appendChild(tr);
    }
}

document.getElementById('btn-salvar-produto').addEventListener('click', () => {
    // Gera ID se não existir (Edição vs Novo)
    const idExistente = document.getElementById('edit-id').value;
    const id = idExistente ? idExistente : 'prod-' + Date.now();
    
    const nome = document.getElementById('prod-nome').value;
    const preco = parseFloat(document.getElementById('prod-preco').value);
    
    if(!nome || isNaN(preco)) return alert('Preencha nome e preço!');

    const produto = {
        nome: nome,
        preco: preco,
        categoria: document.getElementById('prod-categoria').value,
        imagem: document.getElementById('prod-img').value || 'https://via.placeholder.com/150',
        esgotado: document.getElementById('prod-soldout').checked,
        estoque: 999 // Ignorado, usamos booleano
    };

    estoque[id] = produto;
    localStorage.setItem('soparia_estoque', JSON.stringify(estoque));
    alert('Produto Salvo com Sucesso!');
    limparFormProduto();
    renderizarTabelaProdutos();
});

// Funções globais para serem chamadas pelo HTML onclick
window.editarProduto = (id) => {
    const item = estoque[id];
    if(item) {
        document.getElementById('edit-id').value = id;
        document.getElementById('prod-nome').value = item.nome;
        document.getElementById('prod-preco').value = item.preco;
        document.getElementById('prod-categoria').value = item.categoria;
        document.getElementById('prod-img').value = item.imagem;
        document.getElementById('prod-soldout').checked = item.esgotado === true;
        
        // Scroll para o form
        document.querySelector('.card-dashboard').scrollIntoView({behavior: 'smooth'});
    }
};

window.removerProduto = (id) => {
    if(confirm('Tem certeza que deseja excluir este item?')) {
        delete estoque[id];
        localStorage.setItem('soparia_estoque', JSON.stringify(estoque));
        renderizarTabelaProdutos();
    }
};

function limparFormProduto() {
    document.getElementById('edit-id').value = '';
    document.getElementById('prod-nome').value = '';
    document.getElementById('prod-preco').value = '';
    document.getElementById('prod-img').value = '';
    document.getElementById('prod-soldout').checked = false;
}

// --- SEÇÃO 2: NOTIFICAÇÕES (PEDIDOS) ---

function renderizarNotificacoes() {
    const container = document.getElementById('lista-pedidos-pendentes');
    container.innerHTML = '';
    
    if (pedidosPendentes.length === 0) {
        container.innerHTML = '<p style="padding:20px; text-align:center; color:#666;">Nenhum pedido pendente no momento.</p>';
        return;
    }

    pedidosPendentes.forEach((pedido, index) => {
        const card = document.createElement('div');
        card.className = 'card-dashboard';
        
        let listaItensHTML = pedido.itens.map(i => `<li>${i.quantidade}x ${i.nome}</li>`).join('');
        
        card.innerHTML = `
            <div style="border-bottom:1px solid #eee; padding-bottom:10px; margin-bottom:10px;">
                <h4>Pedido #${index + 1}</h4>
                <small>${new Date(pedido.data).toLocaleString()}</small>
            </div>
            <p><strong>Cliente:</strong> ${pedido.cliente} (${pedido.email})</p>
            <p><strong>Endereço:</strong> ${pedido.endereco}</p>
            <p><strong>Total:</strong> R$ ${pedido.total.toFixed(2)} via <strong>${pedido.metodo}</strong></p>
            
            <div style="background:#f9f9f9; padding:10px; margin:10px 0; border-radius:5px;">
                <strong>Itens:</strong>
                <ul style="padding-left:20px; margin:5px 0;">${listaItensHTML}</ul>
            </div>

            <div style="margin-top: 10px; padding: 10px; background: #e3f2fd; border-radius:5px; text-align:center;">
                <i class="bi bi-file-earmark-image"></i> 
                <strong>Comprovante:</strong> <span style="color: blue;">Visualizar (Simulado)</span>
            </div>
            
            <button class="btn-acao btn-aprovar" style="margin-top: 15px; width: 100%; padding:10px;" onclick="aprovarPedido(${index})">
                <i class="bi bi-check-circle-fill"></i> Confirmar Entrega
            </button>
        `;
        container.appendChild(card);
    });
}

window.aprovarPedido = (index) => {
    const pedido = pedidosPendentes[index];
    
    // Normaliza a data para string YYYY-MM-DD para facilitar filtro
    pedido.dataFiltro = new Date().toISOString().split('T')[0]; 
    
    historicoVendas.push(pedido);
    pedidosPendentes.splice(index, 1); // Remove dos pendentes
    
    localStorage.setItem('soparia_pedidos_pendentes', JSON.stringify(pedidosPendentes));
    localStorage.setItem('soparia_historico_vendas', JSON.stringify(historicoVendas));
    
    alert('Pedido aprovado e arquivado no histórico!');
    renderizarNotificacoes();
};

// --- SEÇÃO 3: DASHBOARD ---

function renderizarDashboard() {
    const dataFiltro = document.getElementById('filtro-data').value;
    if (!dataFiltro) return;

    // Filtra vendas pela data (ou dataFiltro salva, ou substring da data ISO)
    const vendasDoDia = historicoVendas.filter(v => {
        const dataVenda = v.dataFiltro || v.data.split('T')[0];
        return dataVenda === dataFiltro;
    });
    
    const total = vendasDoDia.reduce((acc, curr) => acc + curr.total, 0);
    const qtdPedidos = vendasDoDia.length;

    document.getElementById('dash-total').textContent = `R$ ${total.toFixed(2)}`;
    document.getElementById('dash-qtd').textContent = qtdPedidos;

    const lista = document.getElementById('dash-lista-vendas');
    lista.innerHTML = '';
    
    if(vendasDoDia.length === 0) {
        lista.innerHTML = '<p>Sem vendas nesta data.</p>';
    } else {
        vendasDoDia.forEach(v => {
            lista.innerHTML += `
            <li class="carrinho-item" style="border-bottom:1px solid #eee; padding:10px 0;">
                <div>
                    <strong>${v.cliente}</strong><br>
                    <small>${v.metodo}</small>
                </div>
                <div style="font-weight:bold; color:var(--cor-principal);">R$ ${v.total.toFixed(2)}</div>
            </li>`;
        });
    }
}

// Configura data de hoje como padrão
const hoje = new Date().toISOString().split('T')[0];
document.getElementById('filtro-data').value = hoje;
document.getElementById('filtro-data').addEventListener('change', renderizarDashboard);

// --- SEÇÃO 4: USUÁRIOS ---

function renderizarUsuarios() {
    const tbody = document.getElementById('lista-usuarios-admin');
    tbody.innerHTML = '';
    
    usuarios.forEach(u => {
        tbody.innerHTML += `
            <tr>
                <td>${u.nome}</td>
                <td>${u.email}</td>
                <td>${u.endereco ? u.endereco : '<span style="color:#999">Não cadastrado</span>'}</td>
                <td>${u.tipo === 'adm' ? '<strong>ADMIN</strong>' : 'Cliente'}</td>
            </tr>
        `;
    });
}

// --- INICIALIZAÇÃO ---
function atualizarViews() {
    renderizarTabelaProdutos();
    renderizarNotificacoes();
    renderizarDashboard();
    renderizarUsuarios();
}

// Chama na carga da página
atualizarViews();