// _id: Unified MAC parameter
// Example: Unified MAC parameter across different device models
let m = "00:00:00:00:00:00";
let d = declare("Device.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.MACAddress", {value: Date.now()});
let igd = declare("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.MACAddress", {value: Date.now()});

if (d.size) {
  for (let p of d) {
    if (p.value[0]) {
      m = p.value[0];
      break;
    }
  }
}
else if (igd.size) {
  for (let p of igd) {
    if (p.value[0]) {
      m = p.value[0];
      break;
    }
  }
}

return {writable: false, value: [m, "xsd:string"]};