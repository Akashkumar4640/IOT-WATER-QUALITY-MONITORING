#include "mqtt_client.h"
#include <ArduinoJson.h>

MQTTClientManager::MQTTClientManager() 
    : _mqtt(_wifiClient), _lastReconnect(0) {}

void MQTTClientManager::begin() {
    #if ENABLE_MQTT
    _mqtt.setServer(MQTT_BROKER, MQTT_PORT);
    #endif
}

void MQTTClientManager::reconnect() {
    #if ENABLE_MQTT
    if (!_mqtt.connected() && WiFi.status() == WL_CONNECTED) {
        unsigned long now = millis();
        if (now - _lastReconnect > 5000) {
            _lastReconnect = now;
            String clientId = "ESP32_Client_" + String(DEVICE_ID);
            if (_mqtt.connect(clientId.c_str())) {
                Serial.println("[MQTT] Connected to broker: " + String(MQTT_BROKER));
            }
        }
    }
    #endif
}

void MQTTClientManager::loop() {
    #if ENABLE_MQTT
    if (!_mqtt.connected()) {
        reconnect();
    } else {
        _mqtt.loop();
    }
    #endif
}

bool MQTTClientManager::publishTelemetry(const SensorReading& reading) {
    #if ENABLE_MQTT
    if (!_mqtt.connected()) return false;

    JsonDocument doc;
    doc["deviceId"] = DEVICE_ID;
    if (reading.phConnected) doc["ph"] = reading.ph;
    if (reading.tempConnected) doc["temperature"] = reading.temperature;
    if (reading.tdsConnected) doc["tds"] = reading.tds;
    if (reading.turbidityConnected) doc["turbidity"] = reading.turbidity;
    if (reading.ecConnected) doc["ec"] = reading.ec;
    if (reading.waterLevelConnected) doc["waterLevel"] = reading.waterLevel;

    String payload;
    serializeJson(doc, payload);

    return _mqtt.publish(MQTT_TOPIC_READINGS, payload.c_str());
    #else
    return false;
    #endif
}
