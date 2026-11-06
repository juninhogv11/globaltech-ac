// _id: virtual parameter for WPA passphrase
// Example: Create an editable virtual parameter for WPA passphrase
let m = "";
if (args[1].value) {
  m = args[1].value[0];
  declare("Device.WiFi.AccessPoint.1.Security.KeyPassphrase", null, {value: m});
  declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase", null, {value: m});
}
else {
  let d = declare("Device.WiFi.AccessPoint.1.Security.KeyPassphrase", {value: Date.now()});
  let igd = declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.KeyPassphrase", {value: Date.now()});

  if (d.size) {
    m = d.value[0];
  }
  else if (igd.size) {
    m = igd.value[0];
  }
}

return {writable: true, value: [m, "xsd:string"]};