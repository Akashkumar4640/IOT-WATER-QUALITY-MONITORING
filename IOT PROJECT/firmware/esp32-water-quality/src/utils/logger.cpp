#include "logger.h"

void SerialLogger::printBanner() {
    if (!DEBUG_MODE) return;
    Serial.println("\n==================================================");
    Serial.println("     IoT pH WATER QUALITY & CONTENT ANALYZER      ");
    Serial.println("           ESP32 HARDWARE CONTROLLER              ");
    Serial.println("==================================================");
    Serial.println("Device ID: " + String(DEVICE_ID));
    Serial.println("Firmware:  " + String(FIRMWARE_VERSION));
    Serial.println("==================================================\n");
}

void SerialLogger::printTelemetry(
    const String& wifiStatus, 
    const String& ip, 
    const SensorReading& reading, 
    const String& serverStatus,
    int nextIntervalSec
) {
    if (!DEBUG_MODE) return;

    Serial.println("\n==================================================");
    Serial.println("         IoT WATER QUALITY ANALYZER               ");
    Serial.println("==================================================");
    Serial.println("WiFi:        " + wifiStatus + " (" + ip + ")");
    Serial.println("Device:      " + String(DEVICE_ID));

    if (reading.phConnected) {
        Serial.printf("pH:          %.2f pH  (ADC: %d, %.2fV)\n", reading.ph, reading.raw.phRaw, reading.raw.phVoltage);
    } else {
        Serial.println("pH:          [Sensor Not Connected]");
    }

    if (reading.tempConnected) {
        Serial.printf("Temperature: %.1f C\n", reading.temperature);
    } else {
        Serial.println("Temperature: [Sensor Not Connected]");
    }

    if (reading.tdsConnected) {
        Serial.printf("TDS:         %.0f ppm (ADC: %d, %.2fV)\n", reading.tds, reading.raw.tdsRaw, reading.raw.tdsVoltage);
    } else {
        Serial.println("TDS:         [Sensor Not Connected]");
    }

    if (reading.turbidityConnected) {
        Serial.printf("Turbidity:   %.1f NTU (ADC: %d, %.2fV)\n", reading.turbidity, reading.raw.turbidityRaw, reading.raw.turbidityVoltage);
    } else {
        Serial.println("Turbidity:   [Sensor Not Connected]");
    }

    if (reading.ecConnected) {
        Serial.printf("EC:          %.0f uS/cm (ADC: %d)\n", reading.ec, reading.raw.ecRaw);
    }

    if (reading.waterLevelConnected) {
        Serial.printf("Water Level: %.0f %%\n", reading.waterLevel);
    }

    Serial.println("--------------------------------------------------");
    Serial.println("Sending data to backend...");
    Serial.println("Server Response: " + serverStatus);
    Serial.printf("# Next reading in %d seconds\n", nextIntervalSec);
    Serial.println("==================================================");
}
