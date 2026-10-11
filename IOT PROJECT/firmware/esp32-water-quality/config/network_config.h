#ifndef NETWORK_CONFIG_H
#define NETWORK_CONFIG_H

// Wi-Fi Credentials
#define WIFI_SSID           "YOUR_WIFI_SSID"
#define WIFI_PASSWORD       "YOUR_WIFI_PASSWORD"
#define WIFI_TIMEOUT_MS     15000

// Primary Backend Server REST Endpoint
#define SERVER_HOST         "http://192.168.1.50:5000"
#define SERVER_ENDPOINT     "/api/iot/readings"

// Optional MQTT Configuration
#define ENABLE_MQTT         false
#define MQTT_BROKER         "broker.hivemq.com"
#define MQTT_PORT           1883
#define MQTT_TOPIC_READINGS "water-quality/WQ-ESP32-001/readings"
#define MQTT_TOPIC_STATUS   "water-quality/WQ-ESP32-001/status"

#endif // NETWORK_CONFIG_H
