#ifndef CALIBRATION_SUBSYSTEM_H
#define CALIBRATION_SUBSYSTEM_H

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

    // In-situ probe calibration calculation routines
    void calibratePHNeutral(float voltage);
    void calibratePHAcid(float voltage);
    void calibrateTDS(float referenceTds, float currentReading);
    void calibrateTurbidityClear(float voltage);

    const CalibrationProfile& getProfile() const { return _activeProfile; }

private:
    Preferences _prefs;
    CalibrationProfile _activeProfile;
};

#endif // CALIBRATION_SUBSYSTEM_H
