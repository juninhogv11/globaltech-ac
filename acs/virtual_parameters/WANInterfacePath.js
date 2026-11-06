// _id: WANInterfacePath
// Procura entre todas as interfaces IPv4 ativas qual delas possui IP público/CGNAT
let ips = declare("Device.IP.Interface.*.IPv4Address.*.IPAddress", {value: 1});

let selectedInterface = "";

for (let item of ips) {
  let ip = (item.value && item.value[0]) ? item.value[0] : "";
  
  // Ignora IPs inválidos, de loopback ou de rede local (LAN)
  if (ip && ip !== "0.0.0.0" && !ip.startsWith("127.") && !ip.startsWith("192.168.")) {
    // Extrai o caminho base da interface (ex: Device.IP.Interface.6)
    selectedInterface = item.path.split(".IPv4Address.")[0];
    break;
  }
}

// Fallback caso a busca dinâmica não encontre a tempo
if (!selectedInterface) {
  selectedInterface = "Device.IP.Interface.6";
}

return {writable: false, value: [selectedInterface, "xsd:string"]};