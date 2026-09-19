import { test } from 'node:test';
import assert from 'node:assert/strict';
import { tripPreferencesSchema, tripDates } from '../shared/preferences';
import { itinerarySchema, validateItinerary } from '../shared/itinerary';
import { preferences, validItinerary } from './fixtures';

test('valid preferences and inclusive date counting', () => {
  assert.deepEqual(tripPreferencesSchema.parse(preferences), preferences);
  assert.equal(tripDates(preferences.startDate, preferences.endDate).length, 4);
  assert.equal(tripDates('2028-02-28', '2028-03-01').length, 3);
});

for (const [name, override] of Object.entries({
  missingDestination: { destination: undefined }, blankDestination: { destination: ' ' },
  reversedDates: { endDate: '2026-09-19' }, impossibleDate: { startDate: '2026-02-30' },
  tooLong: { endDate: '2026-10-20' }, zeroTravelers: { travelers: 0 }, fractionalTravelers: { travelers: 1.5 },
  negativeBudget: { budget: -1 }, nonFiniteBudget: { budget: Infinity },
  invalidPace: { pace: 'extreme' }, oversizedNotes: { additionalPreferences: 'a'.repeat(2001) },
})) {
  test(`preferences reject ${name}`, () => {
    assert.equal(tripPreferencesSchema.safeParse({ ...preferences, ...override }).success, false);
  });
}

test('complete itinerary validates, including nullable unknown location data', () => {
  assert.deepEqual(validateItinerary(validItinerary(), preferences), validItinerary());
});

test('malformed itinerary fails its schema', () => {
  assert.equal(itinerarySchema.safeParse({ days: [] }).success, false);
  const trip = validItinerary();
  trip.days[0].activities[0].startTime = '25:00';
  assert.equal(itinerarySchema.safeParse(trip).success, false);
});

for (const problem of ['missing-day', 'wrong-party', 'wrong-destination', 'duplicate-id', 'duration', 'daily-cost', 'total-cost', 'overlap']) {
  test(`itinerary rejects ${problem}`, () => {
    const trip = validItinerary();
    const activity = trip.days[0].activities[0];
    if (problem === 'missing-day') trip.days.pop();
    if (problem === 'wrong-party') trip.travelers = 3;
    if (problem === 'wrong-destination') trip.destination = 'Paris';
    if (problem === 'duplicate-id') trip.days[1].activities[0].id = activity.id;
    if (problem === 'duration') activity.durationMinutes = 60;
    if (problem === 'daily-cost') trip.days[0].estimatedDailyCost = 99;
    if (problem === 'total-cost') trip.totalEstimatedCost = 999;
    if (problem === 'overlap') trip.days[0].activities.push({ ...activity, id: 'overlap' });
    assert.throws(() => validateItinerary(trip, preferences));
  });
}
