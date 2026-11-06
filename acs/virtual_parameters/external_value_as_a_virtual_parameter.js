// _id: external value as a virtual parameter
// Example: Expose an external value as a virtual parameter
let serial = declare("DeviceID.SerialNumber", {value: 1});
if (args[1].value) {
  ext("example-ext", "set", serial.value[0], args[1].value[0]);
  return {writable: true, value: [args[1].value[0], "xsd:string"]};
}
else {
  let v = ext("example-ext", "get", serial.value[0]);
  return {writable: true, value: [v, "xsd:string"]};
}