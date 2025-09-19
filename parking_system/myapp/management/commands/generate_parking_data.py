
# management/commands/generate_parking_data.py
import random
import time
from django.core.management.base import BaseCommand
from django.utils import timezone
from myapp.models import ParkingSpot, Car, ParkingEvent

class Command(BaseCommand):
    help = 'Generate random parking data continuously'
    
    CAR_MAKES = ['Toyota', 'Honda', 'Ford', 'BMW', 'Mercedes', 'Audi', 'Volkswagen', 'Nissan', 'Hyundai', 'Kia']
    CAR_MODELS = ['Sedan', 'SUV', 'Hatchback', 'Coupe', 'Convertible', 'Wagon', 'Pickup']
    CAR_COLORS = ['Red', 'Blue', 'Black', 'White', 'Silver', 'Gray', 'Green', 'Yellow', 'Orange', 'Purple']
    FIRST_NAMES = ['John', 'Jane', 'Mike', 'Sarah', 'David', 'Lisa', 'Chris', 'Emma', 'Alex', 'Anna']
    LAST_NAMES = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez']
    
    def add_arguments(self, parser):
        parser.add_argument('--spots', type=int, default=50, help='Number of parking spots to create')
        parser.add_argument('--interval', type=int, default=5, help='Interval between events in seconds')
    
    def handle(self, *args, **options):
        spots_count = options['spots']
        interval = options['interval']
        
        # Create parking spots if they don't exist
        if ParkingSpot.objects.count() < spots_count:
            for i in range(1, spots_count + 1):
                ParkingSpot.objects.get_or_create(spot_number=i)
            self.stdout.write(f'Created {spots_count} parking spots')
        
        self.stdout.write(f'Starting parking data generation (every {interval} seconds)...')
        
        try:
            while True:
                self.generate_random_event()
                time.sleep(interval)
        except KeyboardInterrupt:
            self.stdout.write('\nStopping data generation...')
    
    def generate_random_event(self):
        # 60% chance of entry, 40% chance of exit
        event_type = random.choices(['ENTER', 'EXIT'], weights=[60, 40])[0]
        
        if event_type == 'ENTER':
            self.handle_car_entry()
        else:
            self.handle_car_exit()
    
    def handle_car_entry(self):
        # Find available spots
        available_spots = ParkingSpot.objects.filter(is_occupied=False)
        if not available_spots.exists():
            return  # No available spots
        
        spot = random.choice(available_spots)
        
        # Create or get a random car
        car = self.get_or_create_random_car()
        
        # Mark spot as occupied
        spot.is_occupied = True
        spot.save()
        
        # Create parking event
        ParkingEvent.objects.create(
            car=car,
            parking_spot=spot,
            event_type='ENTER'
        )
        
        self.stdout.write(f'Car {car.license_plate} entered spot {spot.spot_number}')
    
    def handle_car_exit(self):
        # Find occupied spots
        occupied_spots = ParkingSpot.objects.filter(is_occupied=True)
        if not occupied_spots.exists():
            return  # No occupied spots
        
        spot = random.choice(occupied_spots)
        
        # Get the car from the last entry event for this spot
        last_entry = ParkingEvent.objects.filter(
            parking_spot=spot,
            event_type='ENTER'
        ).order_by('-timestamp').first()
        
        if not last_entry:
            return
        
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
        
        self.stdout.write(f'Car {car.license_plate} exited spot {spot.spot_number}')
    
    def get_or_create_random_car(self):
        # Generate random license plate
        license_plate = f"{random.choice('ABCDEFGHIJK')}{random.randint(100, 999)}{random.choice('XYZ')}"
        
        # Check if car already exists
        car, created = Car.objects.get_or_create(
            license_plate=license_plate,
            defaults={
                'make': random.choice(self.CAR_MAKES),
                'model': random.choice(self.CAR_MODELS),
                'color': random.choice(self.CAR_COLORS),
                'owner_name': f"{random.choice(self.FIRST_NAMES)} {random.choice(self.LAST_NAMES)}"
            }
        )
        
        return car