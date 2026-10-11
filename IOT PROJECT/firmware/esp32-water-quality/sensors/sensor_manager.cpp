#include "sensor_manager.h"
#include "../include/config.h"

SensorManager::SensorManager()
    : _tempSensor(PIN_TEMP_DS18B20),
      _phSensor(PIN_PH_SENSOR),
      _tdsSensor(PIN_TDS_SENSOR),
      _turbiditySensor(PIN_TURBIDITY_SENSOR),
      _ecSensor(PIN_EC_SENSOR),
      _waterLevelSensor(PIN_WATER_LEVEL) {}

void SensorManager::begin() {
    _tempSensor.begin();
    _phSensor.begin();
    _tdsSensor.begin();
    _turbiditySensor.begin();
    _ecSensor.begin();
    _waterLevelSensor.begin();
}

SensorReading SensorManager::acquireTelemetry(const CalibrationProfile& calProfile) {
    SensorReading reading;
    memset(&reading, 0, sizeof(SensorReading));

    // 1. Read water temperature first (used for temperature compensation)
    reading.temperature = _tempSensor.readTemperature(reading.tempConnected);

    // 2. Read pH Probe with temperature compensation
    reading.ph = _phSensor.readPH(
        reading.temperature,
        calProfile,
        reading.raw.phRaw,
        reading.raw.phVoltage,
        reading.phConnected
    );

    // 3. Read TDS Probe with temperature compensation
    reading.tds = _tdsSensor.readTDS(
        reading.temperature,
        calProfile,
        reading.raw.tdsRaw,
        reading.raw.tdsVoltage,
        reading.tdsConnected
    );

    // 4. Read Turbidity Probe
    reading.turbidity = _turbiditySensor.readTurbidity(
        calProfile,
        reading.raw.turbidityRaw,
        reading.raw.turbidityVoltage,
        reading.turbidityConnected
    );

    // 5. Read EC Probe
    reading.ec = _ecSensor.readEC(
        reading.temperature,
        calProfile,
        reading.raw.ecRaw,
        reading.raw.ecVoltage,
        reading.ecConnected
    );

    // 6. Read Water Level Probe
    reading.waterLevel = _waterLevelSensor.readLevel(
        calProfile,
        reading.raw.waterLevelRaw,
        reading.raw.waterLevelVoltage,
        reading.waterLevelConnected
    );

    return reading;
}
