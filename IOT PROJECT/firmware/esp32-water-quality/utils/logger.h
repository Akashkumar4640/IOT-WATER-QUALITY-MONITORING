#ifndef FIRMWARE_LOGGER_H
#define FIRMWARE_LOGGER_H

#include <Arduino.h>

enum LogLevel {
    LOG_LEVEL_DEBUG,
    LOG_LEVEL_INFO,
    LOG_LEVEL_WARN,
    LOG_LEVEL_ERROR
};

class Logger {
public:
    static void init(unsigned long baudRate = 115200);
    static void log(LogLevel level, const char* tag, const char* format, ...);
    static void debug(const char* tag, const char* format, ...);
    static void info(const char* tag, const char* format, ...);
    static void warn(const char* tag, const char* format, ...);
    static void error(const char* tag, const char* format, ...);
};

#endif // FIRMWARE_LOGGER_H
