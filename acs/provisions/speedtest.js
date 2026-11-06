const now = Date.now();
const testUrl = "{{SPEEDTEST_URL}}";

// Remove a tag para permitir novos cliques futuros
declare("Tags.RUN_SPEEDTEST", null, {value: false});

// Identifica a interface WAN
let wanInterface = "Device.IP.Interface.6";
let ips = declare("Device.IP.Interface.*.IPv4Address.*.IPAddress", {value: 1});
for (let item of ips) {
  let ip = (item.value && item.value[0]) ? item.value[0] : "";
  if (ip && !ip.startsWith("192.168.") && !ip.startsWith("127.") && ip !== "0.0.0.0") {
    wanInterface = item.path.split(".IPv4Address")[0];
    break;
  }
}

// Envia os comandos de diagnóstico para a ONT
declare("Device.IP.Diagnostics.DownloadDiagnostics.Interface", {value: now}, {value: [wanInterface, "xsd:string"]});
declare("Device.IP.Diagnostics.DownloadDiagnostics.DownloadURL", {value: now}, {value: [testUrl, "xsd:string"]});
declare("Device.IP.Diagnostics.DownloadDiagnostics.DiagnosticsState", {value: now}, {value: ["Requested", "xsd:string"]});