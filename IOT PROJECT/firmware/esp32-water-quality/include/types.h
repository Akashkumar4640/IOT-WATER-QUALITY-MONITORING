#ifndef TYPES_H
#define TYPES_H

#include <Arduino.h>

// Raw sensor electrical readings
struct RawADCValues {
    int phRaw;
    float phVoltage;
    int tdsRaw;
    float tdsVoltage;
    int turbidityRaw;
    float turbidityVoltage;
    int ecRaw;
    float ecVoltage;
    int waterLevelRaw;
    float waterLevelVoltage;
};

// Engineering unit converted readings with connection flags
struct SensorReading {
    float ph;
    bool phConnected;

    float temperature;
    bool tempConnected;

    float tds;
    bool tdsConnected;

    float turbidity;
    bool turbidityConnected;

    float ec;
    bool ecConnected;

    float waterLevel;
    bool waterLevelConnected;

    RawADCValues raw;
};

// Device metadata and health status
struct DeviceInfo {
    char deviceId[32];
    char deviceName[48];
    char deviceToken[64];
    char firmwareVersion[16];
    char connectionType[16];
    int rssi;
    char ipAddress[24];
    unsigned long uptimeSeconds;
};

// System alert structure
struct AlertNotification {
    char deviceId[32];
    char sensor[24];
    float value;
    char threshold[32];
    char severity[16]; // "CRITICAL", "WARNING", "HARDWARE"
    char message[128];
    unsigned long timestamp;
};

// Calibration parameters stored in NVS flash
struct CalibrationProfile {
    // pH Calibration (y = slope * V + intercept)
    float phSlope;
    float phIntercept;
    float phNeutralVoltage; // 7.0 buffer reference (typ. 2.5V)
    float phAcidVoltage;    // 4.0 buffer reference (typ. 3.0V)

    // TDS Calibration (K-Factor)
    float tdsKFactor;

    // Turbidity Calibration (Zero reference voltage)
    float turbidityClearVoltage;

    // EC Calibration
    float ecCellConstant;
    
    // Water Level Calibration (Dry and Max ADC)
    int waterLevelMinRaw;
    int waterLevelMaxRaw;
};

// Discrete water sample snapshot
struct WaterSample {
    char sampleId[36];
    char deviceId[32];
    unsigned long timestamp;
    float ph;
    float temperature;
    float tds;
    float turbidity;
    float ec;
    float waterLevel;
    bool isCalibrated;
};

// Evaluated water quality analysis output
struct WaterQualityAnalysis {
    float wqiScore;
    char status[16]; // "EXCELLENT", "GOOD", "FAIR", "POOR", "CRITICAL"
    char grade[4];
    bool potable;
    char primaryConcern[64];
    int activeSensorsCount;
};

#endif // TYPES_H
