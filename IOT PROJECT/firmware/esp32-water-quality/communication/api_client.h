#ifndef COMM_API_CLIENT_H
#define COMM_API_CLIENT_H

#include <Arduino.h>
#include <HTTPClient.h>
#include "../include/types.h"

class ApiClient {
public:
    ApiClient(const char* host, const char* endpoint, const char* token);
    bool sendTelemetry(const String& payloadJson);
    bool fetchCalibrationProfile(CalibrationProfile& outProfile);

private:
    const char* _host;
    const char* _endpoint;
    const char* _token;
};

#endif // COMM_API_CLIENT_H
