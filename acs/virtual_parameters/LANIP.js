// _id: LANIP
let lanIp = "";

// 1. TR-098 (TP-Link EC220-G5 e outros IGDs)
let lan098 = declare("InternetGatewayDevice.LANDevice.1.LANHostConfigManagement.IPInterface.1.IPInterfaceIPAddress", {value: 1});
if (lan098.value && lan098.value[0]) {
  lanIp = lan098.value[0];
}

// Fallback TR-098
if (!lanIp) {
  let altLan = declare("InternetGatewayDevice.LANDevice.*.LANHostConfigManagement.IPInterface.*.IPInterfaceIPAddress", {value: 1});
  if (altLan.size && altLan.value && altLan.value[0]) {
    lanIp = altLan.value[0];
  }
}

// 2. TR-181 (XX530v)
if (!lanIp) {
  let lan181 = declare("Device.IP.Interface.*.IPv4Address.*.IPAddress", {value: 1});
  if (lan181.size) {
    for (let p of lan181) {
      let val = p.value ? p.value[0] : "";
      if (val && val.startsWith("192.168.")) {
        lanIp = val;
        break;
      }
    }
  }
}

return {writable: false, value: [lanIp, "xsd:string"]};