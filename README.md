# BBZ App Frontend

Aplicação web interna para reserva e gestão de espaços da BBZ. O projeto cobre autenticação, salas e workstations, reservas, check-in/out, compliance, ocorrências, equipes e administração.

## Infraestrutura

| Componente | Desenvolvimento                 | Produção                                          |
| ---------- | ------------------------------- | ------------------------------------------------- |
| Frontend   | `http://localhost:3001`         | `https://app-sistema-reserva.bbz.com.br` (Vercel) |
| Backend    | `http://localhost:3334`         | `https://api-sistema-reserva.bbz.com.br` (Render) |
| Swagger    | `http://localhost:3334/docs`    | `https://api-sistema-reserva.bbz.com.br/docs`     |
| Banco      | PostgreSQL 16 via backend local | Supabase via backend                              |
| E-mail     | Ethereal via backend            | Brevo via backend                                 |
| Imagens    | AWS S3                          | AWS S3                                            |

O frontend não acessa PostgreSQL, SMTP, S3 privado, Google ou DLOCK diretamente. Integrações sensíveis pertencem ao backend.

## Stack e arquitetura

- Node.js 22, Next.js 16 App Router, React 19 e TypeScript.
- Tailwind CSS, Radix UI e Lucide.
- React Hook Form e Zod para formulários.
- SWR e um `customFetch` isomórfico para acesso à API.
- Orval para gerar tipos e clientes a partir do OpenAPI do backend.
- Middleware Next.js para sessão, refresh, CSRF e modo de manutenção.

```text
src/
├── app/          rotas, layouts, páginas e API routes do Next.js
├── components/   componentes de domínio, formulários e UI
├── context/      estado compartilhado de formulários e espaços
├── services/     acesso à API para Server Components
├── api/          clientes gerados pelo Orval e mutator HTTP
├── infra/        env e resolução de hosts
├── middleware/   autenticação e manutenção
├── schema/       validações do cliente
├── lib/          cookies, OAuth, Orval e utilitários de domínio
├── style/        fontes e estilos globais
└── utils/        datas, texto, imagens e helpers
```

## Áreas funcionais

- `/login`, `/esqueceu-senha` e `/redefinir-senha/:userId/:token`: autenticação e recuperação de acesso.
- `/espacos` e `/espacos/:id`: dashboard, busca de disponibilidade e criação de reservas.
- `/espacos/minhas-reservas`: agenda do usuário e reservas em que participa.
- `/espacos/check-in-out/:id`: check-in/out via espaço ou QR code.
- `/espacos/compliance/*`: situação individual, equipe, visão geral, cancelamentos e checkout antecipado.
- `/equipe`: organograma, cargos, reservas, afastamentos, postos avançados e exceções de reserva.
- `/admin/usuarios`, `/admin/espacos` e `/admin/reservas`: operação administrativa.
- `/manutencao`: bloqueio operacional e limpeza de sessão, controlado por env.

Autorização de interface segue role e cargo, mas o backend é a autoridade final. Rotas autenticadas usam Server Components para validar a sessão antes da renderização.

## Ambientes

O contrato está em `.env.example`; `.env` contém somente a configuração local e não deve ser versionado. Em produção, configure as mesmas chaves no Vercel.

| Variável                            | Uso                                                                         |
| ----------------------------------- | --------------------------------------------------------------------------- |
| `NEXT_PUBLIC_ADM_WEB_HOST`          | Host local do frontend; a URL pública de produção vem do Vercel.            |
| `NEXT_PUBLIC_BUCKET`                | Base pública para imagens no S3.                                            |
| `NEXT_PUBLIC_API_URL`               | URL absoluta da API; em produção, `https://api-sistema-reserva.bbz.com.br`. |
| `NEXT_PUBLIC_API_PORT`              | Porta local da API usada pelo app e pelo Orval.                             |
| `NEXT_PUBLIC_MAINTENANCE_MODE`      | Ativa `/manutencao` e invalida a sessão no próximo deploy.                  |
| `NEXT_PUBLIC_COOKIE_DOMAIN`         | Domínio compartilhado dos cookies; em produção, `.bbz.com.br`.              |
| `API_DOC_USER` / `API_DOC_PASSWORD` | Acesso do Orval ao Swagger; manter como secrets.                            |

Variáveis `NEXT_PUBLIC_*` são incorporadas no build. Toda alteração no Vercel exige novo deploy.

## Operação local

Requisitos: Node.js 22, npm e o backend local saudável em `localhost:3334`.

```bash
npm install
cp .env.example .env
npm run dev
```

`npm run dev` executa primeiro `generate:api`, que autentica no Swagger local, atualiza `src/lib/orval/swagger.json` e recria os clientes em `src/api/endpoints/`; em seguida inicia o Next.js na porta 3001. Por isso, suba o backend antes do frontend.

Arquivos sob `src/api/endpoints/` são gerados. Alterações manuais serão substituídas na próxima geração; customizações HTTP devem ficar em `src/api/mutator/` ou na configuração do Orval.

## Scripts

| Script                 | Finalidade                                                                   |
| ---------------------- | ---------------------------------------------------------------------------- |
| `npm run dev`          | Regenera o cliente da API e inicia Next.js em desenvolvimento na porta 3001. |
| `npm run generate:api` | Atualiza OpenAPI e clientes Orval a partir do backend local.                 |
| `npm run build`        | Produz o build de produção do Next.js.                                       |
| `npm start`            | Executa o build localmente na porta 3001.                                    |
| `npm run lint`         | Executa o lint configurado no projeto.                                       |

## Autenticação e comunicação com a API

- O backend grava cookies `httpOnly` para sessão e refresh, além do token CSRF, todos com prefixo `bbz-server-auth`.
- O `customFetch` usa `credentials: include`, adiciona cookies no SSR e envia `X-CSRF-Token` em operações mutáveis.
- Sessão expirada dispara refresh automático; estado inconsistente redireciona para login e limpa cookies.
- O domínio `.bbz.com.br` permite compartilhar os cookies entre `app-sistema-reserva.bbz.com.br` e `api-sistema-reserva.bbz.com.br`.
- Google OAuth inicia no backend e retorna ao frontend depois do callback configurado no Google Cloud.

## Regras de negócio refletidas na interface

- Salas aceitam convidados e copeira; workstations são individuais e submetidas a limite semanal.
- Gerente reserva até 2 dias de workstation; subgerente e assistente, até 3. Ao completar o limite, uma reserva deve cair em segunda ou sexta.
- Afastamentos e postos avançados alteram compliance e disponibilidade conforme decisão do backend.
- Supervisores, diretor, admin e dev possuem visões de equipe, compliance, cancelamentos e ocorrências conforme escopo.
- Gestão de cargos respeita a hierarquia `director > supervisor > manager > assistant_manager > assistant`.
- Checkout antecipado, ausência e cancelamento fora do prazo aparecem nos painéis operacionais correspondentes.

As regras devem ser alteradas primeiro no backend. O frontend apresenta e antecipa validações, mas não deve duplicar decisões de autorização ou consistência.

## Produção

O frontend é publicado no Vercel e recebe o domínio `app-sistema-reserva.bbz.com.br`. O projeto precisa das variáveis do `.env.example`, com `NEXT_PUBLIC_API_URL=https://api-sistema-reserva.bbz.com.br` e `NEXT_PUBLIC_COOKIE_DOMAIN=.bbz.com.br`.

O backend deve liberar `https://app-sistema-reserva.bbz.com.br` no CORS. O Google Cloud deve manter `https://app-sistema-reserva.bbz.com.br` como origem autorizada e `https://api-sistema-reserva.bbz.com.br/v1/public/auth/login/google/callback` como redirect URI. Domínios legados podem coexistir durante a migração, mas devem ser removidos após a virada.

Ativar manutenção exige alterar `NEXT_PUBLIC_MAINTENANCE_MODE=true` e realizar deploy; a desativação também requer novo deploy.

## Verificação e manutenção

- Não há suíte automatizada no repositório atualmente.
- O contrato OpenAPI versionado deve acompanhar o backend.
- O lint mantém como warnings os padrões React legados já catalogados; novas violações permanecem bloqueantes.
- Antes de entregar uma alteração, execute `npm run generate:api` com o backend local atualizado, `npm run lint`, `npx tsc --noEmit` e `npm run build`.
- Nunca exponha credenciais em variáveis `NEXT_PUBLIC_*`, commits, README ou bundles do navegador.
