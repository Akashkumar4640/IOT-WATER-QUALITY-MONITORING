#include "adc_filter.h"
#include <algorithm>
#include <vector>

int ADCFilter::readMedianOversample(uint8_t pin, int sampleCount) {
    if (sampleCount <= 0) sampleCount = 1;
    std::vector<int> samples(sampleCount);

    for (int i = 0; i < sampleCount; i++) {
        samples[i] = analogRead(pin);
        delayMicroseconds(500);
    }

    // Sort to extract median and discard electrical spikes
    std::sort(samples.begin(), samples.end());

    // Average the middle 50% of samples
    int startIdx = sampleCount / 4;
    int endIdx = sampleCount - startIdx;
    long sum = 0;
    int count = 0;

    for (int i = startIdx; i < endIdx; i++) {
        sum += samples[i];
        count++;
    }

    return count > 0 ? (int)(sum / count) : samples[sampleCount / 2];
}

float ADCFilter::adcToVoltage(int rawAdc, float vref, float resolution) {
    if (resolution <= 0.0f) resolution = 4095.0f;
    return (rawAdc * vref) / resolution;
}
