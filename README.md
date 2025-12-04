# Plano de Gerenciamento de Configuração de Software (PGCS)
**Projeto:** Soparia da Lê (Sistema de Delivery Web)  
**Versão do Documento:** 2.0 (Final)

---

## 1. Introdução
Este documento define as diretrizes para o gerenciamento de configuração do sistema "Soparia da Lê", garantindo a integridade dos artefatos de software, rastreabilidade de mudanças e reprodutibilidade do ambiente de desenvolvimento.

## 2. Identificação da Configuração

### 2.1 Estrutura do Repositório
O projeto está organizado na seguinte hierarquia de diretórios:

/ (raiz)
├── assets/                 # Imagens e recursos estáticos
│   └── qrcode.jpg          # QR Code para pagamento PIX
├── admin.html              # Interface do Painel Administrativo
├── admin.js                # Lógica do Frontend Admin (Consumo de API)
├── index.html              # Interface do Cliente (Loja)
├── script.js               # Lógica do Frontend Cliente
├── style.css               # Folhas de estilo globais
├── server.js               # API Backend (Node.js + Express)
├── package.json            # Dependências do Node.js
└── README.md               # Este documento de documentação

### 2.2 Tecnologias e Dependências
* **Frontend:** HTML5, CSS3, JavaScript (Vanilla).
* **Backend:** Node.js, Express.
* **Banco de Dados:** MySQL Community Server 8.0.
* **Dependências (NPM):** `express`, `mysql2`, `cors`.

---

## 3. Controle de Configuração

### 3.1 Estratégia de Ramificação (Branching Model)
Utilizamos uma adaptação do **Gitflow** para garantir estabilidade:

1.  **`main`**: Branch de produção. Contém apenas código estável e versões lançadas (Tags).
2.  **`develop`**: Branch de integração. Recebe todas as novas funcionalidades antes de ir para produção.
3.  **`feature/*`**: Branches temporárias para desenvolvimento (ex: `feature/integracao-backend`).
4.  **`fix/*`**: Branches para correção de bugs críticos.

### 3.2 Fluxo de Trabalho (Workflow)
1.  Criação de branch a partir da `develop` (`git checkout -b feature/nome`).
2.  Desenvolvimento e Commits locais.
3.  Envio para o repositório remoto (`git push`).
4.  Abertura de **Pull Request (PR)** para a `develop`.
5.  **Auditoria de Configuração:** Validação do PR via checklist (padrão de commits, testes manuais).
6.  Merge na `develop` e posteriormente na `main` para lançamento.

### 3.3 Versionamento (Tags)
O projeto utiliza versionamento semântico simplificado:
* **`v1.0-frontend`**: Marco zero. Apenas interface visual funcional com armazenamento local.
* **`v2.0-backend`**: Sistema completo. Integração com API Node.js e banco de dados MySQL.

---

## 4. Instruções de Instalação e Execução

Para rodar este projeto em um novo ambiente, siga os passos:

### 4.1 Banco de Dados
1.  Instale o **MySQL Server**.
2.  Execute o script SQL de criação (disponível na documentação do projeto) para criar o banco `soparia_db` e as tabelas (`usuarios`, `produtos`, `pedidos`).

### 4.2 Backend (API)
1.  Abra o terminal na pasta raiz.
2.  Instale as dependências:
    ```bash
    npm install
    ```
3.  Configure a senha do banco no arquivo `server.js`.
4.  Inicie o servidor:
    ```bash
    node server.js
    ```
    *O servidor rodará em: http://localhost:3000*

### 4.3 Frontend
1.  Abra o arquivo `index.html` ou `admin.html` em qualquer navegador moderno.
2.  **Login Admin Padrão:**
    * Email: `adm@soparia.com`
    * Senha: `08032004`

---

## 5. Auditoria e Qualidade
Todo Pull Request deve passar por uma auditoria mínima contendo:
- [x] Branch de origem correta.
- [x] Commits seguindo padrão imperativo.
- [x] Teste funcional manual realizado.
- [x] Ausência de dados sensíveis (senhas reais) no código fonte.

> Projeto auditado para a disciplina de GCS.
> Teste Subindo para a develop
> Teste 2 para enviar para o professor.
já perdi as contas de teste :D