import { useState } from "react";
import type { TripRun } from "../../shared/runtime";
import { money } from "../lib/format";

export function BookingStays({
  run,
  configured,
  busy,
  onSearch,
}: {
  run: TripRun;
  configured: boolean;
  busy: boolean;
  onSearch: (rooms: number, country: string) => Promise<void>;
}) {
  const [rooms, setRooms] = useState(Math.ceil(run.preferences.travelers / 2));
  const [country, setCountry] = useState("us");
  const nights = run.itinerary.days.length - 1;
  const lodging = run.itinerary.days
    .flatMap((d) => d.activities)
    .filter((a) => a.category === "hotel")
    .reduce((s, a) => s + a.estimatedCost, 0);
  const searchUrl = `https://www.booking.com/searchresults.html?${new URLSearchParams({ ss: run.preferences.destination, checkin: run.preferences.startDate, checkout: run.preferences.endDate, group_adults: String(run.preferences.travelers), no_rooms: String(rooms), group_children: "0", selected_currency: "USD" })}`;
  const snapshot = run.booking;
  return (
    <section className="card booking-stays" aria-label="Booking.com stays">
      <span className="eyebrow">NEXT STEP / BOOKING.COM</span>
      <h3>Find a stay for this plan</h3>
      <p>
        {run.preferences.destination} · {run.preferences.startDate} →{" "}
        {run.preferences.endDate} · {nights} nights ·{" "}
        {run.preferences.travelers} adults
      </p>
      <p className="muted">
        Planned lodging estimate: {money(lodging)} for the whole stay. All
        travelers are treated as adults in this search. Confirm children, room
        occupancy, taxes and cancellation terms on Booking.com.
      </p>
      {!configured && (
        <div className="booking-setup" role="status">
          <strong>Official MCP integration needs partner access</strong>
          <p>
            Set BOOKING_AFFILIATE_ID and BOOKING_BEARER_TOKEN on the server to
            enable live results. Your OpenAI key cannot authenticate
            Booking.com. The manual search link below works without MCP
            credentials.
          </p>
        </div>
      )}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          void onSearch(rooms, country);
        }}
      >
        <label>
          Rooms
          <input
            type="number"
            required
            min={1}
            max={run.preferences.travelers}
            value={rooms}
            disabled={busy}
            onChange={(e) => setRooms(Number(e.target.value))}
          />
        </label>
        <label>
          Country of residence
          <select
            value={country}
            disabled={busy}
            onChange={(e) => setCountry(e.target.value)}
          >
            {[
              ["us", "United States"],
              ["gb", "United Kingdom"],
              ["ca", "Canada"],
              ["au", "Australia"],
              ["jp", "Japan"],
              ["de", "Germany"],
              ["fr", "France"],
              ["in", "India"],
              ["sg", "Singapore"],
            ].map(([id, label]) => (
              <option value={id} key={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <button
          className="secondary-button"
          type="submit"
          disabled={!configured || busy || nights < 1}
        >
          Search live stays
        </button>
        {nights > 0 && (
          <a
            className="secondary-button"
            href={searchUrl}
            target="_blank"
            rel="noreferrer"
          >
            Open Booking.com search ↗
          </a>
        )}
      </form>
      {nights < 1 && (
        <p>
          This one-day trip has no overnight stay. Extend the dates to search
          hotels.
        </p>
      )}
      {snapshot && (
        <div className="booking-results">
          <p>{snapshot.message}</p>
          <small>
            Checked {new Date(snapshot.checkedAt).toLocaleString()} ·{" "}
            {snapshot.rooms} rooms · residence {snapshot.country.toUpperCase()}{" "}
            · source: {snapshot.provider}
          </small>
          <div className="stay-grid">
            {snapshot.offers.map((offer) => (
              <article key={offer.id}>
                <h4>{offer.name}</h4>
                <strong>
                  {offer.totalPrice !== null && offer.currency
                    ? new Intl.NumberFormat("en-US", {
                        style: "currency",
                        currency: offer.currency,
                      }).format(offer.totalPrice)
                    : "See current price"}
                </strong>
                <p>Returned stay total · confirm final charges</p>
                {offer.currency === "USD" && offer.totalPrice !== null && (
                  <small>
                    {offer.totalPrice <= lodging
                      ? "Within your planned lodging estimate"
                      : "Above your planned lodging estimate"}
                  </small>
                )}
                <a href={offer.url} target="_blank" rel="noreferrer">
                  Review on Booking.com ↗
                </a>
              </article>
            ))}
          </div>
        </div>
      )}
      <small>
        Read-only search. Nothing is reserved, cancelled or charged.
      </small>
    </section>
  );
}
