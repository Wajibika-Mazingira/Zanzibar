import time
import os
import threading
from datetime import datetime, timedelta
from typing import List, Dict, Callable, Optional
import json
import logging
import RPi.GPIO as GPIO
from enum import Enum, auto

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Enums for sensor types and states
class SensorType(Enum):
    TEMPERATURE = auto()
    HUMIDITY = auto()
    SOIL_MOISTURE = auto()
    LIGHT = auto()
    CO2 = auto()
    PM25 = auto()
    GPS = auto()
    VOLTAGE = auto()
    CURRENT = auto()
    PRESSURE = auto()
    UV = auto()
    NO2 = auto()
    SO2 = auto()
    O3 = auto()
    WIND_SPEED = auto()
    WIND_DIRECTION = auto()
    RAINFALL = auto()

class SensorState(Enum):
    ACTIVE = auto()
    INACTIVE = auto()
    ERROR = auto()
    CALIBRATING = auto()
    MAINTENANCE = auto()

class AlertLevel(Enum):
    NORMAL = auto()
    LOW = auto()
    MEDIUM = auto()
    HIGH = auto()
    CRITICAL = auto()
    ERROR = auto()

# Configuration classes
class SensorConfig:
    def __init__(
        self,
        id: str,
        name: str,
        sensor_type: SensorType,
        gpio_pin: Optional[int] = None,
        units: str = "",
        sampling_rate: float = 1.0,
        accuracy: float = 0.95,
        alert_thresholds: Optional[Dict[str, float]] = None,
        description: str = "",
        location: str = "",
        metadata: Optional[Dict] = None
    ):
        self.id = id
        self.name = name
        self.sensor_type = sensor_type
        self.gpio_pin = gpio_pin
        self.units = units
        self.sampling_rate = sampling_rate
        self.accuracy = accuracy
        self.alert_thresholds = alert_thresholds or {}
        self.description = description
        self.location = location
        self.metadata = metadata or {}
        
        # Validate GPIO pin for digital sensors
        if gpio_pin is not None and sensor_type in [SensorType.TEMPERATURE, SensorType.HUMIDITY, SensorType.SOIL_MOISTURE, SensorType.LIGHT]:
            if gpio_pin < 0 or gpio_pin > 40:
                raise ValueError(f"Invalid GPIO pin: {gpio_pin}. Must be between 0 and 40.")

class SystemConfig:
    def __init__(
        self,
        system_id: str = "wajibika_gpio_sensors",
        network_config: Optional[Dict] = None,
        data_retention_days: int = 30,
        backup_enabled: bool = True,
        alert_enabled: bool = True,
        calibration_enabled: bool = True
    ):
        self.system_id = system_id
        self.network_config = network_config or {}
        self.data_retention_days = data_retention_days
        self.backup_enabled = backup_enabled
        self.alert_enabled = alert_enabled
        self.calibration_enabled = calibration_enabled

# Data classes
class GPIOSensorData:
    def __init__(
        self,
        sensor_id: str,
        timestamp: datetime,
        value: float,
        units: str,
        quality_score: float = 1.0,
        metadata: Optional[Dict] = None,
        alert_level: str = "normal",
        status: str = "ok"
    ):
        self.sensor_id = sensor_id
        self.timestamp = timestamp
        self.value = value
        self.units = units
        self.quality_score = quality_score
        self.metadata = metadata or {}
        self.alert_level = alert_level
        self.status = status
        
        # Calculate age in minutes
        self.age_minutes = (datetime.now() - timestamp).total_seconds() / 60

# Main controller class
class GPIOSensorController:
    def __init__(self, config: SystemConfig):
        self.config = config
        self.sensors: Dict[str, GPIOSensor] = {}
        self.sensor_data: List[GPIOSensorData] = []
        self.is_monitoring = False
        self.monitoring_thread = None
        self.alert_callbacks: List[Callable] = []
        self.logger = logger
        
        # Initialize GPIO
        GPIO.setmode(GPIO.BCM)
        GPIO.setwarnings(False)
        
        self.logger.info(f"Initialized GPIO Sensor Controller (System ID: {config.system_id})")
    
    def add_sensor(self, config: SensorConfig):
        """Add a new GPIO sensor to the controller"""
        if config.id in self.sensors:
            raise ValueError(f"Sensor with ID {config.id} already exists")
        
        sensor = GPIOSensor(self, config)
        self.sensors[config.id] = sensor
        self.logger.info(f"Added sensor: {config.name} (ID: {config.id}, Type: {config.sensor_type.name})")
    
    def remove_sensor(self, sensor_id: str):
        """Remove a sensor from the controller"""
        if sensor_id in self.sensors:
            del self.sensors[sensor_id]
            self.logger.info(f"Removed sensor: {sensor_id}")
        else:
            raise ValueError(f"Sensor with ID {sensor_id} not found")
    
    def start_monitoring(self, interval: float = 1.0):
        """Start monitoring all sensors"""
        if self.is_monitoring:
            self.logger.warning("Monitoring is already active")
            return
        
        self.is_monitoring = True
        self.monitoring_thread = threading.Thread(
            target=self._monitor_sensors,
            args=(interval,),
            daemon=True
        )
        self.monitoring_thread.start()
        self.logger.info(f"Started monitoring {len(self.sensors)} sensors at {interval}s intervals")
    
    def _monitor_sensors(self, interval: float):
        """Internal method to monitor all sensors"""
        while self.is_monitoring:
            try:
                for sensor_id, sensor in self.sensors.items():
                    if sensor.state == SensorState.ACTIVE:
                        value = sensor.read_sensor()
                        if value is not None:
                            sensor_data = GPIOSensorData(
                                sensor_id=sensor_id,
                                timestamp=datetime.now(),
                                value=value,
                                units=sensor.config.units,
                                quality_score=0.8,
                                metadata={"source": "gpio"},
                                alert_level="normal",
                                status=sensor.state.value
                            )
                            self.sensor_data.append(sensor_data)
                
                # Clean old data
                self._cleanup_old_data()
                
                time.sleep(interval)
                
            except Exception as e:
                self.logger.error(f"Error in sensor monitoring: {str(e)}")
                time.sleep(interval)
    
    def _cleanup_old_data(self):
        """Remove old sensor data based on retention policy"""
        cutoff_time = datetime.now() - timedelta(days=self.config.data_retention_days)
        initial_count = len(self.sensor_data)
        
        self.sensor_data = [data for data in self.sensor_data if data.timestamp > cutoff_time]
        
        if len(self.sensor_data) < initial_count:
            self.logger.info(f"Cleaned up {initial_count - len(self.sensor_data)} old data points")
    
    def stop_monitoring(self):
        """Stop monitoring all sensors"""
        self.is_monitoring = False
        if self.monitoring_thread:
            self.monitoring_thread.join(timeout=10)
        self.logger.info("Stopped sensor monitoring")
    
    def add_alert_callback(self, callback: Callable):
        """Add alert callback function"""
        self.alert_callbacks.append(callback)
    
    def remove_alert_callback(self, callback: Callable):
        """Remove alert callback function"""
        if callback in self.alert_callbacks:
            self.alert_callbacks.remove(callback)
    
    def get_sensor_data(self, sensor_id: str, limit: int = 100) -> List[GPIOSensorData]:
        """Get sensor data for a specific sensor"""
        return [data for data in self.sensor_data if data.sensor_id == sensor_id][-limit:]
    
    def get_all_sensor_data(self, limit: int = 1000) -> List[GPIOSensorData]:
        """Get all sensor data"""
        return self.sensor_data[-limit:]
    
    def get_sensor_status(self, sensor_id: str) -> Dict:
        """Get sensor status"""
        if sensor_id in self.sensors:
            return {
                "id": sensor_id,
                "name": self.sensors[sensor_id].config.name,
                "type": self.sensors[sensor_id].config.sensor_type.value,
                "status": self.sensors[sensor_id].state.value,
                "last_reading": self.sensors[sensor_id].last_reading,
                "data_points": len([d for d in self.sensor_data if d.sensor_id == sensor_id]),
                "alerts_count": len([d for d in self.sensor_data if d.sensor_id == sensor_id and d.alert_level != "normal"])
            }
        return {}
    
    def get_system_status(self) -> Dict:
        """Get overall system status"""
        active_sensors = sum(1 for sensor in self.sensors.values() if sensor.state == SensorState.ACTIVE)
        error_sensors = sum(1 for sensor in self.sensors.values() if sensor.state == SensorState.ERROR)
        
        return {
            "system_id": self.config.system_id,
            "total_sensors": len(self.sensors),
            "active_sensors": active_sensors,
            "error_sensors": error_sensors,
            "monitoring_active": self.is_monitoring,
            "thread_alive": self.monitoring_thread.is_alive() if self.monitoring_thread else False,
            "data_points": len(self.sensor_data),
            "uptime": time.time() - self.start_time if hasattr(self, 'start_time') else 0,
            "gps_location": self.config.network_config.get("static_ip", "Unknown")
        }
    
    def save_data_to_file(self, file_path: str):
        """Save sensor data to file"""
        import json
        data = []
        for sensor_data in self.sensor_data:
            data.append({
                "sensor_id": sensor_data.sensor_id,
                "timestamp": sensor_data.timestamp.isoformat(),
                "value": sensor_data.value,
                "units": sensor_data.units,
                "quality_score": sensor_data.quality_score,
                "metadata": sensor_data.metadata,
                "alert_level": sensor_data.alert_level,
                "status": sensor_data.status
            })
        
        with open(file_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        self.logger.info(f"Saved {len(data)} data points to {file_path}")
    
    def load_data_from_file(self, file_path: str):
        """Load sensor data from file"""
        import json
        with open(file_path, 'r') as f:
            data = json.load(f)
        
        for item in data:
            sensor_data = GPIOSensorData(
                sensor_id=item["sensor_id"],
                timestamp=datetime.fromisoformat(item["timestamp"]),
                value=item["value"],
                units=item["units"],
                quality_score=item["quality_score"],
                metadata=item["metadata"],
                alert_level=item.get("alert_level", "normal"),
                status=item.get("status", "ok")
            )
            self.sensor_data.append(sensor_data)
        
        self.logger.info(f"Loaded {len(data)} data points from {file_path}")
    
    def cleanup(self):
        """Cleanup resources"""
        self.stop_monitoring()
        GPIO.cleanup()
        self.logger.info("GPIO cleanup completed")

class GPIOSensor:
    """GPIO sensor class"""
    
    def __init__(self, controller: GPIOSensorController, config: SensorConfig):
        self.controller = controller
        self.config = config
        self.state = SensorState.ACTIVE
        self.last_reading: Optional[datetime] = None
        self.last_value: Optional[float] = None
        self.error_count = 0
        self.data_points = 0
        self.alert_count = 0
        
        # Setup GPIO pin
        if self.config.gpio_pin is not None:
            GPIO.setup(self.config.gpio_pin, GPIO.IN, pull_up_down=GPIO.PUD_UP)
        
        self.controller.logger.info(f"Created GPIO sensor: {config.name} (ID: {config.id})")
    
    def read_sensor(self) -> Optional[float]:
        """Read sensor value"""
        try:
            if self.config.sensor_type in [SensorType.TEMPERATURE, SensorType.HUMIDITY]:
                # Simulate sensor reading (replace with actual sensor reading)
                if self.config.sensor_type == SensorType.TEMPERATURE:
                    value = 20.0 + (hash(self.config.id) % 100) / 10.0  # Simulated temperature
                else:
                    value = 50.0 + (hash(self.config.id) % 50) / 10.0  # Simulated humidity
            elif self.config.sensor_type == SensorType.SOIL_MOISTURE:
                value = (hash(self.config.id) % 100) / 100.0 * 100.0  # 0-100%
            elif self.config.sensor_type == SensorType.LIGHT:
                value = (hash(self.config.id) % 1000) + 100.0  # 100-1100 lux
            elif self.config.sensor_type == SensorType.CO2:
                value = 400.0 + (hash(self.config.id) % 600)  # 400-1000 ppm
            elif self.config.sensor_type == SensorType.PM25:
                value = (hash(self.config.id) % 50) / 10.0  # 0-5 µg/m³
            elif self.config.sensor_type == SensorType.GPS:
                # GPS reading would require external library
                value = 0.0  # Placeholder
            else:
                value = 0.0
            
            self.last_value = value
            self.last_reading = datetime.now()
            self.data_points += 1
            
            # Check for alerts
            self.check_alerts(value)
            
            return value
            
        except Exception as e:
            self.error_count += 1
            self.state = SensorState.ERROR
            self.controller.logger.error(f"Error reading sensor {self.config.id}: {str(e)}")
            return None
    
    def check_alerts(self, value: float):
        """Check for alerts based on thresholds"""
        alert_level = "normal"
        
        if self.config.alert_thresholds:
            for alert_name, threshold in self.config.alert_thresholds.items():
                if alert_name.startswith("high_") and value > threshold:
                    alert_level = "high"
                elif alert_name.startswith("low_") and value < threshold:
                    alert_level = "low"
                elif alert_name == "error" and value < 0:
                    alert_level = "error"
        
        if alert_level != "normal":
            self.alert_count += 1
            sensor_data = GPIOSensorData(
                sensor_id=self.config.id,
                timestamp=datetime.now(),
                value=value,
                units=self.config.units,
                quality_score=0.8,
                metadata={"alert": alert_level},
                alert_level=alert_level,
                status=self.state.value
            )
            self.controller.sensor_data.append(sensor_data)
            
            # Call alert callbacks
            for callback in self.controller.alert_callbacks:
                try:
                    callback(self.config.id, alert_level, value)
                except Exception as e:
                    self.controller.logger.error(f"Alert callback error: {str(e)}")
    
    def calibrate(self):
        """Calibrate sensor"""
        # Implement calibration logic
        self.controller.logger.info(f"Calibrating sensor {self.config.id}")
        # Add calibration implementation here
    
    def get_status(self) -> Dict:
        """Get sensor status"""
        return {
            "id": self.config.id,
            "name": self.config.name,
            "type": self.config.sensor_type.value,
            "state": self.state.value,
            "last_reading": self.last_reading.isoformat() if self.last_reading else None,
            "last_value": self.last_value,
            "error_count": self.error_count,
            "data_points": self.data_points,
            "alert_count": self.alert_count,
            "config": {
                "gpio_pin": self.config.gpio_pin,
                "units": self.config.units,
                "sampling_rate": self.config.sampling_rate,
                "accuracy": self.config.accuracy
            }
        }

# Global controller instance
_controller: Optional[GPIOSensorController] = None

def get_controller() -> GPIOSensorController:
    """Get or create the global controller instance"""
    global _controller
    if _controller is None:
        config = get_system_config()
        _controller = GPIOSensorController(config)
        _controller.start_time = time.time()
    return _controller

def get_system_config() -> SystemConfig:
    """Get system configuration from environment variables"""
    return SystemConfig(
        system_id=os.getenv("GPIO_SYSTEM_ID", "wajibika_gpio_sensors"),
        network_config={
            "static_ip": os.getenv("GPIO_STATIC_IP", ""),
            "hostname": os.getenv("GPIO_HOSTNAME", "wajibika-gpio"),
        },
        data_retention_days=int(os.getenv("GPIO_DATA_RETENTION_DAYS", "30")),
        backup_enabled=os.getenv("GPIO_BACKUP_ENABLED", "true").lower() == "true",
        alert_enabled=os.getenv("GPIO_ALERT_ENABLED", "true").lower() == "true",
        calibration_enabled=os.getenv("GPIO_CALIBRATION_ENABLED", "true").lower() == "true"
    )

def setup_sensors():
    """Setup sensors for the system"""
    controller = get_controller()
    return controller

def read_all_sensors():
    """Read all sensors"""
    controller = get_controller()
    
    for sensor_id, sensor in controller.sensors.items():
        value = sensor.read_sensor()
        if value is not None:
            sensor_data = GPIOSensorData(
                sensor_id=sensor_id,
                timestamp=datetime.now(),
                value=value,
                units=sensor.config.units,
                quality_score=0.8,
                metadata={"source": "gpio"},
                alert_level="normal",
                status=sensor.state.value
            )
            controller.sensor_data.append(sensor_data)
    
    return controller.get_system_status()

if __name__ == "__main__":
    # Test the GPIO sensor controller
    print("Testing GPIO Sensor Controller...")
    
    # Setup sensors
    controller = setup_sensors()
    
    # Read all sensors
    status = read_all_sensors()
    print(f"System Status: {status}")
    
    # Get individual sensor status
    for sensor_id in controller.sensors.keys():
        sensor_status = controller.get_sensor_status(sensor_id)
        print(f"Sensor {sensor_id}: {sensor_status}")
    
    # Save data
    controller.save_data_to_file("/home/pi/test_sensor_data.json")
    
    print("Test completed successfully!")
    
    # Cleanup
    controller.cleanup()