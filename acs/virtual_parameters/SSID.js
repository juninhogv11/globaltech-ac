// _id: SSID
let ssid = "";

let s098 = declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", {value: 1});
if (s098.value && s098.value[0]) {
  ssid = s098.value[0];
} else {
  let s181 = declare("Device.WiFi.SSID.1.SSID", {value: 1});
  if (s181.value && s181.value[0]) {
    ssid = s181.value[0];
  }
}

return {writable: false, value: [ssid, "xsd:string"]};