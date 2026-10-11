#ifndef SENSOR_MANAGER_H
#define SENSOR_MANAGER_H

#include <Arduino.h>
#include <vector>
#include "../include/types.h"
#include "../include/interfaces.h"
#include "../src/sensors/ph_sensor.h"
#include "../src/sensors/tds_sensor.h"
#include "../src/sensors/turbidity_sensor.h"
#include "../src/sensors/temp_sensor.h"
#include "../src/sensors/ec_sensor.h"
#include "../src/sensors/water_level_sensor.h"

/**
 * SensorManager orchestrates all physical water sensor probes,
 * handles temperature compensation across probes, and populates
 * the standard SensorReading structure.
 */
class SensorManager {
public:
    SensorManager();
    void begin();
    
    // Acquire complete water telemetry packet with temperature compensation
    SensorReading acquireTelemetry(const CalibrationProfile& calProfile);

    // Individual sensor accessors
    TempSensor& getTempSensor() { return _tempSensor; }
    PHSensor& getPHSensor() { return _phSensor; }
    TDSSensor& getTDSSensor() { return _tdsSensor; }
    TurbiditySensor& getTurbiditySensor() { return _turbiditySensor; }
    ECSensor& getECSensor() { return _ecSensor; }
    WaterLevelSensor& getWaterLevelSensor() { return _waterLevelSensor; }

private:
    TempSensor _tempSensor;
    PHSensor _phSensor;
    TDSSensor _tdsSensor;
    TurbiditySensor _turbiditySensor;
    ECSensor _ecSensor;
    WaterLevelSensor _waterLevelSensor;
};

#endif // SENSOR_MANAGER_H
