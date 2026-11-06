// _id: SpeedTestResult
let stateNode = declare("Device.IP.Diagnostics.DownloadDiagnostics.DiagnosticsState", {value: 1});
let state = (stateNode && stateNode.value) ? stateNode.value[0] : "None";

if (state === "Completed") {
  let bytesNode = declare("Device.IP.Diagnostics.DownloadDiagnostics.TestBytesReceived", {value: 1});
  let bomNode = declare("Device.IP.Diagnostics.DownloadDiagnostics.BOMTime", {value: 1});
  let eomNode = declare("Device.IP.Diagnostics.DownloadDiagnostics.EOMTime", {value: 1});

  if (bytesNode && bomNode && eomNode && bytesNode.value && bomNode.value && eomNode.value) {
    let t1 = new Date(bomNode.value[0]).getTime();
    let t2 = new Date(eomNode.value[0]).getTime();
    let durationSec = (t2 - t1) / 1000;

    if (durationSec > 0) {
      let totalBytes = Number(bytesNode.value[0]);
      let mbps = ((totalBytes * 8) / (durationSec * 1000000)).toFixed(2);
      return {writable: false, value: [mbps + " Mbps (" + durationSec + "s)", "xsd:string"]};
    }
  }
  return {writable: false, value: ["Concluído", "xsd:string"]};
}

return {writable: false, value: [state, "xsd:string"]};