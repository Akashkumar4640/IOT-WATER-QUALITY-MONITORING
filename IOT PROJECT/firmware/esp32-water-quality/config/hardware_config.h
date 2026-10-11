#ifndef HARDWARE_CONFIG_H
#define HARDWARE_CONFIG_H

#include <Arduino.h>

// Hardware Pinout Assignments (ADC1 pins 32-39 used during active Wi-Fi)
#define PIN_PH_SENSOR        34      // ADC1_CH6 (Analog pH Probe)
#define PIN_TDS_SENSOR       35      // ADC1_CH7 (Analog TDS Probe)
#define PIN_TURBIDITY_SENSOR 32      // ADC1_CH4 (Analog Turbidity Probe)
#define PIN_TEMP_DS18B20     4       // Digital GPIO 4 (DS18B20 1-Wire Data)
#define PIN_EC_SENSOR        33      // ADC1_CH5 (Analog EC Probe)
#define PIN_WATER_LEVEL      36      // ADC1_CH0 (Analog Water Level Sensor)
#define PIN_STATUS_LED       2       // Built-in Status Indicator LED

// ADC Electrical Parameters
#define ESP32_ADC_VREF       3.30f   // Reference voltage (3.3V)
#define ESP32_ADC_RESOLUTION 4095.0f // 12-bit ADC (0 - 4095)
#define ADC_SAMPLE_COUNT     30      // Oversampling window size

#endif // HARDWARE_CONFIG_H
