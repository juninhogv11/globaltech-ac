// _id: SSID58
let valor = "";

// 1. Procura no padrão TR-181 (XX530v) - índices 3 ou 2
let s3 = declare("Device.WiFi.SSID.3.SSID", {value: 1});
if (s3.value && s3.value[0]) {
  valor = s3.value[0];
} else {
  let s2 = declare("Device.WiFi.SSID.2.SSID", {value: 1});
  if (s2.value && s2.value[0]) {
    valor = s2.value[0];
  }
}

// 2. Se não encontrou, procura no padrão TR-098 legado (índices 5 ou 2)
if (!valor) {
  let w5 = declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.5.SSID", {value: 1});
  if (w5.value && w5.value[0]) {
    valor = w5.value[0];
  } else {
    let w2 = declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.2.SSID", {value: 1});
    if (w2.value && w2.value[0]) {
      valor = w2.value[0];
    }
  }
}

return {writable: false, value: [valor, "xsd:string"]};