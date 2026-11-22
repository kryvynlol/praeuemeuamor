# Mini Discord

Sala de chamada simples pelo navegador: microfone, câmera, compartilhamento de tela e chat de texto. Feito para 2 pessoas (aceita até 4 por padrão). Pode ser instalado como app no PC.

## Colocar online de graça (Render) — recomendado

Assim vocês dois só abrem o link, sem deixar nada rodando no seu PC. O Render já dá HTTPS, que é necessário para câmera, microfone e tela.

1. Crie uma conta grátis no GitHub (github.com) e um repositório novo (pode ser privado).
2. Envie os arquivos desta pasta para o repositório (no site do GitHub: "Add file" > "Upload files", arraste tudo e confirme).
3. Crie uma conta grátis no Render (render.com), entrando com o GitHub.
4. No Render: **New +** > **Web Service** > escolha o repositório.
   - Runtime: **Node**
   - Build Command: `npm install`
   - Start Command: `node server.js`
   - Instance Type: **Free**
5. Em **Environment**, adicione `APP_PASSWORD` com uma senha que só vocês dois saibam.
6. Clique em **Create Web Service**. Em 1 a 2 minutos você recebe um link do tipo `https://mini-discord-xxxx.onrender.com`. Mande esse link e a senha para ela.

(Se preferir, o arquivo `render.yaml` já deixa isso pré-configurado: **New +** > **Blueprint**.)

**Sobre o plano grátis do Render:** o serviço "dorme" depois de uns 15 minutos sem ninguém usando, e a primeira visita seguinte leva de 30 segundos a 1 minuto para acordar. Depois disso funciona normal. A chamada em si (voz e vídeo) vai direto de um para o outro, então o servidor quase não é exigido.

## Instalar como app no PC

Abra o link do site no Chrome ou Edge. Na barra de endereço aparece um ícone de instalar (um monitor com seta). Clique nele e em **Instalar**. O Mini Discord ganha um ícone na área de trabalho e abre em janela própria, como um app. Dá para fazer o mesmo no celular (menu do navegador > "Instalar app" ou "Adicionar à tela inicial").

## Rodar no seu PC (alternativa)

Precisa do Node.js 16 ou mais novo. Na pasta do projeto:

```
node server.js
```

Abra http://localhost:3000. Para ela entrar de fora usando seu PC, use um túnel: `cloudflared tunnel --url http://localhost:3000`.

## Variáveis opcionais

| Variável | O que faz |
|---|---|
| `PORT` | Porta do servidor (padrão 3000; o Render define sozinho) |
| `APP_PASSWORD` | Exige senha para entrar (recomendado) |
| `MAX_PEERS` | Máximo de pessoas por sala (padrão 4) |
| `TURN_URL`, `TURN_USER`, `TURN_PASS` | Servidor TURN, usado se a conexão direta falhar |

## Se a chamada não conectar

Na maioria das redes a conexão é direta (via STUN) e funciona. Em algumas (4G de certas operadoras, redes de empresa) é preciso um servidor TURN. Dá para pegar um gratuito em metered.ca e então definir `TURN_URL` (ex.: `turn:servidor:3478`), `TURN_USER` e `TURN_PASS` nas variáveis de ambiente do Render.

## Observações

- Compartilhar tela funciona no computador (Chrome, Edge, Firefox). Navegadores de celular não suportam.
- Para compartilhar o áudio do computador junto com a tela, use Chrome ou Edge e marque "compartilhar áudio" na janela de seleção.
- Use fones de ouvido para evitar eco.
