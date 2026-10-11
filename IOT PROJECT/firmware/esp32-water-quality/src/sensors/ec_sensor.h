#ifndef EC_SENSOR_H
#define EC_SENSOR_H

#include <Arduino.h>
#include "../include/config.h"
#include "../include/types.h"

class ECSensor {
public:
    ECSensor(uint8_t pin);
    void begin();
    float readEC(float temperatureC, const CalibrationProfile& cal, int& outRawADC, float& outVoltage, bool& outConnected);

private:
    uint8_t _pin;
    float readFilteredVoltage(int& outRawADC);
};

#endif // EC_SENSOR_H
