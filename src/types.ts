/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type BudgetType = 'low' | 'medium' | 'high';
export type CompanionType = 'adult' | 'family_young' | 'family_older';
export type InterestType = 'adventure' | 'nature_eco' | 'historical_heritage' | 'coastal_beach' | 'coastal_island' | 'shopping';
export type TransportType = 'self_driving' | 'car_rental' | 'grab';
export type PaceType = 'slow' | 'moderate' | 'packed';
export type FoodRestrictType = 'halal' | 'no_restriction';

export interface UserInputs {
  duration: number; // 1 to 5 days
  transport: TransportType;
  companion: CompanionType;
  budget: BudgetType;
  food_restrict: FoodRestrictType;
  interests: InterestType[];
  pace: PaceType;
}

export type StateType = 'Penang' | 'Perak' | 'Kedah' | 'Perlis';

export interface POI {
  id: string; // matches attraction_id
  state: StateType; // links attraction to state_id
  name: string;
  category: InterestType; // matched against user interest
  costTier: BudgetType; // cost_tier
  estCost: string; // cost_estimate
  activity_intensity: 'light' | 'moderate' | 'active'; // activity_intensity
  childFriendly: boolean; // child_friendly: 0 = false, 1 = true
  description: string;
}

export interface FoodEntry {
  food_id: string;
  state: StateType;
  name: string;
  description: string;
  halal_status: 'halal' | 'non_halal';
}

export interface FiredRule {
  ruleId: string;
  ruleName: string;
  description: string;
  outcome: string;
}

export interface ItineraryDay {
  dayNumber: number;
  pois: POI[];
  food?: FoodEntry; // Suggested food entry for this day
  theme: string;
  travelNote?: string;
}

export interface InferenceResult {
  recommendedState: StateType;
  alternativeState?: StateType;
  multi_state: boolean;
  primary_state: StateType;
  secondary_state: StateType | 'NONE';
  days_in_primary: number;
  days_in_secondary: number;
  pois_per_day: number;
  eligible_pois: POI[];
  food_suggestions: FoodEntry[];
  derivedAccommodation: {
    tier: string;
    advice: string;
  };
  itinerary: ItineraryDay[];
  firedRules: FiredRule[];
  explanation: Record<string, string[]>;
}

export interface SavedTrip {
  id: string;
  timestamp: string;
  inputs: UserInputs;
  result: InferenceResult;
}
