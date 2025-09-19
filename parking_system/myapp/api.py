
# api.py
from ninja import NinjaAPI, Schema
from ninja.pagination import paginate
from django.shortcuts import get_object_or_404
from typing import List, Optional
from datetime import datetime
from .models import ParkingSpot, Car, ParkingEvent

api = NinjaAPI()

# Schemas
class ParkingSpotSchema(Schema):
    id: int
    spot_number: int
    is_occupied: bool
    updated_at: datetime

class CarSchema(Schema):
    id: int
    license_plate: str
    make: str
    model: str
    color: str
    owner_name: str
    created_at: datetime

class ParkingEventSchema(Schema):
    id: str
    car: CarSchema
    parking_spot: Optional[ParkingSpotSchema]
    event_type: str
    timestamp: datetime

class ParkingStatusSchema(Schema):
    total_spots: int
    occupied_spots: int
    available_spots: int
    occupancy_rate: float

# Helper function to generate random events
def generate_random_parking_event():
    import random
    
    CAR_MAKES = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Tesla', 'Nissan']
    CAR_MODELS = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Truck', 'Wagon']
    CAR_COLORS = ['Red', 'Blue', 'Black', 'White', 'Silver', 'Gray', 'Green']
    FIRST_NAMES = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma']
    LAST_NAMES = ['Smith', 'Johnson', 'Brown', 'Davis', 'Wilson', 'Garcia', 'Miller']
    
    # Ensure we have parking spots
    if ParkingSpot.objects.count() == 0:
        # Create 50 spots if none exist
        for i in range(1, 51):
            ParkingSpot.objects.create(spot_number=i)
    
    # 65% chance of entry, 35% chance of exit
    event_type = random.choices(['ENTER', 'EXIT'], weights=[65, 35])[0]
    
    if event_type == 'ENTER':
        # Find available spots
        available_spots = ParkingSpot.objects.filter(is_occupied=False)
        if available_spots.exists():
            spot = random.choice(available_spots)
            
            # Create or get a random car
            license_plate = f"{random.choice('ABCDEFGHIJK')}{random.randint(100, 999)}{random.choice('XYZ')}"
            car, created = Car.objects.get_or_create(
                license_plate=license_plate,
                defaults={
                    'make': random.choice(CAR_MAKES),
                    'model': random.choice(CAR_MODELS),
                    'color': random.choice(CAR_COLORS),
                    'owner_name': f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}"
                }
            )
            
            # Mark spot as occupied
            spot.is_occupied = True
            spot.save()
            
            # Create parking event
            ParkingEvent.objects.create(
                car=car,
                parking_spot=spot,
                event_type='ENTER'
            )
    else:
        # Find occupied spots for exit
        occupied_spots = ParkingSpot.objects.filter(is_occupied=True)
        if occupied_spots.exists():
            spot = random.choice(occupied_spots)
            
            # Get the car from the last entry event for this spot
            last_entry = ParkingEvent.objects.filter(
                parking_spot=spot,
                event_type='ENTER'
            ).order_by('-timestamp').first()
            
            if last_entry:
                car = last_entry.car
                
                # Mark spot as available
                spot.is_occupied = False
                spot.save()
                
                # Create exit event
                ParkingEvent.objects.create(
                    car=car,
                    parking_spot=spot,
                    event_type='EXIT'
                )

# API Endpoints
@api.get("/parking-spots", response=List[ParkingSpotSchema])
def list_parking_spots(request):
    # Generate a random event each time this is called
    generate_random_parking_event()
    return ParkingSpot.objects.all().order_by('spot_number')

@api.get("/parking-status", response=ParkingStatusSchema)
def parking_status(request):
    total_spots = ParkingSpot.objects.count()
    occupied_spots = ParkingSpot.objects.filter(is_occupied=True).count()
    available_spots = total_spots - occupied_spots
    occupancy_rate = (occupied_spots / total_spots * 100) if total_spots > 0 else 0
    
    return {
        "total_spots": total_spots,
        "occupied_spots": occupied_spots,
        "available_spots": available_spots,
        "occupancy_rate": round(occupancy_rate, 2)
    }

@api.get("/recent-events", response=List[ParkingEventSchema])
def recent_events(request):
    return ParkingEvent.objects.select_related('car', 'parking_spot').all()[:20]

@api.get("/cars", response=List[CarSchema])
def list_cars(request):
    return Car.objects.all().order_by('-created_at')

@api.post("/initialize-parking")
def initialize_parking(request):
    """Initialize parking system - create spots if they don't exist"""
    current_spots = ParkingSpot.objects.count()
    
    if current_spots < 50:
        # Create missing spots
        existing_numbers = set(ParkingSpot.objects.values_list('spot_number', flat=True))
        
        for i in range(1, 51):
            if i not in existing_numbers:
                ParkingSpot.objects.create(spot_number=i)
        
        created_spots = 50 - current_spots
        return {
            "message": f"Initialized parking system with {created_spots} new spots",
            "total_spots": 50,
            "created_spots": created_spots
        }
    else:
        return {
            "message": "Parking system already initialized",
            "total_spots": current_spots,
            "created_spots": 0
        }