/**
 * SolarTime class following adhan-js architecture exactly
 * Handles all solar time calculations with proper multi-day interpolation
 */

import { SolarCoordinates } from "./solar-coordinates";
import {
  approximateTransit,
  correctedTransit,
  correctedHourAngle,
} from "./astronomical";
import { julianDay } from "../utils/astronomy";
import { dtr, rtd } from "../utils/math";
import type { Coordinates } from "../../types";

export class SolarTime {
  observer: Coordinates;
  solar: SolarCoordinates;
  prevSolar: SolarCoordinates;
  nextSolar: SolarCoordinates;
  approxTransit: number;
  transit: number;
  sunrise: number;
  sunset: number;

  constructor(date: Date, coordinates: Coordinates) {
    const jd = julianDay(
      date.getFullYear(),
      date.getMonth() + 1,
      date.getDate(),
      0
    );

    this.observer = coordinates;
    this.solar = new SolarCoordinates(jd);
    this.prevSolar = new SolarCoordinates(jd - 1);
    this.nextSolar = new SolarCoordinates(jd + 1);

    const m0 = approximateTransit(
      coordinates.longitude,
      this.solar.apparentSiderealTime,
      this.solar.rightAscension
    );
    const solarAltitude = -50.0 / 60.0; // Standard refraction angle

    this.approxTransit = m0;

    this.transit = correctedTransit(
      m0,
      coordinates.longitude,
      this.solar.apparentSiderealTime,
      this.solar.rightAscension,
      this.prevSolar.rightAscension,
      this.nextSolar.rightAscension
    );

    this.sunrise = correctedHourAngle(
      m0,
      solarAltitude,
      coordinates,
      false,
      this.solar.apparentSiderealTime,
      this.solar.rightAscension,
      this.prevSolar.rightAscension,
      this.nextSolar.rightAscension,
      this.solar.declination,
      this.prevSolar.declination,
      this.nextSolar.declination
    );

    this.sunset = correctedHourAngle(
      m0,
      solarAltitude,
      coordinates,
      true,
      this.solar.apparentSiderealTime,
      this.solar.rightAscension,
      this.prevSolar.rightAscension,
      this.nextSolar.rightAscension,
      this.solar.declination,
      this.prevSolar.declination,
      this.nextSolar.declination
    );
  }

  /**
   * Calculate hour angle for any prayer time
   * This is the key method that all prayers use
   */
  hourAngle(angle: number, afterTransit: boolean): number {
    return correctedHourAngle(
      this.approxTransit,
      angle,
      this.observer,
      afterTransit,
      this.solar.apparentSiderealTime,
      this.solar.rightAscension,
      this.prevSolar.rightAscension,
      this.nextSolar.rightAscension,
      this.solar.declination,
      this.prevSolar.declination,
      this.nextSolar.declination
    );
  }

  /**
   * Calculate Asr (afternoon) prayer time
   * Following adhan-js algorithm exactly
   */
  afternoon(shadowLength: number): number {
    // Shadow angle calculation from adhan-js
    const tangent = Math.abs(this.observer.latitude - this.solar.declination);
    const inverse = shadowLength + Math.tan(dtr(tangent));
    const angle = rtd(Math.atan(1.0 / inverse));
    return this.hourAngle(angle, true);
  }
}

export default SolarTime;
