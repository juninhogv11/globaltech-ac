"use strict";
// Cria ou altera um usuário do portal: node scripts/add-user.js <usuario> ["Nome Completo"]
const readline = require("readline");
const { loadUsers, saveUsers, hashPassword } = require("../lib/auth");

const username = process.argv[2];
const name = process.argv[3] || username;
if (!username || !/^[A-Za-z0-9_.-]{2,32}$/.test(username)) {
  console.error('Uso: node scripts/add-user.js <usuario> ["Nome Completo"]');
  process.exit(1);
}

// Lê a senha sem mostrar na tela
function ask(question) {
  return new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    rl._writeToOutput = (s) => { if (s.includes(question)) rl.output.write(s); };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

(async () => {
  const p1 = await ask("Senha: ");
  const p2 = await ask("Repita a senha: ");
  if (p1 !== p2) {
    console.error("As senhas não conferem.");
    process.exit(1);
  }
  if (p1.length < 8) {
    console.error("A senha precisa ter pelo menos 8 caracteres.");
    process.exit(1);
  }
  const users = loadUsers();
  const existed = !!users[username];
  users[username] = { name, hash: hashPassword(p1) };
  saveUsers(users);
  console.log(existed ? `Senha de "${username}" alterada.` : `Usuário "${username}" criado.`);
})();
