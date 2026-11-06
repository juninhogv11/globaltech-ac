// _id: Pass58
let valor = "";

// 1. Padrão TR-181 (XX530v) - AccessPoint 3 ou 2
let p3 = declare("Device.WiFi.AccessPoint.3.Security.KeyPassphrase", {value: 1});
if (p3.value && p3.value[0]) {
  valor = p3.value[0];
} else {
  let p2 = declare("Device.WiFi.AccessPoint.2.Security.KeyPassphrase", {value: 1});
  if (p2.value && p2.value[0]) {
    valor = p2.value[0];
  }
}

// 2. Padrão TR-098 legado - WLANConfiguration 5 ou 2
if (!valor) {
  let pw5 = declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.5.PreSharedKey.1.KeyPassphrase", {value: 1});
  let tp5 = declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.5.X_TP_PreSharedKey", {value: 1});
  if (pw5.value && pw5.value[0]) {
    valor = pw5.value[0];
  } else if (tp5.value && tp5.value[0]) {
    valor = tp5.value[0];
  }
}

return {writable: false, value: [valor, "xsd:string"]};