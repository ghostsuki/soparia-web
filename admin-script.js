// Acessa o mesmo estoque SIMULADO que está no localStorage (simulando um GET do backend)
// Em um ambiente real, este JS Faria uma requisição POST/PUT para api.php para atualizar o MySQL
let estoque = JSON.parse(localStorage.getItem('estoqueSoparia')) || {
    'sopa-frango': { nome: 'Sopa de Frango com Legumes', categoria: 'Sopas e Pratos', preco: 25.00, estoque: 15, imagem: 'https://via.placeholder.com/300x180/8B4513/FFFFFF?text=Sopa+Frango' },
    'sopa-carne': { nome: 'Sopa de Carne com Mandioca', categoria: 'Sopas e Pratos', preco: 28.00, estoque: 10, imagem: 'https://via.placeholder.com/300x180/A0522D/FFFFFF?text=Sopa+Carne' },
    'sopa-mocoto': { nome: 'Sopa de Mocotó Especial', categoria: 'Sopas e Pratos', preco: 35.00, estoque: 5, imagem: 'https://via.placeholder.com/300x180/B0C4DE/FFFFFF?text=Sopa+Mocotó' },
    'lasanha': { nome: 'Lasanha à Bolonhesa (Prato)', categoria: 'Sopas e Pratos', preco: 30.00, estoque: 8, imagem: 'https://via.placeholder.com/300x180/CD5C5C/FFFFFF?text=Lasanha' },
    'suco': { nome: 'Suco Natural (Laranja/Abacaxi)', categoria: 'Bebidas', preco: 8.00, estoque: 25, imagem: 'https://via.placeholder.com/300x180/FFA500/FFFFFF?text=Suco' },
    'refri': { nome: 'Refrigerante Lata (Diversos)', categoria: 'Bebidas', preco: 7.00, estoque: 30, imagem: 'https://via.placeholder.com/300x180/00CED1/FFFFFF?text=Refrigerante' },
    'torta': { nome: 'Fatia de Torta Holandesa', categoria: 'Sobremesas', preco: 12.00, estoque: 12, imagem: 'https://via.placeholder.com/300x180/D2B48C/FFFFFF?text=Torta' },
    'bolo': { nome: 'Bolo de Chocolate Vulcão', categoria: 'Sobremesas', preco: 15.00, estoque: 9, imagem: 'https://via.placeholder.com/300x180/8B4513/FFFFFF?text=Bolo' },
};

const listaEstoque = document.getElementById('lista-estoque');
const mensagemAdm = document.getElementById('mensagem-adm');

function salvarEstoque() {
    // Simula o POST/PUT para o backend (salvando no LocalStorage para persistir no front)
    localStorage.setItem('estoqueSoparia', JSON.stringify(estoque));
}

function renderizarEstoque() {
    listaEstoque.innerHTML = '';
    
    for (const [id, item] of Object.entries(estoque)) {
        const div = document.createElement('div');
        div.classList.add('admin-item');
        div.innerHTML = `
            <img src="${item.imagem}" alt="${item.nome}" style="width: 50px; height: 30px; object-fit: cover; border-radius: 4px; margin-right: 10px;">
            <span>${item.nome} (${item.categoria}) - Preço: R$ ${item.preco.toFixed(2)} - **Estoque Atual: ${item.estoque}**</span>
            <input type="number" id="input-${id}" value="${item.estoque}" min="0">
            <button data-id="${id}" onclick="atualizarEstoque('${id}')">Salvar</button>
        `;
        listaEstoque.appendChild(div);
    }
}

window.atualizarEstoque = function(id) {
    const input = document.getElementById(`input-${id}`);
    const novoEstoque = parseInt(input.value);

    if (isNaN(novoEstoque) || novoEstoque < 0) {
        alert('Por favor, insira um número válido.');
        return;
    }

    // Atualiza o estoque e salva (simulação de PUT)
    estoque[id].estoque = novoEstoque;
    salvarEstoque();

    mensagemAdm.textContent = `Estoque de ${estoque[id].nome} atualizado para ${novoEstoque}.`;
    setTimeout(() => { mensagemAdm.textContent = ''; }, 3000);
    renderizarEstoque(); // Opcional, para garantir a atualização visual
}

document.getElementById('adicionar-form').addEventListener('submit', function(e) {
    e.preventDefault();
    const nome = document.getElementById('novo-nome').value;
    const categoria = document.getElementById('nova-categoria').value;
    const preco = parseFloat(document.getElementById('novo-preco').value);
    const inicial = parseInt(document.getElementById('novo-estoque').value);
    const imagem = document.getElementById('nova-imagem').value;

    if (isNaN(preco) || preco < 0 || isNaN(inicial) || inicial < 0) {
        alert('Por favor, insira valores válidos para preço e estoque.');
        return;
    }

    const novoId = nome.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-'); // Sanitiza o ID
    
    if (estoque[novoId]) {
        alert('Item com este nome já existe. Use a função de atualizar.');
        return;
    }

    // Cria um novo item (simulação de POST)
    estoque[novoId] = { 
        nome: nome, 
        categoria: categoria,
        preco: preco,
        estoque: inicial,
        imagem: imagem
    };
    salvarEstoque();

    mensagemAdm.textContent = `${nome} adicionado com ${inicial} unidades.`;
    // Limpa o formulário
    document.getElementById('novo-nome').value = '';
    document.getElementById('nova-categoria').value = '';
    document.getElementById('novo-preco').value = '';
    document.getElementById('novo-estoque').value = '';
    document.getElementById('nova-imagem').value = ''; // Linha completada
    
    setTimeout(() => { mensagemAdm.textContent = ''; }, 3000);
    renderizarEstoque();
});

// Garante que o estoque inicial seja salvo na primeira vez e inicializa a renderização
if (!localStorage.getItem('estoqueSoparia')) {
    salvarEstoque();
}

renderizarEstoque();