# ESP32 Hardware Wiring, Pinout, and Electrical Safety Guide

## ⚠️ Critical Electrical Compatibility Warning

> [!WARNING]
> **ESP32 GPIO Voltage Limit:** The ESP32 ADC inputs are strictly **3.3V tolerant**. Applying 5.0V directly to any ESP32 GPIO pin will **permanently damage the microcontroller SoC**.
> 
> Many analog water quality sensor boards (such as standard Analog pH meters, DF-Robot Turbidity sensors, and industrial TDS amplifiers) are powered by **5.0V** and produce an analog output in the **0.0V – 5.0V range**. You **MUST** use a resistor voltage divider or operational-amplifier buffer before connecting to an ESP32 ADC pin!

---

## 1. Pinout Summary Table

| Sensor / Module | Sensor Board VCC | Output Signal | ESP32 GPIO | ADC Channel | Protection / Level Shifting Required |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Analog pH Probe Board** | 5.0V or 3.3V | Analog Voltage (0 - 5V) | `GPIO 34` | ADC1_CH6 | **Yes (Resistor Divider: 1kΩ / 2kΩ)** if powered at 5V |
| **DS18B20 Temp Probe** | 3.3V or 5.0V | 1-Wire Digital | `GPIO 4` | Digital GPIO | **4.7 kΩ Pull-Up Resistor** between DATA & 3.3V |
| **Analog TDS Sensor** | 3.3V ~ 5.0V | Analog Voltage (0 - 2.3V) | `GPIO 35` | ADC1_CH7 | Direct to GPIO 35 (if powered at 3.3V) |
| **Turbidity Sensor Board** | 5.0V | Analog Voltage (0 - 4.5V) | `GPIO 32` | ADC1_CH4 | **Yes (Resistor Divider: 1kΩ / 2kΩ)** |
| **Analog EC Sensor** | 3.3V ~ 5.0V | Analog Voltage (0 - 3.0V) | `GPIO 33` | ADC1_CH5 | Voltage Divider if output exceeds 3.3V |
| **Water Level Sensor** | 3.3V | Analog Voltage (0 - 3.3V) | `GPIO 36` (VP) | ADC1_CH0 | Direct to GPIO 36 |
| **Status LED Indicator** | Internal | Digital Output | `GPIO 2` | Digital | Internal Blue LED |

> [!NOTE]
> **Why ADC1 (GPIO 32–39)?** When the ESP32 Wi-Fi radio is active, **ADC2 (GPIO 0, 2, 4, 12-15, 25-27) is disabled or locked by the Wi-Fi driver**. All analog sensor pins must be allocated strictly to **ADC1 pins** (GPIO 32, 33, 34, 35, 36, 39).

---

## 2. Voltage Divider Circuit for 5V Analog Sensors

For 5V sensor outputs (e.g. Turbidity, pH amplifier output), scale down 0–5V to 0–3.3V:

```
Sensor Analog Out (0 - 5.0V)
          │
         [R1: 1.0 kΩ]
          │
          ├───────────────► ESP32 ADC Pin (GPIO 34 / GPIO 32) [Max 3.3V]
          │
         [R2: 2.0 kΩ]
          │
         GND (Common Ground)
```

$$\text{V}_{\text{ADC}} = \text{V}_{\text{Sensor}} \times \frac{R_2}{R_1 + R_2} = 5.0\text{V} \times \frac{2000}{1000 + 2000} = 3.33\text{V}$$

---

## 3. DS18B20 Waterproof Temperature Sensor Connection

The DS18B20 uses Dallas 1-Wire protocol. A pull-up resistor is mandatory:

```
  ESP32 3.3V ──────┬──────────────────────── DS18B20 VCC (Red Wire)
                   │
                 [4.7 kΩ]
                   │
  ESP32 GPIO 4 ────┴──────────────────────── DS18B20 DATA (Yellow / White Wire)
  
  ESP32 GND ──────────────────────────────── DS18B20 GND (Black Wire)
```

---

## 4. Power Supply & Grounding Best Practices

1. **Common Ground:** Ensure all sensor power grounds and the ESP32 ground pin are bonded together to a single common ground bus.
2. **Decoupling Capacitors:** Place a **0.1 µF ceramic capacitor** and a **10 µF electrolytic capacitor** across the power rails of analog sensor boards to reduce electrical noise caused by Wi-Fi transmission bursts.
3. **BNC Probe Handling:** pH and EC probes are high-impedance devices. Never touch the glass bulb with bare fingers or wipe with dry cloth (electrostatic discharge). Keep the probe submerged in **3M KCl storage solution** when not in use.
