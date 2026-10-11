#ifndef TDS_SENSOR_H
#define TDS_SENSOR_H

#include <Arduino.h>
#include "../include/config.h"
#include "../include/types.h"

class TDSSensor {
public:
    TDSSensor(uint8_t pin);
    void begin();
    float readTDS(float temperatureC, const CalibrationProfile& cal, int& outRawADC, float& outVoltage, bool& outConnected);

private:
    uint8_t _pin;
    float readFilteredVoltage(int& outRawADC);
};

#endif // TDS_SENSOR_H
