#ifndef PH_SENSOR_H
#define PH_SENSOR_H

#include <Arduino.h>
#include "../include/config.h"
#include "../include/types.h"

class PHSensor {
public:
    PHSensor(uint8_t pin);
    void begin();
    float readPH(float temperatureC, const CalibrationProfile& cal, int& outRawADC, float& outVoltage, bool& outConnected);

private:
    uint8_t _pin;
    float readFilteredVoltage(int& outRawADC);
};

#endif // PH_SENSOR_H
