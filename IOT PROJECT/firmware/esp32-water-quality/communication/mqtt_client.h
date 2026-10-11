#ifndef COMM_MQTT_CLIENT_H
#define COMM_MQTT_CLIENT_H

#include <Arduino.h>
#include <WiFiClient.h>

class MQTTClient {
public:
    MQTTClient(const char* broker, int port, const char* deviceId);
    bool connect();
    bool isConnected();
    bool publishTelemetry(const char* topic, const String& payload);
    void loop();

private:
    const char* _broker;
    int _port;
    const char* _deviceId;
};

#endif // COMM_MQTT_CLIENT_H
