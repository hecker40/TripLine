import { useState, type FormEvent } from "react";
import {
  hotelOptions,
  paceOptions,
  transportationOptions,
  tripPreferencesSchema,
  type TripPreferences,
} from "../../shared/preferences";
import { optionLabel } from "../lib/format";

const interests = [
  "Food",
  "Culture",
  "Technology",
  "Nature",
  "Shopping",
  "History",
  "Nightlife",
  "Art",
];
const fieldLabels: Record<string, string> = {
  destination: "Destination",
  startDate: "Start date",
  endDate: "End date",
  travelers: "Travelers",
  budget: "Total budget · USD",
  dietaryRestrictions: "Dietary restrictions",
  additionalPreferences: "Anything else?",
};
type FormValues = Omit<
  TripPreferences,
  "travelers" | "budget" | "dietaryRestrictions"
> & {
  travelers: string;
  budget: string;
  dietaryRestrictions: string;
};
const dateAfter = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
};

export function TripPreferencesForm({
  busy,
  disabled = false,
  onGenerate,
}: {
  busy: boolean;
  disabled?: boolean;
  onGenerate: (preferences: TripPreferences) => Promise<void>;
}) {
  const [remember, setRemember] = useState(false);
  const [values, setValues] = useState<FormValues>(() => {
    try {
      const cached = tripPreferencesSchema.safeParse(
        JSON.parse(localStorage.getItem("travelos-preferences") || "null"),
      );
      if (cached.success)
        return {
          ...cached.data,
          travelers: String(cached.data.travelers),
          budget: String(cached.data.budget),
          dietaryRestrictions: cached.data.dietaryRestrictions.join(", "),
        };
    } catch {
      /* Storage can be disabled. */
    }
    return {
      destination: "",
      startDate: dateAfter(7),
      endDate: dateAfter(10),
      travelers: "2",
      budget: "1500",
      interests: ["food", "culture", "technology"],
      pace: "balanced",
      transportation: "public_transit",
      hotelPreference: "mid_range",
      dietaryRestrictions: "",
      additionalPreferences: "",
    };
  });
  const [customInterests, setCustomInterests] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const set = <K extends keyof FormValues>(field: K, value: FormValues[K]) => {
    setValues((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: "" }));
  };
  const tags = (text: string) =>
    text
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsed = tripPreferencesSchema.safeParse({
      ...values,
      travelers: Number(values.travelers),
      budget: Number(values.budget),
      interests: [...new Set([...values.interests, ...tags(customInterests)])],
      dietaryRestrictions: tags(values.dietaryRestrictions).filter(
        (tag) => tag.toLowerCase() !== "none",
      ),
    });
    if (!parsed.success) {
      setErrors(
        Object.fromEntries(
          parsed.error.issues.map((issue) => [
            String(issue.path[0]),
            issue.message,
          ]),
        ),
      );
      return;
    }
    setErrors({});
    try {
      if (remember)
        localStorage.setItem(
          "travelos-preferences",
          JSON.stringify(parsed.data),
        );
      else localStorage.removeItem("travelos-preferences");
    } catch {
      /* Planning works without local storage. */
    }
    void onGenerate(parsed.data);
  }
  const error = (field: string) =>
    errors[field] ? (
      <span className="field-error" id={`${field}-error`}>
        {errors[field]}
      </span>
    ) : null;
  const validation = (field: string) => ({
    "aria-label": fieldLabels[field],
    "aria-invalid": Boolean(errors[field]),
    "aria-describedby": errors[field] ? `${field}-error` : undefined,
  });

  return (
    <form onSubmit={submit} noValidate className="preferences-panel">
      <div className="panel-heading">
        <span className="eyebrow">01 / THE BRIEF</span>
        <h2>Make it your trip.</h2>
        <p>A few details. A plan that fits you.</p>
      </div>
      <fieldset disabled={busy || disabled} className="form-fields">
        <legend className="sr-only">Trip preferences</legend>
        <label>
          Destination
          <input
            autoComplete="off"
            name="destination"
            placeholder="Tokyo, Japan"
            maxLength={120}
            value={values.destination}
            onChange={(e) => set("destination", e.target.value)}
            {...validation("destination")}
          />
          {error("destination")}
        </label>
        <div className="field-row">
          <label>
            Start date
            <input
              type="date"
              value={values.startDate}
              onChange={(e) => set("startDate", e.target.value)}
              {...validation("startDate")}
            />
            {error("startDate")}
          </label>
          <label>
            End date
            <input
              type="date"
              value={values.endDate}
              onChange={(e) => set("endDate", e.target.value)}
              {...validation("endDate")}
            />
            {error("endDate")}
          </label>
        </div>
        <span className="field-hint">
          1–7 days, including your start and end dates.
        </span>
        <div className="field-row">
          <label>
            Travelers
            <input
              type="number"
              min={1}
              max={12}
              step={1}
              value={values.travelers}
              onChange={(e) => set("travelers", e.target.value)}
              {...validation("travelers")}
            />
            {error("travelers")}
          </label>
          <label>
            Total budget · USD
            <input
              type="number"
              min={1}
              max={1000000}
              value={values.budget}
              onChange={(e) => set("budget", e.target.value)}
              {...validation("budget")}
            />
            {error("budget")}
          </label>
        </div>
        <span className="field-hint">
          Whole-party budget. Includes stays; excludes flights.
        </span>
        <fieldset className="interest-field">
          <legend>Your interests</legend>
          <div className="chips">
            {interests.map((interest) => {
              const value = interest.toLowerCase();
              const selected = values.interests.includes(value);
              return (
                <button
                  key={value}
                  type="button"
                  className={`chip ${selected ? "selected" : ""}`}
                  aria-pressed={selected}
                  onClick={() =>
                    set(
                      "interests",
                      selected
                        ? values.interests.filter((item) => item !== value)
                        : [...values.interests, value],
                    )
                  }
                >
                  {interest}
                </button>
              );
            })}
          </div>
          {error("interests")}
        </fieldset>
        <label>
          Other interests <span className="optional">optional</span>
          <input
            placeholder="Anime, coffee, architecture"
            value={customInterests}
            onChange={(e) => setCustomInterests(e.target.value)}
            maxLength={400}
          />
          <span className="field-hint">Separate with commas.</span>
        </label>
        <div className="field-row">
          <label>
            Travel pace
            <select
              value={values.pace}
              onChange={(e) =>
                set("pace", e.target.value as TripPreferences["pace"])
              }
            >
              {paceOptions.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </select>
          </label>
          <label>
            Transportation
            <select
              value={values.transportation}
              onChange={(e) =>
                set(
                  "transportation",
                  e.target.value as TripPreferences["transportation"],
                )
              }
            >
              {transportationOptions.map((value) => (
                <option key={value} value={value}>
                  {optionLabel(value)}
                </option>
              ))}
            </select>
          </label>
        </div>
        <label>
          Hotel preference
          <select
            value={values.hotelPreference}
            onChange={(e) =>
              set(
                "hotelPreference",
                e.target.value as TripPreferences["hotelPreference"],
              )
            }
          >
            {hotelOptions.map((value) => (
              <option key={value} value={value}>
                {optionLabel(value)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Dietary restrictions <span className="optional">optional</span>
          <input
            placeholder="Vegetarian, gluten-free…"
            maxLength={400}
            value={values.dietaryRestrictions}
            onChange={(e) => set("dietaryRestrictions", e.target.value)}
            {...validation("dietaryRestrictions")}
          />
          {error("dietaryRestrictions")}
        </label>
        <label>
          Anything else? <span className="optional">optional</span>
          <textarea
            rows={3}
            maxLength={2000}
            placeholder="No early mornings. More neighborhoods, fewer crowds."
            value={values.additionalPreferences}
            onChange={(e) => set("additionalPreferences", e.target.value)}
            {...validation("additionalPreferences")}
          />
          {error("additionalPreferences")}
        </label>
        {Object.values(errors).some(Boolean) && (
          <p role="alert" className="field-error">
            Please check the highlighted preferences.
          </p>
        )}
        <label className="remember-preferences">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember my preferences on this device
        </label>
        <button className="primary-button" type="submit">
          {busy ? "Planning your trip…" : "Generate Trip"}
          <span aria-hidden="true">↗</span>
        </button>
      </fieldset>
      <p className="form-footer">
        A proposed itinerary. Nothing booked, nothing charged.
      </p>
    </form>
  );
}
