import FAQ from "../components/FAQ";

export default function UsefulInfo() {
  return (
    <main className="mx-auto max-w-6xl px-4 pt-6 pb-16 text-brand-900">
      <section className="mt-6 rounded-3xl bg-brand-50 border border-brand-200 md:p-10">
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
          Useful info
        </h1>
        <p className="mt-3 text-base text-brand-700 md:text-lg">
          FAQ about the air quality scale, data sources, and how we generate recommendations.
        </p>

        <div className="mt-8 space-y-6">
          <FAQ
            q="Who is Wispi?"
            a= 
            {
              <>
              <p>
                Wispi is a friendly <b>little wisp who loves helping people</b>. Wispi keeps an eye on air quality and shares clear, useful information 
                so you can make better decisions for your health and daily life.
              </p>
              </>
            }
          />
          <FAQ
            q="Where does the air quality data come from?"
            a= 
            {
              <>
              <p>
                From <b>OpenWeather’s Air Pollution API</b>, based on coordinates for your selected location.
              </p>
              </>
            }
          />
          <FAQ
            q="What is the OpenWeather AQI scale (1–5)?"
            a= 
            {
              <div className="space-y-4">
              <p>
                OpenWeather uses a simple 1–5 Air Quality Index <b>where 1 is the best and 5 is the worst</b>. While this scale is specific to 
                OpenWeather, it generally aligns with standard international categories for health-based reporting.
              </p>
              <a
                href="https://openweathermap.org/api/air-pollution?collection=environmental"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-brand-200 hover:text-brand-400 visited:text-brand-600"
                title="OpenWeather — Air Pollution API concept"
              >
                source: https://openweathermap.org/api/air-pollution?collection=environmental
              </a>
              </div>
            }
          />
          <FAQ
            q="What does each AQI level mean?"
            a={ 
              <ul className="list-disc pl-5 space-y-1">
                <li><b>1 — Good:</b> air is clean, enjoy outdoor activities.</li>
                <li><b>2 — Fair:</b> acceptable, minor risk for very sensitive people.</li>
                <li><b>3 — Moderate:</b> risk for sensitive groups.</li>
                <li><b>4 — Poor:</b> high risk for sensitive groups, recomended to reduce outdoor activity for all people.</li>
                <li><b>5 — Very Poor:</b> avoid outdoor activity.</li>
              </ul>
            }
          />
          <FAQ
            q="Where do the recommendations come from?"
            a= 
            {
              <div className="space-y-4">
              <p>
                Recommendations are simple preset messages based on the <b>United States Environmental Protection Agency</b> and 
                aligned with OpenWeather AQI scale.
              </p>
              <a
                href="https://www.epa.gov/outdoor-air-quality-data/air-data-basic-information"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-brand-200 hover:text-brand-400 visited:text-brand-600"
                title="United States Environmental Protection Agency — Air Data Basic Information"
              >
                source: https://www.epa.gov/outdoor-air-quality-data/air-data-basic-information
              </a>
              </div>
            }
          />
          <FAQ
            q="Why knowledge about current air quality is important?"
            a={
              <div className="space-y-4">
              <p>
                Almost all of the global population is exposed to air pollution levels that exceed the safe guidelines set by the 
                World Health Organization (WHO). The highest levels of exposure are typically found in low- and middle-income countries.
              </p>
              <p>
                Air pollution exists in two main forms. <b>Ambient (outdoor) air pollution</b> comes from sources such as traffic, industry, 
                and wildfires.<b> Household air pollution</b> is caused by the burning of fuels for cooking or heating indoors, and it can 
                also contribute to outdoor pollution.
              </p>
              <p>
                The combined effects of outdoor and household air pollution are linked to around <b>7 million premature deaths every year</b>, 
                increasing the risk of stroke, heart disease, chronic obstructive pulmonary disease, lung cancer, and acute respiratory infections.
              </p>
              <p>
                By staying informed about current air quality conditions, you can take simple but meaningful steps to protect yourself and 
                your loved ones — such as limiting outdoor activity, improving ventilation, or planning exercise and travel more wisely. Awareness 
                helps you make better daily decisions that can improve your overall quality of life.
              </p>
              <a
                href="https://www.who.int/teams/environment-climate-change-and-health/air-quality-energy-and-health/health-impacts/exposure-air-pollution"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-xs text-brand-200 hover:text-brand-400 visited:text-brand-600"
                title="World Health Organization — Air quality and health"
              >
                source: https://www.who.int/teams/environment-climate-change-and-health/air-quality-energy-and-health/health-impacts/exposure-air-pollution
              </a>
              </div>
              }
          />
          <FAQ
            q="Why can two nearby places show different results?"
            a="Air quality can vary with traffic, wind, humidity, and local sources. Provider grid resolution and update 
            frequency can also affect values."
          />
          <FAQ
            q="Are these recommendations medical advice?"
            a= 
            {
              <>
              <p>
                <b>No.</b> Provided recommendations are for general informational purposes only and are not a substitute for professional 
                medical advice. If you have a medical condition or feel unwell, always follow the medical professional guidance.
              </p>
              </>
            }
          />
          <FAQ
            q="Is this service free to use?"
            a= 
            {
              <>
              <p>
                <b>Yes.</b> The service is completely free of charge. All features are available without any fees or subscriptions.
              </p>
              </>
            }
          />
          <FAQ
            q="How can I report a bug or get in touch?"
            a= 
            {
              <>
              <p>
                If you notice a bug, have a suggestion, or want to share feedback, feel free to contact me through the <b>Contacts section</b>. 
                Your input helps make the service better.
              </p>
              </>
            }
          />
        </div>
      </section>
    </main>
  );
}


