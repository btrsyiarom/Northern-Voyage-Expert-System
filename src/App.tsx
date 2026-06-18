/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Compass, 
  RefreshCw, 
  History, 
  Sparkles, 
  Map, 
  BookOpen, 
  Search, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  Sliders, 
  AlertTriangle, 
  Check, 
  CheckCircle, 
  Calendar, 
  ChevronRight, 
  Trash2, 
  Info,
  Clock,
  Car,
  Utensils,
  Gem,
  Tent,
  DollarSign,
  MessageCircle,
  Send,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserInputs, InferenceResult, SavedTrip, StateType, InterestType, FoodEntry, POI } from './types';
import { KNOWLEDGE_BASE, FOOD_DB } from './kb';
import { runInference } from './inference';

const DEFAULT_INPUTS: UserInputs = {
  duration: 3,
  transport: 'grab',
  companion: 'adult',
  budget: 'medium',
  food_restrict: 'no_restriction',
  interests: ['historical_heritage', 'nature_eco'],
  pace: 'moderate'
};

const INTEREST_META: Record<InterestType, { label: string; icon: string; desc: string }> = {
  adventure: { label: 'Adventure Triggers', icon: '🧗', desc: 'Active climbs, caves, hikes' },
  nature_eco: { label: 'Nature & Wilderness', icon: '🌲', desc: 'Rainforest park canopies' },
  historical_heritage: { label: 'Historical Heritage', icon: '🏛️', desc: 'UNESCO monuments, temples' },
  coastal_beach: { label: 'Scenic Beach Coasts', icon: '🏖️', desc: 'Sunset waterfront relax' },
  coastal_island: { label: 'Island Archipelagos', icon: '🏝️', desc: 'Duty-free ports & waters' },
  shopping: { label: 'Shopping Experience', icon: '🛍️', desc: 'Premium waterfront hubs, border bazaars' }
};

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
}

// Custom parser component to beautifully format Kai's replies without exposing raw system asterisks (**) or hashes (##).
function parseBoldText(text: string) {
  const parts = text.split(/\*\*([^*]+)\*\*/g);
  return parts.map((part, i) => {
    if (i % 2 === 1) {
      return (
        <strong key={i} className="font-extrabold text-blue-950 bg-blue-50/70 px-1.2 py-0.5 rounded text-[11px] border border-blue-100/30">
          {part}
        </strong>
      );
    }
    // Handle italics as well
    const subParts = part.split(/\*([^*]+)\*/g);
    return subParts.map((sub, j) => {
      if (j % 2 === 1) {
        return <em key={j} className="italic text-blue-900 font-medium">{sub}</em>;
      }
      return sub;
    });
  });
}

function FormattedChatMessage({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1.5 text-xs text-slate-750 leading-relaxed font-normal">
      {lines.map((line, idx) => {
        let trimmed = line.trim();
        if (!trimmed) {
          return <div key={idx} className="h-1.5" />;
        }

        // Handle titles or headers
        if (trimmed.startsWith('###') || trimmed.startsWith('##')) {
          const rawText = trimmed.replace(/^#+\s*/, '');
          return (
            <h5 key={idx} className="font-extrabold text-[12px] text-blue-950 mt-3 mb-1 tracking-tight flex items-center gap-1">
              <span className="w-1.5 h-3 rounded bg-blue-500 inline-block"></span>
              {parseBoldText(rawText)}
            </h5>
          );
        }

        // Handle list elements
        if (trimmed.startsWith('*') || trimmed.startsWith('-')) {
          const rawText = trimmed.replace(/^[\*\-]\s*/, '');
          return (
            <div key={idx} className="flex gap-1.5 pl-2 items-start my-1 text-slate-700">
              <span className="text-blue-500 font-bold text-[13px] leading-3">•</span>
              <span className="flex-1 text-[11.5px]">{parseBoldText(rawText)}</span>
            </div>
          );
        }

        // Regular line sentence
        return (
          <p key={idx} className="mb-0.5 text-slate-750 text-[11.5px]">
            {parseBoldText(line)}
          </p>
        );
      })}
    </div>
  );
}

export default function App() {
  const [inputs, setInputs] = useState<UserInputs>(() => {
    const saved = localStorage.getItem('nv_current_inputs_v2');
    return saved ? JSON.parse(saved) : DEFAULT_INPUTS;
  });

  const [currentStep, setCurrentStep] = useState<number>(() => {
    const cached = localStorage.getItem('nv_wizard_step_v2');
    return cached ? parseInt(cached, 10) : -1;
  });

  const [inferenceResult, setInferenceResult] = useState<InferenceResult | null>(null);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'explanation' | 'database'>('itinerary');
  const [savedTrips, setSavedTrips] = useState<SavedTrip[]>([]);
  const [saveName, setSaveName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [searchKBQuery, setSearchKBQuery] = useState('');
  const [filterKBState, setFilterKBState] = useState<string>('All');
  const [filterKBCategory, setFilterKBCategory] = useState<string>('All');
  const [filterKBType, setFilterKBType] = useState<'attractions' | 'culinary'>('attractions');

  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Kai Travel Chatbot state hooks
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('nv_chat_messages_v1');
    return saved ? JSON.parse(saved) : [
      { role: 'model', content: "Hey! I'm Kai, your AI itinerary assistant. How can I help you today?" }
    ];
  });
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  // Sync chat messages to LocalStorage
  useEffect(() => {
    localStorage.setItem('nv_chat_messages_v1', JSON.stringify(chatMessages));
  }, [chatMessages]);

  const chatEndRef = React.useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, chatOpen]);

  const handleSendChatMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { role: 'user', content: trimmed };
    const updatedMessages = [...chatMessages, userMsg];
    
    setChatMessages(updatedMessages);
    setChatInput('');
    setChatLoading(true);

    try {
      // Structure full context about the active expert system recommendations and inputs
      const context = {
        duration: inputs.duration,
        transport: inputs.transport,
        companion: inputs.companion,
        pace: inputs.pace,
        budget: inputs.budget,
        food_restrict: inputs.food_restrict,
        interests: inputs.interests,
        recommendedState: inferenceResult?.recommendedState,
        itineraryText: inferenceResult?.itinerary 
          ? inferenceResult.itinerary.map(day => (
              `Day ${day.dayNumber} (${day.theme}):\n` + 
              `🍽️ Food Option: ${day.food?.name || 'Local recommendation'} (${day.food?.cuisine || ''})\n` +
              `🏛️ Attractions: ${day.pois.map(poi => `${poi.name} [Intensity Level: ${poi.activity_intensity}, Cost: ${poi.costTier}]`).join(', ')}`
            )).join('\n\n') 
          : 'No computations or active plans yet.'
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: trimmed,
          history: chatMessages,
          context
        })
      });

      if (!response.ok) {
        throw new Error('Server responded with an error status');
      }

      const data = await response.json();
      const extractedReply = data.reply || data.response;
      
      if (extractedReply) {
        setChatMessages(prev => [...prev, { role: 'model', content: extractedReply }]);
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Malformed server response');
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev, 
        { role: 'model', content: "Apologies, I encountered a minor signal loss. Please try sending your message again!" }
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  const handleResetChat = () => {
    setChatMessages([
      { role: 'model', content: "Hey! I'm Kai, your AI itinerary assistant. How can I help you today?" }
    ]);
  };

  const basePoisPerDay = inputs.pace === 'slow' ? 1 : inputs.pace === 'moderate' ? 2 : 3;

  // Cache inputs
  useEffect(() => {
    localStorage.setItem('nv_current_inputs_v2', JSON.stringify(inputs));
  }, [inputs]);

  // Cache current step
  useEffect(() => {
    localStorage.setItem('nv_wizard_step_v2', currentStep.toString());
  }, [currentStep]);

  // Run inference engine when inputs change
  useEffect(() => {
    try {
      const res = runInference(inputs);
      setInferenceResult(res);
    } catch (err: any) {
      console.error(err);
      setErrorMessage('Error running inference: ' + err.message);
      setTimeout(() => setErrorMessage(''), 5500);
    }
  }, [inputs]);

  // Load saved trips
  useEffect(() => {
    const saved = localStorage.getItem('nv_saved_trips_v2');
    if (saved) {
      setSavedTrips(JSON.parse(saved));
    }
  }, []);

  const handleResetInputs = () => {
    setInputs(DEFAULT_INPUTS);
    setCurrentStep(-1);
    setActiveTab('itinerary');
    setSuccessMessage('System reset to baseline clean parameters.');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleInterestToggle = (interest: InterestType) => {
    setInputs(prev => {
      const exists = prev.interests.includes(interest);
      let updatedInterests: InterestType[];
      if (exists) {
        if (prev.interests.length <= 1) {
          setErrorMessage('Please select at least one interest to build an itinerary.');
          setTimeout(() => setErrorMessage(''), 3550);
          return prev;
        }
        updatedInterests = prev.interests.filter(item => item !== interest);
      } else {
        let maxAllowed = 4;
        if (prev.duration === 1 || prev.duration === 2) maxAllowed = 2;

        if (prev.interests.length >= maxAllowed) {
          setErrorMessage(`Duration of ${prev.duration} Day(s) restricts selection to at most ${maxAllowed} interests.`);
          setTimeout(() => setErrorMessage(''), 3550);
          return prev;
        }
        updatedInterests = [...prev.interests, interest];
      }
      return { ...prev, interests: updatedInterests };
    });
  };

  const handleCoastalToggle = () => {
    setInputs(prev => {
      const hasBeach = prev.interests.includes('coastal_beach');
      const hasIsland = prev.interests.includes('coastal_island');
      const isSelected = hasBeach || hasIsland;

      let updated: InterestType[];
      if (isSelected) {
        const filtered = prev.interests.filter(item => item !== 'coastal_beach' && item !== 'coastal_island');
        if (filtered.length === 0) {
          setErrorMessage('Please select at least one interest to build an itinerary.');
          setTimeout(() => setErrorMessage(''), 3550);
          return prev;
        }
        updated = filtered;
      } else {
        let maxAllowed = 4;
        if (prev.duration === 1 || prev.duration === 2) maxAllowed = 2;

        if (prev.interests.length >= maxAllowed) {
          setErrorMessage(`Duration of ${prev.duration} Day(s) restricts selection to at most ${maxAllowed} interests.`);
          setTimeout(() => setErrorMessage(''), 3550);
          return prev;
        }

        updated = [...prev.interests, 'coastal_beach'];
      }

      return { ...prev, interests: updated };
    });
  };

  const handleCoastalSubToggle = (type: 'coastal_beach' | 'coastal_island') => {
    setInputs(prev => {
      const activeType = prev.interests.includes('coastal_beach') 
        ? 'coastal_beach' 
        : (prev.interests.includes('coastal_island') ? 'coastal_island' : null);

      if (!activeType) {
        // Not active, let's activate it
        let maxAllowed = 4;
        if (prev.duration === 1 || prev.duration === 2) maxAllowed = 2;

        if (prev.interests.length >= maxAllowed) {
          setErrorMessage(`Duration of ${prev.duration} Day(s) restricts selection to at most ${maxAllowed} interests.`);
          setTimeout(() => setErrorMessage(''), 3550);
          return prev;
        }
        return { ...prev, interests: [...prev.interests, type] };
      }

      if (activeType === type) {
        // If clicking the active one, check if they can turn it off. Only allowed if there is another category.
        const hasOtherCategories = prev.interests.some(item => item !== 'coastal_beach' && item !== 'coastal_island');
        if (!hasOtherCategories) {
          setErrorMessage('Please select at least one interest to build an itinerary.');
          setTimeout(() => setErrorMessage(''), 3550);
          return prev;
        }
        return { ...prev, interests: prev.interests.filter(item => item !== type) };
      } else {
        // Otherwise convert/switch to this other type (mutually exclusive)
        const filtered = prev.interests.filter(item => item !== activeType);
        return { ...prev, interests: [...filtered, type] };
      }
    });
  };

  const handleDurationChange = (val: number) => {
    setInputs(prev => {
      let updatedInterests = [...prev.interests];
      let maxAllowed = 4;
      if (val === 1 || val === 2) maxAllowed = 2;

      if (updatedInterests.length > maxAllowed) {
        updatedInterests = updatedInterests.slice(0, maxAllowed);
        setErrorMessage(`duration = ${val} Day(s) limits interests to at most ${maxAllowed} items. Selection truncated.`);
        setTimeout(() => setErrorMessage(''), 4500);
      }
      return { ...prev, duration: val, interests: updatedInterests };
    });
  };

  const handleSaveTrip = () => {
    if (!inferenceResult) return;
    const nameToUse = saveName.trim() || `My ${inferenceResult.recommendedState} Trip (${inputs.duration} Days)`;
    const newSaved: SavedTrip = {
      id: Date.now().toString(),
      timestamp: new Date().toLocaleDateString('en-MY', { hour: '2-digit', minute: '2-digit' }),
      inputs,
      result: inferenceResult
    };
    const updated = [newSaved, ...savedTrips];
    setSavedTrips(updated);
    localStorage.setItem('nv_saved_trips_v2', JSON.stringify(updated));
    setShowSaveModal(false);
    setSaveName('');
    setSuccessMessage(`Itinerary "${nameToUse}" saved successfully!`);
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleLoadTrip = (trip: SavedTrip) => {
    setInputs(trip.inputs);
    setInferenceResult(trip.result);
    setCurrentStep(9);
    setActiveTab('itinerary');
    setSuccessMessage('Historical consultation session loaded!');
    setTimeout(() => setSuccessMessage(''), 2000);
  };

  const handleDeleteTrip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedTrips.filter(t => t.id !== id);
    setSavedTrips(updated);
    localStorage.setItem('nv_saved_trips_v2', JSON.stringify(updated));
  };

  // State colors & visual settings
  const stateColorMap: Record<StateType, { bg: string; text: string; border: string; accent: string; badge: string; description: string; highlights: string[] }> = {
    Penang: {
      bg: 'bg-gradient-to-br from-emerald-500/10 to-teal-500/10 bg-emerald-50/40',
      text: 'text-emerald-950',
      border: 'border-emerald-500/30 border-2',
      accent: 'text-emerald-700 font-extrabold pb-0.5 border-b-2 border-emerald-400',
      badge: 'bg-emerald-600 text-white font-mono font-bold border-none shadow-xs text-[10px] px-2.5 py-1 rounded-lg',
      description: 'The Pearl of the Orient. Known for colonial George Town streets, historic shopfront murals, ancient clan houses, and globally acclaimed hawker hubs.',
      highlights: ['UNESCO Heritage George Town', 'Vibrant Beach Coasts & Street Art', 'World-Famous Street Delicacies']
    },
    Perak: {
      bg: 'bg-gradient-to-br from-green-500/10 to-emerald-500/10 bg-green-50/40',
      text: 'text-green-950',
      border: 'border-green-500/30 border-2',
      accent: 'text-green-700 font-extrabold pb-0.5 border-b-2 border-green-400',
      badge: 'bg-green-600 text-white font-mono font-bold border-none shadow-xs text-[10px] px-2.5 py-1 rounded-lg',
      description: 'The Land of Grace. Famous for deep limestone cave temples, majestic royal residencies, British colonial monuments, and Ipoh white coffee lanes.',
      highlights: ['Limestone Spelunking & Hotspots', 'Heritage Old Towns & White Coffee', 'Lush botanical Lake Gardens']
    },
    Kedah: {
      bg: 'bg-gradient-to-br from-teal-500/10 to-emerald-500/10 bg-teal-50/40',
      text: 'text-teal-950',
      border: 'border-teal-500/30 border-2',
      accent: 'text-teal-700 font-extrabold pb-0.5 border-b-2 border-teal-400',
      badge: 'bg-teal-600 text-white font-mono font-bold border-none shadow-xs text-[10px] px-2.5 py-1 rounded-lg',
      description: 'The Abode of Peace. Home to legendary archipelagos (Langkawi), extensive heritage rice fields, ancient archaeological dig site valleys, and highlands.',
      highlights: ['Langkawi Duty-Free Archipelago', 'Archaeological Bujang Valley Ruins', 'Seaside Forts & Rice Museum Panorama']
    },
    Perlis: {
      bg: 'bg-gradient-to-br from-lime-500/10 to-green-500/10 bg-lime-50/40',
      text: 'text-lime-950',
      border: 'border-lime-500/30 border-2',
      accent: 'text-lime-700 font-extrabold pb-0.5 border-b-2 border-lime-400',
      badge: 'bg-lime-600 text-white font-mono font-bold border-none shadow-xs text-[10px] px-2.5 py-1 rounded-lg',
      description: 'Serene Borderlands. Malaysia\'s smallest state features scenic wind-swept limestone peaks, extensive border bazaars, and subterranean cave boardwalks.',
      highlights: ['Karst Ridge Cloud-Walk Viewpoints', 'Historic Cave Railway Suspensions', 'Thai-Infused Border Bazaars']
    }
  };

  // Skip/Forward step transits
  const handleNextStep = () => {
    if (currentStep === 2 && inputs.companion === 'family_young') {
      setInputs(prev => ({ ...prev, pace: 'slow' }));
      setCurrentStep(4); // Skip pace setup (Step 3)
    } else {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep === 4 && inputs.companion === 'family_young') {
      setCurrentStep(2); // Skip back to companion
    } else {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleStepClick = (idx: number) => {
    if (inputs.companion === 'family_young' && idx === 3) return; // Locked pace step
    setCurrentStep(idx);
  };

  // Filter KB Inventory
  const filteredKBList = KNOWLEDGE_BASE.filter(poi => {
    const matchesSearch = poi.name.toLowerCase().includes(searchKBQuery.toLowerCase()) || 
                          (poi.description && poi.description.toLowerCase().includes(searchKBQuery.toLowerCase()));
    const matchesState = filterKBState === 'All' || poi.state === filterKBState;
    const matchesCategory = filterKBCategory === 'All' || poi.category === filterKBCategory;
    return matchesSearch && matchesState && matchesCategory;
  });

  const filteredFoodList = FOOD_DB.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchKBQuery.toLowerCase()) || 
                          (f.description && f.description.toLowerCase().includes(searchKBQuery.toLowerCase()));
    const matchesState = filterKBState === 'All' || f.state === filterKBState;
    const matchesHalal = filterKBCategory === 'All' || 
                         (filterKBCategory === 'halal' && f.halal_status === 'halal') ||
                         (filterKBCategory === 'non_halal' && f.halal_status === 'non_halal');
    return matchesSearch && matchesState && matchesHalal;
  });

  const steps = [
    {
      title: "Trip Duration Setup",
      description: "Choose how long you plan to explore (1 to 5 Days). Adjusting duration dynamically limits the maximum applicable interests to ensure realistic, achievable day schedules.",
      fields: ["duration"]
    },
    {
      title: "Transit & Transportation",
      description: "Choose your primary mode of travel. Your transit method directly dictates whether multi-state driving itineraries can trigger safely for longer vacations.",
      fields: ["transport"]
    },
    {
      title: "Travel Companion Setup",
      description: "Define your team. Selecting Family with Young Children automatically overrides daily pacing to Slow and coordinates safe toddler exclusions.",
      fields: ["companion"]
    },
    {
      title: "Itinerary Density Pace",
      description: inputs.companion === 'family_young'
        ? "Itinerary density choice (Locked - Pace is automatically set to Slow for toddler comfort and rest safety)."
        : "Control how many core attractions you visit each day to optimize your schedules.",
      fields: ["pace"]
    },
    {
      title: "Daily Sightseeing Budget",
      description: "Define your individual spending parameters per day for activities and meals (excluding lodging). Premium amusement parks or private guides are automatically filtered out for lower budgets.",
      fields: ["budget"]
    },
    {
      title: "Dietary Food Filter",
      description: "Activate safe Halal audit routines or unlock the rich traditional Chinese/Straits-born non-halal street hawker networks.",
      fields: ["food_restrict"]
    },
    {
      title: "Core Interests Only",
      description: "Select what elements inspire you. Choosing multiple core categories triggers our cooperative conflict resolution rules, distributing state recommendations proportionately.",
      fields: ["interests"]
    }
  ];

  return (
    <div className="min-h-screen bg-sage-50 flex flex-col antialiased font-sans text-darkgreen-900">
      
      {/* HEADER BAR */}
      <header className="bg-white text-sage-900 py-4.5 px-6 md:px-12 border-b border-sage-200 shadow-xs sticky top-0 z-40 shrink-0">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setCurrentStep(-1)}>
            <div className="p-2.5 bg-sage-100 rounded-lg text-sage-700 flex items-center justify-center">
              <Compass className="w-5.5 h-5.5 stroke-[2]" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight text-sage-900 flex items-center gap-1.5 font-display">
                NorthVoyage <span className="font-light text-sage-500">Expert System</span>
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {currentStep >= 0 && (
              <button 
                onClick={handleResetInputs}
                className="text-xs text-sage-800 hover:text-sage-900 transition-colors bg-sage-50 hover:bg-sage-100 px-3 py-1.5 rounded-lg flex items-center gap-1.5 border border-sage-200 cursor-pointer shadow-xs"
              >
                <RefreshCw className="w-3.5 h-3.5 text-sage-500" />
                <span>Reset Engine</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* FLOATING SUCCESS/ERROR TOASTERS */}
      <AnimatePresence>
        {successMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-sage-100 text-sage-900 border border-sage-300 px-5 py-3 rounded-xl shadow-xl z-50 text-xs font-bold font-mono flex items-center gap-2"
          >
            <CheckCircle className="w-4.5 h-4.5 text-sage-600 shrink-0" />
            <span>{successMessage}</span>
          </motion.div>
        )}

        {errorMessage && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 bg-red-50 text-red-900 border border-red-200 px-5 py-3 rounded-xl shadow-xl z-50 text-xs font-bold font-mono flex items-center gap-2"
          >
            <AlertTriangle className="w-4.5 h-4.5 text-red-650 shrink-0" />
            <span>{errorMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MAIN CONTAINER */}
      <main className="flex-1 py-8 px-4 md:px-12 max-w-7xl mx-auto w-full">
        
        {/* ======================================================= */}
        {/* STAGE -1: LANDING & INTRODUCTORY CONSOLE                 */}
        {/* ======================================================= */}
        {currentStep === -1 && (
          <div className="space-y-10 animate-fadeIn py-4">
            
            {/* AMBIENT HERO ACCENT */}
            <div className="bg-white text-sage-900 p-8 md:p-12 rounded-3xl relative overflow-hidden shadow-sm border border-sage-200">
              <div className="absolute top-0 right-0 w-96 h-96 bg-sage-100/50 rounded-full blur-3xl pointer-events-none"></div>
              
              <div className="max-w-2xl relative">
                <span className="bg-sage-50 text-sage-700 text-[10px] font-black tracking-widest font-mono uppercase px-3 py-1 rounded-full border border-sage-200">
                  NORTHERN PENINSULAR MALAYSIA CONSULTANT
                </span>
                
                <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mt-4 leading-tight font-display text-sage-900">
                  Planning your Itinerary to Northern Malaysia
                </h2>
                <p className="text-sm font-bold text-sage-600 uppercase tracking-widest mt-2 font-mono">
                  perak, penang, kedah, perlis
                </p>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <button
                    onClick={() => setCurrentStep(0)}
                    className="bg-sage-600 hover:bg-sage-700 text-white font-extrabold py-3.5 px-7 rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 group text-xs uppercase tracking-wider cursor-pointer"
                    id="start_consultation_huge_btn"
                  >
                    <span>START</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform text-white" />
                  </button>

                  <a 
                    href="#saved_history_anchor"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById('saved_history_panel');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="bg-sage-50 hover:bg-sage-100 text-sage-800 font-bold py-3.5 px-6 rounded-xl transition-all flex items-center justify-center gap-2 text-xs border border-sage-200 shadow-xs"
                  >
                    <History className="w-4 h-4 text-sage-600" />
                    <span>View Saved History ({savedTrips.length})</span>
                  </a>
                </div>
              </div>
            </div>

            {/* RECENT SAVED SESSIONS PANEL */}
            <div id="saved_history_panel" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs scroll-mt-24">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-4 mb-5">
                <History className="w-5.5 h-5.5 text-slate-400" />
                <div>
                  <h3 className="text-base font-extrabold text-slate-900">Historical Consultation Sessions</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Quick-recall previous system outcomes stored in your client cache</p>
                </div>
              </div>

              {savedTrips.length === 0 ? (
                <div className="p-8 text-center text-slate-400 font-sans border border-dashed border-slate-200 rounded-xl bg-slate-50">
                  <span className="text-xl">🗂️</span>
                  <p className="text-xs font-semibold mt-2 text-slate-700">No previous sessions found</p>
                  <p className="text-[11px] text-slate-400 leading-normal mt-1 max-w-[280px] mx-auto">Your saved itineraries will appear here for easy comparison and execution review.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="saved_history_anchor">
                  {savedTrips.map((trip) => (
                    <div 
                      key={trip.id}
                      onClick={() => handleLoadTrip(trip)}
                      className="p-5 rounded-xl border border-slate-200 hover:border-emerald-600/30 hover:shadow-xs transition-all bg-slate-50/50 hover:bg-white cursor-pointer group flex flex-col justify-between items-stretch min-h-[160px]"
                    >
                      <div>
                        <div className="flex justify-between items-start">
                          <span className="text-[9px] font-mono text-slate-400">{trip.timestamp}</span>
                          <button 
                            onClick={(e) => handleDeleteTrip(trip.id, e)}
                            className="p-1 rounded text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <h4 className="text-sm font-black text-slate-900 mt-2 group-hover:text-emerald-700 transition-colors truncate">
                          Target: {trip.result.recommendedState}
                        </h4>
                        <div className="text-[10px] text-slate-500 font-medium leading-relaxed font-sans space-y-1 mt-3">
                          <div className="flex justify-between">
                            <span>Duration:</span>
                            <span className="font-bold text-slate-800">{trip.inputs.duration} Days</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Companion:</span>
                            <span className="font-bold text-slate-800 capitalize">{trip.inputs.companion.replace('_', ' ')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Daily Budget:</span>
                            <span className="font-bold text-slate-800 capitalize">{trip.inputs.budget}</span>
                          </div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-emerald-600 font-mono">
                        <span>CONSULT AGAIN</span>
                        <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* ======================================================= */}
        {/* STAGES 0 to 6: INTERACTIVE WIZARD SYSTEM                */}
        {/* ======================================================= */}
        {currentStep >= 0 && currentStep <= 6 && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fadeIn">
            
            {/* WIZARD LEFT RAIL: STEP PROGRESS */}
            <div className="col-span-1 lg:col-span-4 bg-white rounded-2xl border border-slate-200 p-5 shadow-xs shrink-0">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest font-mono mb-4">Consultation Progress</h3>
              <div className="space-y-2">
                {steps.map((st, idx) => {
                  const isCompleted = idx < currentStep;
                  const isActive = idx === currentStep;
                  const isLocked = inputs.companion === 'family_young' && idx === 3;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleStepClick(idx)}
                      disabled={(idx > currentStep && !steps[idx - 1]) || isLocked}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all text-xs flex items-center justify-between outline-none ${
                        isActive 
                          ? 'border-emerald-600 bg-emerald-500/5 text-emerald-950 font-bold ring-1 ring-emerald-600' 
                          : isLocked
                            ? 'border-slate-100 bg-slate-50/50 text-slate-300 cursor-not-allowed opacity-50'
                            : isCompleted
                              ? 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'
                              : 'border-slate-100 bg-white text-slate-300 cursor-not-allowed hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                         <span className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-mono font-bold shrink-0 ${
                          isActive 
                            ? 'bg-emerald-600 text-white' 
                            : isLocked 
                              ? 'bg-slate-200 text-slate-400'
                              : isCompleted 
                                ? 'bg-emerald-150 text-emerald-800' 
                                : 'bg-slate-100 text-slate-400'
                        }`}>
                          {idx + 1}
                        </span>
                        <span className="truncate">{st.title}</span>
                      </div>
                      {isLocked && (
                        <span className="text-[8px] bg-amber-50 border border-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-wider shrink-0 leading-none">Auto Slow</span>
                      )}
                      {!isLocked && isCompleted && (
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>

              {/* DYNAMIC RECAP MINI PANEL */}
              <div className="mt-6 pt-5 border-t border-slate-100 space-y-2 text-[11px] font-mono text-slate-500 leading-normal">
                <span className="block text-[9px] font-black uppercase tracking-widest text-slate-400 font-mono mb-2">Live Setup Summary</span>
                <div className="truncate"><span className="text-slate-400">1. Days:</span> <strong>{inputs.duration} Days</strong></div>
                <div className="truncate"><span className="text-slate-400">2. Transit:</span> <strong>{inputs.transport === 'grab' ? 'Grab / Taxi' : inputs.transport === 'self_driving' ? 'Self-Driving' : 'Car Rental'}</strong></div>
                <div className="truncate"><span className="text-slate-400">3. Companion:</span> <strong className="capitalize">{inputs.companion.replace('_', ' ')}</strong></div>
                <div className="truncate"><span className="text-slate-400">4. Pace:</span> <strong>{inputs.pace} pace</strong></div>
                <div className="truncate"><span className="text-slate-400">5. Sightseeing allowance:</span> <strong className="capitalize">{inputs.budget} Budget</strong></div>
                <div className="truncate"><span className="text-slate-400">6. Food:</span> <strong>{inputs.food_restrict === 'halal' ? 'Halal Preferred' : 'No Restrictions'}</strong></div>
                <div className="col-span-2 truncate"><span className="text-slate-400">7. Selected Interests:</span> <strong className="capitalize text-slate-700">{inputs.interests.map(i => i.replace('_', ' ')).join(', ')}</strong></div>
              </div>
            </div>

            {/* WIZARD FRONT PANEL */}
            <div className="col-span-1 lg:col-span-8 bg-white rounded-2xl border border-slate-200 p-6 md:p-8 shadow-xs relative">
              
              {/* Step Content */}
              <div>
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-6">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 font-mono">
                      Step {currentStep + 1} of {steps.length} • {steps[currentStep].title}
                    </span>
                    <h3 className="text-lg font-black font-display text-slate-900 mt-0.5 leading-snug">
                      {steps[currentStep].title} Setup
                    </h3>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {Math.round(((currentStep + 1) / steps.length) * 100)}% Complete
                  </span>
                </div>

                <p className="text-slate-500 text-xs md:text-sm mb-6 leading-relaxed">
                  {steps[currentStep].description}
                </p>

                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentStep}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    transition={{ duration: 0.15 }}
                    className="space-y-6"
                  >
                    
                    {/* STEP 0: TRIP DURATION */}
                    {currentStep === 0 && (
                      <div className="space-y-5 animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Select Trip Duration (Days)
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                          {[
                            { val: 1, label: "1 Day", tag: "Express", desc: "Short transit" },
                            { val: 2, label: "2 Days", tag: "Weekend", desc: "Quick getaway" },
                            { val: 3, label: "3 Days", tag: "Standard", desc: "Leisurely blend" },
                            { val: 4, label: "4 Days", tag: "Immersive", desc: "Deep vacation" },
                            { val: 5, label: "5 Days", tag: "Expedition", desc: "State-wide trek" }
                          ].map((opt) => {
                            const isSelected = inputs.duration === opt.val;
                            return (
                              <button
                                key={opt.val}
                                type="button"
                                onClick={() => handleDurationChange(opt.val)}
                                className={`p-4 rounded-xl border text-center flex flex-col justify-center items-center gap-1 transition-all outline-none cursor-pointer ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-500/5 text-emerald-950 ring-1 ring-emerald-600 font-bold shadow-xs'
                                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                                }`}
                                id={`duration_btn_${opt.val}`}
                              >
                                <span className="text-xl font-black">{opt.val}</span>
                                <p className="text-[11px] font-bold mt-1 leading-none">{opt.label}</p>
                                <span className="text-[8px] uppercase tracking-wider font-mono px-1.5 py-0.5 mt-2 bg-slate-200/50 rounded text-slate-500">
                                  {opt.tag}
                                </span>
                              </button>
                            );
                          })}
                        </div>

                        <div className="bg-emerald-50/60 border border-emerald-500/10 rounded-xl p-3.5 text-xs text-emerald-800 leading-normal mt-4 gap-2.5 flex items-start font-sans">
                          <Info className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-950 block mb-0.5">Duration Dependency Actions:</span> 
                            Changing trip duration automatically scales the permissible interest categories to prevent schedule overloading. Selection limits are: 1-2 Days = Max 2 interests | 3-5 Days = Max 4 interests.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* STEP 1: TRANSIT / TRANSIT METHOD */}
                    {currentStep === 1 && (
                      <div className="space-y-5 animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Select Transportation Mode
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {[
                            { id: 'self_driving', label: 'Self-Driving (Own/Rental)', icon: '🚗', desc: 'Authorizes active inter-state pairings on longer trips (>= 3 days).' },
                            { id: 'grab', label: 'E-Hailing (Grab / Taxi)', icon: '📱', desc: 'Convenient inner-city point rides. Restricted to single-state routes for 3 days.' }
                          ].map((opt) => {
                            const isSelected = inputs.transport === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, transport: opt.id as any }))}
                                className={`p-4.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[145px] outline-none cursor-pointer ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-500/5 text-emerald-950 ring-1 ring-emerald-600 shadow-xs'
                                    : 'border-slate-200 bg-slate-50/50 text-slate-600 hover:border-slate-300'
                                }`}
                                id={`transport_btn_${opt.id}`}
                              >
                                <div className="space-y-1.5 col-span-3">
                                  <span className="text-2xl shrink-0">{opt.icon}</span>
                                  <p className="text-xs font-bold text-slate-900 leading-none mt-1.5">{opt.label}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2.5 leading-snug">{opt.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* STEP 2: TRAVEL COMPANION */}
                    {currentStep === 2 && (
                      <div className="space-y-5 animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Define Your Travel Companion Circle
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          
                          {/* Option A: Adults only */}
                          <button
                            type="button"
                            onClick={() => setInputs(prev => ({ ...prev, companion: 'adult' }))}
                            className={`p-4.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[145px] cursor-pointer outline-none ${
                              inputs.companion === 'adult'
                                ? 'border-emerald-600 bg-emerald-500/5 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                                : 'border-slate-200 bg-slate-50/50 text-slate-705 hover:border-slate-300'
                            }`}
                            id="companion_adult"
                          >
                            <div className="space-y-1.5">
                              <span className="text-3xl shrink-0">🧑‍🤝‍🧑</span>
                              <p className="text-xs font-bold text-slate-900 leading-none mt-2">Adults Only Group</p>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">No kids present. Focuses on standard adventurous or intensive itineraries.</p>
                          </button>

                          {/* Option B: Family Group */}
                          <button
                            type="button"
                            onClick={() => {
                              if (inputs.companion === 'adult') {
                                setInputs(prev => ({ ...prev, companion: 'family_young', pace: 'slow' }));
                              }
                            }}
                            className={`p-4.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[145px] cursor-pointer outline-none ${
                              inputs.companion !== 'adult'
                                ? 'border-emerald-600 bg-emerald-500/5 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                                : 'border-slate-200 bg-slate-50/50 text-slate-705 hover:border-slate-300'
                            }`}
                            id="companion_family"
                          >
                            <div className="space-y-1.5">
                              <span className="text-3xl shrink-0">👨‍👩‍👧‍👦</span>
                              <p className="text-xs font-bold text-slate-900 leading-none mt-2">Family Group</p>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-2 leading-relaxed">Children present. Enables safety limits and family comfort-based travel routing.</p>
                          </button>

                        </div>

                        {/* Interactive subchoice for family configuration */}
                        {inputs.companion !== 'adult' && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-5 bg-emerald-50/40 rounded-2xl border border-emerald-100 space-y-3 mt-4"
                          >
                            <p className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Select Family Configuration:</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                              
                              {/* Option B1: kids < 7 */}
                              <button
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, companion: 'family_young', pace: 'slow' }))}
                                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[100px] cursor-pointer outline-none ${
                                  inputs.companion === 'family_young'
                                    ? 'bg-white border-emerald-600 text-emerald-950 ring-1 ring-emerald-600 font-bold shadow-xs'
                                    : 'bg-white/60 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white'
                                }`}
                                id="companion_family_young"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">👶</span>
                                  <p className="text-xs font-bold text-slate-950">Family with kids &lt; 7 years</p>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 leading-normal">
                                  Enforces family safety overrides and sets daily pace to Slow automatically.
                                </p>
                              </button>

                              {/* Option B2: kids > 7 */}
                              <button
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, companion: 'family_older' }))}
                                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[100px] cursor-pointer outline-none ${
                                  inputs.companion === 'family_older'
                                    ? 'bg-white border-emerald-600 text-emerald-950 ring-1 ring-emerald-600 font-bold shadow-xs'
                                    : 'bg-white/60 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-white'
                                }`}
                                id="companion_family_older"
                              >
                                <div className="flex items-center gap-2">
                                  <span className="text-xl">🧑‍🎓</span>
                                  <p className="text-xs font-bold text-slate-950">Family with kids more than 7 years</p>
                                </div>
                                <p className="text-[10px] text-slate-500 mt-2 leading-normal">
                                  Keeps child-friendly filter active, but allows flexible, active daily pacing.
                                </p>
                              </button>

                            </div>
                          </motion.div>
                        )}
                      </div>
                    )}

                    {/* STEP 3: TRAVEL PACE SETUP (Only shown if companion is NOT family_young) */}
                    {currentStep === 3 && (
                      <div className="space-y-5 animate-fadeIn">
                        {inputs.companion === 'family_young' ? (
                          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-amber-800 leading-normal flex items-start gap-2.5 font-sans">
                            <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                            <div>
                              <span className="font-extrabold text-amber-950 block mb-1">Step Bypass Active:</span>
                              Since you are traveling with toddlers/young children (under age 7), our safety engine auto-infers your pace as <strong>Slow</strong> (1 Attraction + 1 Culinary Stop per day). The pace setup option is skipped automatically.
                            </div>
                          </div>
                        ) : (
                          <div>
                            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                              Select Your Travel Pace (Daily Intensity)
                            </label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {[
                                { id: 'slow', label: 'Slow & Leisurely', icon: '☕', desc: '1 attraction + 1 food stop / Day' },
                                { id: 'moderate', label: 'Moderate & Balanced', icon: '🚶', desc: '2 attractions + 1 food stop / Day' },
                                { id: 'packed', label: 'Packed & Active', icon: '🧗', desc: '3 attractions + 1 food stop / Day' }
                              ].map((pc) => (
                                <button
                                  key={pc.id}
                                  type="button"
                                  onClick={() => setInputs(prev => ({ ...prev, pace: pc.id as any }))}
                                  className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[125px] cursor-pointer outline-none ${
                                    inputs.pace === pc.id
                                      ? 'border-emerald-600 bg-emerald-500/5 text-emerald-950 ring-1 ring-emerald-600 font-bold'
                                      : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                                  }`}
                                  id={`pace_btn_${pc.id}`}
                                >
                                  <div>
                                    <div className="flex items-center gap-1.5">
                                      <span>{pc.icon}</span>
                                      <p className="text-xs font-bold text-slate-900 leading-none">{pc.label}</p>
                                    </div>
                                    <p className="text-[10px] text-emerald-700 font-extrabold mt-1.5 font-mono">{pc.desc}</p>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* STEP 4: DAILY BUDGET */}
                    {currentStep === 4 && (
                      <div className="space-y-5 animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Define Sightseeing Daily Budget (Per Traveler)
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'low', label: 'Low Budget', rate: 'RM 15 – 50 / day', desc: 'Homestays, street food hunts, free colonial plazas and nature parks' },
                            { id: 'medium', label: 'Medium Budget', rate: 'RM 60 – 150 / day', desc: 'Traditional restaurants, midrange museums, and general taxis' },
                            { id: 'high', label: 'High Budget', rate: 'RM 180+ / day', desc: 'Premium guides, fine dining, and elite theme park admissions' }
                          ].map((bgt) => (
                            <button
                              key={bgt.id}
                              type="button"
                              onClick={() => setInputs(prev => ({ ...prev, budget: bgt.id as any }))}
                              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[140px] cursor-pointer outline-none ${
                                inputs.budget === bgt.id
                                  ? 'border-emerald-600 bg-emerald-500/5 text-emerald-950 ring-1 ring-emerald-600 font-bold shadow-xs'
                                  : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                              }`}
                              id={`bgt_btn_${bgt.id}`}
                            >
                              <div>
                                <p className="text-xs font-bold text-slate-900 leading-none">{bgt.label}</p>
                                <p className="text-xs text-emerald-700 font-mono font-extrabold mt-1.5">{bgt.rate}</p>
                              </div>
                              <p className="text-[10px] text-slate-400 mt-2.5 leading-normal">{bgt.desc}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 5: DIETARY FOOD RESTRICTIONS */}
                    {currentStep === 5 && (
                      <div className="space-y-5 animate-fadeIn">
                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                          Select Dietary Alignment
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          {[
                            { id: 'halal', label: 'Halal Certified Preferred', icon: '🕌', desc: 'Filters daily lunch and dinner suggestions exclusively from Halal-Certified regional outlets.' },
                            { id: 'no_restriction', label: 'Traditional / No Restriction', icon: '🍜', desc: 'Allows traditional landmarks, Straits Chinese eateries, and pork-infused street delicacies.' }
                          ].map((opt) => {
                            const isSelected = inputs.food_restrict === opt.id;
                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={() => setInputs(prev => ({ ...prev, food_restrict: opt.id as any }))}
                                className={`p-4.5 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[140px] cursor-pointer outline-none ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-500/5 text-emerald-950 ring-1 ring-emerald-600 font-bold shadow-xs'
                                    : 'border-slate-200 bg-slate-50/50 text-slate-700 hover:border-slate-300'
                                }`}
                                id={`food_btn_${opt.id}`}
                              >
                                <div className="space-y-1.5 col-span-3">
                                  <span className="text-2xl shrink-0">{opt.icon}</span>
                                  <p className="text-xs font-bold text-slate-900 leading-none mt-1.5">{opt.label}</p>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed">{opt.desc}</p>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* STEP 6: CORE TRAVEL INTERESTS */}
                    {currentStep === 6 && (
                      <div className="space-y-5 animate-fadeIn">
                        <div className="flex items-center justify-between">
                          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                            Choose Core Interests Only
                          </label>
                          {inputs.interests.length >= 2 && (
                            <span className="text-[9px] text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-mono font-medium border border-emerald-100">
                              COOPERATIVE ROUTING ACTIVE
                            </span>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[
                            { id: 'adventure', label: 'Adventure Triggers', icon: '🧗', desc: 'Active climbs, caves, hikes' },
                            { id: 'nature_eco', label: 'Nature & Wilderness', icon: '🌲', desc: 'Rainforest park canopies' },
                            { id: 'historical_heritage', label: 'Historical Heritage', icon: '🏛️', desc: 'UNESCO monuments, temples' },
                            { id: 'coastal', label: 'Coastal Interests', icon: '🌊', desc: 'Beaches, island ports, and waters' },
                            { id: 'shopping', label: 'Shopping Experience', icon: '🛍️', desc: 'Premium waterfront hubs, border bazaars' }
                          ].map((opt) => {
                            const isCoastal = opt.id === 'coastal';
                            const isSelected = isCoastal
                              ? (inputs.interests.includes('coastal_beach') || inputs.interests.includes('coastal_island'))
                              : inputs.interests.includes(opt.id as any);
                            
                            let limitVal = (inputs.duration <= 2) ? 2 : 4;
                            const isAtLimit = !isSelected && inputs.interests.length >= limitVal;

                            const handleClick = () => {
                              if (isCoastal) {
                                handleCoastalToggle();
                              } else {
                                handleInterestToggle(opt.id as any);
                              }
                            };

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                disabled={isAtLimit}
                                onClick={handleClick}
                                className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all min-h-[110px] outline-none ${
                                  isSelected
                                    ? 'border-emerald-600 bg-emerald-500/10 text-emerald-990 ring-2 ring-emerald-600'
                                    : isAtLimit
                                      ? 'border-slate-100 bg-slate-50 text-slate-300 cursor-not-allowed opacity-50'
                                      : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 text-slate-700 cursor-pointer'
                                }`}
                                id={`interest_btn_${opt.id}`}
                              >
                                <span className="text-2xl">{opt.icon}</span>
                                <div>
                                  <p className="text-xs font-black leading-tight mt-1">{opt.label}</p>
                                  <p className="text-[10px] text-slate-400 mt-1 leading-snug">{opt.desc}</p>
                                </div>
                              </button>
                            );
                          })}
                        </div>

                        {/* Coastal sub-selection if the user selected Coastal */}
                        {(inputs.interests.includes('coastal_beach') || inputs.interests.includes('coastal_island')) && (
                          <div className="p-4 bg-emerald-50/30 border border-emerald-100 rounded-xl space-y-3.5 animate-fadeIn">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-slate-800">
                                ⚓ Choose specific Coastal types:
                              </span>
                              <span className="text-[9px] text-slate-400 uppercase tracking-widest font-mono">
                                Sub-selector
                              </span>
                            </div>
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                type="button"
                                onClick={() => handleCoastalSubToggle('coastal_beach')}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-xs font-bold text-left transition-all flex-1 ${
                                  inputs.interests.includes('coastal_beach')
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                                id="coastal_sub_beach"
                              >
                                <span className="text-lg">🏖️</span>
                                <div>
                                  <p className="leading-tight font-extrabold">Scenic Beach Coasts</p>
                                  <p className="text-[9px] font-normal text-slate-400 mt-0.5">Batu Ferringhi sunset sand waterfronts</p>
                                </div>
                              </button>
                              
                              <button
                                type="button"
                                onClick={() => handleCoastalSubToggle('coastal_island')}
                                className={`flex items-center gap-2.5 px-4 py-3 rounded-lg border text-xs font-bold text-left transition-all flex-1 ${
                                  inputs.interests.includes('coastal_island')
                                    ? 'bg-emerald-500/10 border-emerald-500 text-emerald-950 ring-1 ring-emerald-500'
                                    : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'
                                }`}
                                id="coastal_sub_island"
                              >
                                <span className="text-lg">🏝️</span>
                                <div>
                                  <p className="leading-tight font-extrabold">Island Archipelagos</p>
                                  <p className="text-[9px] font-normal text-slate-400 mt-0.5">Langkawi, Pangkor duty-free ports & waters</p>
                                </div>
                              </button>
                            </div>
                            <p className="text-[10px] text-slate-400 italic">
                              * Select either beach or island coastal type. Changes are mutually exclusive and count as 1 selection.
                            </p>
                          </div>
                        )}

                        {/* Interactive validation advisory */}
                        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs text-slate-500 leading-relaxed font-sans">
                          <span className="font-bold text-slate-800">KBS Inference Rule Enforcer:</span> Since your duration is set to <strong>{inputs.duration} Day(s)</strong>, you can select at most {(inputs.duration <= 2) ? '2' : '4'} categories.
                        </div>
                      </div>
                    )}

                  </motion.div>
                </AnimatePresence>
              </div>

              {/* FOOTER WIZARD CONTROLS */}
              <div className="flex items-center justify-between border-t border-slate-100 pt-6 mt-8">
                <button
                  onClick={handlePrevStep}
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors py-2 px-3 hover:bg-slate-50 rounded-lg outline-none cursor-pointer"
                  id="wizard_back_btn"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                {currentStep < steps.length - 1 ? (
                  <button
                    onClick={handleNextStep}
                    className="bg-sage-600 hover:bg-sage-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-xs transition-all flex items-center gap-1.5 text-xs text-center cursor-pointer uppercase tracking-wider"
                    id="wizard_next_btn"
                  >
                    <span>Continue</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      try {
                        const res = runInference(inputs);
                        setInferenceResult(res);
                        setCurrentStep(9); // Navigate to Results Stage
                        setSuccessMessage('Expert system inference completed successfully!');
                        setTimeout(() => setSuccessMessage(''), 2000);
                      } catch (err: any) {
                        setErrorMessage(err.message);
                      }
                    }}
                    className="bg-sage-600 hover:bg-sage-700 text-white font-extrabold py-3 px-7 rounded-xl shadow-md transition-all flex items-center gap-2 text-xs uppercase tracking-widest cursor-pointer"
                    id="generate_blueprint_btn"
                  >
                    <Sparkles className="w-4.5 h-4.5 text-white stroke-[2.5]" />
                    <span>Evaluate Itinerary</span>
                    <ArrowRight className="w-4 h-4 text-white" />
                  </button>
                )}
              </div>

            </div>
          </div>
        )}

        {/* ======================================================= */}
        {/* STAGE 9: INFERENCE SYSTEM RESULTS BOARD                  */}
        {/* ======================================================= */}
        {currentStep === 9 && inferenceResult && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="space-y-6"
          >
            
            {/* HERO BANNER SECTION */}
            {(() => {
              const scheme = stateColorMap[inferenceResult.recommendedState];
              return (
                <div className={`p-6 md:p-8 rounded-2xl border ${scheme.border} ${scheme.bg} shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-6 relative overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/5 rounded-full blur-3xl -translate-y-20 translate-x-10 pointer-events-none"></div>
                  
                  <div className="relative min-w-0 flex-1">
                    <span className="text-[10px] font-mono tracking-widest uppercase font-bold text-slate-500 block mb-1">RECOMMENDED TARGET DECISION</span>
                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight font-display">
                      {inferenceResult.recommendedState}
                      {inferenceResult.multi_state && (
                        <span className="text-slate-400 font-light"> & {inferenceResult.alternativeState} Expedition</span>
                      )}
                    </h2>
                    <p className="text-xs text-slate-500 leading-relaxed font-sans max-w-2xl mt-2.5">
                      {scheme.description} {inferenceResult.multi_state && `This trip connects with secondary state ${inferenceResult.alternativeState} to satisfy cooperative pairing rules.`}
                    </p>
                  </div>

                  <div className="flex flex-row md:flex-col gap-3 shrink-0 justify-stretch relative z-10 w-full md:w-auto">
                    <button
                      onClick={() => setShowSaveModal(true)}
                      className="bg-sage-500 hover:bg-sage-650 text-white font-bold text-xs py-2.5 px-4 rounded-xl flex items-center justify-center gap-1.5 transition-all flex-1 cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5 text-sage-100" />
                      <span>Save Trip</span>
                    </button>
                    <button
                      onClick={() => setCurrentStep(6)}
                      className="bg-white hover:bg-sage-50 text-darkgreen-800 text-xs font-bold py-2.5 px-4 rounded-xl border border-sage-200 flex items-center justify-center gap-1.5 transition-all flex-1 cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-sage-600" />
                      <span>Adjust Inputs</span>
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* NAV TABS */}
            <div className="flex bg-sage-100 p-1 rounded-xl gap-2 w-max border border-sage-200/50">
              {[
                { id: 'itinerary', label: 'Inferred Daily Itinerary', icon: Map },
                { id: 'explanation', label: 'Explanation Facility', icon: BookOpen },
                { id: 'database', label: 'Knowledge Base Repository', icon: Search }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-2 px-4 rounded-lg text-xs font-bold flex items-center gap-2 transition-all outline-none cursor-pointer ${
                      isActive 
                        ? 'bg-white text-darkgreen-905 shadow-xs' 
                        : 'text-sage-700 hover:text-darkgreen-900'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-sage-500 font-extrabold' : 'text-sage-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* TAB 1: DAILY ROUTE SCHEDULES */}
            {activeTab === 'itinerary' && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                
                {/* Timeline display */}
                <div className="lg:col-span-8 space-y-6">
                  {inferenceResult.itinerary.map((day) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      key={day.dayNumber}
                      className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs relative"
                    >
                      {/* Timeline bar */}
                      <div className="absolute top-16 bottom-16 left-[23px] w-0.5 bg-slate-100 pointer-events-none"></div>

                      <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                        <div className="flex items-center gap-3">
                          <span className="w-8 h-8 rounded-full bg-sage-600 text-white font-mono font-bold flex items-center justify-center text-sm shrink-0">
                            {day.dayNumber}
                          </span>
                          <div>
                            <h3 className="text-sm font-black text-slate-900">Day {day.dayNumber} Roadmap</h3>
                            <p className="text-[10px] text-emerald-800 uppercase tracking-widest font-mono font-bold mt-0.5">{day.theme}</p>
                          </div>
                        </div>
                        {day.travelNote && (
                          <span className="text-[9px] bg-amber-50 text-amber-700 font-mono font-bold border border-amber-200 py-1 px-2.5 rounded-lg flex items-center gap-1 shrink-0">
                            🚗 TRAVEL DAY
                          </span>
                        )}
                      </div>

                      {/* Travel Note Box */}
                      {day.travelNote && (
                        <div className="bg-amber-500/5 border border-amber-500/10 rounded-xl p-3.5 text-xs text-amber-800 leading-relaxed mb-5 flex items-start gap-2 animate-fadeIn font-sans">
                          <Car className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-extrabold text-amber-950 block">Travel Note: {day.travelNote}</span>
                            According to <strong>Rule 2.17</strong>, when moving between states your transportation day activities are restricted to 1 light attraction and dinner in your destination state.
                          </div>
                        </div>
                      )}

                      {/* Timeline cards */}
                      <div className="space-y-6">
                        
                        {/* 1. Morning Attraction (Index 0) */}
                        {day.pois[0] && (
                          <div className="flex gap-4 relative">
                            <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-300 shrink-0 z-10 mt-1.5 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-sage-500"></div>
                            </div>
                            <div className="flex-1 p-5 bg-white hover:bg-slate-50/20 border-l-4 border-l-sage-500 border-y border-r border-slate-200/80 rounded-r-xl rounded-l-md shadow-xs hover:shadow-xs transition-all leading-normal ml-0.5">
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] uppercase tracking-wider bg-sage-600 text-white font-mono px-2 py-0.5 rounded font-black leading-none">Morning Excursion</span>
                                  <h4 className="text-sm font-black text-slate-900">{day.pois[0].name}</h4>
                                </div>
                                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-mono font-black border border-emerald-200 px-2.5 py-0.5 rounded-lg">{day.pois[0].state}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-sans">{day.pois[0].description}</p>
                              
                              <div className="pt-3.5 border-t border-slate-100 mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] text-slate-500 font-mono">
                                <div><span className="opacity-75">💰 Allowance:</span> <strong className="text-slate-800">{day.pois[0].estCost}</strong></div>
                                <div className="capitalize"><span className="opacity-75">🧗 Intensity:</span> <strong className="text-slate-800">{day.pois[0].activity_intensity}</strong></div>
                                <div><span className="opacity-75">🕌 Halal:</span> <strong className="text-slate-800 font-semibold text-[9px] uppercase text-emerald-600">Non-Restricted</strong></div>
                              </div>

                              {/* Explainer hooks (Layer 7 Rule checks) */}
                              {inferenceResult.explanation[day.pois[0].id] && (
                                <div className="mt-3.5 pt-2.5 border-t border-slate-100 space-y-1">
                                  {inferenceResult.explanation[day.pois[0].id].map((reason, ri) => (
                                    <div key={ri} className="text-[9px] text-emerald-700 font-bold bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 flex items-center gap-1.5 w-fit font-mono leading-none">
                                      <Gem className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>Reasoning: {reason}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 2. Noon Stop (Lunch - Core food suggestions) */}
                        {day.food && (
                          <div className="flex gap-4 relative">
                            <div className="w-4 h-4 rounded-full bg-teal-100 border-2 border-teal-500 shrink-0 z-10 mt-1.5 flex items-center justify-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-teal-600"></div>
                            </div>
                            <div className="flex-1 p-5 bg-teal-50/40 hover:bg-teal-50/70 border-l-4 border-l-teal-500 border-y border-r border-teal-100 rounded-r-xl rounded-l-md shadow-xs transition-all leading-normal ml-0.5">
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] uppercase tracking-widest bg-teal-700 text-teal-50 font-mono px-2 py-0.5 rounded font-black flex items-center gap-1 leading-none">
                                    <Utensils className="w-2.5 h-2.5" />
                                    <span>Noon Stop • Food Highlight</span>
                                  </span>
                                  <h4 className="text-sm font-black text-teal-950">{day.food.name}</h4>
                                </div>
                                <span className={`text-[10px] font-mono font-black px-2.5 py-0.5 rounded-lg border ${day.food.halal_status === 'halal' ? 'bg-emerald-600 text-white border-emerald-500' : 'bg-rose-600 text-white border-rose-500'}`}>
                                  {day.food.halal_status === 'halal' ? 'Halal Certified' : 'Non-Halal Default'}
                                </span>
                              </div>
                              <p className="text-xs text-teal-900 mt-2.5 leading-relaxed font-sans font-normal opacity-90">{day.food.description}</p>

                              {/* Explainer logs (Layer 7 Food rules) */}
                              {inferenceResult.explanation[day.food.food_id] && (
                                <div className="mt-3.5 pt-2.5 border-t border-teal-500/10 space-y-1">
                                  {inferenceResult.explanation[day.food.food_id].map((reason, ri) => (
                                    <div key={ri} className="text-[9px] text-teal-800 font-bold bg-teal-500/5 px-2 py-1 rounded border border-teal-500/10 flex items-center gap-1.5 w-fit font-mono leading-none">
                                      <Gem className="w-3 h-3 text-teal-600 shrink-0" />
                                      <span>Reasoning: {reason}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}

                        {/* 3. Afternoon Excursions (Remaining index >= 1) */}
                        {day.pois.slice(1).map((poi, pi) => (
                          <div key={poi.id} className="flex gap-4 relative animate-fadeIn">
                            <div className="w-4 h-4 rounded-full bg-white border-2 border-slate-300 shrink-0 z-10 mt-1.5 flex items-center justify-center">
                              <div className="w-2 h-2 rounded-full bg-sage-500"></div>
                            </div>
                            <div className="flex-1 p-5 bg-white hover:bg-slate-50/20 border-l-4 border-l-sage-500 border-y border-r border-slate-200/80 rounded-r-xl rounded-l-md shadow-xs hover:shadow-xs transition-all leading-normal ml-0.5">
                              <div className="flex justify-between items-start flex-wrap gap-2">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[9px] uppercase tracking-wider bg-sage-600 text-white font-mono px-2 py-0.5 rounded font-black leading-none">
                                    {pi === 0 ? 'Afternoon Excursion' : 'Evening Stop'}
                                  </span>
                                  <h4 className="text-sm font-black text-slate-900">{poi.name}</h4>
                                </div>
                                <span className="text-[10px] bg-emerald-100 text-emerald-900 font-mono font-black border border-emerald-200 px-2.5 py-0.5 rounded-lg">{poi.state}</span>
                              </div>
                              <p className="text-xs text-slate-600 mt-2.5 leading-relaxed font-sans">{poi.description}</p>
                              
                              <div className="pt-3.5 border-t border-slate-100 mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-[10px] text-slate-500 font-mono">
                                <div><span className="opacity-75">💰 Allowance:</span> <strong className="text-slate-800">{poi.estCost}</strong></div>
                                <div className="capitalize"><span className="opacity-75">🧗 Intensity:</span> <strong className="text-slate-800">{poi.activity_intensity}</strong></div>
                                <div><span className="opacity-75">🕌 Halal:</span> <strong className="text-slate-800 font-semibold text-[9px] uppercase text-emerald-600">Non-Restricted</strong></div>
                              </div>

                              {/* Explainer triggers */}
                              {inferenceResult.explanation[poi.id] && (
                                <div className="mt-3.5 pt-2.5 border-t border-slate-100 space-y-1">
                                  {inferenceResult.explanation[poi.id].map((reason, ri) => (
                                    <div key={ri} className="text-[9px] text-emerald-700 font-bold bg-emerald-500/5 px-2 py-1 rounded border border-emerald-500/10 flex items-center gap-1.5 w-fit font-mono leading-none">
                                      <Gem className="w-3 h-3 text-emerald-600 shrink-0" />
                                      <span>Reasoning: {reason}</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        ))}

                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Sidebar accommodations & Worksheet details (Layer 6 & Layer 7) */}
                <div className="lg:col-span-4 space-y-5">
                  
                  {/* Lodging segment */}
                  <div className="bg-white text-sage-900 rounded-2xl border border-sage-200 p-5.5 shadow-sm leading-normal">
                    <div className="flex items-center gap-2 mb-4 text-sage-600">
                      <Tent className="w-5 h-5 stroke-[2]" />
                      <h3 className="text-xs font-black uppercase tracking-widest font-mono text-sage-800">LODGING DEEP INFERENCE</h3>
                    </div>
                    <div className="space-y-3 font-sans text-xs">
                      <div className="flex flex-col gap-1 border-b border-sage-100 pb-3">
                        <span className="text-sage-500 font-mono text-[9px] uppercase tracking-wider leading-none">Derived Lodging Option:</span>
                        <span className="text-sage-900 font-extrabold text-sm leading-normal">{inferenceResult.derivedAccommodation.tier}</span>
                      </div>
                      <p className="text-sage-700 text-xs leading-relaxed">
                        {inferenceResult.derivedAccommodation.advice}
                      </p>
                    </div>
                  </div>

                  {/* Calculations Sheet */}
                  <div className="bg-sage-50 text-sage-900 rounded-2xl border border-sage-200 p-5.5 shadow-sm leading-normal">
                    <div className="flex items-center gap-2 mb-4 text-sage-750">
                      <span className="text-lg">💰</span>
                      <h3 className="text-xs font-black uppercase tracking-widest font-mono text-sage-900">BUDGET SHEET PROJECTOR</h3>
                    </div>
                    
                    <div className="space-y-3 font-sans text-xs">
                      <div className="flex justify-between border-b border-sage-200 pb-2">
                        <span className="text-sage-800">Rate class:</span>
                        <span className="font-extrabold text-sage-900 capitalize">{inputs.budget} Allowance</span>
                      </div>
                      <div className="flex justify-between border-b border-sage-200 pb-2">
                        <span className="text-slate-600">Target allowance / Day:</span>
                        <span className="font-extrabold text-sage-900 font-mono text-xs">RM {inputs.budget === 'low' ? '30' : inputs.budget === 'medium' ? '100' : '250'} / person</span>
                      </div>
                      <div className="flex justify-between border-b border-sage-200 pb-2">
                        <span className="text-slate-600">Days duration:</span>
                        <span className="font-extrabold text-white bg-sage-600 rounded px-1.5 py-0.5 text-[10px] font-mono">{inputs.duration} Days</span>
                      </div>
                      <div className="flex justify-between border-b border-sage-200 pb-2 font-semibold">
                        <span className="text-slate-600">Pace:</span>
                        <span className="font-extrabold text-sage-900 capitalize">{inputs.pace} ({basePoisPerDay} blocks/day)</span>
                      </div>

                      <p className="text-[10px] text-sage-700 leading-normal italic mt-1.5 p-2 bg-white rounded border border-sage-200">
                        *Pocket money projections calculate sightseeing and food budgets per active tourist day. Lodging, hotel, or car rentals are managed independently of this worksheet.
                      </p>
                    </div>
                  </div>

                  {/* Recap details */}
                  <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs leading-normal">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-mono mb-3">CONVENIENCE FACT REVIEW</h4>
                    <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-slate-600">
                      <div>Days: <strong>{inputs.duration}</strong></div>
                      <div>Transit: <strong>{inputs.transport}</strong></div>
                      <div>Budget: <strong>{inputs.budget}</strong></div>
                      <div>Pace: <strong>{inputs.pace}</strong></div>
                      <div>Team: <strong>{inputs.companion}</strong></div>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* TAB 2: EXPLANATION FACILITY */}
            {activeTab === 'explanation' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs leading-normal"
              >
                <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 font-display">ISP543 Production System Explanation Facility</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Traces forward-chaining rules evaluation and consecutive logic triggers</p>
                  </div>
                  <span className="text-xs font-mono font-bold text-emerald-600 bg-emerald-50 border border-emerald-150 px-2.5 py-1 rounded-lg">
                    {inferenceResult.firedRules.length} Rules Fired
                  </span>
                </div>

                <div className="space-y-4">
                  {inferenceResult.firedRules.map((fired, idx) => (
                    <div key={idx} className="p-4 bg-slate-50 hover:bg-slate-100/60 transition-all border border-slate-200/50 rounded-xl">
                      <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                        <span className="text-[10px] font-mono font-bold bg-darkgreen-800 text-white px-2.5 py-0.5 rounded">
                          PRODUCTION RULE: {fired.ruleId}
                        </span>
                        <span className="text-[10px] font-bold text-emerald-700">{fired.ruleName}</span>
                      </div>
                      <p className="text-xs text-slate-500 leading-relaxed font-sans">
                        <strong className="text-slate-800 font-medium">Antecedent / Premise:</strong> IF {fired.description}
                      </p>
                      <div className="p-2.5 bg-emerald-500/5 text-emerald-990 rounded border border-emerald-500/10 flex items-center gap-2 text-xs mt-3.5">
                        <span className="text-emerald-600 animate-pulse font-mono">⚙️</span>
                        <span><strong className="text-emerald-950 font-bold">Consequent / Outcome:</strong> {fired.outcome}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* TAB 3: ACTIVE KNOWLEDGE BASE REPOSITORY */}
            {activeTab === 'database' && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs leading-normal"
              >
                <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 border-b border-slate-150 pb-5 mb-5">
                  <div>
                    <h3 className="text-base font-extrabold text-slate-900 font-display">Active ISP543 Rule Databases</h3>
                    <p className="text-xs text-slate-400 mt-0.5">Explore the production system\'s dual tables containing indexed regional attractions and local culinary items</p>
                  </div>
                  
                  {/* Database Select Toggles */}
                  <div className="flex rounded-lg bg-sage-100 p-1 border border-sage-200/50 self-start md:self-auto shrink-0 font-sans">
                    <button 
                      onClick={() => { setFilterKBType('attractions'); setFilterKBCategory('All'); }}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${filterKBType === 'attractions' ? 'bg-white shadow-xs text-darkgreen-900' : 'text-sage-700 hover:text-darkgreen-950'}`}
                    >
                      Attractions Table (40 landmarks)
                    </button>
                    <button 
                      onClick={() => { setFilterKBType('culinary'); setFilterKBCategory('All'); }}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-md transition-all cursor-pointer ${filterKBType === 'culinary' ? 'bg-white shadow-xs text-darkgreen-900' : 'text-sage-700 hover:text-darkgreen-950'}`}
                    >
                      Culinary Food Table (24 rows)
                    </button>
                  </div>
                </div>

                {/* SEARCH/FILTERS ROW */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
                  
                  {/* Search text */}
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input 
                      type="text"
                      placeholder="Search items by name/desc..."
                      value={searchKBQuery}
                      onChange={(e) => setSearchKBQuery(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 hover:border-slate-300 focus:border-slate-800 bg-slate-50/50 p-3 pl-10 rounded-xl outline-none transition-colors"
                    />
                  </div>

                  {/* Filter State */}
                  <div>
                    <select
                      value={filterKBState}
                      onChange={(e) => setFilterKBState(e.target.value)}
                      className="w-full text-xs font-semibold border border-slate-200 hover:border-slate-300 focus:border-slate-800 bg-slate-50 p-3 rounded-xl outline-none transition-colors"
                    >
                      <option value="All">All Northern States</option>
                      <option value="Penang">Penang Only</option>
                      <option value="Perak">Perak Only</option>
                      <option value="Kedah">Kedah Only</option>
                      <option value="Perlis">Perlis Only</option>
                    </select>
                  </div>

                  {/* Category Filter depending on Table Type */}
                  <div>
                    {filterKBType === 'attractions' ? (
                      <select
                        value={filterKBCategory}
                        onChange={(e) => setFilterKBCategory(e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 hover:border-slate-300 focus:border-slate-800 bg-slate-50 p-3 rounded-xl outline-none transition-colors"
                      >
                        <option value="All">All Categories</option>
                        <option value="adventure">adventure</option>
                        <option value="nature_eco">nature_eco</option>
                        <option value="historical_heritage">historical_heritage</option>
                        <option value="coastal_beach">coastal_beach</option>
                        <option value="coastal_island">coastal_island</option>
                        <option value="shopping">shopping</option>
                      </select>
                    ) : (
                      <select
                        value={filterKBCategory}
                        onChange={(e) => setFilterKBCategory(e.target.value)}
                        className="w-full text-xs font-semibold border border-slate-200 hover:border-slate-300 focus:border-slate-800 bg-slate-50 p-3 rounded-xl outline-none transition-colors"
                      >
                        <option value="All">All Dietaries</option>
                        <option value="halal">Halal Status Only</option>
                        <option value="non_halal">Non-Halal Status Only</option>
                      </select>
                    )}
                  </div>

                  {/* Clear Button */}
                  <div>
                    <button
                      onClick={() => {
                        setSearchKBQuery('');
                        setFilterKBState('All');
                        setFilterKBCategory('All');
                      }}
                      className="w-full text-xs font-bold text-slate-800 border border-slate-250 hover:bg-slate-50 p-3 rounded-xl transition-all cursor-pointer"
                    >
                      Clear Search Parameters
                    </button>
                  </div>

                </div>

                {/* DB DISPLAY TABLE */}
                {filterKBType === 'attractions' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredKBList.map(poi => (
                      <div key={poi.id} className="p-4 bg-slate-50/50 hover:bg-slate-50/90 border border-slate-200/55 rounded-xl transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                            <span className="text-[9px] text-slate-400 font-mono">attraction_id: {poi.id}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-emerald-50 text-emerald-800 font-mono font-bold border border-emerald-100 rounded px-2 py-0.5 leading-none">{poi.state}</span>
                              <span className="text-[9px] bg-slate-100/80 text-slate-600 font-mono font-bold border border-slate-200 rounded px-2 py-0.5 leading-none uppercase">{poi.costTier} cost</span>
                            </div>
                          </div>

                          <h4 className="text-xs font-extrabold text-slate-900 leading-snug">{poi.name}</h4>
                          <p className="text-xs text-slate-500 font-sans leading-relaxed mt-1.5">{poi.description}</p>
                        </div>

                        <div className="mt-4 pt-3.5 border-t border-slate-100/80 grid grid-cols-2 gap-2.5 text-[9px] font-mono text-slate-400">
                          <div>🏃 Intensity: <span className="capitalize text-slate-600">{poi.activity_intensity}</span></div>
                          <div>💰 Est budget: <span className="text-slate-600">{poi.estCost}</span></div>
                          <div>👶 Childfriendly: <span className="text-slate-600">{poi.childFriendly ? 'Yes (All Age)' : 'No (Restrictions)'}</span></div>
                          <div>💼 Category: <span className="text-emerald-800 font-bold">{poi.category}</span></div>
                        </div>
                      </div>
                    ))}
                    {filteredKBList.length === 0 && (
                      <div className="col-span-2 text-center py-10 text-slate-400 font-sans text-xs">No attractions matched search query or filters.</div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fadeIn">
                    {filteredFoodList.map(food => (
                      <div key={food.food_id} className="p-4 bg-teal-500/2 hover:bg-teal-500/5 border border-teal-500/10 rounded-xl transition-all flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                            <span className="text-[9px] text-slate-400 font-mono">food_id: {food.food_id}</span>
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] bg-sage-100 text-sage-800 font-mono font-bold border border-sage-200 rounded px-2 py-0.5 leading-none">{food.state}</span>
                              <span className={`text-[9px] font-mono font-bold rounded px-2 py-0.5 leading-none border ${food.halal_status === 'halal' ? 'bg-emerald-50 text-emerald-800 border-emerald-100' : 'bg-rose-50 text-rose-800 border-rose-100'}`}>
                                {food.halal_status === 'halal' ? 'Halal Certified' : 'Non-Halal default'}
                              </span>
                            </div>
                          </div>

                          <h4 className="text-xs font-extrabold text-teal-950 leading-snug">{food.name}</h4>
                          <p className="text-xs text-teal-900 mt-1.5 leading-relaxed font-sans">{food.description}</p>
                        </div>
                      </div>
                    ))}
                    {filteredFoodList.length === 0 && (
                      <div className="col-span-2 text-center py-10 text-slate-400 font-sans text-xs">No foods matched search query or filters.</div>
                    )}
                  </div>
                )}
              </motion.div>
            )}

          </motion.div>
        )}

      </main>

      {/* FOOTER BAR */}
      <footer className="bg-white text-sage-700 border-t border-sage-200 py-10 px-6 md:px-12 mt-12 shrink-0 font-sans text-xs">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-center md:text-left">
          <div>
            <p className="font-extrabold text-sage-900">NorthVoyage Travel Expert System</p>
            <p className="text-[10px] text-sage-605 mt-1 leading-normal max-w-lg">
              Engineered using forward-chaining routing rules, multi-attribute constraints, and child safety limits to structure robust itineraries spanning Peninsular Malaysia's northern borders. Conforms fully to ISP543 university course parameters.
            </p>
          </div>
          <div className="text-[10px] font-mono text-sage-500 shrink-0">
            LocalStorage Cache Active • Standard Sandbox Environment
          </div>
        </div>
      </footer>

      {/* DIALOG/MODAL: SAVE BLUEPRINT */}
      {showSaveModal && (
        <div className="fixed inset-0 bg-sage-900/40 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fadeIn">
          <motion.div 
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-6 md:p-8 max-w-md w-full border border-sage-200/80 shadow-xl"
          >
            <h3 className="text-base font-extrabold text-sage-900">Save Consultation Session</h3>
            <p className="text-xs text-sage-700 mt-1 leading-relaxed">Persist your current travel constraints and system outcomes to your local history, letting you review or load this itinerary instantly on subsequent boots.</p>

            <div className="my-5">
              <label className="block text-[10px] font-black text-sage-400 uppercase tracking-wider mb-2">Itinerary Blueprint Title</label>
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                placeholder={inferenceResult ? `My ${inferenceResult.recommendedState} Trip (${inputs.duration} Days)` : ''}
                className="w-full text-xs font-semibold border border-sage-150 p-3 rounded-xl focus:border-sage-400 outline-none bg-sage-50 focus:bg-white transition-colors"
              />
            </div>

            <div className="flex gap-2.5 justify-end text-xs font-bold font-sans">
              <button
                onClick={() => { setShowSaveModal(false); setSaveName(''); }}
                className="text-sage-600 hover:text-sage-800 py-2.5 px-4 hover:bg-sage-50 rounded-lg transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTrip}
                className="bg-sage-500 hover:bg-sage-600 text-white font-bold py-2.5 px-5 rounded-lg transition-all cursor-pointer"
              >
                Confirm Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* FLOATING CHATBOT WIDGET (Option B: Show only after itinerary is generated) */}
      {currentStep === 9 && inferenceResult && (
        <div className="fixed bottom-6 right-6 z-55 font-sans">
          <AnimatePresence>
            {chatOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
                className="bg-white border border-indigo-120/40 w-84 max-w-[calc(100vw-2rem)] h-[410px] rounded-2xl shadow-2xl flex flex-col overflow-hidden mb-3"
              >
                {/* HEADER */}
                <div className="bg-gradient-to-r from-indigo-700 via-indigo-800 to-blue-900 text-white p-3 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-sm font-black border border-white/20 shadow-2xs">
                      👨‍✈️
                    </div>
                    <div>
                      <h4 className="font-extrabold text-xs tracking-tight">AI Assistant Kai</h4>
                      <span className="text-[9px] text-emerald-100 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                        Concierge • Active Itinerary
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleResetChat}
                      title="Reset chat session"
                      className="px-1.5 py-0.5 rounded-md bg-white/10 text-white/90 hover:text-white hover:bg-white/20 transition-colors cursor-pointer text-[9px] font-mono font-bold"
                    >
                      Clear
                    </button>
                    <button
                      onClick={() => setChatOpen(false)}
                      className="p-1 rounded-md text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* MESSAGES */}
                <div className="flex-1 overflow-y-auto p-3 space-y-3 bg-slate-50/60 scrollbar-thin">
                  {chatMessages.map((msg, idx) => {
                    const isUser = msg.role === 'user';
                    return (
                      <div key={idx} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                        <div className={`p-2.5 rounded-xl max-w-[85%] leading-relaxed shadow-3xs ${
                          isUser 
                            ? 'bg-indigo-600 text-white rounded-br-none text-xs font-medium' 
                            : 'bg-white text-slate-800 border border-indigo-100/40 rounded-bl-none'
                        }`}>
                          {isUser ? (
                            <p className="whitespace-pre-wrap leading-relaxed break-words font-medium text-xs">{msg.content}</p>
                          ) : (
                            <FormattedChatMessage content={msg.content} />
                          )}
                        </div>
                      </div>
                    );
                  })}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white border border-indigo-100/30 p-2.5 rounded-xl rounded-bl-none text-xs flex items-center gap-2 shadow-3xs">
                        <span className="flex gap-1" aria-hidden="true">
                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce"></span>
                        </span>
                        <span className="text-[10px] font-bold text-indigo-600/90 tracking-tight">Kai is drafting...</span>
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>

                {/* CHIPS */}
                <div className="p-1.5 border-t border-slate-100 flex gap-1 overflow-x-auto whitespace-nowrap bg-white scrollbar-none shrink-0 border-b border-slate-100">
                  {[
                    "Halal highlights in Penang?",
                    "Highlight cave routes in Perak",
                    "Why go to Langkawi, Kedah?",
                    "Tell me about Perlis karst hills"
                  ].map((chip) => (
                    <button
                      key={chip}
                      onClick={() => {
                        if (!chatLoading) {
                          handleSendChatMessage(chip);
                        }
                      }}
                      disabled={chatLoading}
                      className="text-[9px] font-bold text-indigo-700 bg-indigo-50/50 border border-indigo-100/45 hover:bg-indigo-100/80 transition-all rounded-full px-2 py-0.5 cursor-pointer shrink-0 disabled:opacity-50"
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                {/* INPUT FORM */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!chatLoading && chatInput.trim()) {
                      handleSendChatMessage(chatInput);
                    }
                  }}
                  className="p-2 border-t border-slate-100 flex gap-1.5 bg-white items-end font-sans"
                >
                  <textarea
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        if (!chatLoading && chatInput.trim()) {
                          handleSendChatMessage(chatInput);
                        }
                      }
                    }}
                    placeholder="Ask Kai questions..."
                    disabled={chatLoading}
                    rows={1}
                    className="flex-1 bg-slate-50 border border-slate-150 text-slate-850 disabled:opacity-60 text-xs px-2.5 py-2 rounded-lg focus:border-indigo-400 focus:bg-white outline-none font-semibold transition-colors resize-none max-h-20 min-h-[34px] leading-normal"
                  />
                  <button
                    type="submit"
                    disabled={chatLoading || !chatInput.trim()}
                    className="p-2 bg-indigo-700 hover:bg-indigo-800 text-white rounded-lg transition-all cursor-pointer disabled:bg-slate-100 disabled:text-slate-400 disabled:cursor-not-allowed flex items-center justify-center shrink-0 w-8 h-8 self-end"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>

          {/* FLOATING TRIGGER BUTTON */}
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className={`flex items-center gap-2 p-3 rounded-full text-white shadow-xl hover:scale-105 transition-all text-[11px] font-black cursor-pointer uppercase tracking-wider ${
              chatOpen 
                ? 'bg-rose-600 hover:bg-rose-700' 
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
            id="chat-toggle-floating-btn"
          >
            {chatOpen ? (
              <X className="w-5 h-5 text-white" />
            ) : (
              <>
                <MessageCircle className="w-5 h-5 text-white animate-pulse" />
                <span>Ask Kai AI</span>
              </>
            )}
          </button>
        </div>
      )}

    </div>
  );
}
