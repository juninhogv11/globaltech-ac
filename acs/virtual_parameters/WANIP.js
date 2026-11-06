// _id: WANIP
// IP da WAN: percorre todas as conexões e pega o primeiro IP válido que não seja da LAN
const fresh = Date.now() - 600000;
let ip = "";

function valido(v) {
  return v && v !== "0.0.0.0" && !v.startsWith("127.") && !v.startsWith("169.254.");
}

function primeiro(path, filtro) {
  for (let p of declare(path, {value: fresh})) {
    let v = (p.value && p.value[0]) ? String(p.value[0]) : "";
    if (valido(v) && (!filtro || filtro(v))) return v;
  }
  return "";
}

// 1. TR-098 PPPoE
ip = primeiro("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANPPPConnection.*.ExternalIPAddress");

// 2. TR-098 IPoE / DHCP
if (!ip) ip = primeiro("InternetGatewayDevice.WANDevice.*.WANConnectionDevice.*.WANIPConnection.*.ExternalIPAddress");

// 3. TR-181 PPP
if (!ip) ip = primeiro("Device.PPP.Interface.*.IPCP.LocalIPAddress");
if (!ip) ip = primeiro("Device.PPP.Interface.*.ExternalIPAddress");

// 4. TR-181 IP Interface (ignora a faixa da LAN 192.168.x)
if (!ip) ip = primeiro("Device.IP.Interface.*.IPv4Address.*.IPAddress", v => !v.startsWith("192.168."));

return {writable: false, value: [ip, "xsd:string"]};
