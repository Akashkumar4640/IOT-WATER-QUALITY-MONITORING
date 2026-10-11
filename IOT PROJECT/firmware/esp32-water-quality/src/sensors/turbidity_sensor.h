#ifndef TURBIDITY_SENSOR_H
#define TURBIDITY_SENSOR_H

#include <Arduino.h>
#include "../include/config.h"
#include "../include/types.h"

class TurbiditySensor {
public:
    TurbiditySensor(uint8_t pin);
    void begin();
    float readTurbidity(const CalibrationProfile& cal, int& outRawADC, float& outVoltage, bool& outConnected);

private:
    uint8_t _pin;
    float readFilteredVoltage(int& outRawADC);
};

#endif // TURBIDITY_SENSOR_H
