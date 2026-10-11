# 🌊 IoT pH Water Quality and Content Analyzer — Hardware Integrated System

A full-stack, hardware-integrated IoT platform designed for real-time water quality monitoring, multi-probe calibration, AI potability inference, data quality auditing, cross-location sample comparison, anomaly alert evaluation, and diagnostic reporting using ESP32 microcontrollers.

---

## 📐 System Architecture

```text
WATER SAMPLE (Borewell / Tank / RO / River)
       │
       ▼
[ Physical Sensors: pH (BNC), DS18B20 Temp, TDS, Turbidity, EC, Water Level ]
       │
       ▼
[ ESP32 Microcontroller: FreeRTOS / Arduino C++ Firmware ]
   ├── 12-Bit ADC Filtering (30-sample median filter) & Voltage Conversion
   ├── NVS Flash Calibration Profile (pH 2/3-Point, TDS K-Factor, Turbidity Zero)
   ├── Wi-Fi Manager with Auto-Reconnect & Buffered Local Retry Queue
   └── Primary: HTTP REST Client (POST /api/iot/readings) + Secondary: MQTT
       │
       ▼ (Wi-Fi / LAN / Internet)
[ Node.js + Express Backend Server ]
   ├── Device Authentication (`X-Device-Id`, `X-Device-Token`)
   ├── Telemetry Sanitizer & Ingestion Pipeline (Invalid/Stale Rejections Logged)
   ├── SQLite 3 Embedded Persistent Database (ACID Transactions & Indexed Tables)
   ├── Real-Time Alert Engine (Stateful Deduplication & Auto-Resolution)
   ├── Deterministic Water Quality Index (WQI) Weighted Evaluator (0–100)
   ├── AI/ML Random Forest Potability & Anomaly Inference Service
   └── Socket.IO Real-Time Telemetry Broadcast
       │
       ▼ (WebSockets / HTTP)
[ React + TypeScript + Tailwind CSS Real-Time Dashboard ]
   ├── Dark Environmental Luxury Interface with Glassmorphism
   ├── Hardware Mode (Strict real data) vs Demo Mode (Simulation with badge)
   ├── Live Telemetry Stream Cards & Micro-Sparklines
   ├── Multi-Channel Continuous Waveform Charts (5m, 30m, 1h, 24h)
   ├── Dedicated pH Analysis Suite (Bounds, Distribution, Anomaly Warnings)
   ├── AI Water Intelligence (Potability, Anomaly Index, Interactive Sandbox)
   ├── Water Sample Registry & Cross-Location Comparative Benchmark
   ├── Telemetry Data Quality Monitor (Rejection audit, Validity rate)
   ├── Step-by-Step Hardware Probe Calibration Studio (pH, TDS, Turbidity)
   ├── Advanced Hardware Diagnostics (Raw ADC counts, voltages, network ping)
   ├── Device Registry & Token Generator
   └── Formal Water Quality Analysis PDF & CSV Report Generator
```

---

## 1. 🔌 Hardware Requirements & Wiring Guidance

| Component | Description | ESP32 GPIO | Channel / Interface | Voltage / Level Protection |
| :--- | :--- | :--- | :--- | :--- |
| **ESP32 DevKit V1** | Dual-core 240MHz MCU with Wi-Fi & BLE | — | — | 3.3V Logic Level |
| **Analog pH Sensor** | BNC glass electrode probe + signal board | `GPIO 34` | ADC1_CH6 | 1kΩ / 2kΩ Voltage Divider (if 5V board) |
| **DS18B20 Temp Probe**| Waterproof stainless steel temperature probe | `GPIO 4` | Digital 1-Wire | 4.7 kΩ pull-up resistor to 3.3V |
| **Analog TDS Sensor** | Total Dissolved Solids probe | `GPIO 35` | ADC1_CH7 | Direct to GPIO 35 (at 3.3V VCC) |
| **Turbidity Sensor** | Optical turbidity detection module | `GPIO 32` | ADC1_CH4 | 1kΩ / 2kΩ Voltage Divider (if 5V board) |
| **Analog EC Sensor** | Electrical conductivity probe | `GPIO 33` | ADC1_CH5 | Direct or Divider |
| **Water Level Sensor**| Submersible resistive or ultrasonic sensor | `GPIO 36` (VP)| ADC1_CH0 | 0 – 3.3V range |

> [!WARNING]
> **3.3V ADC Safety:** The ESP32 ADC inputs are strictly **3.3V tolerant**. If your analog sensor board operates on 5V and outputs 0–5V, use a **1kΩ / 2kΩ resistor voltage divider** before wiring to the ESP32 pin.
>
> **ADC1 Pin Usage:** All analog inputs use **ADC1 (GPIO 32–39)** because ADC2 is disabled when the ESP32 Wi-Fi radio is active.

---

## 2. 🚀 Quick Start Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **PlatformIO** or **Arduino IDE** (for ESP32 firmware)

---

### Step 1: Start the Backend Server

```bash
cd server
npm install
node server.js
```
*Backend runs on: `http://localhost:5000` (API & WebSockets active with SQLite persistent storage)*

---

### Step 2: Start the React Frontend Dashboard

```bash
cd client
npm install
npm run dev
```
*Open your browser at: `http://localhost:5173`*

---

### Step 3: Run the ESP32 Hardware Simulator (Optional for Testing)

To test live telemetry streaming, WebSocket updates, and alert triggers without physical hardware:

```bash
cd scripts
node simulate_esp32.js --interval 3000
```

---

## 3. 💾 ESP32 Firmware Installation & Configuration

Firmware source files are located in `/firmware/esp32-water-quality/`.

### Configuration
Open `firmware/esp32-water-quality/include/config.h` and configure your Wi-Fi credentials and server address:

```cpp
#define WIFI_SSID           "YOUR_WIFI_NAME"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"
#define SERVER_HOST         "http://192.168.1.50:5000" // Replace with backend IP
#define SERVER_ENDPOINT     "/api/iot/readings"
#define DEVICE_ID           "WQ-ESP32-001"
#define DEVICE_TOKEN        "wq-sec-token-esp32-001"
```

### Uploading Firmware
- **PlatformIO:** Open `/firmware/esp32-water-quality/` in VSCode PlatformIO and click **Upload**.
- **Arduino IDE:** Open `/firmware/esp32-water-quality/src/main.cpp`, install libraries (`ArduinoJson`, `OneWire`, `DallasTemperature`), select **ESP32 Dev Module**, and click **Upload**.

---

## 4. 🧮 Water Quality Score (WQI) Formula

The system computes a deterministic Water Quality Index from **0 to 100** based on standard Weighted Arithmetic Water Quality Index method (WAWQI):

$$\text{WQI} = \frac{\sum (W_i \times Q_i)}{\sum W_i}$$

Where:
- $W_{pH} = 0.30$, Ideal $= 7.00$, Safe $= [6.5, 8.5]$
- $W_{TDS} = 0.25$, Safe $< 500\text{ ppm}$
- $W_{Turbidity} = 0.25$, Safe $< 5.0\text{ NTU}$
- $W_{Temp} = 0.10$, Safe $= [15, 30^\circ\text{C}]$
- $W_{EC} = 0.10$, Safe $< 800\text{ }\mu\text{S/cm}$

**Score Tiers:**
- **90–100:** EXCELLENT (Compliant with drinking water guidelines)
- **70–89:** GOOD (Safe for general domestic use)
- **50–69:** MODERATE / FAIR (Pre-filtration recommended)
- **< 50:** CRITICAL / POOR (Significant contamination detected)

---

## 5. 🤖 AI / Machine Learning Module

- **Classification:** Multi-Variate Random Forest & Ionic Anomaly Ensemble.
- **Outputs:** Potability Verdict, Anomaly Score (0–100), Feature Importance Weights, and Prescriptive Advice.
- **Simulation Sandbox:** Real-time parameter adjusting to evaluate "What-If" scenarios.

---

## 6. 🧪 Physical Sensor Calibration Workflow

1. Navigate to **Calibration Studio** in the dashboard.
2. Select **pH Electrode Probe**.
3. Rinse probe in deionized water and place in **pH 7.00 Neutral Buffer Solution**.
4. Allow millivolt reading to stabilize.
5. Repeat for **pH 4.01 Acid Buffer** and **pH 10.01 Base Buffer**.
6. Click **Execute & Save pH Calibration** to store parameters in the backend and microcontroller NVS flash.

---

## 7. 🛡️ Security & Device Authentication

Every ESP32 transmission is authenticated using HTTP headers:
- `X-Device-Id`: Unique identifier (e.g., `WQ-ESP32-001`)
- `X-Device-Token`: Cryptographic hardware secret token (configured in Device Management)

---

## 8. 📊 Reports & Data Export

- **PDF Diagnostic Report:** Click **Download Official PDF Report** on the Reports view for formal parameter audit documents.
- **CSV Data Export:** Click **Export CSV Dataset** for raw telemetry rows with millivolt counts and timestamps.

