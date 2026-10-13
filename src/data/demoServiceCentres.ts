import type { ServiceCentre } from '@/types/rescue';

export const demoServiceCentres: ServiceCentre[] = [
  {
    id: 'SC-001',
    name: 'RescueAI Central Hub',
    latitude: 10.7726,
    longitude: 106.6981,
    services: ['roadside_assistance', 'sedan_towing', 'suv_towing', 'battery_jump', 'tyre_service'],
    open: true,
    phone: '+84 28 7300 1100',
  },
  {
    id: 'SC-002',
    name: 'Southern Service Centre',
    latitude: 10.715,
    longitude: 106.722,
    services: ['ev_support', 'battery_jump', 'roadside_assistance'],
    open: true,
    phone: '+84 28 7300 2200',
  },
  {
    id: 'SC-003',
    name: 'Eastern Depot',
    latitude: 10.845,
    longitude: 106.75,
    services: ['accident_recovery', 'suv_towing', 'sedan_towing'],
    open: false,
    phone: '+84 28 7300 3300',
  },
];
