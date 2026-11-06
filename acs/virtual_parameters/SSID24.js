// _id: SSID24
let ssid = declare("InternetGatewayDevice.LANDevice.1.WLANConfiguration.1.SSID", {value: 1});
if (!ssid.value || !ssid.value[0]) {
  ssid = declare("Device.WiFi.SSID.1.SSID", {value: 1});
}
return {writable: false, value: [ssid.value ? ssid.value[0] : "", "xsd:string"]};