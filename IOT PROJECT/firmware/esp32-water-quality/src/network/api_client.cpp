#include "api_client.h"

APIClient::APIClient() {}

String APIClient::buildJsonPayload(const SensorReading& reading) {
    JsonDocument doc;

    doc["deviceId"] = DEVICE_ID;
    doc["deviceToken"] = DEVICE_TOKEN;

    // Strict null handling for disconnected sensors (NO fake values!)
    if (reading.phConnected) doc["ph"] = serialized(String(reading.ph, 2));
    else doc["ph"] = nullptr;

    if (reading.tempConnected) doc["temperature"] = serialized(String(reading.temperature, 2));
    else doc["temperature"] = nullptr;

    if (reading.tdsConnected) doc["tds"] = serialized(String(reading.tds, 1));
    else doc["tds"] = nullptr;

    if (reading.turbidityConnected) doc["turbidity"] = serialized(String(reading.turbidity, 2));
    else doc["turbidity"] = nullptr;

    if (reading.ecConnected) doc["ec"] = serialized(String(reading.ec, 1));
    else doc["ec"] = nullptr;

    if (reading.waterLevelConnected) doc["waterLevel"] = serialized(String(reading.waterLevel, 1));
    else doc["waterLevel"] = nullptr;

    // Diagnostic Raw ADC / Voltages payload
    JsonObject rawObj = doc["rawValues"].to<JsonObject>();
    if (reading.phConnected) {
        rawObj["ph"]["adc"] = reading.raw.phRaw;
        rawObj["ph"]["voltage"] = serialized(String(reading.raw.phVoltage, 3));
    }
    if (reading.tdsConnected) {
        rawObj["tds"]["adc"] = reading.raw.tdsRaw;
        rawObj["tds"]["voltage"] = serialized(String(reading.raw.tdsVoltage, 3));
    }
    if (reading.turbidityConnected) {
        rawObj["turbidity"]["adc"] = reading.raw.turbidityRaw;
        rawObj["turbidity"]["voltage"] = serialized(String(reading.raw.turbidityVoltage, 3));
    }
    if (reading.ecConnected) {
        rawObj["ec"]["adc"] = reading.raw.ecRaw;
        rawObj["ec"]["voltage"] = serialized(String(reading.raw.ecVoltage, 3));
    }

    String jsonString;
    serializeJson(doc, jsonString);
    return jsonString;
}

bool APIClient::sendTelemetry(const SensorReading& reading, String& outServerResponse) {
    if (WiFi.status() != WL_CONNECTED) {
        outServerResponse = "ERR_WIFI_DISCONNECTED";
        return false;
    }

    HTTPClient http;
    String endpoint = String(SERVER_HOST) + String(SERVER_ENDPOINT);

    http.begin(endpoint);
    http.setTimeout(4000);
    http.addHeader("Content-Type", "application/json");
    http.addHeader("X-Device-Id", DEVICE_ID);
    http.addHeader("X-Device-Token", DEVICE_TOKEN);

    String payload = buildJsonPayload(reading);
    int httpResponseCode = http.POST(payload);

    bool success = false;
    if (httpResponseCode > 0) {
        outServerResponse = "HTTP " + String(httpResponseCode);
        if (httpResponseCode == HTTP_CODE_OK || httpResponseCode == HTTP_CODE_CREATED) {
            success = true;
        }
    } else {
        outServerResponse = "HTTP_ERR: " + http.errorToString(httpResponseCode);
    }

    http.end();
    return success;
}
