/*
  GenieACS Provisioning Flow - Bootstrap
  Executado no evento 0 BOOTSTRAP (Factory Reset ou Primeiro Boot)

  Sem clear(): apagar todo o cache obrigava a redescobrir a árvore inteira
  (1800+ parâmetros no XX530v) na mesma sessão e gerava fault "preset_loop".
  O cache é atualizado pela provision "inform" (árvore diária) e pela "default" (10 min).
*/

// Remove a tag Provisioned para liberar o fluxo de provisionamento IPoE
declare("Tags.Provisioned", null, {value: false});

// Pede a restauração do Wi-Fi (provision wifi_restore; só grava se houve reset de fábrica)
declare("Tags.RESTORE_WIFI", null, {value: true});
