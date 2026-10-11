#ifndef WATER_LEVEL_SENSOR_H
#define WATER_LEVEL_SENSOR_H

#include <Arduino.h>
#include "../include/config.h"
#include "../include/types.h"

class WaterLevelSensor {
public:
    WaterLevelSensor(uint8_t pin);
    void begin();
    float readLevel(int& outRawADC, float& outVoltage, bool& outConnected);

private:
    uint8_t _pin;
    float readFilteredVoltage(int& outRawADC);
};

#endif // WATER_LEVEL_SENSOR_H
