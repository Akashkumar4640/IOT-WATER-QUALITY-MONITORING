#include "logger.h"
#include <stdarg.h>

void Logger::init(unsigned long baudRate) {
    Serial.begin(baudRate);
    while (!Serial && millis() < 2000) {
        delay(10);
    }
}

void Logger::log(LogLevel level, const char* tag, const char* format, ...) {
    char message[256];
    va_list args;
    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);

    const char* levelStr = "INFO";
    switch (level) {
        case LOG_LEVEL_DEBUG: levelStr = "DEBUG"; break;
        case LOG_LEVEL_INFO:  levelStr = "INFO";  break;
        case LOG_LEVEL_WARN:  levelStr = "WARN";  break;
        case LOG_LEVEL_ERROR: levelStr = "ERROR"; break;
    }

    Serial.printf("[%lu][%s][%s] %s\n", millis(), levelStr, tag ? tag : "SYS", message);
}

void Logger::debug(const char* tag, const char* format, ...) {
    char message[256];
    va_list args;
    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);
    Logger::log(LOG_LEVEL_DEBUG, tag, "%s", message);
}

void Logger::info(const char* tag, const char* format, ...) {
    char message[256];
    va_list args;
    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);
    Logger::log(LOG_LEVEL_INFO, tag, "%s", message);
}

void Logger::warn(const char* tag, const char* format, ...) {
    char message[256];
    va_list args;
    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);
    Logger::log(LOG_LEVEL_WARN, tag, "%s", message);
}

void Logger::error(const char* tag, const char* format, ...) {
    char message[256];
    va_list args;
    va_start(args, format);
    vsnprintf(message, sizeof(message), format, args);
    va_end(args);
    Logger::log(LOG_LEVEL_ERROR, tag, "%s", message);
}
