/*
  GenieACS Provisioning Flow - Bootstrap
  Executado no evento 0 BOOTSTRAP (reset de fábrica, reinício pela OLT no XX530v ou novo ACS).

  Só marca BOOTSTRAP_PENDING. Não mexe em Provisioned nem em outras tags:
  um preset de evento roda de novo a cada ciclo da sessão, e tirar/pôr tags que outras
  provisions gravam de volta gera fault "preset_loop".
  - 02_PROVISION_IPOE roda de novo enquanto BOOTSTRAP_PENDING existir;
  - 04_WIFI_RESTORE restaura o Wi-Fi se ele voltou ao padrão de fábrica;
  - 05_BOOTSTRAP_DONE tira a marca no próximo inform periódico.
  Sem clear(): apagar o cache obrigava a redescobrir a árvore inteira (1800+ parâmetros).
*/
declare("Tags.BOOTSTRAP_PENDING", null, {value: true});
