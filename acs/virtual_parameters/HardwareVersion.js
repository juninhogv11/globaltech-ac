// _id: HardwareVersion
let v = declare("InternetGatewayDevice.DeviceInfo.HardwareVersion", {value: 1});
if (!v.value || !v.value[0]) {
  v = declare("Device.DeviceInfo.HardwareVersion", {value: 1});
}
return {writable: false, value: [v.value ? v.value[0] : "", "xsd:string"]};