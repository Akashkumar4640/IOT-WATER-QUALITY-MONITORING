#include "wifi_manager.h"

WiFiManager::WiFiManager() : _lastReconnectAttempt(0) {}

void WiFiManager::begin() {
    pinMode(PIN_STATUS_LED, OUTPUT);
    digitalWrite(PIN_STATUS_LED, LOW);

    WiFi.mode(WIFI_STA);
    WiFi.setSleep(false); // Low latency IoT mode

    Serial.println("[WiFi] Connecting to network: " + String(WIFI_SSID) + "...");
    WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

    unsigned long start = millis();
    while (WiFi.status() != WL_CONNECTED && (millis() - start) < WIFI_TIMEOUT_MS) {
        delay(250);
        digitalWrite(PIN_STATUS_LED, !digitalRead(PIN_STATUS_LED)); // Fast blink during connection
        Serial.print(".");
    }
    Serial.println();

    if (WiFi.status() == WL_CONNECTED) {
        digitalWrite(PIN_STATUS_LED, HIGH); // Solid ON when connected
        Serial.println("[WiFi] Connected! IP Address: " + WiFi.localIP().toString() + " (RSSI: " + String(WiFi.RSSI()) + " dBm)");
    } else {
        digitalWrite(PIN_STATUS_LED, LOW);
        Serial.println("[WiFi] Initial connection timed out. Background retry enabled.");
    }
}

bool WiFiManager::isConnected() {
    return WiFi.status() == WL_CONNECTED;
}

void WiFiManager::maintainConnection() {
    if (WiFi.status() != WL_CONNECTED) {
        digitalWrite(PIN_STATUS_LED, LOW);
        unsigned long now = millis();
        if (now - _lastReconnectAttempt > 10000) { // Retry every 10s
            _lastReconnectAttempt = now;
            Serial.println("[WiFi] Reconnecting...");
            WiFi.disconnect();
            WiFi.reconnect();
        }
    } else {
        digitalWrite(PIN_STATUS_LED, HIGH);
    }
}

String WiFiManager::getIPAddress() {
    return WiFi.localIP().toString();
}

int WiFiManager::getRSSI() {
    return WiFi.RSSI();
}
