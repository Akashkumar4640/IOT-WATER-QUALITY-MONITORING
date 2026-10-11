#ifndef CONFIG_H
#define CONFIG_H

#include <Arduino.h>

// =========================================================================
//  ESP32 WATER QUALITY ANALYZER - HARDWARE & FIRMWARE CONFIGURATION
// =========================================================================

// Device Identity
#define DEVICE_ID           "WQ-ESP32-001"
#define DEVICE_NAME         "ESP32 Water Quality Analyzer"
#define DEVICE_TOKEN        "wq-sec-token-esp32-001" // Configure matching server token
#define FIRMWARE_VERSION    "1.0.4-PROD"

// Wi-Fi Credentials (Configure for your local network)
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"
#define WIFI_TIMEOUT_MS     15000

// Primary Backend Server REST Endpoint
// Replace with your Node.js server LAN IP (e.g., http://192.168.1.100:5000/api/iot/readings)
#define SERVER_HOST         "http://192.168.1.50:5000"
#define SERVER_ENDPOINT     "/api/iot/readings"

// Optional MQTT Configuration
#define ENABLE_MQTT         false
#define MQTT_BROKER         "broker.hivemq.com"
#define MQTT_PORT           1883
#define MQTT_TOPIC_READINGS "water-quality/WQ-ESP32-001/readings"
#define MQTT_TOPIC_STATUS   "water-quality/WQ-ESP32-001/status"

// Measurement Polling Interval
#define SAMPLING_INTERVAL_MS 5000    // Read and transmit every 5 seconds
#define ADC_SAMPLE_COUNT     30      // Number of ADC oversamples for noise filtering

// Hardware GPIO Pinout Assignments (Adjust for your specific ESP32 board layout)
// Note: Use ADC1 pins (GPIO 32 - 39) when Wi-Fi is active to avoid ADC2 Wi-Fi conflict!
#define PIN_PH_SENSOR        34      // ADC1_CH6 (Analog pH Probe Board)
#define PIN_TDS_SENSOR       35      // ADC1_CH7 (Analog TDS Sensor Board)
#define PIN_TURBIDITY_SENSOR 32      // ADC1_CH4 (Analog Turbidity Board)
#define PIN_TEMP_DS18B20     4       // Digital GPIO 4 (DS18B20 1-Wire Data with 4.7kΩ pullup)
#define PIN_EC_SENSOR        33      // ADC1_CH5 (Optional EC Sensor)
#define PIN_WATER_LEVEL      36      // ADC1_CH0 / SENSOR_VP (Optional Water Level Sensor)

#define PIN_STATUS_LED       2       // Built-in ESP32 Blue LED for connection status

// ADC & Voltage Calibration Constants
#define ESP32_ADC_VREF       3.30f   // Reference voltage (3.3V)
#define ESP32_ADC_RESOLUTION 4095.0f // 12-bit ADC (0 - 4095)
#define ADC_ATTENUATION      ADC_11db // 0 - 3.3V range

// Debug & Serial Monitor Flag
#define DEBUG_MODE           true    // Set to false for silent production deployment

#endif // CONFIG_H
