#include "calibration_manager.h"

#define PREFS_NAMESPACE "wq_cal"

CalibrationManager::CalibrationManager() {}

void CalibrationManager::begin() {
    _prefs.begin(PREFS_NAMESPACE, false);
    _activeProfile = loadProfile();
}

CalibrationProfile CalibrationManager::loadProfile() {
    CalibrationProfile profile;
    profile.phSlope = _prefs.getFloat("ph_slope", 3.5f);
    profile.phIntercept = _prefs.getFloat("ph_intercept", 0.0f);
    profile.phNeutralVoltage = _prefs.getFloat("ph_neut_v", 1.50f);
    profile.phAcidVoltage = _prefs.getFloat("ph_acid_v", 2.03f);

    profile.tdsKFactor = _prefs.getFloat("tds_k", 1.0f);
    profile.turbidityClearVoltage = _prefs.getFloat("turb_clear_v", 2.50f);
    profile.ecCellConstant = _prefs.getFloat("ec_k", 1.0f);

    return profile;
}

bool CalibrationManager::saveProfile(const CalibrationProfile& profile) {
    _activeProfile = profile;
    _prefs.putFloat("ph_slope", profile.phSlope);
    _prefs.putFloat("ph_intercept", profile.phIntercept);
    _prefs.putFloat("ph_neut_v", profile.phNeutralVoltage);
    _prefs.putFloat("ph_acid_v", profile.phAcidVoltage);

    _prefs.putFloat("tds_k", profile.tdsKFactor);
    _prefs.putFloat("turb_clear_v", profile.turbidityClearVoltage);
    _prefs.putFloat("ec_k", profile.ecCellConstant);

    return true;
}

bool CalibrationManager::resetToDefaults() {
    CalibrationProfile def;
    def.phSlope = 3.5f;
    def.phIntercept = 0.0f;
    def.phNeutralVoltage = 1.50f;
    def.phAcidVoltage = 2.03f;
    def.tdsKFactor = 1.0f;
    def.turbidityClearVoltage = 2.50f;
    def.ecCellConstant = 1.0f;

    return saveProfile(def);
}

void CalibrationManager::calibratePHNeutral(float voltage) {
    _activeProfile.phNeutralVoltage = voltage;
    saveProfile(_activeProfile);
}

void CalibrationManager::calibratePHAcid(float voltage) {
    _activeProfile.phAcidVoltage = voltage;
    // Recalculate slope: (7.0 - 4.01) / (neutral_V - acid_V)
    float deltaV = _activeProfile.phNeutralVoltage - voltage;
    if (abs(deltaV) > 0.1f) {
        _activeProfile.phSlope = (7.0f - 4.01f) / deltaV;
    }
    saveProfile(_activeProfile);
}

void CalibrationManager::calibrateTDS(float referenceTds, float currentReading) {
    if (currentReading > 0.0f) {
        _activeProfile.tdsKFactor = (referenceTds / currentReading) * _activeProfile.tdsKFactor;
        saveProfile(_activeProfile);
    }
}

void CalibrationManager::calibrateTurbidityClear(float voltage) {
    _activeProfile.turbidityClearVoltage = voltage;
    saveProfile(_activeProfile);
}
