#ifndef SYSTEM_CONFIG_H
#define SYSTEM_CONFIG_H

// Device Identity
#define DEVICE_ID           "WQ-ESP32-001"
#define DEVICE_NAME         "ESP32 Water Quality Analyzer"
#define DEVICE_TOKEN        "wq-sec-token-esp32-001"
#define FIRMWARE_VERSION    "1.0.4-PROD"

// Measurement Polling Interval
#define SAMPLING_INTERVAL_MS 5000    // Telemetry transmission every 5 seconds
#define DEBUG_MODE           true

#endif // SYSTEM_CONFIG_H
