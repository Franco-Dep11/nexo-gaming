import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { slides } from "../data/slides";

function HeroCarousel() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const previousSlide = () => {
    setCurrentSlide((current) =>
      current === 0 ? slides.length - 1 : current - 1
    );
  };

  const nextSlide = () => {
    setCurrentSlide((current) =>
      current === slides.length - 1 ? 0 : current + 1
    );
  };

  useEffect(() => {
    if (isPaused || slides.length <= 1) return undefined;

    const interval = window.setInterval(() => {
      setCurrentSlide((current) =>
        current === slides.length - 1 ? 0 : current + 1
      );
    }, 5000);

    return () => window.clearInterval(interval);
  }, [isPaused]);

  if (slides.length === 0) return null;

  return (
    <section
      className="hero-carousel"
      aria-label="Promociones destacadas"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="hero-carousel__viewport">
        {slides.map((slide, index) => (
          <a
            key={slide.id}
            href={slide.href}
            className={`hero-carousel__slide ${
              index === currentSlide ? "is-active" : ""
            }`}
            aria-hidden={index !== currentSlide}
            tabIndex={index === currentSlide ? 0 : -1}
          >
            <img
              src={slide.image}
              alt={slide.alt}
              draggable="false"
            />
          </a>
        ))}

        {slides.length > 1 && (
          <>
            <button
              className="hero-carousel__arrow hero-carousel__arrow--left"
              type="button"
              onClick={previousSlide}
              aria-label="Mostrar promoción anterior"
            >
              <ChevronLeft size={28} />
            </button>

            <button
              className="hero-carousel__arrow hero-carousel__arrow--right"
              type="button"
              onClick={nextSlide}
              aria-label="Mostrar promoción siguiente"
            >
              <ChevronRight size={28} />
            </button>
          </>
        )}
      </div>

      <div
        className="hero-carousel__indicators"
        aria-label="Seleccionar promoción"
      >
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            className={index === currentSlide ? "is-active" : ""}
            onClick={() => setCurrentSlide(index)}
            aria-label={`Mostrar promoción ${index + 1}`}
            aria-current={index === currentSlide ? "true" : undefined}
          />
        ))}
      </div>
    </section>
  );
}

export default HeroCarousel;