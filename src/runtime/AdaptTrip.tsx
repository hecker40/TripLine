import { useState } from "react";

export function AdaptTrip({
  date,
  dayNumber,
  busy,
  onAdapt,
}: {
  date: string;
  dayNumber: number;
  busy: boolean;
  onAdapt: (date: string, resumeAt: string, message: string) => Promise<void>;
}) {
  const [message, setMessage] = useState("");
  const [resumeAt, setResumeAt] = useState("09:00");
  return (
    <section className="card adapt-trip" aria-label="Adjust your trip">
      <span className="eyebrow">ADAPTER AGENT / DAY {dayNumber}</span>
      <h3>Plans changed? Tell us what happened.</h3>
      <p>
        Adjust the rest of {date}. Earlier activities and other days stay
        unchanged. No reservations are booked or cancelled.
      </p>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void onAdapt(date, resumeAt, message);
        }}
      >
        <label htmlFor="adapt-message">What went wrong?</label>
        <textarea
          id="adapt-message"
          required
          minLength={5}
          maxLength={1500}
          disabled={busy}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="I missed my train and will reach Shibuya at 13:00. Move lunch and keep my evening plans."
        />
        <div className="adapt-actions">
          <label>
            Resume planning at (destination time)
            <input
              aria-label="Resume planning at"
              type="time"
              required
              disabled={busy}
              value={resumeAt}
              onChange={(e) => setResumeAt(e.target.value)}
            />
          </label>
          <button
            className="primary-button"
            disabled={busy || message.trim().length < 5}
            type="submit"
          >
            {busy ? "Working…" : "Adjust this day"}
          </button>
        </div>
      </form>
    </section>
  );
}
