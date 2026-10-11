#include "ph_sensor.h"
#include <algorithm>

PHSensor::PHSensor(uint8_t pin) : _pin(pin) {}

void PHSensor::begin() {
    pinMode(_pin, INPUT);
    analogSetPinAttenuation(_pin, ADC_11db);
}

float PHSensor::readFilteredVoltage(int& outRawADC) {
    const int sampleCount = ADC_SAMPLE_COUNT;
    int samples[sampleCount];

    for (int i = 0; i < sampleCount; i++) {
        samples[i] = analogRead(_pin);
        delay(5);
    }

    // Sort to extract median (reject noise spikes)
    std::sort(samples, samples + sampleCount);
    outRawADC = samples[sampleCount / 2];

    // Convert to voltage
    float voltage = (outRawADC / ESP32_ADC_RESOLUTION) * ESP32_ADC_VREF;
    return voltage;
}

float PHSensor::readPH(float temperatureC, const CalibrationProfile& cal, int& outRawADC, float& outVoltage, bool& outConnected) {
    outVoltage = readFilteredVoltage(outRawADC);

    // Open circuit or grounded probe detection
    // If ADC is near 0 (< 30) or floating max (> 4050), sensor is disconnected
    if (outRawADC < 30 || outRawADC > 4050 || outVoltage < 0.05f || outVoltage > 3.25f) {
        outConnected = false;
        return -1.0f;
    }

    outConnected = true;

    // Standard pH Nernst slope conversion with temperature compensation
    // Slope defaults to ~3.5 pH/Volt for standard 2.5V-centered modules (0-5V scaled down to 0-3.3V)
    float slope = cal.phSlope != 0 ? cal.phSlope : 3.5f;
    float neutralV = cal.phNeutralVoltage != 0 ? cal.phNeutralVoltage : 1.50f; // 1.5V corresponds to pH 7.0 in 3.3V scaled boards

    // Temperature slope adjustment: Nernst factor (T_kelvin / 298.15K)
    float tempKelvin = (temperatureC > 0 && temperatureC < 80) ? (temperatureC + 273.15f) : 298.15f;
    float tempAdjustedSlope = slope * (298.15f / tempKelvin);

    float ph = 7.0f + ((neutralV - outVoltage) * tempAdjustedSlope);

    // Constrain to realistic physical pH range
    if (ph < 0.0f) ph = 0.0f;
    if (ph > 14.0f) ph = 14.0f;

    return ph;
}
