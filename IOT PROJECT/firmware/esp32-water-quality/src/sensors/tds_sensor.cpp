#include "tds_sensor.h"
#include <algorithm>

TDSSensor::TDSSensor(uint8_t pin) : _pin(pin) {}

void TDSSensor::begin() {
    pinMode(_pin, INPUT);
    analogSetPinAttenuation(_pin, ADC_11db);
}

float TDSSensor::readFilteredVoltage(int& outRawADC) {
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

float TDSSensor::readTDS(float temperatureC, const CalibrationProfile& cal, int& outRawADC, float& outVoltage, bool& outConnected) {
    outVoltage = readFilteredVoltage(outRawADC);

    // Open circuit check: If voltage is near 0 (< 0.05V) or floating max
    if (outRawADC < 20 || outVoltage < 0.04f) {
        outConnected = false;
        return -1.0f;
    }

    outConnected = true;

    // Temperature compensation formula: standard 2% per °C relative to 25°C
    float validTemp = (temperatureC > 0 && temperatureC < 70) ? temperatureC : 25.0f;
    float compensationCoefficient = 1.0f + 0.02f * (validTemp - 25.0f);
    float compensationVoltage = outVoltage / compensationCoefficient;

    // Standard polynomial conversion: (133.42*v^3 - 255.86*v^2 + 857.39*v)*0.5
    float v = compensationVoltage;
    float kFactor = cal.tdsKFactor != 0 ? cal.tdsKFactor : 1.0f;

    float tdsValue = (133.42f * v * v * v - 255.86f * v * v + 857.39f * v) * 0.5f * kFactor;

    if (tdsValue < 0.0f) tdsValue = 0.0f;
    if (tdsValue > 3000.0f) tdsValue = 3000.0f;

    return tdsValue;
}
