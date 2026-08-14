import React, { useState, useEffect } from 'react';
import ShiftLogin from './components/ShiftLogin';
import ShiftEntryView from './components/ShiftEntryView';
import { supabase } from './lib/supabaseClient';
import { RestaurantSystemConfig } from './types';
import { DEFAULT_RESTAURANT_CONFIG } from './data/initialData';
import { safeSessionStorage } from './utils/safeStorage';

const SHIFT_SESSION_KEY = 'maraki_shift_auth';

function ShiftApp() {
  const [authed, setAuthed] = useState(() => {
    return safeSessionStorage.getItem(SHIFT_SESSION_KEY) === 'true';
  });
  const [config, setConfig] = useState<RestaurantSystemConfig>(DEFAULT_RESTAURANT_CONFIG);

  useEffect(() => {
    // Fetch restaurant config from Supabase
    supabase
      .from('config')
      .select('*')
      .single()
      .then(({ data }) => {
        if (data) {
          setConfig({
            defaultJuiceUnitPrice: data.default_juice_unit_price ?? 170,
            defaultFoodUnitPrice: data.default_food_unit_price ?? 220,
            foodMenu: data.food_menu ?? [],
            currencySymbol: data.currency_symbol || 'Br ETB',
            dayShiftWorkerName: data.day_shift_worker_name || 'Makeda (Day Shift)',
            nightShiftWorkerName: data.night_shift_worker_name || 'Tewodros (Night Shift)',
            restaurantName: data.restaurant_name || 'Maraki Juice and Salad',
          });
        }
      });
  }, []);

  const handleLoginSuccess = () => {
    safeSessionStorage.setItem(SHIFT_SESSION_KEY, 'true');
    setAuthed(true);
  };

  if (!authed) {
    return <ShiftLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <ShiftEntryView config={config} />;
}

export default ShiftApp;
