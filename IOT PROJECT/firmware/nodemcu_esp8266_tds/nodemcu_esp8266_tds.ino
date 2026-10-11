/*
 * ==============================================================================================
 *  Project: IoT-Enabled Drinking Water Suitability Checker
 *  Hardware: ESP8266 NodeMCU + Analog TDS Sensor Module (0 - 1000 ppm)
 *  Platform: Integrated IoT Water Quality Web Platform
 *  Author: Antigravity IoT Engineering
 *  Budget: < ₹2000 total hardware cost
 * ==============================================================================================
 *
 *  Pin Connections:
 *  - TDS Sensor Module VCC  --> NodeMCU 3.3V (or 5V / VIN)
 *  - TDS Sensor Module GND  --> NodeMCU GND
 *  - TDS Sensor Module AOUT --> NodeMCU A0 (ADC Analog Input)
 *
 *  Working Principle:
 *  1. TDS probe immersed into water sample.
 *  2. Module measures electrical conductivity, providing analog voltage output.
 *  3. NodeMCU samples pin A0, applies median filtering for noise reduction.
 *  4. Converts analog voltage to TDS (ppm) via standard temperature-compensated calibration formula.
 *  5. Connects to Wi-Fi and transmits live telemetry via HTTP POST to:
 *     http://<SERVER_IP>:5000/api/tds/telemetry
 * ==============================================================================================
 */

#include <ESP8266WiFi.h>
#include <ESP8266HTTPClient.h>
#include <WiFiClient.h>

// ---------------- Wi-Fi Configuration ----------------
const char* WIFI_SSID     = "YOUR_WIFI_NAME";
const char* WIFI_PASSWORD = "YOUR_WIFI_PASSWORD";

// ---------------- Web Platform Endpoint ----------------
// Replace with the IP address of your host running the web application, or your deployed domain
// Local: "http://<YOUR_LOCAL_IP>:5000/api/tds"
// Production: "https://<YOUR_DOMAIN>/api/tds"
const char* SERVER_URL    = "http://192.168.1.100:5000/api/tds";
const char* DEVICE_ID     = "NODEMCU-TDS-01";

// ---------------- Hardware Pin ----------------
const int TDS_PIN = A0; // NodeMCU dedicated analog ADC pin

// ---------------- Sampling Parameters ----------------
#define SCOUNT 30            // Number of sampling points
int analogBuffer[SCOUNT];    // Store analog reading array
int analogBufferTemp[SCOUNT];
int analogBufferIndex = 0;
int copyIndex = 0;

float averageVoltage = 0.0;
float tdsValue = 0.0;
float temperature = 25.0;    // Reference water temperature (°C)

// Median filter algorithm to eliminate sensor electrical noise
int getMedianNum(int bArray[], int iFilterLen) {
  int bTab[iFilterLen];
  for (byte i = 0; i < iFilterLen; i++) {
    bTab[i] = bArray[i];
  }
  int i, j, bTemp;
  for (j = 0; j < iFilterLen - 1; j++) {
    for (i = 0; i < iFilterLen - j - 1; i++) {
      if (bTab[i] > bTab[i + 1]) {
        bTemp = bTab[i];
        bTab[i] = bTab[i + 1];
        bTab[i + 1] = bTemp;
      }
    }
  }
  if ((iFilterLen & 1) > 0)
    bTemp = bTab[(iFilterLen - 1) / 2];
  else
    bTemp = (bTab[iFilterLen / 2] + bTab[iFilterLen / 2 - 1]) / 2;
  return bTemp;
}

void setup() {
  Serial.begin(115200);
  pinMode(TDS_PIN, INPUT);

  delay(1000);
  Serial.println();
  Serial.println("===================================================================");
  Serial.println("   IoT Drinking Water Suitability Checker (ESP8266 NodeMCU)       ");
  Serial.println("===================================================================");

  // Connect to Wi-Fi
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("[Wi-Fi] Connecting to ");
  Serial.println(WIFI_SSID);

  int retries = 0;
  while (WiFi.status() != WL_CONNECTED && retries < 40) {
    delay(500);
    Serial.print(".");
    retries++;
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println();
    Serial.println("[Wi-Fi] Connected successfully!");
    Serial.print("[Wi-Fi] IP Address: ");
    Serial.println(WiFi.localIP());
  } else {
    Serial.println();
    Serial.println("[Wi-Fi] Connection timeout. Sensor loop will continue sampling.");
  }
}

void loop() {
  static unsigned long analogSampleTimepoint = millis();
  // Sample every 40 ms
  if (millis() - analogSampleTimepoint > 40U) {
    analogSampleTimepoint = millis();
    analogBuffer[analogBufferIndex] = analogRead(TDS_PIN);
    analogBufferIndex++;
    if (analogBufferIndex == SCOUNT)
      analogBufferIndex = 0;
  }

  static unsigned long printTimepoint = millis();
  // Compute and transmit every 3 seconds
  if (millis() - printTimepoint > 3000U) {
    printTimepoint = millis();
    for (copyIndex = 0; copyIndex < SCOUNT; copyIndex++) {
      analogBufferTemp[copyIndex] = analogBuffer[copyIndex];
    }

    // Read median analog ADC value
    int medianAdc = getMedianNum(analogBufferTemp, SCOUNT);

    // Convert ADC to voltage (ESP8266 NodeMCU 10-bit ADC: 0-1023 -> 0-3.3V)
    averageVoltage = (float)medianAdc * (3.3 / 1024.0);

    // Temperature compensation formula:
    // fFinalResult(25^C) = fFinalResult(current)/(1.0+0.02*(fTP-25.0));
    float compensationCoefficient = 1.0 + 0.02 * (temperature - 25.0);
    float compensationVoltage = averageVoltage / compensationCoefficient;

    // Standard 3rd-order polynomial TDS conversion formula
    tdsValue = (133.42 * pow(compensationVoltage, 3) 
               - 255.86 * pow(compensationVoltage, 2) 
               + 857.39 * compensationVoltage) * 0.5;

    if (tdsValue < 0) tdsValue = 0;

    Serial.println("-------------------------------------------------------------------");
    Serial.print("Raw ADC Value:      "); Serial.println(medianAdc);
    Serial.print("Analog Voltage:     "); Serial.print(averageVoltage, 3); Serial.println(" V");
    Serial.print("Computed TDS:       "); Serial.print(tdsValue, 1); Serial.println(" ppm");

    // Indicative suitability verdict output in serial monitor
    if (tdsValue <= 300.0) {
      Serial.println("Suitability Status: [DRINKABLE (indicative)]");
      Serial.println("Likely Components:  Moderate minerals – likely calcium, magnesium, bicarbonates.");
    } else if (tdsValue <= 500.0) {
      Serial.println("Suitability Status: [HIGH TDS – USE WITH CAUTION (indicative)]");
      Serial.println("Likely Components:  High minerals/salts – likely calcium, magnesium; possibly sodium, chloride, sulfate.");
    } else {
      Serial.println("Suitability Status: [NOT RECOMMENDED FOR DRINKING (indicative)]");
      Serial.println("Likely Components:  Very high salts/minerals – likely high sodium, chloride, sulfate, nitrates, along with calcium and magnesium.");
    }

    // Send HTTP POST telemetry to the website
    sendTelemetryToServer(tdsValue, averageVoltage, medianAdc);
  }
}

void sendTelemetryToServer(float tds, float voltage, int rawAdc) {
  if (WiFi.status() == WL_CONNECTED) {
    WiFiClient client;
    HTTPClient http;

    http.begin(client, SERVER_URL);
    http.addHeader("Content-Type", "application/json");

    // Determine status string
    String statusStr = "Normal TDS Range";
    if (tds <= 50.0) {
      statusStr = "Very Low TDS";
    } else if (tds <= 300.0) {
      statusStr = "Normal TDS Range";
    } else if (tds <= 500.0) {
      statusStr = "Moderate TDS";
    } else {
      statusStr = "High TDS";
    }

    // Construct telemetry JSON payload matching POST /api/tds:
    // { "tds_ppm": 32, "raw_adc": 23.4, "status": "Normal TDS Range", "device_key": "tds-demo-2026" }
    String jsonPayload = "{";
    jsonPayload += "\"tds_ppm\":" + String(tds, 1) + ",";
    jsonPayload += "\"raw_adc\":" + String(rawAdc) + ",";
    jsonPayload += "\"status\":\"" + statusStr + "\",";
    jsonPayload += "\"device_key\":\"tds-demo-2026\"";
    jsonPayload += "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.print("[HTTP POST] Success! Response Code: ");
      Serial.println(httpResponseCode);
      String response = http.getString();
      Serial.println("[HTTP POST] Response: " + response);
    } else {
      Serial.print("[HTTP POST] Failed, error code: ");
      Serial.println(httpResponseCode);
    }

    http.end();
  } else {
    Serial.println("[Wi-Fi] Offline - telemetry skipped.");
  }
}
