#ifndef PAYLOAD_BUILDER_H
#define PAYLOAD_BUILDER_H

#include <Arduino.h>
#include "../include/types.h"

class PayloadBuilder {
public:
    // Builds formatted JSON string matching Backend SensorReading contract
    static String buildTelemetryJSON(
        const char* deviceId,
        const SensorReading& reading,
        int rssi
    );

    // Builds device heartbeat/status JSON
    static String buildStatusJSON(
        const DeviceInfo& devInfo
    );
};

#endif // PAYLOAD_BUILDER_H
