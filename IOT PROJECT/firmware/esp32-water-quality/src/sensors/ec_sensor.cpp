#include "ec_sensor.h"
#include <algorithm>

ECSensor::ECSensor(uint8_t pin) : _pin(pin) {}

void ECSensor::begin() {
    pinMode(_pin, INPUT);
    analogSetPinAttenuation(_pin, ADC_11db);
}

float ECSensor::readFilteredVoltage(int& outRawADC) {
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

float ECSensor::readEC(float temperatureC, const CalibrationProfile& cal, int& outRawADC, float& outVoltage, bool& outConnected) {
    outVoltage = readFilteredVoltage(outRawADC);

    // If pin is floating near 0 or not plugged in
    if (outRawADC < 20 || outVoltage < 0.05f) {
        outConnected = false;
        return -1.0f;
    }

    outConnected = true;

    // Temperature compensation
    float validTemp = (temperatureC > 0 && temperatureC < 70) ? temperatureC : 25.0f;
    float tempFactor = 1.0f + 0.0185f * (validTemp - 25.0f);
    float compVoltage = outVoltage / tempFactor;

    // Linear conductivity equation in µS/cm
    float cellK = cal.ecCellConstant > 0 ? cal.ecCellConstant : 1.0f;
    float ec = (compVoltage * 1000.0f) * cellK;

    if (ec < 0.0f) ec = 0.0f;
    if (ec > 10000.0f) ec = 10000.0f;

    return ec;
}
