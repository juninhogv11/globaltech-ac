// Força a leitura do MAC na sessão atual
let mac = "";

if (isIGD) {
  let m1 = declare("InternetGatewayDevice.WANDevice.1.WANEthernetInterfaceConfig.MACAddress", {value: 1});
  if (m1.value && m1.value[0]) mac = m1.value[0];
} else {
  // TR-181 (XX530v): força o valor a vir na sessão
  let m181 = declare("Device.Ethernet.Interface.1.MACAddress", {value: 1});
  if (m181.value && m181.value[0]) {
    mac = m181.value[0];
  }
}

// Se não achou na interface Ethernet (comum no primeiro inform logo após deletar),
// pega direto do ID do dispositivo que o GenieACS sempre tem na hora:
if (!mac) {
  let devId = declare("DeviceID.ID", {value: 1});
  if (devId.value && devId.value[0]) {
    // Procura padrão de MAC (ex: 0CEF15... ou com dois pontos)
    let raw = devId.value[0];
    let match = raw.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
    if (match) {
      mac = match[0];
    } else {
      // Se a TP-Link mandar o OUI + Serial no DeviceID:
      mac = raw;
    }
  }
}

log("MAC identificado para provision: " + mac);