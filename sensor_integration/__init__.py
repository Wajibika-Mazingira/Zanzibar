"""
GPIO Sensor Integration for Wajibika Mazingira Project

This module provides GPIO sensor integration for the Wajibika Mazingira
environmental monitoring project using Raspberry Pi 5.

The system includes:
- GPIO sensor controller for managing multiple sensors
- Sensor configuration management
- Real-time data collection and processing
- Alert management and callbacks
- System monitoring and status reporting
- Data persistence and backup

Installation:
1. Install required Python packages:
   pip install RPi.GPIO psutil

2. Set up environment variables:
   export GPIO_SYSTEM_ID=wajibika_gpio_sensors
   export GPIO_STATIC_IP=""
   export GPIO_HOSTNAME=wajibika-gpio
   export GPIO_PORT=8080
   export GPIO_DATA_RETENTION_DAYS=30
   export GPIO_BACKUP_ENABLED=true
   export GPIO_ALERT_ENABLED=true
   export GPIO_CALIBRATION_ENABLED=true
   export GPIO_LOG_LEVEL=INFO

3. Run the setup script:
   python gpio_sensor_setup.py

Usage:
   python gpio_sensor_setup.py --setup-sensors
   python gpio_sensor_setup.py --list-sensors
   python gpio_sensor_setup.py --start-monitoring
   python gpio_sensor_setup.py --status
   python gpio_sensor_setup.py --save-data data.json
   python gpio_sensor_setup.py --load-data data.json
   python gpio_sensor_setup.py --cleanup

For more information, see the README file in the sensor_integration directory.
"""

__version__ = "1.0.0"
__author__ = "Wajibika Mazingira Team"
__email__ = "contact@wajibika.org"
__license__ = "MIT"

# Required packages
REQUIRED_PACKAGES = [
    "RPi.GPIO>=0.7.1",
    "psutil>=5.9.0",
    "python-dotenv>=0.19.0",
]

# Sensor types
SENSOR_TYPES = [
    "temperature",
    "humidity",
    "soil_moisture",
    "light",
    "co2",
    "pm25",
    "gps",
    "voltage",
    "current",
    "pressure",
    "uv",
    "no2",
    "so2",
    "o3",
    "wind_speed",
    "wind_direction",
    "rainfall",
    "air_quality",
    "noise",
    "radiation",
    "moisture",
    "conductivity",
    "salinity",
    "ph",
    "orp",
    "redox",
    "chlorine",
    "ammonia",
    "nitrate",
    "phosphate",
    "calcium",
    "magnesium",
    "potassium",
    "sodium",
    "calcium_carbonate",
    "magnesium_carbonate",
    "sodium_carbonate",
    "calcium_oxide",
    "magnesium_oxide",
    "sodium_oxide",
    "calcium_hydroxide",
    "magnesium_hydroxide",
    "sodium_hydroxide",
    "calcium_sulfate",
    "magnesium_sulfate",
    "sodium_sulfate",
    "calcium_chloride",
    "magnesium_chloride",
    "sodium_chloride",
]

# Alert levels
ALERT_LEVELS = ["normal", "low", "medium", "high", "critical", "error"]

# Sensor states
SENSOR_STATES = ["active", "inactive", "error", "calibrating", "maintenance"]

# System status keys
SYSTEM_STATUS_KEYS = [
    "system_id",
    "total_sensors",
    "active_sensors",
    "error_sensors",
    "monitoring_active",
    "thread_alive",
    "data_points",
    "uptime",
    "gps_location"
]

# Error messages
ERROR_MESSAGES = {
    "invalid_gpio_pin": "Invalid GPIO pin: {pin}. Must be between 0 and 40.",
    "sensor_already_exists": "Sensor with ID {id} already exists.",
    "sensor_not_found": "Sensor with ID {id} not found.",
    "monitoring_already_active": "Monitoring is already active.",
    "invalid_sensor_type": "Invalid sensor type: {type}.",
    "sensor_calibration_failed": "Sensor calibration failed.",
    "sensor_read_failed": "Failed to read sensor {id}: {error}",
    "alert_callback_failed": "Alert callback failed: {error}",
}

# Log messages
LOG_MESSAGES = {
    "system_initialized": "Initialized GPIO Sensor Controller (System ID: {system_id})",
    "sensor_added": "Added sensor: {name} (ID: {id})",
    "sensor_removed": "Removed sensor: {id}",
    "monitoring_started": "Started monitoring {count} sensors at {interval}s intervals",
    "monitoring_stopped": "Stopped sensor monitoring",
    "sensor_reading": "Read sensor {id}: {value} {units}",
    "sensor_error": "Error reading sensor {id}: {error}",
    "alert_triggered": "Alert triggered: {sensor_id} - {alert_level} - {value}",
    "data_saved": "Saved {count} data points to {file_path}",
    "data_loaded": "Loaded {count} data points from {file_path}",
    "system_cleanup": "GPIO cleanup completed",
}

# Configuration templates
DEFAULT_SYSTEM_CONFIG = {
    "system_id": "wajibika_gpio_sensors",
    "network_config": {
        "static_ip": "",
        "hostname": "wajibika-gpio",
        "port": 8080,
    },
    "data_retention_days": 30,
    "backup_enabled": True,
    "alert_enabled": True,
    "calibration_enabled": True,
    "log_level": "INFO"
}

DEFAULT_SENSOR_CONFIGS = [
    {
        "id": "temp_greenhouse_1",
        "name": "Greenhouse Temperature Sensor",
        "sensor_type": "temperature",
        "gpio_pin": 4,
        "units": "°C",
        "sampling_rate": 1.0,
        "accuracy": 0.95,
        "alert_thresholds": {
            "high_temp": 35.0,
            "low_temp": 10.0,
            "error": -100.0
        },
        "description": "Monitors temperature in greenhouse environment",
        "location": "Greenhouse Section 1",
        "metadata": {
            "project": "greenhouse_monitoring",
            "area": "section_1",
            "crop_type": "vegetables"
        }
    },
    {
        "id": "hum_greenhouse_1",
        "name": "Greenhouse Humidity Sensor",
        "sensor_type": "humidity",
        "gpio_pin": 5,
        "units": "%RH",
        "sampling_rate": 1.0,
        "accuracy": 0.95,
        "alert_thresholds": {
            "high_humidity": 85.0,
            "low_humidity": 20.0,
            "error": -100.0
        },
        "description": "Monitors humidity in greenhouse environment",
        "location": "Greenhouse Section 1",
        "metadata": {
            "project": "greenhouse_monitoring",
            "area": "section_1",
            "crop_type": "vegetables"
        }
    },
    {
        "id": "soil_moisture_field_1",
        "name": "Field Soil Moisture Sensor",
        "sensor_type": "soil_moisture",
        "gpio_pin": 6,
        "units": "%",
        "sampling_rate": 2.0,
        "accuracy": 0.90,
        "alert_thresholds": {
            "high_moisture": 80.0,
            "low_moisture": 20.0,
            "error": -100.0
        },
        "description": "Monitors soil moisture for agricultural irrigation",
        "location": "Field Section 1",
        "metadata": {
            "project": "precision_agriculture",
            "area": "field_1",
            "crop_type": "cereals"
        }
    },
    {
        "id": "light_greenhouse_1",
        "name": "Greenhouse Light Sensor",
        "sensor_type": "light",
        "gpio_pin": 7,
        "units": "lux",
        "sampling_rate": 1.0,
        "accuracy": 0.90,
        "alert_thresholds": {
            "high_light": 100000.0,
            "low_light": 100.0,
            "error": -1.0
        },
        "description": "Monitors light intensity in greenhouse",
        "location": "Greenhouse Section 1",
        "metadata": {
            "project": "greenhouse_monitoring",
            "area": "section_1",
            "crop_type": "vegetables"
        }
    },
    {
        "id": "co2_greenhouse_1",
        "name": "Greenhouse CO2 Sensor",
        "sensor_type": "co2",
        "gpio_pin": 8,
        "units": "ppm",
        "sampling_rate": 1.0,
        "accuracy": 0.95,
        "alert_thresholds": {
            "high_co2": 2000.0,
            "low_co2": 200.0,
            "error": -100.0
        },
        "description": "Monitors CO2 levels in greenhouse for crop optimization",
        "location": "Greenhouse Section 1",
        "metadata": {
            "project": "greenhouse_monitoring",
            "area": "section_1",
            "crop_type": "vegetables"
        }
    },
]

# Help text
HELP_TEXT = """
GPIO Sensor Integration for Wajibika Mazingira Project

This module provides GPIO sensor integration for the Wajibika Mazingira
environmental monitoring project using Raspberry Pi 5.

Setup and Usage:

1. Install required packages:
   pip install RPi.GPIO psutil python-dotenv

2. Set up environment variables:
   export GPIO_SYSTEM_ID=wajibika_gpio_sensors
   export GPIO_STATIC_IP=""
   export GPIO_HOSTNAME=wajibika-gpio
   export GPIO_PORT=8080
   export GPIO_DATA_RETENTION_DAYS=30
   export GPIO_BACKUP_ENABLED=true
   export GPIO_ALERT_ENABLED=true
   export GPIO_CALIBRATION_ENABLED=true
   export GPIO_LOG_LEVEL=INFO

3. Run the setup script:
   python gpio_sensor_setup.py

Common commands:
   python gpio_sensor_setup.py --setup-sensors
   python gpio_sensor_setup.py --list-sensors
   python gpio_sensor_setup.py --start-monitoring
   python gpio_sensor_setup.py --status
   python gpio_sensor_setup.py --save-data data.json
   python gpio_sensor_setup.py --load-data data.json
   python gpio_sensor_setup.py --cleanup

For more information, see the README file in the sensor_integration directory.
"""

# Version information
__version__ = "1.0.0"
__author__ = "Wajibika Mazingira Team"
__email__ = "contact@wajibika.org"
__license__ = "MIT"

# Module exports
__all__ = [
    "SensorConfig",
    "SystemConfig",
    "GPIOSensorController",
    "GPIOSensor",
    "GPIOSensorData",
    "SensorType",
    "SensorState",
    "AlertLevel",
    "get_controller",
    "get_system_config",
    "setup_sensors",
    "read_all_sensors",
    "REQUIRED_PACKAGES",
    "SENSOR_TYPES",
    "ALERT_LEVELS",
    "SENSOR_STATES",
    "SYSTEM_STATUS_KEYS",
    "ERROR_MESSAGES",
    "LOG_MESSAGES",
    "DEFAULT_SYSTEM_CONFIG",
    "DEFAULT_SENSOR_CONFIGS",
    "HELP_TEXT",
]
