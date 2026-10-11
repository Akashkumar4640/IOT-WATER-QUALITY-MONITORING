#include "water_level_sensor.h"
#include <algorithm>

WaterLevelSensor::WaterLevelSensor(uint8_t pin) : _pin(pin) {}

void WaterLevelSensor::begin() {
    pinMode(_pin, INPUT);
    analogSetPinAttenuation(_pin, ADC_11db);
}

float WaterLevelSensor::readFilteredVoltage(int& outRawADC) {
    const int sampleCount = ADC_SAMPLE_COUNT;
    int samples[sampleCount];

    for (int i = 0; i < sampleCount; i++) {
        samples[i] = analogRead(_pin);
        delay(5);
    }

    std::sort(samples, samples + sampleCount);
    outRawADC = samples[sampleCount / 2];

    float voltage = (outRawADC / ESP32_ADC_RESOLUTION) * ESP32_ADC_VREF;
    return voltage;
}

float WaterLevelSensor::readLevel(int& outRawADC, float& outVoltage, bool& outConnected) {
    outVoltage = readFilteredVoltage(outRawADC);

    // If ADC is disconnected
    if (outRawADC < 10) {
        outConnected = false;
        return -1.0f;
    }

    outConnected = true;

    // Convert raw ADC (0 - 3500) to percentage (0 - 100%)
    float percentage = (outRawADC / 3300.0f) * 100.0f;
    if (percentage < 0.0f) percentage = 0.0f;
    if (percentage > 100.0f) percentage = 100.0f;

    return percentage;
}
