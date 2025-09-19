# models.py
from django.db import models
from django.utils import timezone
import uuid

class ParkingSpot(models.Model):
    spot_number = models.IntegerField(unique=True)
    is_occupied = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Spot {self.spot_number} - {'Occupied' if self.is_occupied else 'Available'}"

class Car(models.Model):
    license_plate = models.CharField(max_length=20, unique=True)
    make = models.CharField(max_length=50)
    model = models.CharField(max_length=50)
    color = models.CharField(max_length=30)
    owner_name = models.CharField(max_length=100)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.license_plate} - {self.make} {self.model}"

class ParkingEvent(models.Model):
    EVENT_TYPES = [
        ('ENTER', 'Enter'),
        ('EXIT', 'Exit'),
    ]
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    car = models.ForeignKey(Car, on_delete=models.CASCADE)
    parking_spot = models.ForeignKey(ParkingSpot, on_delete=models.CASCADE, null=True, blank=True)
    event_type = models.CharField(max_length=5, choices=EVENT_TYPES)
    timestamp = models.DateTimeField(default=timezone.now)
    
    class Meta:
        ordering = ['-timestamp']
    
    def __str__(self):
        return f"{self.car.license_plate} - {self.event_type} at {self.timestamp}"