#include "temp_sensor.h"

TempSensor::TempSensor(uint8_t pin) 
    : _pin(pin), _oneWire(pin), _sensors(&_oneWire) {}

void TempSensor::begin() {
    _sensors.begin();
    _sensors.setWaitForConversion(true);
}

float TempSensor::readTemperature(bool& outConnected) {
    _sensors.requestTemperatures();
    float tempC = _sensors.getTempCByIndex(0);

    // DS18B20 returns DEVICE_DISCONNECTED_C (-127.0) when probe is missing/loose
    // or 85.0C on initial power-on glitch if conversion did not complete
    if (tempC == DEVICE_DISCONNECTED_C || tempC < -50.0f || tempC > 125.0f) {
        outConnected = false;
        return -1.0f;
    }

    outConnected = true;
    return tempC;
}
