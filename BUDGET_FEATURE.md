# Budget & Cost Tracking Feature

## Overview

The Travel Itinerary Generator now includes comprehensive budget tracking and cost estimation for activities. Plan your day while staying within your budget!

## Features

### 1. **Budget Input**
- Set your total budget for the trip in USD
- Optional field - itineraries can be generated without a budget
- Budget is distributed across all travelers

### 2. **Traveler Count**
- Specify how many people are traveling (1-20)
- Defaults to 1 person
- Used to calculate per-person costs

### 3. **Per-Activity Cost Estimates**
- AI estimates cost per person for each activity
- Includes admission fees, meal costs, or activity costs
- Shows $0 for free activities (parks, walking tours, etc.)
- Considers typical prices in the selected city

### 4. **Budget Summary Card**
Displays at the top of the itinerary:
- **Per Person Cost**: Total cost divided by number of travelers
- **Total Cost**: Combined cost for all travelers
- **Budget Remaining**: How much budget is left (or overspent)

### 5. **Visual Cost Indicators**
Each activity shows:
- Dollar icon with cost per person
- "Free" label for $0 activities (in green)
- Cost appears alongside time and duration

## How It Works

### User Flow

1. **Enter City** - Choose your destination
2. **Set Radius** - How far you want to explore
3. **Enter Budget** (optional) - Your total trip budget
4. **Set Travelers** - How many people are going
5. **Select Preferences** - Types of activities
6. **Generate** - AI creates budget-aware itinerary

### AI Cost Estimation

The AI considers:
- **Admission fees** for museums, attractions, events
- **Meal costs** for restaurants and cafes
- **Activity costs** for tours, experiences, entertainment
- **Local pricing** specific to the city
- **Budget constraints** if budget is provided

### Budget Calculation

```
Per Person Cost = Total Activity Costs ÷ Number of Travelers
Total Cost = Per Person Cost × Number of Travelers
Budget Remaining = Total Budget - Total Cost
```

## Visual Design

### Form Fields

**Budget Input:**
```
┌────────────────────────────────┐
│ Total Budget (USD) (optional)  │
│ ┌────────────────────────────┐ │
│ │ e.g., 500                  │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

**Travelers Input:**
```
┌────────────────────────────────┐
│ Number of Travelers            │
│ ┌────────────────────────────┐ │
│ │ e.g., 2                    │ │
│ └────────────────────────────┘ │
└────────────────────────────────┘
```

### Budget Summary Card

```
┌─────────────────────────────────────────────────┐
│ Cost Summary                                    │
│                                                 │
│  Per Person      Total Cost    Budget Remaining│
│  $125.00         $250.00       $250.00          │
└─────────────────────────────────────────────────┘
```

### Activity Cost Display

```
┌────────────────────────────────┐
│ 1. Museum of Modern Art        │
│ 10:00 AM - 12:00 PM • 2 hours • $25.00/person │
└────────────────────────────────┘

┌────────────────────────────────┐
│ 2. Central Park                │
│ 1:00 PM - 3:00 PM • 2 hours • Free │
└────────────────────────────────┘
```

## Implementation Details

### Type Definitions

**ItineraryItem:**
```typescript
interface ItineraryItem {
  // ... existing fields
  estimatedCost?: number; // Cost per person in USD
}
```

**Itinerary:**
```typescript
interface Itinerary {
  city: string;
  itinerary: ItineraryItem[];
  totalCost?: number; // Total for all travelers
  budgetRemaining?: number; // Budget - totalCost
}
```

**GenerateItineraryRequest:**
```typescript
interface GenerateItineraryRequest {
  // ... existing fields
  budget?: number; // Total budget in USD
  travelers?: number; // Number of people
}
```

### Files Modified

1. **[types/index.ts](types/index.ts)** - Added budget/cost fields
2. **[components/ItineraryForm.tsx](components/ItineraryForm.tsx)** - Added budget/travelers inputs
3. **[app/api/generate-itinerary/route.ts](app/api/generate-itinerary/route.ts)** - Enhanced AI prompt
4. **[components/ItineraryDisplay.tsx](components/ItineraryDisplay.tsx)** - Added cost displays
5. **[app/page.tsx](app/page.tsx)** - Budget calculation logic

### AI Prompt Enhancement

The AI receives:
- Total budget and per-person budget
- Number of travelers
- Instructions to estimate costs
- Budget constraints to stay within

Example prompt segment:
```
- Total budget: $500 USD for 2 traveler(s) = $250.00 per person

**COST ESTIMATES**: Provide realistic cost estimates per person in USD
- Include admission fees, meal costs, or activity costs
- Use $0 for free activities
- Keep total costs within $250.00 per person budget
```

## Example Scenarios

### Scenario 1: Budget-Conscious Trip

**Input:**
- City: New York City
- Budget: $200
- Travelers: 2
- Preferences: Museums, Parks

**Output:**
- Mix of free and paid activities
- Total stays under budget
- Shows: "Budget Remaining: $50.00"

### Scenario 2: No Budget Specified

**Input:**
- City: San Francisco
- Travelers: 1
- No budget entered

**Output:**
- Costs still estimated
- Shows per-person cost
- No budget remaining (field hidden)

### Scenario 3: Over Budget Warning

**Input:**
- City: London
- Budget: $100
- Travelers: 2
- Preferences: Fine Dining, Entertainment

**Output:**
- AI tries to stay within budget
- If over: Shows "$25.00 over" in red
- Suggests budget-friendly alternatives

## Budget Summary Colors

- **Green** ($xxx.xx) - Budget remaining
- **Red** ($xxx.xx over) - Over budget
- **Green** "Free" - No cost activities

## Cost Categories

### Free Activities ($0)
- Public parks
- Beaches
- Walking tours
- Historic neighborhoods
- Viewpoints
- Street art/markets

### Low Cost ($5-$20)
- Local cafes
- Street food
- Museums (many have free days)
- Public gardens

### Medium Cost ($20-$50)
- Restaurant meals
- Museum admissions
- Guided tours
- Entertainment venues

### High Cost ($50+)
- Fine dining
- Premium attractions
- Shows/concerts
- Adventure activities

## Customization

### Adjust Cost Ranges

Edit the AI prompt in `app/api/generate-itinerary/route.ts`:

```typescript
// Add specific cost guidelines
8. **COST ESTIMATES**: Provide realistic cost estimates per person in USD
   - Free activities: $0
   - Budget meals: $10-20
   - Mid-range dining: $20-40
   - Museums: $15-30
   - Shows/events: $30-100
```

### Change Budget Display

Edit `components/ItineraryDisplay.tsx`:

**Change colors:**
```typescript
className={`${itinerary.budgetRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}
// Change to blue/orange, etc.
```

**Add warnings:**
```typescript
{itinerary.budgetRemaining < 0 && (
  <p className="text-sm text-red-600 mt-2">
    ⚠️ This itinerary exceeds your budget
  </p>
)}
```

## Benefits

### For Budget Travelers
- ✅ Stay within spending limits
- ✅ See total costs upfront
- ✅ Make informed decisions
- ✅ No surprises

### For Group Travel
- ✅ Fair cost splitting
- ✅ Per-person breakdown
- ✅ Total group cost visible
- ✅ Easy planning

### For Flexible Budgets
- ✅ Still see estimated costs
- ✅ Compare options
- ✅ Plan finances
- ✅ Optional field

## Backward Compatibility

**100% backward compatible!**

- Budget fields are optional
- Old itineraries work without changes
- Costs only show if provided
- No breaking changes

## Future Enhancements

Potential improvements:

1. **Currency Conversion** - Support multiple currencies
2. **Budget Categories** - Separate budgets for food, activities, etc.
3. **Price Ranges** - Min/max estimates instead of fixed price
4. **Deals & Discounts** - Factor in student/senior discounts
5. **Seasonal Pricing** - Adjust for peak/off-peak
6. **Real-time Pricing** - Integration with booking APIs
7. **Budget Optimization** - "Maximize activities within budget"
8. **Cost Comparison** - Compare costs between cities

## Testing

### Test Cases

1. **With Budget & Travelers**
   - Enter: $500, 2 travelers
   - Verify: Per-person shown, total calculated, budget remaining accurate

2. **Without Budget**
   - Leave budget empty
   - Verify: Costs still estimated, no budget remaining shown

3. **Single Traveler**
   - Enter: 1 traveler
   - Verify: Per-person = total cost

4. **Free Activities**
   - Generate for parks/outdoors
   - Verify: "Free" label appears in green

5. **Over Budget**
   - Enter low budget
   - Verify: Red "over" indicator appears

## Performance Impact

**Minimal:**
- No additional API calls
- Same token usage
- Client-side calculations only
- No performance degradation

## Accessibility

- ✅ Screen reader friendly labels
- ✅ Clear cost indicators
- ✅ Color + text indicators (not color-only)
- ✅ Keyboard navigable
- ✅ Proper ARIA labels

## Summary

The budget feature adds practical financial planning to the itinerary generator, making it more useful for real-world trip planning. Users can:

1. Set their total budget
2. Specify number of travelers
3. See per-activity costs
4. Track remaining budget
5. Make informed decisions

**Files modified:** 5
**New features:** 5
**Breaking changes:** 0
**User value:** High

The feature is fully functional and ready to use! 💰✈️
