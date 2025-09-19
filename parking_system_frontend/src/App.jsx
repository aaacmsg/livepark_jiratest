import React, { useState, useEffect } from 'react';
import { useQuery, QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Car, Activity, MapPin, Clock, TrendingUp, Zap } from 'lucide-react';

// Create QueryClient
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: 7000, // Call API every 7 seconds
      refetchIntervalInBackground: true,
    },
  },
});

// Mock data generator for testing without backend
const generateMockData = () => {
  const spots = Array.from({ length: 50 }, (_, i) => ({
    id: i + 1,
    spot_number: i + 1,
    is_occupied: Math.random() > 0.6,
    updated_at: new Date().toISOString()
  }));

  const events = Array.from({ length: 15 }, (_, i) => ({
    id: `event-${i}`,
    car: {
      id: i,
      license_plate: `${['ABC', 'DEF', 'GHI', 'JKL'][Math.floor(Math.random() * 4)]}${100 + i}`,
      make: ['Toyota', 'Honda', 'Ford', 'BMW', 'Tesla', 'Mercedes'][Math.floor(Math.random() * 6)],
      model: ['Camry', 'Civic', 'F-150', 'X5', 'Model 3', 'C-Class'][Math.floor(Math.random() * 6)],
      color: ['Red', 'Blue', 'Black', 'White', 'Silver', 'Gray'][Math.floor(Math.random() * 6)],
      owner_name: `Driver ${i + 1}`,
    },
    parking_spot: {
      id: i + 1,
      spot_number: Math.floor(Math.random() * 50) + 1,
      is_occupied: true
    },
    event_type: Math.random() > 0.5 ? 'ENTER' : 'EXIT',
    timestamp: new Date(Date.now() - Math.random() * 3600000).toISOString()
  }));

  const occupiedCount = spots.filter(s => s.is_occupied).length;
  const status = {
    total_spots: spots.length,
    occupied_spots: occupiedCount,
    available_spots: spots.length - occupiedCount,
    occupancy_rate: Math.round((occupiedCount / spots.length) * 100)
  };

  return { spots, events, status };
};

// API functions (replace these URLs with your Django backend when ready)
const API_BASE = 'http://localhost:8000/api';

const initializeParkingSystem = async () => {
  try {
    const response = await fetch(`${API_BASE}/initialize-parking`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error('Fallo al iniciar sistema de parking');
    return response.json();
  } catch (error) {
    console.log('Fallo al iniciar sistema de parking:', error);
    return null;
  }
};

const fetchParkingSpots = async () => {
  try {
    const response = await fetch(`${API_BASE}/parking-spots`);
    if (!response.ok) throw new Error('API no disponible');
    return response.json();
  } catch {
    // Fallback to mock data if API is not available
    return generateMockData().spots;
  }
};

const fetchParkingStatus = async () => {
  try {
    const response = await fetch(`${API_BASE}/parking-status`);
    if (!response.ok) throw new Error('API no disponible');
    return response.json();
  } catch {
    return generateMockData().status;
  }
};

const fetchRecentEvents = async () => {
  try {
    const response = await fetch(`${API_BASE}/recent-events`);
    if (!response.ok) throw new Error('API no disponible');
    return response.json();
  } catch {
    return generateMockData().events;
  }
};

// Components
const ParkingSpot = ({ spot, size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-6 h-6 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-14 h-14 text-base'
  };

  return (
    <div
      className={`
        ${sizeClasses[size]} 
        rounded-lg border-2 flex items-center justify-center font-bold
        transition-all duration-300 hover:scale-110 cursor-pointer select-none
        ${spot.is_occupied 
          ? 'bg-red-500 hover:bg-red-600 border-red-600 text-white shadow-lg shadow-red-200' 
          : 'bg-emerald-500 hover:bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-200'
        }
      `}
      title={`Spot ${spot.spot_number} - ${spot.is_occupied ? 'Ocupado' : 'Disponible'}`}
    >
      {spot.spot_number}
    </div>
  );
};

const StatCard = ({ icon: Icon, title, value, subtitle, gradient }) => (
  <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-100 hover:shadow-xl transition-all duration-300 hover:scale-105">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
        <p className="text-3xl font-bold text-gray-800">{value}</p>
        {subtitle && <p className="text-gray-400 text-xs mt-1">{subtitle}</p>}
      </div>
      <div className={`p-4 rounded-xl bg-gradient-to-br ${gradient}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </div>
);

const ActivityItem = ({ event }) => {
  const isEntry = event.event_type === 'ENTER';
  const time = new Date(event.timestamp).toLocaleTimeString();
  
  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border-l-4 transition-all hover:scale-105 ${
      isEntry 
        ? 'border-emerald-500 bg-gradient-to-r from-emerald-50 to-white' 
        : 'border-red-500 bg-gradient-to-r from-red-50 to-white'
    }`}>
      <div className={`p-2 rounded-lg ${isEntry ? 'bg-emerald-500' : 'bg-red-500'}`}>
        <Car className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-gray-800 text-sm">{event.car.license_plate}</p>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            isEntry ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
          }`}>
            {isEntry ? 'IN' : 'OUT'}
          </span>
        </div>
        <p className="text-sm text-gray-600 truncate">
          {event.car.color} {event.car.make} {event.car.model}
        </p>
        <p className="text-xs text-gray-400">
          Puesto {event.parking_spot?.spot_number} • {time}
        </p>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [viewMode, setViewMode] = useState('grid');
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Initialize parking system on component mount
  useEffect(() => {
    const initSystem = async () => {
      const result = await initializeParkingSystem();
      if (result) {
        console.log('Parking system initialized:', result.message);
      }
      setIsInitialized(true);
    };
    
    initSystem();
  }, []);
  
  const { data: parkingSpots, isLoading: spotsLoading } = useQuery({
    queryKey: ['parkingSpots'],
    queryFn: fetchParkingSpots,
    enabled: isInitialized, // Only start fetching after initialization
  });

  const { data: parkingStatus, isLoading: statusLoading } = useQuery({
    queryKey: ['parkingStatus'],
    queryFn: fetchParkingStatus,
    enabled: isInitialized,
  });

  const { data: recentEvents, isLoading: eventsLoading } = useQuery({
    queryKey: ['recentEvents'],
    queryFn: fetchRecentEvents,
    enabled: isInitialized,
  });

  if (spotsLoading || statusLoading || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-500 border-t-transparent mx-auto"></div>
          <p className="mt-6 text-gray-600 font-medium">Cargando sistema de parking...</p>
        </div>
      </div>
    );
  }

  const occupiedSpots = parkingSpots?.filter(spot => spot.is_occupied) || [];
  const availableSpots = parkingSpots?.filter(spot => !spot.is_occupied) || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent">
                  LivePark
                </h1>
                <p className="text-gray-500 mt-1">Gestión de Parking Inteligente</p>
              </div>
            </div>
            <div className="flex bg-gray-100 rounded-xl p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'grid' 
                    ? 'bg-white shadow-md text-blue-600 scale-105' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Vista Grid
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-6 py-3 rounded-lg text-sm font-semibold transition-all ${
                  viewMode === 'list' 
                    ? 'bg-white shadow-md text-blue-600 scale-105' 
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                Vista Detalle
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={MapPin}
            title="Puestos"
            value={parkingStatus?.total_spots || 0}
            gradient="from-blue-500 to-blue-600"
          />
          <StatCard
            icon={Car}
            title="Ocupados"
            value={parkingStatus?.occupied_spots || 0}
            gradient="from-red-500 to-red-600"
          />
          <StatCard
            icon={Activity}
            title="Disponibles"
            value={parkingStatus?.available_spots || 0}
            gradient="from-emerald-500 to-emerald-600"
          />
          <StatCard
            icon={TrendingUp}
            title="% Ocupación"
            value={`${parkingStatus?.occupancy_rate || 0}%`}
            gradient="from-purple-500 to-purple-600"
          />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Parking Grid */}
          <div className="xl:col-span-2">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-8 border border-gray-200">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-2xl font-bold text-gray-800">Estacionamientos</h2>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-emerald-500 rounded-full"></div>
                    <span className="font-medium text-gray-600">Disponibles ({availableSpots.length})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 bg-red-500 rounded-full"></div>
                    <span className="font-medium text-gray-600">Ocupados ({occupiedSpots.length})</span>
                  </div>
                </div>
              </div>
              
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-8 lg:grid-cols-10 gap-3 p-4 bg-gray-50 rounded-2xl">
                  {parkingSpots?.map((spot) => (
                    <ParkingSpot key={spot.id} spot={spot} />
                  ))}
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {parkingSpots?.map((spot) => (
                    <div key={spot.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors">
                      <span className="font-semibold text-gray-700">Puesto {spot.spot_number}</span>
                      <span className={`px-4 py-2 rounded-full text-sm font-semibold ${
                        spot.is_occupied 
                          ? 'bg-red-100 text-red-800' 
                          : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {spot.is_occupied ? 'Ocupado' : 'Disponible'}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="xl:col-span-1">
            <div className="bg-white/80 backdrop-blur-sm rounded-3xl shadow-xl p-6 border border-gray-200 h-fit">
              <div className="flex items-center gap-3 mb-6">
                <Clock className="w-6 h-6 text-blue-600" />
                <h2 className="text-xl font-bold text-gray-800">Actividad</h2>
              </div>
              
              <div className="space-y-3 max-h-[600px] overflow-y-auto">
                {eventsLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-pulse">
                      <div className="h-4 bg-gray-200 rounded w-3/4 mx-auto mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
                    </div>
                  </div>
                ) : recentEvents?.length > 0 ? (
                  recentEvents.slice(0, 10).map((event) => (
                    <ActivityItem key={event.id} event={event} />
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>No hay actividad reciente</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Main App
const App = () => (
  <QueryClientProvider client={queryClient}>
    <Dashboard />
  </QueryClientProvider>
);

export default App;