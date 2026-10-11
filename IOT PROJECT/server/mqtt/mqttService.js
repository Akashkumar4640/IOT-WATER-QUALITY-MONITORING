const mqtt = require('mqtt');
const { processIncomingReading } = require('../iot/iotReceiver');

let client = null;
let isConnected = false;
let mqttEnabled = false;

function initMQTT(brokerUrl = process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883', enabled = false) {
  mqttEnabled = enabled || process.env.ENABLE_MQTT === 'true';

  if (!mqttEnabled) {
    console.log('[MQTT] MQTT service is in OPTIONAL / DISABLED mode (HTTP REST is primary).');
    return;
  }

  try {
    console.log(`[MQTT] Connecting to broker: ${brokerUrl}...`);
    client = mqtt.connect(brokerUrl, {
      clientId: `WQ_Server_${Math.random().toString(16).substring(2, 8)}`,
      clean: true,
      connectTimeout: 5000,
      reconnectPeriod: 10000
    });

    client.on('connect', () => {
      isConnected = true;
      console.log('[MQTT] Connected to MQTT broker successfully.');
      
      // Subscribe to all water-quality readings
      client.subscribe('water-quality/+/readings', (err) => {
        if (err) console.error('[MQTT] Subscription error:', err);
        else console.log('[MQTT] Subscribed to topic: water-quality/+/readings');
      });

      client.subscribe('water-quality/+/status', (err) => {
        if (!err) console.log('[MQTT] Subscribed to topic: water-quality/+/status');
      });
    });

    client.on('message', async (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        const topicParts = topic.split('/');
        const deviceId = topicParts[1] || payload.deviceId;

        if (topic.endsWith('/readings')) {
          await processIncomingReading({ ...payload, deviceId });
        }
      } catch (err) {
        console.error('[MQTT] Failed to process incoming message:', err.message);
      }
    });

    client.on('error', (err) => {
      console.warn('[MQTT] Broker connection error (will retry):', err.message);
    });

    client.on('offline', () => {
      isConnected = false;
      console.warn('[MQTT] Client went offline');
    });
  } catch (err) {
    console.error('[MQTT] Initialization error:', err);
  }
}

function getMqttStatus() {
  return {
    enabled: mqttEnabled,
    connected: isConnected,
    broker: process.env.MQTT_BROKER_URL || 'mqtt://broker.hivemq.com:1883',
    topics: ['water-quality/+/readings', 'water-quality/+/status', 'water-quality/+/alerts']
  };
}

module.exports = { initMQTT, getMqttStatus };
