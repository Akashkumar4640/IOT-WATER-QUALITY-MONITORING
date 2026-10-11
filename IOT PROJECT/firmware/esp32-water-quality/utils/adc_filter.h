#ifndef ADC_FILTER_H
#define ADC_FILTER_H

#include <Arduino.h>

class ADCFilter {
public:
    // Read oversampled ADC with outlier rejection
    static int readMedianOversample(uint8_t pin, int sampleCount = 30);

    // Convert raw 12-bit ADC reading to voltage (accounting for reference Vref)
    static float adcToVoltage(int rawAdc, float vref = 3.30f, float resolution = 4095.0f);
};

#endif // ADC_FILTER_H
