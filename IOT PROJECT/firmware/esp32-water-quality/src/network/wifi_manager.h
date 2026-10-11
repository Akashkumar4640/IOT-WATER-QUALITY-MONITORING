#ifndef WIFI_MANAGER_H
#define WIFI_MANAGER_H

#include <Arduino.h>
#include <WiFi.h>
#include "../include/config.h"

class WiFiManager {
public:
    WiFiManager();
    void begin();
    bool isConnected();
    void maintainConnection();
    String getIPAddress();
    int getRSSI();

private:
    unsigned long _lastReconnectAttempt;
};

#endif // WIFI_MANAGER_H
