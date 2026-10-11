#include <Arduino.h>
#include "include/config.h"
#include "include/types.h"
#include "src/sensors/ph_sensor.h"
#include "src/sensors/temp_sensor.h"
#include "src/sensors/tds_sensor.h"
#include "src/sensors/turbidity_sensor.h"
#include "src/sensors/ec_sensor.h"
#include "src/sensors/water_level_sensor.h"
#include "src/calibration/calibration_manager.h"
#include "src/network/wifi_manager.h"
#include "src/network/api_client.h"
#include "src/network/mqtt_client.h"
#include "src/utils/logger.h"

// Instantiate System Modules
WiFiManager wifiManager;
APIClient apiClient;
MQTTClientManager mqttManager;
CalibrationManager calManager;

PHSensor phSensor(PIN_PH_SENSOR);
TempSensor tempSensor(PIN_TEMP_DS18B20);
TDSSensor tdsSensor(PIN_TDS_SENSOR);
TurbiditySensor turbSensor(PIN_TURBIDITY_SENSOR);
ECSensor ecSensor(PIN_EC_SENSOR);
WaterLevelSensor levelSensor(PIN_WATER_LEVEL);

CalibrationProfile activeCal;
unsigned long lastSampleTime = 0;

void setup() {
    Serial.begin(115200);
    delay(1000);

    SerialLogger::printBanner();

    // 1. Initialize NVS Calibration Parameters
    calManager.begin();
    activeCal = calManager.loadProfile();

    // 2. Initialize Physical Sensor Drivers
    phSensor.begin();
    tempSensor.begin();
    tdsSensor.begin();
    turbSensor.begin();
    ecSensor.begin();
    levelSensor.begin();

    // 3. Connect to Wi-Fi
    wifiManager.begin();

    // 4. Initialize MQTT (if enabled)
    mqttManager.begin();

    Serial.println("[System] Initialization complete. Starting telemetry loop.\n");
}

void loop() {
    // Keep Wi-Fi and MQTT connected
    wifiManager.maintainConnection();
    mqttManager.loop();

    unsigned long currentMillis = millis();

    if (currentMillis - lastSampleTime >= SAMPLING_INTERVAL_MS) {
        lastSampleTime = currentMillis;

        SensorReading reading;

        // 1. Read Temperature first (used for temperature compensation in pH/TDS/EC)
        reading.temperature = tempSensor.readTemperature(reading.tempConnected);
        float currentTemp = reading.tempConnected ? reading.temperature : 25.0f;

        // 2. Read pH Sensor
        reading.ph = phSensor.readPH(
            currentTemp, 
            activeCal, 
            reading.raw.phRaw, 
            reading.raw.phVoltage, 
            reading.phConnected
        );

        // 3. Read TDS Sensor
        reading.tds = tdsSensor.readTDS(
            currentTemp, 
            activeCal, 
            reading.raw.tdsRaw, 
            reading.raw.tdsVoltage, 
            reading.tdsConnected
        );

        // 4. Read Turbidity Sensor
        reading.turbidity = turbSensor.readTurbidity(
            activeCal, 
            reading.raw.turbidityRaw, 
            reading.raw.turbidityVoltage, 
            reading.turbidityConnected
        );

        // 5. Read Optional EC Sensor
        reading.ec = ecSensor.readEC(
            currentTemp, 
            activeCal, 
            reading.raw.ecRaw, 
            reading.raw.ecVoltage, 
            reading.ecConnected
        );

        // 6. Read Optional Water Level Sensor
        reading.waterLevel = levelSensor.readLevel(
            reading.raw.waterLevelRaw, 
            reading.raw.waterLevelVoltage, 
            reading.waterLevelConnected
        );

        // 7. Transmit Telemetry over HTTP REST
        String serverResponse = "SKIPPED (No Wi-Fi)";
        if (wifiManager.isConnected()) {
            bool sent = apiClient.sendTelemetry(reading, serverResponse);
            if (sent) {
                serverResponse = "SUCCESS (" + serverResponse + ")";
            }
        }

        // 8. Publish via MQTT if enabled
        mqttManager.publishTelemetry(reading);

        // 9. Serial Monitor telemetry logging
        String wifiState = wifiManager.isConnected() ? "CONNECTED" : "DISCONNECTED";
        SerialLogger::printTelemetry(
            wifiState, 
            wifiManager.getIPAddress(), 
            reading, 
            serverResponse, 
            SAMPLING_INTERVAL_MS / 1000
        );
    }

    delay(20); // Yield to FreeRTOS watchdog
}
