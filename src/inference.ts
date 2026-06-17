/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { UserInputs, InferenceResult, POI, FoodEntry, FiredRule, ItineraryDay, StateType, InterestType } from './types';
import { KNOWLEDGE_BASE, FOOD_DB } from './kb';

// Travel times mapping for Rule 2.17
function getTravelTimeText(fromState: StateType, toState: StateType): string {
  if (fromState === 'Penang' && toState === 'Perak') return ' Penang -> Ipoh (~2.5 hrs)';
  if (fromState === 'Kedah' && toState === 'Perak') return ' Kedah -> Ipoh (~2 hrs)';
  if (fromState === 'Penang' && toState === 'Kedah') return ' Penang -> Kedah (~1 hr)';
  if (fromState === 'Perak' && toState === 'Kedah') return ' Perak -> Kedah (~2 hrs)';
  if (fromState === 'Kedah' && toState === 'Perlis') return ' Kedah -> Perlis (~45 min)';
  return ` ${fromState} -> ${toState} (~2 hrs)`;
}

// Helper to determine single-state primary state based on interests and transport (Rules 2.1 - 2.6)
function getSingleStatePrimary(interests: InterestType[], transport: string): { state: StateType; ruleId: string; desc: string } {
  // RULE 2.1: interest CONTAINS coastal_island
  if (interests.includes('coastal_island')) {
    return {
      state: 'Kedah',
      ruleId: 'RULE_2.1',
      desc: 'IF duration <= 2 AND interest CONTAINS coastal_island -> Kedah'
    };
  }
  // RULE 2.2: interest CONTAINS coastal_beach
  if (interests.includes('coastal_beach')) {
    return {
      state: 'Penang',
      ruleId: 'RULE_2.2',
      desc: 'IF duration <= 2 AND interest CONTAINS coastal_beach -> Penang'
    };
  }
  // RULE 2.3: interest CONTAINS adventure
  if (interests.includes('adventure')) {
    return {
      state: 'Perak',
      ruleId: 'RULE_2.3',
      desc: 'IF duration <= 2 AND interest CONTAINS adventure -> Perak'
    };
  }
  // RULE 2.4: interest CONTAINS nature_eco AND transport = grab
  if (interests.includes('nature_eco') && transport === 'grab') {
    return {
      state: 'Perak',
      ruleId: 'RULE_2.4',
      desc: 'IF duration <= 2 AND interest CONTAINS nature_eco AND transport = grab -> Perak'
    };
  }
  // RULE 2.5: interest CONTAINS nature_eco AND (transport = self_driving OR car_rental)
  if (interests.includes('nature_eco') && (transport === 'self_driving' || transport === 'car_rental')) {
    return {
      state: 'Kedah',
      ruleId: 'RULE_2.5',
      desc: 'IF duration <= 2 AND interest CONTAINS nature_eco AND transport = self_driving/car_rental -> Kedah'
    };
  }
  // RULE 2.6: interest CONTAINS historical_heritage
  if (interests.includes('historical_heritage')) {
    return {
      state: 'Penang',
      ruleId: 'RULE_2.6',
      desc: 'IF duration <= 2 AND interest CONTAINS historical_heritage -> Penang'
    };
  }
  // RULE 2.6.5: interest CONTAINS shopping
  if (interests.includes('shopping')) {
    return {
      state: 'Penang',
      ruleId: 'RULE_2.6_SHOPPING',
      desc: 'IF duration <= 2 AND interest CONTAINS shopping -> Penang'
    };
  }

  // Final fallback
  return {
    state: 'Penang',
    ruleId: 'RULE_2.6_FALLBACK',
    desc: 'No single state rule matched. Defaulted primary state to Penang.'
  };
}

export function runInference(inputs: UserInputs): InferenceResult {
  const firedRules: FiredRule[] = [];

  // =========================================================================
  // LAYER 0: Pace Inference
  // =========================================================================
  let inferredPace = inputs.pace;
  if (inputs.companion === 'family_young') {
    inferredPace = 'slow';
    firedRules.push({
      ruleId: 'RULE_0.1',
      ruleName: 'Young Family Pace Override',
      description: 'IF companion = family_young',
      outcome: 'System automatically infers pace = slow AND skips pace question'
    });
  } else {
    firedRules.push({
      ruleId: 'RULE_0.2',
      ruleName: 'Adult/Older Family Pace Preserved',
      description: 'IF companion = adult OR companion = family_older',
      outcome: `Pace setting of "${inputs.pace}" is selected directly by user`
    });
  }

  // =========================================================================
  // LAYER 1: Interest Limit Rules
  // =========================================================================
  if (inputs.duration === 1) {
    firedRules.push({
      ruleId: 'RULE_1.1',
      ruleName: 'Brief Express Interest Limit',
      description: 'IF duration = 1',
      outcome: 'Interest choices restricted to at most 2'
    });
  } else if (inputs.duration === 2 || inputs.duration === 3) {
    firedRules.push({
      ruleId: 'RULE_1.2',
      ruleName: 'Standard Trip Interest Limit',
      description: 'IF duration = 2 OR 3',
      outcome: 'Interest choices restricted to at most 3'
    });
  } else if (inputs.duration === 4 || inputs.duration === 5) {
    firedRules.push({
      ruleId: 'RULE_1.3',
      ruleName: 'Immersive Trip Interest Limit',
      description: 'IF duration = 4 OR 5',
      outcome: 'Interest choices restricted to at most 5 (unrestricted)'
    });
  }

  // =========================================================================
  // LAYER 2: State Routing Rules
  // =========================================================================
  let primaryState: StateType = 'Penang';
  let secondaryState: StateType | 'NONE' = 'NONE';
  let multiState = false;
  let daysInPrimary = inputs.duration;
  let daysInSecondary = 0;

  if (inputs.duration <= 2) {
    // 2A - Single state routing
    const match = getSingleStatePrimary(inputs.interests, inputs.transport);
    primaryState = match.state;
    multiState = false;
    daysInPrimary = inputs.duration;
    daysInSecondary = 0;

    firedRules.push({
      ruleId: match.ruleId,
      ruleName: 'Single State Short Routing',
      description: `IF duration <= 2 AND matching interest order applied: ${match.desc}`,
      outcome: `primary_state = ${primaryState}, multi_state = FALSE`
    });
  } else {
    // 2B - Multi-state routing decision (duration 3-5 days)
    if (inputs.duration === 3 && inputs.transport === 'grab') {
      multiState = false;
      daysInPrimary = 3;
      daysInSecondary = 0;
      
      const match = getSingleStatePrimary(inputs.interests, inputs.transport);
      primaryState = match.state;

      firedRules.push({
        ruleId: 'RULE_2.7',
        ruleName: 'Grab 3-Day Transit Decision',
        description: 'IF duration = 3 AND transport = grab',
        outcome: `multi_state = FALSE (state: ${primaryState}) AND days_in_primary = 3`
      });
    } else {
      // Could allow multi-state! Let's pair them if we have rules.
      let canPair = false;

      if (inputs.duration === 3 && (inputs.transport === 'self_driving' || inputs.transport === 'car_rental')) {
        multiState = true;
        daysInPrimary = 2;
        daysInSecondary = 1;
        canPair = true;

        firedRules.push({
          ruleId: 'RULE_2.8',
          ruleName: 'Driving 3-Day Multi-State Authorization',
          description: 'IF duration = 3 AND transport = self_driving OR car_rental',
          outcome: 'multi_state = TRUE AND days_in_primary = 2 AND days_in_secondary = 1'
        });
      } else if (inputs.duration === 4) {
        multiState = true;
        daysInPrimary = 3;
        daysInSecondary = 1;
        canPair = true;

        firedRules.push({
          ruleId: 'RULE_2.9',
          ruleName: '4-Day Inter-State Exploration',
          description: 'IF duration = 4',
          outcome: 'multi_state = TRUE AND days_in_primary = 3 AND days_in_secondary = 1'
        });
      } else if (inputs.duration === 5) {
        multiState = true;
        daysInPrimary = 3;
        daysInSecondary = 2;
        canPair = true;

        firedRules.push({
          ruleId: 'RULE_2.10',
          ruleName: '5-Day Expedition Multi-State Schedule',
          description: 'IF duration = 5',
          outcome: 'multi_state = TRUE AND days_in_primary = 3 AND days_in_secondary = 2'
        });
      }

      // 2C - Apply State pairing rules (Only fires when multi_state = TRUE)
      if (canPair) {
        let paired = false;

        // RULE 2.11: historical_heritage AND nature_eco
        if (inputs.interests.includes('historical_heritage') && inputs.interests.includes('nature_eco')) {
          primaryState = 'Penang';
          secondaryState = 'Perak';
          paired = true;
          firedRules.push({
            ruleId: 'RULE_2.11',
            ruleName: 'Heritage & Eco Pairing',
            description: 'IF multi_state = TRUE AND interest CONTAINS historical_heritage AND nature_eco',
            outcome: `primary_state = Penang, secondary_state = Perak (~2.5 hrs drive)`
          });
        }
        // RULE 2.12: coastal_island AND nature_eco (but not matched yet)
        else if (inputs.interests.includes('coastal_island') && inputs.interests.includes('nature_eco')) {
          primaryState = 'Kedah';
          secondaryState = 'Perak';
          paired = true;
          firedRules.push({
            ruleId: 'RULE_2.12',
            ruleName: 'Island & Wilderness Pairing',
            description: 'IF multi_state = TRUE AND interest CONTAINS coastal_island AND nature_eco',
            outcome: `primary_state = Kedah, secondary_state = Perak (~2 hrs drive)`
          });
        }
        // RULE 2.13: historical_heritage AND coastal_beach
        else if (inputs.interests.includes('historical_heritage') && inputs.interests.includes('coastal_beach')) {
          primaryState = 'Penang';
          secondaryState = 'Kedah';
          paired = true;
          firedRules.push({
            ruleId: 'RULE_2.13',
            ruleName: 'Heritage & Beach Pair',
            description: 'IF multi_state = TRUE AND interest CONTAINS historical_heritage AND coastal_beach',
            outcome: `primary_state = Penang, secondary_state = Kedah (~1 hr drive)`
          });
        }
        // RULE 2.14: adventure AND nature_eco
        else if (inputs.interests.includes('adventure') && inputs.interests.includes('nature_eco')) {
          primaryState = 'Perak';
          secondaryState = 'Kedah';
          paired = true;
          firedRules.push({
            ruleId: 'RULE_2.14',
            ruleName: 'Adventure & Eco Forest Pairing',
            description: 'IF multi_state = TRUE AND interest CONTAINS adventure AND nature_eco',
            outcome: `primary_state = Perak, secondary_state = Kedah (~2 hrs drive)`
          });
        }
        // RULE 2.15: coastal_island AND duration = 5
        else if (inputs.interests.includes('coastal_island') && inputs.duration === 5) {
          primaryState = 'Kedah';
          secondaryState = 'Perlis';
          paired = true;
          firedRules.push({
            ruleId: 'RULE_2.15',
            ruleName: 'Border Island Expedition Pairing',
            description: 'IF multi_state = TRUE AND interest CONTAINS coastal_island AND duration = 5',
            outcome: `primary_state = Kedah, secondary_state = Perlis (~45 min ferry/drive)`
          });
        }

        // RULE 2.16: Safety Net - if no pairing rule fires, stay single state
        if (!paired) {
          multiState = false;
          secondaryState = 'NONE';
          daysInPrimary = inputs.duration;
          daysInSecondary = 0;
          
          const match = getSingleStatePrimary(inputs.interests, inputs.transport);
          primaryState = match.state;

          firedRules.push({
            ruleId: 'RULE_2.16',
            ruleName: 'Pairing Safety Net Triggered',
            description: 'IF multi_state = TRUE AND no pairing rule fires',
            outcome: `Fallback -> multi_state = FALSE, primary_state = ${primaryState} (via single state rule)`
          });
        }
      }
    }
  }

  // =========================================================================
  // LAYER 3: POI Filtering
  // =========================================================================
  let eligiblePOIs = KNOWLEDGE_BASE.filter(poi => {
    // Only accept POIs in primary or secondary states
    if (multiState) {
      return poi.state === primaryState || poi.state === secondaryState;
    }
    return poi.state === primaryState;
  });

  // Apply Companion Exclusions
  if (inputs.companion === 'family_young') {
    eligiblePOIs = eligiblePOIs.filter(poi => poi.childFriendly && poi.activity_intensity !== 'active');
    firedRules.push({
      ruleId: 'RULE_3.1',
      ruleName: 'Toddler Protection Filter',
      description: 'IF companion = family_young',
      outcome: 'Remove all non-child-friendly and "active" intensity attractions'
    });
  } else if (inputs.companion === 'family_older') {
    eligiblePOIs = eligiblePOIs.filter(poi => poi.childFriendly);
    firedRules.push({
      ruleId: 'RULE_3.2',
      ruleName: 'Older Kids Safety Filter',
      description: 'IF companion = family_older',
      outcome: 'Remove all non-child-friendly attractions'
    });
  }

  // Apply Budget Exclusions
  if (inputs.budget === 'low') {
    eligiblePOIs = eligiblePOIs.filter(poi => poi.costTier !== 'medium' && poi.costTier !== 'high');
    firedRules.push({
      ruleId: 'RULE_3.3',
      ruleName: 'Economy Budget Gatekeeper',
      description: 'IF budget = low',
      outcome: 'Remove all medium and high cost-tier attractions'
    });
  } else if (inputs.budget === 'medium') {
    eligiblePOIs = eligiblePOIs.filter(poi => poi.costTier !== 'high');
    firedRules.push({
      ruleId: 'RULE_3.4',
      ruleName: 'Moderate Budget Regulator',
      description: 'IF budget = medium',
      outcome: 'Remove all high cost-tier attractions'
    });
  } else if (inputs.budget === 'high') {
    firedRules.push({
      ruleId: 'RULE_3.5',
      ruleName: 'All-Clear Luxury Access',
      description: 'IF budget = high',
      outcome: 'No budget filtering applied — all cost tiers eligible'
    });
  }

  // =========================================================================
  // LAYER 4 & LAYER 5: Pace & Food Routing Engine
  // =========================================================================
  let basePoisPerDay = 3;
  if (inferredPace === 'slow') {
    basePoisPerDay = 2; // 1 attraction + 1 food
    firedRules.push({
      ruleId: 'RULE_4.1',
      ruleName: 'Leisurely Pace Setup',
      description: 'IF pace = slow',
      outcome: 'Daily slots: 2 (1 attraction + 1 food)'
    });
  } else if (inferredPace === 'moderate') {
    basePoisPerDay = 3; // 2 attractions + 1 food
    firedRules.push({
      ruleId: 'RULE_4.2',
      ruleName: 'Moderate Balanced Pace Setup',
      description: 'IF pace = moderate',
      outcome: 'Daily slots: 3 (2 attractions + 1 food)'
    });
  } else if (inferredPace === 'packed') {
    basePoisPerDay = 4; // 3 attractions + 1 food
    firedRules.push({
      ruleId: 'RULE_4.3',
      ruleName: 'Packed Explorer Pace Setup',
      description: 'IF pace = packed',
      outcome: 'Daily slots: 4 (3 attractions + 1 food)'
    });
  }

  // =========================================================================
  // LAYER 6: Accommodation derivation
  // =========================================================================
  let stayTier = '';
  let stayAdvice = '';
  if (inputs.budget === 'low') {
    stayTier = 'Budget guesthouse or hostel (RM30-80/night)';
    stayAdvice = 'Fits low-budget parameters. Recommends cozy homestays, hostels, or local guest guesthouses.';
    firedRules.push({
      ruleId: 'RULE_6.1',
      ruleName: 'Economy Lodging Selection',
      description: 'IF budget = low',
      outcome: `accommodation = "${stayTier}"`
    });
  } else if (inputs.budget === 'medium') {
    stayTier = '3-star hotel (RM100-200/night)';
    stayAdvice = 'Fits mid-range parameters. Recommends standard 3-star suites with family amenities and conveniences.';
    firedRules.push({
      ruleId: 'RULE_6.2',
      ruleName: 'Mid-Range Lodging Selection',
      description: 'IF budget = medium',
      outcome: `accommodation = "${stayTier}"`
    });
  } else if (inputs.budget === 'high') {
    stayTier = '4-5 star resort or hotel (RM250+/night)';
    stayAdvice = 'Fits luxury budget parameters. Recommends boutique lifestyle hotels or scenic premium beachfront resorts.';
    firedRules.push({
      ruleId: 'RULE_6.3',
      ruleName: 'Luxury Lodging Selection',
      description: 'IF budget = high',
      outcome: `accommodation = "${stayTier}"`
    });
  }

  // =========================================================================
  // COMPUTE SELECTION & DAY EXPLANATION RULES (LAYER 7)
  // =========================================================================
  const explanations: Record<string, string[]> = {};
  const itinerary: ItineraryDay[] = [];
  const usedPoiIds = new Set<string>();
  const usedFoodIds = new Set<string>();
  const foodSuggestions: FoodEntry[] = [];

  // Helper score to prioritize attractions matching selected interests
  function getPoiScore(poi: POI): number {
    let score = 0;
    if (inputs.interests.includes(poi.category)) {
      score += 15;
    }
    // Boost slightly based on activity level matches if any, but interest is core
    return score;
  }

  // Generate day-by-day itinerary
  for (let d = 1; d <= inputs.duration; d++) {
    // Determine state for today
    const isPrimaryStateDay = d <= daysInPrimary;
    const currentState: StateType = isPrimaryStateDay ? primaryState : (secondaryState as StateType);

    // Is it a travel day? Rule 2.17: day when state changes (d === daysInPrimary + 1)
    const isTravelDay = multiState && d === daysInPrimary + 1;

    let poisCountForToday = 0;
    if (isTravelDay) {
      poisCountForToday = 1; // 1 attraction on travel day
      firedRules.push({
        ruleId: 'RULE_2.17',
        ruleName: 'Travel Transition Restriction',
        description: `IF travel_day = TRUE (Day ${d} moving from ${primaryState} to ${secondaryState})`,
        outcome: 'Forces 1 light attraction only, applies driving travel note, and sources dinner in Perak/secondary state'
      });
    } else {
      // base count minus 1 (since base count includes food)
      poisCountForToday = basePoisPerDay - 1;
    }

    // Get available attractions for today's state
    let statePOIs = eligiblePOIs.filter(poi => poi.state === currentState && !usedPoiIds.has(poi.id));

    // If travel day, filter by light intensity only
    if (isTravelDay) {
      statePOIs = statePOIs.filter(poi => poi.activity_intensity === 'light');
    }

    // Sort available POIs by score descending so user's interest matches show up first!
    statePOIs.sort((a, b) => getPoiScore(b) - getPoiScore(a));

    // If not enough state-specific POIs, backfill with used or any compatible
    const selectedPOIs: POI[] = [];
    for (let i = 0; i < poisCountForToday; i++) {
      if (statePOIs[i]) {
        selectedPOIs.push(statePOIs[i]);
        usedPoiIds.add(statePOIs[i].id);
      } else {
        // Look for any other POI in this state even if category doesn't match
        const backupPOIs = eligiblePOIs.filter(p => p.state === currentState && !usedPoiIds.has(p.id));
        if (backupPOIs[0]) {
          selectedPOIs.push(backupPOIs[0]);
          usedPoiIds.add(backupPOIs[0].id);
        }
      }
    }

    // Source food suggestion for this day (Layer 5)
    let foodOptions = FOOD_DB.filter(f => f.state === currentState && !usedFoodIds.has(f.food_id));
    if (inputs.food_restrict === 'halal') {
      foodOptions = foodOptions.filter(f => f.halal_status === 'halal');
    }

    // Pick one food item
    let selectedFood: FoodEntry | undefined = foodOptions[0];
    if (selectedFood) {
      usedFoodIds.add(selectedFood.food_id);
      foodSuggestions.push(selectedFood);
    } else {
      // Fallback if depleted
      const fallbackOptions = FOOD_DB.filter(f => f.state === currentState);
      const fs = inputs.food_restrict === 'halal' ? fallbackOptions.filter(f => f.halal_status === 'halal') : fallbackOptions;
      if (fs[0]) {
        selectedFood = fs[0];
        foodSuggestions.push(selectedFood);
      }
    }

    // Log explanation why each item was selected (Layer 7)
    selectedPOIs.forEach(poi => {
      const reasons: string[] = [];
      
      // RULE 7.1: Category match
      if (inputs.interests.includes(poi.category)) {
        const readableCat = poi.category.replace('_', ' ');
        reasons.push(`Matches your ${readableCat} interest`);
      }

      // RULE 7.2: Young companion
      if (inputs.companion === 'family_young' && poi.childFriendly) {
        reasons.push('Suitable for families with young children (<= 7)');
        reasons.push('Pace set to slow — 2 slots per day (1 active attraction + 1 culinary stop)');
      }

      // RULE 7.3: Older companion
      if (inputs.companion === 'family_older' && poi.childFriendly) {
        reasons.push('Suitable for families with children (8+)');
      }

      // RULE 7.4: Low cost match
      if (poi.costTier === 'low' && inputs.budget === 'low') {
        reasons.push('Budget friendly — fits your daily budget parameters');
      }

      // RULE 7.6: Multi state secondary state indicator
      if (multiState && currentState === secondaryState) {
        reasons.push(`Located in ${secondaryState} — part of your multi-state driving itinerary`);
      }

      explanations[poi.id] = reasons;
    });

    if (selectedFood) {
      const foodReasons: string[] = [];
      // RULE 7.5: Halal preference
      if (selectedFood.halal_status === 'halal' && inputs.food_restrict === 'halal') {
        foodReasons.push('Halal certified — suits your food preference');
      }
      if (multiState && currentState === secondaryState) {
        foodReasons.push(`Located in ${secondaryState} - local signature of your secondary state`);
      } else {
        foodReasons.push(`Located in ${currentState} - local signature delicacy`);
      }
      explanations[selectedFood.food_id] = foodReasons;
    }

    // Set day travel note if travel day
    let tNote: string | undefined;
    if (isTravelDay) {
      tNote = `Drive ${getTravelTimeText(primaryState, secondaryState as StateType)}`;
    }

    // Set a lovely theme descriptor based on the state and day activities
    let dayTheme = '';
    if (isTravelDay) {
      dayTheme = `Transition Day to ${currentState}`;
    } else {
      dayTheme = `${currentState} Exploration Hub`;
    }

    itinerary.push({
      dayNumber: d,
      pois: selectedPOIs,
      food: selectedFood,
      theme: dayTheme,
      travelNote: tNote
    });
  }

  // Core explanation triggers
  if (inputs.food_restrict === 'halal') {
    firedRules.push({
      ruleId: 'RULE_5.1',
      ruleName: 'Halal Food Selection Active',
      description: 'IF food_restrict = halal',
      outcome: 'Only restaurants carrying verified Halal-Certified status selected for food sugestions'
    });
  } else {
    firedRules.push({
      ruleId: 'RULE_5.2',
      ruleName: 'Unrestricted Culinary Food Selection',
      description: 'IF food_restrict = no_restriction',
      outcome: 'Enables selection of traditional pork-lard signature dishes and local non-restricting joints'
    });
  }

  return {
    recommendedState: primaryState,
    alternativeState: secondaryState !== 'NONE' ? secondaryState : undefined,
    multi_state: multiState,
    primary_state: primaryState,
    secondary_state: secondaryState,
    days_in_primary: daysInPrimary,
    days_in_secondary: daysInSecondary,
    pois_per_day: basePoisPerDay,
    eligible_pois: eligiblePOIs,
    food_suggestions: foodSuggestions,
    derivedAccommodation: {
      tier: stayTier,
      advice: stayAdvice
    },
    itinerary,
    firedRules,
    explanation: explanations
  };
}
