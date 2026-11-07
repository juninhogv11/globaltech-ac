// Tira a marca BOOTSTRAP_PENDING no primeiro inform periódico depois do BOOTSTRAP
// (preset 05_BOOTSTRAP_DONE). Fica fora da sessão do BOOTSTRAP para não gerar preset_loop.
declare("Tags.BOOTSTRAP_PENDING", null, {value: false});
