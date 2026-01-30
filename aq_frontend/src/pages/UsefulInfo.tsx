import FAQ from "../components/FAQ";

export default function UsefulInfo() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 text-brand-900">
      <section className="mt-6 rounded-3xl bg-white/80 p-6 ring-1 ring-brand-200 backdrop-blur md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Useful info
        </h1>
        <p className="mt-3 text-base text-brand-700 md:text-lg">
          FAQ about the OpenWeather air quality scale, data sources, and how we generate recommendations.
        </p>

        <div className="mt-8 space-y-6">
          <FAQ
            q="What is the OpenWeather AQI scale (1–5)?"
            a="OpenWeather uses a simple 1–5 Air Quality Index where 1 is best and 5 is worst. It’s an overall category based on pollutant concentrations."
          />
          <FAQ
            q="What does each AQI level mean?"
            a={
              <ul className="list-disc pl-5 space-y-1">
                <li><b>1 — Good:</b> air is clean.</li>
                <li><b>2 — Fair:</b> acceptable, minor risk for very sensitive people.</li>
                <li><b>3 — Moderate:</b> some risk for sensitive groups.</li>
                <li><b>4 — Poor:</b> higher risk; reduce outdoor exertion.</li>
                <li><b>5 — Very Poor:</b> avoid outdoor activity when possible.</li>
              </ul>
            }
          />
          <FAQ
            q="Where does the air data come from?"
            a="The app currently fetches air pollution measurements from OpenWeather’s Air Pollution API, based on coordinates (lat/lon) for your selected location."
          />
          <FAQ
            q="Where do the recommendations come from?"
            a="Right now, recommendations are simple preset messages based on the 1–5 AQI level. Later, we can expand them with more detailed guidance and personal settings."
          />
          <FAQ
            q="Why can two nearby places show different results?"
            a="Air quality can vary with traffic, wind, humidity, and local sources. Also, provider grid resolution and update frequency can affect values."
          />
          <FAQ
            q="Is this medical advice?"
            a="No. It’s informational only. If you have a condition like asthma or heart/lung issues, follow your doctor’s guidance first."
          />
        </div>
      </section>
    </main>
  );
}

