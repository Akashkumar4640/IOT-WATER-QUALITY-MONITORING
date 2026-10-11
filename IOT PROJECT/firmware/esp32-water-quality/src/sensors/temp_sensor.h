#ifndef TEMP_SENSOR_H
#define TEMP_SENSOR_H

#include <Arduino.h>
#include <OneWire.h>
#include <DallasTemperature.h>
#include "../include/config.h"

class TempSensor {
public:
    TempSensor(uint8_t pin);
    void begin();
    float readTemperature(bool& outConnected);

private:
    uint8_t _pin;
    OneWire _oneWire;
    DallasTemperature _sensors;
};

#endif // TEMP_SENSOR_H
