#ifndef COMM_WIFI_MANAGER_H
#define COMM_WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>

class WiFiManager {
public:
    WiFiManager(const char* ssid, const char* password);
    bool connect(unsigned long timeoutMs = 15000);
    bool isConnected();
    void maintainConnection();
    int getRSSI();
    String getIP();

private:
    const char* _ssid;
    const char* _password;
    unsigned long _lastReconnectAttempt;
};

#endif // COMM_WIFI_MANAGER_H
