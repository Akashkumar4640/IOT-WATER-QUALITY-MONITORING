#ifndef CALIBRATION_MANAGER_H
#define CALIBRATION_MANAGER_H

#include <Arduino.h>
#include <Preferences.h>
#include "../include/types.h"

class CalibrationManager {
public:
    CalibrationManager();
    void begin();
    CalibrationProfile loadProfile();
    bool saveProfile(const CalibrationProfile& profile);
    bool resetToDefaults();

    // In-situ probe calibration calculation helpers
    void calibratePHNeutral(float voltage);
    void calibratePHAcid(float voltage);
    void calibrateTDS(float referenceTds, float currentReading);
    void calibrateTurbidityClear(float voltage);

private:
    Preferences _prefs;
    CalibrationProfile _activeProfile;
};

#endif // CALIBRATION_MANAGER_H
