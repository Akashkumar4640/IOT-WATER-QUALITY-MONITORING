#ifndef API_CLIENT_H
#define API_CLIENT_H

#include <Arduino.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include "../include/config.h"
#include "../include/types.h"

class APIClient {
public:
    APIClient();
    bool sendTelemetry(const SensorReading& reading, String& outServerResponse);

private:
    String buildJsonPayload(const SensorReading& reading);
};

#endif // API_CLIENT_H
