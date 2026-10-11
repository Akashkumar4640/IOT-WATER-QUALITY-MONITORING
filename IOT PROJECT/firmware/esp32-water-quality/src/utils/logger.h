#ifndef LOGGER_H
#define LOGGER_H

#include <Arduino.h>
#include "../include/config.h"
#include "../include/types.h"

class SerialLogger {
public:
    static void printBanner();
    static void printTelemetry(
        const String& wifiStatus, 
        const String& ip, 
        const SensorReading& reading, 
        const String& serverStatus,
        int nextIntervalSec
    );
};

#endif // LOGGER_H
