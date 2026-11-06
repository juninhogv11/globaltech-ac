// _id: Pass24
let p = declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase", {value: 1});
if (!p.value || !p.value[0]) {
  p = declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.X_TP_PreSharedKey", {value: 1});
}
if (!p.value || !p.value[0]) {
  p = declare("Device.WiFi.AccessPoint.1.Security.KeyPassphrase", {value: 1});
}
return {writable: true, value: [p.value ? p.value[0] : "", "xsd:string"]};