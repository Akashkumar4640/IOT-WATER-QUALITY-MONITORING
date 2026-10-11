#include "turbidity_sensor.h"
#include <algorithm>

TurbiditySensor::TurbiditySensor(uint8_t pin) : _pin(pin) {}

void TurbiditySensor::begin() {
    pinMode(_pin, INPUT);
    analogSetPinAttenuation(_pin, ADC_11db);
}

float TurbiditySensor::readFilteredVoltage(int& outRawADC) {
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

float TurbiditySensor::readTurbidity(const CalibrationProfile& cal, int& outRawADC, float& outVoltage, bool& outConnected) {
    outVoltage = readFilteredVoltage(outRawADC);

    // If ADC is totally dead (< 15) or grounded disconnected
    if (outRawADC < 15 || outVoltage < 0.05f) {
        outConnected = false;
        return -1.0f;
    }

    outConnected = true;

    // Optical Turbidity Transfer Curve (0 - 3000 NTU)
    // Clear pure water outputs ~2.5V (or calibrated clear voltage)
    float clearV = cal.turbidityClearVoltage > 0 ? cal.turbidityClearVoltage : 2.50f;

    // Normalized voltage ratio
    float v = outVoltage;
    if (v >= clearV) {
        return 0.0f; // Pure, pristine water
    }

    // Polynomial formula for turbidity module
    // NTU = -1120.4 * (v^2) + 5742.3 * v - 4352.9
    float ntu = -1120.4f * (v * v) + 5742.3f * v - 4352.9f;

    if (ntu < 0.0f) ntu = 0.0f;
    if (ntu > 3000.0f) ntu = 3000.0f;

    return ntu;
}
