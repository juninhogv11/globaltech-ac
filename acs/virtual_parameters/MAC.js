// _id: MAC
let mac = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANIPConnection.1.MACAddress", {value: 1});
if (!mac.value || !mac.value[0]) {
  mac = declare("InternetGatewayDevice.WANDevice.1.WANConnectionDevice.1.WANPPPConnection.1.MACAddress", {value: 1});
}
if (!mac.value || !mac.value[0]) {
  mac = declare("Device.Ethernet.Interface.1.MACAddress", {value: 1});
}
return {writable: false, value: [mac.value ? mac.value[0] : "", "xsd:string"]};