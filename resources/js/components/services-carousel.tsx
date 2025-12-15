"use client"

import React from "react"
import { Swiper, SwiperSlide } from "swiper/react"

import "swiper/css"
import "swiper/css/pagination"

import {
  Pagination,
} from "swiper/modules"

interface TreatmentType {
  id: number
  name: string
  description: string | null
  standard_cost: string
  duration_minutes: number
}

interface ServicesCarouselProps {
  treatments: TreatmentType[]
  showPagination?: boolean
}

export const ServicesCarousel: React.FC<ServicesCarouselProps> = ({
  treatments,
  showPagination = true,
}) => {

  const css = `
  .services-swiper {
    width: 100%;
    padding: 16px 0 50px 0;
  }
  
  @media (min-width: 640px) {
    .services-swiper {
      padding: 20px 0 60px 0;
    }
  }
  
  @media (min-width: 1024px) {
    .services-swiper {
      padding: 24px 0 70px 0;
    }
  }
  
  .services-swiper .swiper-wrapper {
    align-items: stretch;
  }
  
  /* Mobile first - Extra small screens */
  .services-swiper .swiper-slide {
    width: 85vw;
    max-width: 300px;
    height: auto;
    transition: transform 0.4s ease, opacity 0.4s ease;
  }
  
  /* Small screens (640px+) */
  @media (min-width: 640px) {
    .services-swiper .swiper-slide {
      width: 320px;
      max-width: none;
    }
  }
  
  /* Medium screens (768px+) */
  @media (min-width: 768px) {
    .services-swiper .swiper-slide {
      width: 340px;
    }
  }
  
  /* Large screens (1024px+) */
  @media (min-width: 1024px) {
    .services-swiper .swiper-slide {
      width: 360px;
    }
  }
  
  /* Extra large screens (1280px+) */
  @media (min-width: 1280px) {
    .services-swiper .swiper-slide {
      width: 380px;
    }
  }
  
  .services-swiper .swiper-slide-active {
    z-index: 10;
  }
  
  .services-swiper .swiper-slide-active .service-card {
    transform: scale(1.03);
    border-color: rgba(74, 144, 217, 0.4);
    box-shadow: 0 20px 40px -12px rgba(74, 144, 217, 0.2);
  }
  
  @media (min-width: 640px) {
    .services-swiper .swiper-slide-active .service-card {
      transform: scale(1.05);
      box-shadow: 0 25px 50px -12px rgba(74, 144, 217, 0.2);
    }
  }

  .services-swiper .swiper-pagination {
    bottom: 8px;
  }
  
  @media (min-width: 640px) {
    .services-swiper .swiper-pagination {
      bottom: 12px;
    }
  }

  .services-swiper .swiper-pagination-bullet {
    width: 8px;
    height: 8px;
    background: rgba(0, 0, 0, 0.2);
    opacity: 1;
    transition: all 0.3s ease;
  }
  
  @media (min-width: 640px) {
    .services-swiper .swiper-pagination-bullet {
      width: 10px;
      height: 10px;
    }
  }

  .services-swiper .swiper-pagination-bullet-active {
    width: 20px;
    border-radius: 4px;
    background: #4A90D9;
  }
  
  @media (min-width: 640px) {
    .services-swiper .swiper-pagination-bullet-active {
      width: 28px;
      border-radius: 5px;
    }
  }
  `

  if (treatments.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-brand-blue/10">
            <svg className="h-8 w-8 animate-pulse text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium text-brand-dark/70">Curating our latest services...</p>
          <p className="mt-1 text-xs text-brand-dark/50">Please check back soon</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative flex-1">
      <style>{css}</style>

      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 z-20 w-16 bg-gradient-to-r from-brand-light to-transparent pointer-events-none sm:w-24 lg:w-32" />
      <div className="absolute inset-y-0 right-0 z-20 w-16 bg-gradient-to-l from-brand-light to-transparent pointer-events-none sm:w-24 lg:w-32" />

      <Swiper
        className="services-swiper"
        spaceBetween={20}
        speed={500}
        grabCursor={true}
        centeredSlides={true}
        loop={true}
        slidesPerView={"auto"}
        pagination={showPagination ? { clickable: true } : false}
        modules={[Pagination]}
      >
        {treatments.map((treatment) => (
          <SwiperSlide key={treatment.id}>
            <div className="service-card group relative flex h-full min-h-[300px] flex-col overflow-hidden rounded-2xl border border-brand-dark/5 bg-white shadow-lg transition-all duration-400 sm:min-h-[340px] sm:rounded-3xl md:min-h-[360px] lg:min-h-[380px]">
              {/* Card Header with Icon */}
              <div className="flex items-center justify-between p-4 pb-0 sm:p-5 sm:pb-0 md:p-6 md:pb-0">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-blue/10 text-brand-blue transition-all duration-300 sm:h-14 sm:w-14 group-hover:bg-brand-blue group-hover:text-white">
                  <svg className="h-6 w-6 sm:h-7 sm:w-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                </div>
              </div>

              {/* Card Body */}
              <div className="flex flex-1 flex-col p-4 pt-3 sm:p-5 sm:pt-4 md:p-6 md:pt-4">
                <h3 className="mb-1.5 text-base font-bold text-brand-dark sm:mb-2 sm:text-lg md:text-xl lg:text-2xl">
                  {treatment.name}
                </h3>
                <p className="flex-1 text-xs leading-relaxed text-brand-dark/60 line-clamp-3 sm:text-sm sm:line-clamp-4 md:text-base">
                  {treatment.description || 'Professional dental care service tailored to your needs.'}
                </p>
              </div>

              {/* Card Footer */}
              <div className="flex items-center justify-between border-t border-brand-dark/5 p-4 pt-3 sm:p-5 sm:pt-4 md:p-6 md:pt-4">
                <div>
                  <p className="text-[10px] text-brand-dark/50 sm:text-xs">Starting at</p>
                  <p className="text-lg font-bold text-brand-dark sm:text-xl md:text-2xl lg:text-3xl">
                    ₱{parseFloat(treatment.standard_cost).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[10px] text-brand-dark/50 sm:text-xs">Duration</p>
                  <p className="text-sm font-semibold text-brand-dark sm:text-base md:text-lg lg:text-xl">
                    {treatment.duration_minutes} mins
                  </p>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  )
}
