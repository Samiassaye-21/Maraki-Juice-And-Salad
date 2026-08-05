import React, { useState, useEffect } from 'react';
import KitchenLogin from './components/KitchenLogin';
import KitchenOrderEntry from './components/KitchenOrderEntry';
import { supabase } from './lib/supabaseClient';
import { FoodMenuItem, RestaurantSystemConfig } from './types';
import { DEFAULT_FOOD_MENU, DEFAULT_RESTAURANT_CONFIG } from './data/initialData';

const KITCHEN_SESSION_KEY = 'maraki_kitchen_auth';

function KitchenApp() {
  const [authed, setAuthed] = useState(() => {
    return sessionStorage.getItem(KITCHEN_SESSION_KEY) === 'true';
  });
  const [foodMenu, setFoodMenu] = useState<FoodMenuItem[]>(DEFAULT_FOOD_MENU);

  useEffect(() => {
    // Fetch the food menu from Supabase config (same as admin)
    supabase
      .from('config')
      .select('food_menu')
      .single()
      .then(({ data }) => {
        if (data?.food_menu && Array.isArray(data.food_menu)) {
          setFoodMenu(data.food_menu as FoodMenuItem[]);
        }
      });
  }, []);

  const handleLoginSuccess = () => {
    sessionStorage.setItem(KITCHEN_SESSION_KEY, 'true');
    setAuthed(true);
  };

  if (!authed) {
    return <KitchenLogin onLoginSuccess={handleLoginSuccess} />;
  }

  return <KitchenOrderEntry foodMenu={foodMenu} />;
}

export default KitchenApp;
