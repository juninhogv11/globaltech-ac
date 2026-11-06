// _id: WiFiClientsSignal
let clients = [];

// TR-181 (XX530v e novos modelos)
let tr181Signals = declare("Device.WiFi.AccessPoint.*.AssociatedDevice.*.SignalStrength", {value: 1});
let tr181Macs = declare("Device.WiFi.AccessPoint.*.AssociatedDevice.*.AssociatedDeviceMACAddress", {value: 1});

for (let item of tr181Signals) {
  let path = item.path.substring(0, item.path.lastIndexOf("."));
  let macItem = declare(path + ".AssociatedDeviceMACAddress", {value: 1});
  let mac = (macItem && macItem.value) ? macItem.value[0] : "";
  let sig = item.value ? item.value[0] : "";
  if (sig) {
    let shortMac = mac ? mac.slice(-5) : "dev";
    clients.push(shortMac + " (" + sig + " dBm)");
  }
}

// TR-098 (Modelos legados)
if (clients.length === 0) {
  let tr98Signals = declare("InternetGatewayDevice.LANDevice.*.WLANConfiguration.*.AssociatedDevice.*.X_TP_StaSignalStrength", {value: 1});
  for (let item of tr98Signals) {
    if (item.value && item.value[0]) {
      clients.push(item.value[0] + " dBm");
    }
  }
}

return {writable: false, value: [clients.length > 0 ? clients.join(", ") : "Sem clientes", "xsd:string"]};