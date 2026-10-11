#ifndef MQTT_CLIENT_H
#define MQTT_CLIENT_H

#include <Arduino.h>
#include <WiFiClient.h>
#include <PubSubClient.h>
#include "../include/config.h"
#include "../include/types.h"

class MQTTClientManager {
public:
    MQTTClientManager();
    void begin();
    void loop();
    bool publishTelemetry(const SensorReading& reading);

private:
    WiFiClient _wifiClient;
    PubSubClient _mqtt;
    unsigned long _lastReconnect;
    void reconnect();
};

#endif // MQTT_CLIENT_H
