#include "payload_builder.h"

String PayloadBuilder::buildTelemetryJSON(
    const char* deviceId,
    const SensorReading& reading,
    int rssi
) {
    String json = "{";
    json += "\"deviceId\":\"" + String(deviceId) + "\",";
    json += "\"rssi\":" + String(rssi) + ",";

    // Sensors engineering values (or null if probe disconnected)
    json += "\"ph\":" + (reading.phConnected ? String(reading.ph, 2) : "null") + ",";
    json += "\"temperature\":" + (reading.tempConnected ? String(reading.temperature, 1) : "null") + ",";
    json += "\"tds\":" + (reading.tdsConnected ? String(reading.tds, 0) : "null") + ",";
    json += "\"turbidity\":" + (reading.turbidityConnected ? String(reading.turbidity, 2) : "null") + ",";
    json += "\"ec\":" + (reading.ecConnected ? String(reading.ec, 0) : "null") + ",";
    json += "\"waterLevel\":" + (reading.waterLevelConnected ? String(reading.waterLevel, 1) : "null") + ",";

    // Raw Electrical Diagnostics
    json += "\"rawValues\":{";
    json += "\"ph\":{\"adc\":" + String(reading.raw.phRaw) + ",\"voltage\":" + String(reading.raw.phVoltage, 3) + "},";
    json += "\"temperature\":{\"raw\":\"" + String(reading.temperature, 1) + "C\"},";
    json += "\"tds\":{\"adc\":" + String(reading.raw.tdsRaw) + ",\"voltage\":" + String(reading.raw.tdsVoltage, 3) + "},";
    json += "\"turbidity\":{\"adc\":" + String(reading.raw.turbidityRaw) + ",\"voltage\":" + String(reading.raw.turbidityVoltage, 3) + "},";
    json += "\"ec\":{\"adc\":" + String(reading.raw.ecRaw) + ",\"voltage\":" + String(reading.raw.ecVoltage, 3) + "},";
    json += "\"waterLevel\":{\"adc\":" + String(reading.raw.waterLevelRaw) + ",\"voltage\":" + String(reading.raw.waterLevelVoltage, 3) + "}";
    json += "}}";

    return json;
}

String PayloadBuilder::buildStatusJSON(const DeviceInfo& devInfo) {
    String json = "{";
    json += "\"deviceId\":\"" + String(devInfo.deviceId) + "\",";
    json += "\"deviceName\":\"" + String(devInfo.deviceName) + "\",";
    json += "\"firmwareVersion\":\"" + String(devInfo.firmwareVersion) + "\",";
    json += "\"connectionType\":\"" + String(devInfo.connectionType) + "\",";
    json += "\"rssi\":" + String(devInfo.rssi) + ",";
    json += "\"ipAddress\":\"" + String(devInfo.ipAddress) + "\",";
    json += "\"uptimeSeconds\":" + String(devInfo.uptimeSeconds);
    json += "}";
    return json;
}
