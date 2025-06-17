# Node.js API Demo – IAM (AWS-like)

## Visão Geral

Esta API é um sistema completo de gerenciamento de usuários, grupos, roles, policies e permissions, inspirado no padrão AWS IAM. Ela implementa autenticação JWT, controle de acesso baseado em roles/policies, ownership/administração, CRUD completo para todos os recursos e documentação Swagger.

- **Padrão:** Model-Service-Controller
- **Segurança:** JWT, Helmet, CORS, validação
- **IAM:** Root, Admin, User, Groups, Policies, Permissions
- **Ownership:** Admin só gerencia entidades criadas por ele
- **Testes:** Unitários e integração (Jest + Supertest)
- **Documentação:** Swagger em `/docs`

## Recursos e Conceitos

- **User:** Usuário autenticável, pode ser root, admin ou user comum.
- **Role:** Papel atribuído a usuários ou grupos (ex: Root, Admin, User).
- **Policy:** Documento JSON (IAM-like) que define ações e recursos permitidos.
- **Permission:** Permissão atômica (ex: `user:create`, `group:delete`).
- **Group:** Agrupamento de usuários, pode receber roles/policies/permissions.

## IAM (Inspiração AWS)
- **Root:** Pode tudo, tem policy `RootFullAccess` (`Action: *`, `Resource: *`).
- **Admin:** Gerencia apenas entidades criadas por ele.
- **User:** Só pode ler seus próprios dados e grupos.
- **Ownership:** Garantido via campo `createdBy`.
- **Policies:** São documentos JSON no padrão AWS, exemplo:
  ```json
  {
    "Version": "2025-06-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": ["user:create", "user:read"],
        "Resource": ["*"]
      }
    ]
  }
  ```
- **Permissions:** São strings atômicas, ex: `user:create`, `group:delete`.

## Endpoints Principais

### Autenticação
- `POST /api/auth/login` – Login (email, password) → JWT
- `POST /api/auth/register` – Cadastro de usuário (admin pode criar outros)

### Usuários
- `GET /api/users` – Listar usuários (Root: todos, Admin: só os seus)
- `GET /api/users/:id` – Detalhe de usuário
- `POST /api/users` – Criar usuário (Root/Admin)
- `PUT /api/users/:id` – Atualizar usuário
- `DELETE /api/users/:id` – Remover usuário
- `GET /api/users/me/roles` – Roles do usuário autenticado
- `GET /api/users/me/permissions` – Permissions do usuário autenticado
- `GET /api/users/me/policies` – Policies do usuário autenticado
- `GET /api/users/me/groups` – Grupos do usuário autenticado
- `POST /api/users/:id/roles` – Atribuir role a usuário
- `POST /api/users/:id/permissions` – Atribuir permission a usuário
- `POST /api/users/:id/policies` – Atribuir policy a usuário

### Roles
- `GET /api/roles` – Listar roles
- `POST /api/roles` – Criar role
- `PUT /api/roles/:id` – Atualizar role
- `DELETE /api/roles/:id` – Remover role

### Policies
- `GET /api/policies` – Listar policies (inclui permissions)
- `GET /api/policies/:id` – Detalhe de policy (inclui permissions)
- `POST /api/policies` – Criar policy
- `PUT /api/policies/:id` – Atualizar policy
- `DELETE /api/policies/:id` – Remover policy

### Permissions
- `GET /api/permissions` – Listar permissions
- `POST /api/permissions` – Criar permission
- `PUT /api/permissions/:id` – Atualizar permission
- `DELETE /api/permissions/:id` – Remover permission

### Grupos
- `GET /api/groups` – Listar grupos
- `POST /api/groups` – Criar grupo
- `PUT /api/groups/:id` – Atualizar grupo
- `DELETE /api/groups/:id` – Remover grupo
- `POST /api/groups/:id/users` – Adicionar usuário ao grupo
- `POST /api/groups/:id/roles` – Atribuir role ao grupo
- `POST /api/groups/:id/policies` – Atribuir policy ao grupo
- `POST /api/groups/:id/permissions` – Atribuir permission ao grupo

## Instalação e Configuração

1. **Clone o repositório:**
   ```bash
   git clone <repo-url>
   cd nodejs-api-demo
   ```
2. **Instale as dependências:**
   ```bash
   npm install
   ```
3. **Configure o banco de dados:**
   - Edite `config/config.json` com as credenciais do seu PostgreSQL.
4. **Rode as migrations:**
   ```bash
   npx sequelize-cli db:migrate
   ```
5. **Rode o seed para criar root/admin/policies/permissions:**
   ```bash
   node src/scripts/seed-root-admin.js
   ```
6. **Inicie a aplicação:**
   ```bash
   npm start
   ```
7. **Acesse a documentação Swagger:**
   - http://localhost:3000/docs

## Usuários Padrão
- **Root:**
  - Email: `root@system.local`
  - Senha: `rootpassword`
- **Admin:**
  - Email: `admin@system.local`
  - Senha: `adminpassword`

## Exemplos de Requisição

### Login
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"root@system.local","password":"rootpassword"}'
```

### Listar policies (com JWT)
```bash
curl -X GET http://localhost:3000/api/policies \
  -H "Authorization: Bearer <SEU_TOKEN_AQUI>"
```

### Criar policy customizada
```bash
curl -X POST http://localhost:3000/api/policies \
  -H "Authorization: Bearer <SEU_TOKEN_AQUI>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PolicyUserReadOnly",
    "document": {
      "Version": "2025-06-17",
      "Statement": [{
        "Effect": "Allow",
        "Action": ["user:read"],
        "Resource": ["*"]
      }]
    }
  }'
```

## ⚡️ Atualização IAM: Proteção nas rotas de escrita

A partir da versão atual, **todas as rotas de criação, alteração e remoção exigem permission IAM específica**. O middleware verifica o campo `x-action` do Swagger e exige que o usuário tenha a permission correspondente (ex: `user:create`, `role:delete`).

### Exemplo de policy para Root (acesso total)
```json
{
  "Version": "2025-06-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["*"], "Resource": ["*"] }
  ]
}
```

### Exemplo de policy para Admin (acesso limitado)
```json
{
  "Version": "2025-06-17",
  "Statement": [
    { "Effect": "Allow", "Action": ["user:create", "user:update", "user:delete", "group:create", "group:update", "group:delete"], "Resource": ["*"] }
  ]
}
```

### Exemplo de erro 403
```json
{ "error": "Access denied: missing permission user:create" }
```

- O campo `x-action` no Swagger define a permission exigida para cada rota de escrita.
- O root tem acesso total. O admin só gerencia entidades criadas por ele.
- Veja exemplos de uso de policies e permissions acima.
- Consulte o Swagger para saber qual permission é exigida em cada rota.

## Troubleshooting
- **Erro 400 JSON:** Certifique-se de que o JSON está bem formado e as aspas estão corretas.
- **Access Denied:** Verifique se o usuário tem a role/policy/permission correta. O root sempre deve ter acesso total.
- **Banco limpo:** Sempre rode o seed após resetar o banco para garantir root/admin e permissões.

## Dicas de Segurança
- Altere as senhas padrão em produção.
- Use variáveis de ambiente para credenciais sensíveis.
- Limite o escopo do root/admin em ambientes reais.

## Testes
- Execute todos os testes de integração:
  ```bash
  npm test
  ```

## Observações
- O seed pode ser customizado via variáveis de ambiente (`ROOT_EMAIL`, `ROOT_PASSWORD`, etc).
- O sistema segue o padrão AWS IAM: policies são documentos JSON, permissions são atômicas, ownership é respeitado.
- O endpoint de policy retorna todas as permissions associadas.

---

Dúvidas? Consulte o Swagger ou abra uma issue!
