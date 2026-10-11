#ifndef INTERFACES_H
#define INTERFACES_H

#include <Arduino.h>
#include "types.h"

/**
 * Pure virtual interface for all water quality sensors.
 * Enables plug-and-play addition of new sensors (e.g., ORP, DO, Nitrate).
 */
class ISensor {
public:
    virtual ~ISensor() = default;

    // Initialize sensor pins and hardware peripherals
    virtual void init() = 0;

    // Read current electrical value & update engineering units
    virtual float read() = 0;

    // Check if the physical probe is connected (within electrical validity window)
    virtual bool isConnected() = 0;

    // Return the raw ADC reading
    virtual int getRawADC() const = 0;

    // Return the calculated analog voltage
    virtual float getVoltage() const = 0;

    // Sensor name identifier (e.g. "pH", "TDS", "Turbidity")
    virtual const char* getName() const = 0;

    // Sensor measurement unit (e.g. "pH", "ppm", "NTU", "°C")
    virtual const char* getUnit() const = 0;
};

#endif // INTERFACES_H
