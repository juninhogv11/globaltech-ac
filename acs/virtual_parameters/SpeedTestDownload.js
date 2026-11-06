// _id: SpeedTestDownload
let state = declare("Device.IP.Diagnostics.DownloadDiagnostics.DiagnosticsState", {value: 1});
let bytes = declare("Device.IP.Diagnostics.DownloadDiagnostics.TestBytesReceived", {value: 1});
let bom = declare("Device.IP.Diagnostics.DownloadDiagnostics.BOMTime", {value: 1});
let eom = declare("Device.IP.Diagnostics.DownloadDiagnostics.EOMTime", {value: 1});

if (state && state.value && state.value[0] === "Completed" && bytes && bytes.value && bom && bom.value && eom && eom.value) {
  let t1 = new Date(bom.value[0]).getTime();
  let t2 = new Date(eom.value[0]).getTime();
  let durationSec = (t2 - t1) / 1000;

  if (durationSec > 0) {
    let totalBytes = Number(bytes.value[0]);
    let mbps = ((totalBytes * 8) / (durationSec * 1000000)).toFixed(2);
    return {writable: false, value: [mbps + " Mbps (" + durationSec + "s)", "xsd:string"]};
  }
}

return {writable: false, value: ["Não executado", "xsd:string"]};